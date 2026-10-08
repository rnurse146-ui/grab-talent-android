import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { sanitizeText, normalizeTime } from '../../shared/emailSanitize.ts';
import { buildBookingIcs, toBase64Utf8 } from '../../shared/calendarInvite.ts';

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
    // Only a booking that has actually transitioned to 'confirmed' may be
    // emailed — blocks direct re-invocation (spam) for arbitrary bookings.
    if (booking.status !== 'confirmed') {
      return Response.json({ error: 'Booking is not confirmed' }, { status: 403 });
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

    // Times are seeker-controlled: keep only valid HH:MM values, else a fixed
    // default — never raw strings in the ICS DTSTART/DTEND lines.
    const startT = normalizeTime(booking.start_time);
    const endT = normalizeTime(booking.end_time);
    // All booking fields are seeker-controlled and untrusted: sanitizeText,
    // icsEscape and fixed-format times in the shared builder keep no injected
    // properties or events from being added to the calendar invite.
    const eventName = sanitizeText(booking.event_name, 120) || 'Gig';
    const clientName = sanitizeText(booking.seeker_name, 100) || 'The client';
    const clientPhone = sanitizeText(booking.seeker_phone, 30);
    const venuePlain = sanitizeText([booking.venue_name, booking.venue_address, booking.venue_city].filter(Boolean).join(', '), 200);
    const notesPlain = sanitizeText(booking.special_requirements, 300);
    const { icsContent, filename: icsFilename } = buildBookingIcs(booking, {
      method: 'REQUEST',
      attendeeEmail: talentEmail,
      description: `Booked by ${clientName}${clientPhone ? ` (${clientPhone})` : ''}.${booking.talent_payout != null ? ` Payout: £${booking.talent_payout}.` : ''}${notesPlain ? ` Notes: ${notesPlain}` : ''}`
    });

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: talentEmail,
      subject: `🎉 Confirmed Gig: ${eventName} on ${eventDateFormatted}`,
      attachments: [{ filename: icsFilename, content: toBase64Utf8(icsContent) }],
      body: `Hi ${booking.talent_stage_name},

Great news — you've been hired! ${clientName} has confirmed their booking with you.

📅 Event: ${eventName}
🗓️ Date: ${eventDateFormatted}
⏰ Time: ${startT || 'TBD'} – ${endT || 'TBD'}${Number.isFinite(booking.duration_hours) ? ` (${booking.duration_hours}h)` : ''}
📍 Venue: ${venuePlain}
💷 Your Payout: £${booking.talent_payout}
${clientPhone ? `📞 Client Phone: ${clientPhone}` : ''}
${notesPlain ? `\n📝 Special Requirements (written by the client): ${notesPlain}` : ''}

The calendar invite is attached — open it to add the gig straight to your calendar app (Google Calendar, Apple Calendar, Outlook and more all support it).

Log in to Grab Talent to view full booking details and message your client.

Good luck and have a great performance! 🎭

— The Grab Talent Team`
    });

    return Response.json({ sent: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}