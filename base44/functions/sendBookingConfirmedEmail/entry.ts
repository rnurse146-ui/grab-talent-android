import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { sanitizeText, icsEscape } from '../../shared/emailSanitize.ts';

// Sends the "gig confirmed" email (with calendar invite) to the talent when a
// booking is confirmed. Narrow operation: the recipient, subject and body are
// all derived server-side from the booking — only a booking_id is accepted.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const bookingId = String(body?.booking_id || '');
    if (!bookingId) return Response.json({ error: 'booking_id is required' }, { status: 400 });

    const bookings = await base44.asServiceRole.entities.Booking.filter({ id: bookingId });
    if (bookings.length === 0) return Response.json({ error: 'Booking not found' }, { status: 404 });
    const booking = bookings[0];
    if (booking.seeker_id !== user.id && booking.talent_user_id !== user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const talentUsers = await base44.asServiceRole.entities.User.filter({ id: booking.talent_user_id });
    if (talentUsers.length === 0 || !talentUsers[0].email) {
      return Response.json({ sent: false });
    }
    const talentEmail = talentUsers[0].email;

    let eventDateFormatted = 'TBD';
    if (booking.event_date) {
      try {
        eventDateFormatted = new Intl.DateTimeFormat('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(booking.event_date));
      } catch { eventDateFormatted = 'TBD'; }
    }

    const icsDate = booking.event_date ? booking.event_date.replace(/-/g, '') : '';
    const startTime = booking.start_time ? booking.start_time.replace(':', '') + '00' : '090000';
    const endTime = booking.end_time ? booking.end_time.replace(':', '') + '00' : '180000';
    const dtStart = icsDate ? `${icsDate}T${startTime}` : '';
    const dtEnd = icsDate ? `${icsDate}T${endTime}` : '';
    const uid = `grabtalent-${booking.id}@grabtalent.app`;
    // All booking fields below are seeker-controlled and untrusted. Sanitize
    // (control chars + URLs) and RFC 5545-escape so no injected properties or
    // events can be added to the calendar invite.
    const eventName = sanitizeText(booking.event_name, 120) || 'Gig';
    const clientName = sanitizeText(booking.seeker_name, 100) || 'The client';
    const clientPhone = sanitizeText(booking.seeker_phone, 30);
    const venuePlain = sanitizeText([booking.venue_name, booking.venue_address, booking.venue_city].filter(Boolean).join(', '), 200);
    const notesPlain = sanitizeText(booking.special_requirements, 300);
    const location = icsEscape(venuePlain);
    const notes = icsEscape(notesPlain);
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Grab Talent//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${icsEscape(eventName)}`,
      `LOCATION:${location}`,
      `DESCRIPTION:Booked by ${icsEscape(clientName)}${clientPhone ? ` (${icsEscape(clientPhone)})` : ''}. Payout: £${booking.talent_payout}.${notes ? ' Notes: ' + notes : ''}`,
      `ORGANIZER:mailto:noreply@grabtalent.app`,
      `ATTENDEE:mailto:${talentEmail}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: talentEmail,
      subject: `🎉 Confirmed Gig: ${eventName} on ${eventDateFormatted}`,
      body: `Hi ${booking.talent_stage_name},

Great news — you've been hired! ${clientName} has confirmed their booking with you.

📅 Event: ${eventName}
🗓️ Date: ${eventDateFormatted}
⏰ Time: ${booking.start_time} – ${booking.end_time} (${booking.duration_hours}h)
📍 Venue: ${venuePlain}
💷 Your Payout: £${booking.talent_payout}
${clientPhone ? `📞 Client Phone: ${clientPhone}` : ''}
${notesPlain ? `\n📝 Special Requirements (written by the client): ${notesPlain}` : ''}

📆 ADD TO YOUR CALENDAR
Copy the text below, save it as a file called "gig.ics", then open it to add the event directly to your calendar app (works with Google Calendar, Apple Calendar, Outlook and more):

--- COPY FROM HERE ---
${icsContent}
--- COPY TO HERE ---

Log in to Grab Talent to view full booking details and message your client.

Good luck and have a great performance! 🎭

— The Grab Talent Team`
    });

    return Response.json({ sent: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}