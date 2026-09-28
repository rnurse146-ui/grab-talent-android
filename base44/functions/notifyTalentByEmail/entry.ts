import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Emails talent when they receive a new booking request or get shortlisted to
// a Maybe List, so they hear about it even when not using the app.
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

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: talentEmail,
        subject: `🎭 New Booking Request: ${booking.event_name || 'Event'} on ${formatDate(booking.event_date)}`,
        body: `Hi ${booking.talent_stage_name || 'there'},

You've received a new booking request on Grab Talent!

📅 Event: ${booking.event_name || 'Event'} (${(booking.event_type || 'event').replace(/_/g, ' ')})
🗓️ Date: ${formatDate(booking.event_date)}
⏰ Time: ${booking.start_time || 'TBD'} – ${booking.end_time || 'TBD'}${booking.duration_hours ? ` (${booking.duration_hours}h)` : ''}
📍 Venue: ${[booking.venue_name, booking.venue_city].filter(Boolean).join(', ')}
${booking.total_price != null ? `💷 Total: £${booking.total_price} (your payout: £${booking.talent_payout})` : ''}
👤 Client: ${booking.seeker_name || 'An event organizer'}${booking.seeker_phone ? ` (${booking.seeker_phone})` : ''}
${booking.special_requirements ? `\n📝 Special Requirements: ${booking.special_requirements}` : ''}

The client is waiting on your response — open Grab Talent to review the request and accept or decline it.
https://grabtalent.base44.app

— The Grab Talent Team`
      });
      return Response.json({ sent: true });
    }

    return Response.json({ error: 'Unknown kind' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}