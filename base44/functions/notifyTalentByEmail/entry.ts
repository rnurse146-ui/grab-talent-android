import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { sanitizeText, normalizeTime } from '../../shared/emailSanitize.ts';
import { buildBookingIcs, toBase64Utf8 } from '../../shared/calendarInvite.ts';

// Emails talent when they receive a new booking request or get shortlisted to
// a Maybe List, and emails the seeker when the talent accepts or declines a
// booking request, so both sides hear about it even when not using the app.
// Recipient address and email content are derived server-side — only ids are
// accepted from the caller, and the caller must be the seeker who triggered it.
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
      const venue = sanitizeText([booking.venue_name, booking.venue_city].filter(Boolean).join(', '), 160);
      const eventType = sanitizeText(booking.event_type, 40).replace(/_/g, ' ') || 'event';
      const startT = normalizeTime(booking.start_time) || 'TBD';
      const endT = normalizeTime(booking.end_time) || 'TBD';

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: talentEmail,
        subject: `🎭 New Booking Request: ${eventName} on ${formatDate(booking.event_date)}`,
        body: `Hi ${booking.talent_stage_name || 'there'},

You've received a new booking request on Grab Talent!

📅 Event: ${eventName} (${eventType})
🗓️ Date: ${formatDate(booking.event_date)}
⏰ Time: ${startT} – ${endT}${Number.isFinite(booking.duration_hours) ? ` (${booking.duration_hours}h)` : ''}
📍 Venue: ${venue}
${booking.total_price != null ? `💷 Total: £${booking.total_price} (your payout: £${booking.talent_payout})` : ''}
👤 Client: ${clientName}

Special requirements and client contact details are only shown in the booking request in the app, never in this email.

The client is waiting on your response — open Grab Talent to review the request and accept or decline it.
https://grabtalent.base44.app

— The Grab Talent Team`
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
          subject: `✅ ${talentName} accepted your booking request: ${eventName}`,
          attachments: [{ filename: icsFilename, content: toBase64Utf8(icsContent) }],
          body: `Hi ${seekerName},

Great news — ${talentName} has ACCEPTED your booking request on Grab Talent!

📅 Event: ${eventName}
🗓️ Date: ${formatDate(booking.event_date)}
⏰ Time: ${startT} – ${endT}
📍 Venue: ${venue}

A calendar invite is attached so you can add the date to your calendar app (Google, Apple, Outlook and more) while you wait for the date to be locked in.

Next step: open Grab Talent and confirm the booking to lock the date in.

https://grabtalent.base44.app

— The Grab Talent Team`
        });
      } else {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: seekerEmail,
          subject: `Booking request declined: ${eventName}`,
          body: `Hi ${seekerName},

Unfortunately ${talentName} is unable to take your booking on Grab Talent.

📅 Event: ${eventName}
🗓️ Date: ${formatDate(booking.event_date)}

Your date is still free — open Grab Talent to browse other great performers for your event.

https://grabtalent.base44.app

— The Grab Talent Team`
        });
      }
      return Response.json({ sent: true });
    }

    return Response.json({ error: 'Unknown kind' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}