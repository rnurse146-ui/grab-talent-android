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

    const bookingUrl = `https://grabtalent.co.uk/BookingDetails?id=${encodeURIComponent(booking.id)}`;
    const row = (label, value) => value
      ? `<tr><td style="padding:4px 0;color:#71717a;width:120px;vertical-align:top;">${label}</td><td style="padding:4px 0;color:#18181b;">${value}</td></tr>`
      : '';

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: talentEmail,
      from_name: 'Grab Talent',
      subject: `Confirmed gig: ${eventName} on ${eventDateFormatted}`,
      attachments: [{ filename: icsFilename, content: toBase64Utf8(icsContent) }],
      html: `
<div style="margin:0;padding:24px 12px;background:#fcfcfd;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">
    <tr>
      <td style="background:#71717a;padding:16px 24px;">
        <img src="https://media.base44.com/images/public/697f3da7f123570707b055b1/22eb7db98_logo2.jpg" alt="Grab Talent" height="30" style="height:30px;display:block;border:0;" />
        <span style="color:#ffffff;font-size:16px;font-weight:bold;display:inline-block;margin-top:8px;">Grab Talent</span>
      </td>
    </tr>
    <tr>
      <td style="padding:28px 24px 8px;">
        <h1 style="margin:0 0 10px;font-size:22px;line-height:1.3;color:#18181b;">You've been hired!</h1>
        <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#71717a;">Hi ${booking.talent_stage_name || 'there'}, great news. ${clientName} has confirmed their booking with you.</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:15px;color:#3f3f46;line-height:1.5;">
          ${row('Event', eventName)}
          ${row('Date', eventDateFormatted)}
          ${row('Time', `${startT || 'TBD'} – ${endT || 'TBD'}${Number.isFinite(booking.duration_hours) ? ` (${booking.duration_hours}h)` : ''}`)}
          ${row('Venue', venuePlain)}
          ${row('Payout', `£${booking.talent_payout}`)}
          ${row('Client', clientName)}
          ${clientPhone ? row('Client phone', clientPhone) : ''}
          ${notesPlain ? row('Notes', notesPlain) : ''}
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:24px;">
        <a href="${bookingUrl}" style="display:inline-block;background:#71717a;color:#ffffff;text-decoration:none;font-size:16px;font-weight:bold;padding:14px 28px;border-radius:6px;">Open booking and message client</a>
        <p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:#71717a;">
          If the button doesn't work, copy this link into your browser:<br />
          <a href="${bookingUrl}" style="color:#71717a;word-break:break-all;">${bookingUrl}</a>
        </p>
        <p style="margin:18px 0 0;font-size:13px;line-height:1.6;color:#71717a;">The calendar invite is attached, so you can add the gig straight to Google Calendar, Apple Calendar or Outlook. Good luck and have a great performance!</p>
      </td>
    </tr>
    <tr>
      <td style="padding:18px 24px;background:#f4f4f5;border-top:1px solid #e5e7eb;">
        <p style="margin:0 0 8px;font-size:12px;line-height:1.6;color:#71717a;">
          <strong style="color:#3f3f46;">Can't find our emails?</strong> Check your junk or spam folder and mark any message from Grab Talent as "Not junk", so you never miss a booking.
        </p>
        <p style="margin:0;font-size:12px;line-height:1.6;color:#a1a1aa;">
          This is an automated message, please do not reply to this email. For help, open the Help section in the Grab Talent app.
        </p>
      </td>
    </tr>
  </table>
</div>`
    });

    return Response.json({ sent: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}