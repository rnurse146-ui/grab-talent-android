import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { sanitizeText, normalizeTime } from '../../shared/emailSanitize.ts';
import { buildBookingIcs, toBase64Utf8 } from '../../shared/calendarInvite.ts';

// Emails talent when they receive a new booking request or get shortlisted to
// a Maybe List, and emails the seeker when the talent accepts or declines a
// booking request, so both sides hear about it even when not using the app.
// Recipient address and email content are derived server-side — only ids are
// accepted from the caller, and the caller must be the seeker who triggered it.
const APP_URL = 'https://grabtalent.co.uk';
const LOGO_URL = 'https://media.base44.com/images/public/697f3da7f123570707b055b1/22eb7db98_logo2.jpg';

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

// One branded, clickable email layout: a header lockup, headline, a details
// table and a prominent button. Links are absolute and point at the live app.
const emailHtml = ({ heading, intro, rows, ctaLabel, ctaUrl, outro }) => `
<div style="margin:0;padding:24px 12px;background:#fcfcfd;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">
    <tr>
      <td style="background:#71717a;padding:16px 24px;">
        <img src="${LOGO_URL}" alt="Grab Talent" height="30" style="height:30px;display:block;border:0;" />
        <span style="color:#ffffff;font-size:16px;font-weight:bold;display:inline-block;margin-top:8px;">Grab Talent</span>
      </td>
    </tr>
    <tr>
      <td style="padding:28px 24px 8px;">
        <h1 style="margin:0 0 10px;font-size:22px;line-height:1.3;color:#18181b;">${escapeHtml(heading)}</h1>
        <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#71717a;">${intro}</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:15px;color:#3f3f46;line-height:1.5;">
          ${rows}
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:24px;">
        <a href="${ctaUrl}" style="display:inline-block;background:#71717a;color:#ffffff;text-decoration:none;font-size:16px;font-weight:bold;padding:14px 28px;border-radius:6px;">${escapeHtml(ctaLabel)}</a>
        <p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:#71717a;">
          If the button doesn't work, copy this link into your browser:<br />
          <a href="${ctaUrl}" style="color:#71717a;word-break:break-all;">${ctaUrl}</a>
        </p>
        ${outro ? `<p style="margin:18px 0 0;font-size:13px;line-height:1.6;color:#71717a;">${outro}</p>` : ''}
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
</div>`;

