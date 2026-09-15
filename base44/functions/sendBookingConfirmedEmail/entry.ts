import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

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
      `SUMMARY:🎭 ${booking.event_name || 'Gig'} — ${booking.event_type?.replace(/_/g, ' ')}`,
      `LOCATION:${[booking.venue_name, booking.venue_address, booking.venue_city].filter(Boolean).join(', ')}`,
      `DESCRIPTION:Booked by ${booking.seeker_name}${booking.seeker_phone ? ` (${booking.seeker_phone})` : ''}. Payout: £${booking.talent_payout}.${booking.special_requirements ? ' Notes: ' + booking.special_requirements : ''}`,
      `ORGANIZER:mailto:noreply@grabtalent.app`,
      `ATTENDEE:mailto:${talentEmail}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: talentEmail,
      subject: `🎉 Confirmed Gig: ${booking.event_name || 'New Booking'} on ${eventDateFormatted}`,
      body: `Hi ${booking.talent_stage_name},

Great news — you've been hired! ${booking.seeker_name} has confirmed their booking with you.

📅 Event: ${booking.event_name || 'Event'}
🗓️ Date: ${eventDateFormatted}
⏰ Time: ${booking.start_time} – ${booking.end_time} (${booking.duration_hours}h)
📍 Venue: ${booking.venue_name}, ${booking.venue_address}, ${booking.venue_city}
💷 Your Payout: £${booking.talent_payout}
${booking.seeker_phone ? `📞 Client Phone: ${booking.seeker_phone}` : ''}
${booking.special_requirements ? `\n📝 Special Requirements: ${booking.special_requirements}` : ''}

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