const detailRow = (label, value) => value
  ? `<tr><td style="padding:4px 0;color:#71717a;width:120px;vertical-align:top;">${escapeHtml(label)}</td><td style="padding:4px 0;color:#18181b;">${escapeHtml(value)}</td></tr>`
  : '';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const kind = String(body?.kind || '');

    const getTalentEmail = async (talentUserId) => {
      const talentUsers = await base44.asServiceRole.entities.User.filter({ id: talentUserId });
      return talentUsers.length > 0 ? talentUsers[0].email : null;
    };

    const formatDate = (dateStr) => {
      if (!dateStr) return 'TBD';
      try {
        return new Intl.DateTimeFormat('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(dateStr));
      } catch { return 'TBD'; }
    };

    if (kind === 'booking_request') {
      const bookingId = String(body?.booking_id || '');
      if (!bookingId) return Response.json({ error: 'booking_id is required' }, { status: 400 });
      let bookings = [];
      try { bookings = await base44.asServiceRole.entities.Booking.filter({ id: bookingId }); } catch {}
      if (bookings.length === 0) return Response.json({ error: 'Booking not found' }, { status: 404 });
      const booking = bookings[0];
      if (booking.seeker_id !== user.id) return Response.json({ error: 'Forbidden' }, { status: 403 });

      const talentEmail = await getTalentEmail(booking.talent_user_id);
      if (!talentEmail) return Response.json({ sent: false });

      // Booking fields are seeker-controlled and untrusted: never echo free-text
      // (special requirements, phone) in mail sent under the platform's identity —
      // point to the in-app booking instead, where it renders in a safe UI.
      const eventName = sanitizeText(booking.event_name, 120) || 'Event';
      const clientName = sanitizeText(booking.seeker_name, 100) || 'An event organizer';
      const talentName = sanitizeText(booking.talent_stage_name, 100) || 'there';
      const venue = sanitizeText([booking.venue_name, booking.venue_city].filter(Boolean).join(', '), 160);
      const eventType = sanitizeText(booking.event_type, 40).replace(/_/g, ' ') || 'event';
      const startT = normalizeTime(booking.start_time) || 'TBD';
      const endT = normalizeTime(booking.end_time) || 'TBD';
      const bookingUrl = `${APP_URL}/BookingDetails?id=${encodeURIComponent(booking.id)}`;

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: talentEmail,
        from_name: 'Grab Talent',
        subject: `New booking request: ${eventName} on ${formatDate(booking.event_date)}`,
        html: emailHtml({
          heading: 'You have a new booking request',
          intro: `Hi ${escapeHtml(talentName)}, ${escapeHtml(clientName)} would like to book you for a ${escapeHtml(eventType)}. Open the request to accept or decline it.`,
          rows: [
            detailRow('Event', `${eventName} (${eventType})`),
            detailRow('Date', formatDate(booking.event_date)),
            detailRow('Time', `${startT} – ${endT}${Number.isFinite(booking.duration_hours) ? ` (${booking.duration_hours}h)` : ''}`),
            detailRow('Venue', venue),
            detailRow('Client', clientName),
            booking.total_price != null ? detailRow('Total', `£${booking.total_price} (your payout: £${booking.talent_payout})`) : ''
          ].join(''),
          ctaLabel: 'Review and accept booking',
          ctaUrl: bookingUrl,
          outro: 'Special requirements and client contact details are only shown in the booking request in the app. The client is waiting on your response.'
        })
      });
      return Response.json({ sent: true });
    }

    // The client withdrew their booking — email the talent so they don't miss it,
    // since a cancellation sent by mistake is easy to put right by messaging.
    if (kind === 'booking_cancelled') {
      const bookingId = String(body?.booking_id || '');
      if (!bookingId) return Response.json({ error: 'booking_id is required' }, { status: 400 });
      let bookings = [];
      try { bookings = await base44.asServiceRole.entities.Booking.filter({ id: bookingId }); } catch {}
      if (bookings.length === 0) return Response.json({ error: 'Booking not found' }, { status: 404 });
      const booking = bookings[0];
      if (booking.seeker_id !== user.id) return Response.json({ error: 'Forbidden' }, { status: 403 });

      const talentEmail = await getTalentEmail(booking.talent_user_id);
      if (!talentEmail) return Response.json({ sent: false });

      const eventName = sanitizeText(booking.event_name, 120) || 'Event';
      const clientName = sanitizeText(booking.seeker_name, 100) || 'The client';
      const talentName = sanitizeText(booking.talent_stage_name, 100) || 'there';
      const venue = sanitizeText([booking.venue_name, booking.venue_city].filter(Boolean).join(', '), 160);
      const startT = normalizeTime(booking.start_time) || 'TBD';
      const endT = normalizeTime(booking.end_time) || 'TBD';
      const bookingUrl = `${APP_URL}/BookingDetails?id=${encodeURIComponent(booking.id)}`;

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: talentEmail,
        from_name: 'Grab Talent',
        subject: `Booking cancelled by the client: ${eventName}`,
        html: emailHtml({
          heading: 'A client cancelled their booking',
          intro: `Hi ${escapeHtml(talentName)}, ${escapeHtml(clientName)} has cancelled their booking with you. Cancellations are sometimes sent by mistake, so you can open the booking and message them to check.`,
          rows: [
            detailRow('Event', eventName),
            detailRow('Date', formatDate(booking.event_date)),
            detailRow('Time', `${startT} – ${endT}`),
            detailRow('Venue', venue),
            detailRow('Client', clientName)
          ].join(''),
          ctaLabel: 'Open the booking',
          ctaUrl: bookingUrl,
          outro: 'The date has been freed up in your calendar, so other clients can book you for it.'
        })
      });
      return Response.json({ sent: true });
    }

    // Talent accepted or declined a booking — email the seeker. The caller must
    // be the talent on the booking, and the response is validated server-side.
    if (kind === 'booking_response') {
      const bookingId = String(body?.booking_id || '');
      const response = String(body?.response || '');
      if (!bookingId || !['accepted', 'declined'].includes(response)) {
        return Response.json({ error: 'booking_id and a valid response are required' }, { status: 400 });
      }
      let bookings = [];
      try { bookings = await base44.asServiceRole.entities.Booking.filter({ id: bookingId }); } catch {}
      if (bookings.length === 0) return Response.json({ error: 'Booking not found' }, { status: 404 });
      const booking = bookings[0];
      if (booking.talent_user_id !== user.id) return Response.json({ error: 'Forbidden' }, { status: 403 });

      const seekers = await base44.asServiceRole.entities.User.filter({ id: booking.seeker_id });
      const seekerEmail = seekers.length > 0 ? seekers[0].email : null;
      if (!seekerEmail) return Response.json({ sent: false });

      const eventName = sanitizeText(booking.event_name, 120) || 'Event';
      const seekerName = sanitizeText(booking.seeker_name, 100) || 'there';
      const talentName = sanitizeText(booking.talent_stage_name, 100) || 'The performer';
      const venue = sanitizeText([booking.venue_name, booking.venue_city].filter(Boolean).join(', '), 160);
      const startT = normalizeTime(booking.start_time) || 'TBD';
      const endT = normalizeTime(booking.end_time) || 'TBD';
      const bookingUrl = `${APP_URL}/BookingDetails?id=${encodeURIComponent(booking.id)}`;

      if (response === 'accepted') {
        // The date is now real for the client: attach a calendar invite so it
        // lands in their Google / Apple / Outlook calendar in one tap.
        const { icsContent, filename: icsFilename } = buildBookingIcs(booking, {
          method: 'PUBLISH',
          status: 'TENTATIVE',
          description: `${talentName} accepted your booking request. Confirm in Grab Talent to lock the date in.`
        });
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: seekerEmail,
          from_name: 'Grab Talent',
          subject: `${talentName} accepted your booking request: ${eventName}`,
          attachments: [{ filename: icsFilename, content: toBase64Utf8(icsContent) }],
          html: emailHtml({
            heading: `${talentName} accepted your booking`,
            intro: `Hi ${escapeHtml(seekerName)}, great news. ${escapeHtml(talentName)} has accepted your booking request. Confirm the booking in the app to lock the date in.`,
            rows: [
              detailRow('Event', eventName),
              detailRow('Date', formatDate(booking.event_date)),
              detailRow('Time', `${startT} – ${endT}`),
              detailRow('Venue', venue)
            ].join(''),
            ctaLabel: 'Confirm the booking',
            ctaUrl: bookingUrl,
            outro: 'A calendar invite is attached, so you can add the date to Google Calendar, Apple Calendar or Outlook while you confirm.'
          })
        });
      } else {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: seekerEmail,
          from_name: 'Grab Talent',
          subject: `Booking request declined: ${eventName}`,
          html: emailHtml({
            heading: 'Your booking request was declined',
            intro: `Hi ${escapeHtml(seekerName)}, unfortunately ${escapeHtml(talentName)} is unable to take your booking on Grab Talent.`,
            rows: [
              detailRow('Event', eventName),
              detailRow('Date', formatDate(booking.event_date))
            ].join(''),
            ctaLabel: 'Find other talent',
            ctaUrl: `${APP_URL}/Discover`,
            outro: 'Your date is still free. Open Grab Talent to browse other great performers for your event.'
          })
        });
      }
      return Response.json({ sent: true });
    }

    return Response.json({ error: 'Unknown kind' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}