import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Server-controlled booking status transitions. The caller must be the seeker
// or the talent on the booking, and only role-appropriate transitions from the
// current status are allowed. Strikes, the confirmation email and
// notifications are applied here — clients can never forge booking state.
const SEEKER_TRANSITIONS = { pending: ['cancelled'], accepted: ['confirmed', 'cancelled'], confirmed: ['completed'] };
// 'completed' is reserved for the seeker (arrival confirmation) — talent side only gets 'cancelled'
const TALENT_TRANSITIONS = { pending: ['accepted', 'declined'], accepted: ['cancelled'], confirmed: ['cancelled'] };

const STATUS_MESSAGES = {
  accepted: 'was accepted',
  declined: 'was declined',
  confirmed: 'is confirmed',
  cancelled: 'was cancelled',
  completed: 'was marked complete'
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const bookingId = String(body?.booking_id || '');
    const newStatus = String(body?.status || '');
    if (!bookingId || !newStatus) return Response.json({ error: 'booking_id and status are required' }, { status: 400 });

    let booking = null;
    try {
      booking = await base44.asServiceRole.entities.Booking.get(bookingId);
    } catch (e) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }
    if (!booking) return Response.json({ error: 'Booking not found' }, { status: 404 });

    const isSeeker = booking.seeker_id === user.id;
    const isTalent = booking.talent_user_id === user.id;
    const allowed = (isSeeker ? SEEKER_TRANSITIONS : isTalent ? TALENT_TRANSITIONS : {})[booking.status] || [];
    if (!allowed.includes(newStatus)) {
      return Response.json({ error: 'This status change is not allowed' }, { status: 403 });
    }

    await base44.asServiceRole.entities.Booking.update(bookingId, { status: newStatus });

    // 3-strike rule: a talent cancelling within 7 days of the event counts as a violation
    if (isTalent && newStatus === 'cancelled' && booking.event_date) {
      const eventDate = new Date(booking.event_date + 'T12:00:00');
      const daysUntil = Math.ceil((eventDate - new Date(new Date().toDateString())) / (1000 * 60 * 60 * 24));
      if (daysUntil <= 7) {
        const profiles = await base44.asServiceRole.entities.TalentProfile.filter({ id: booking.talent_profile_id });
        if (profiles.length > 0) {
          const profile = profiles[0];
          const newStrikes = (profile.strikes_count || 0) + 1;
          const updates = { strikes_count: newStrikes };
          if (newStrikes >= 3) {
            updates.account_suspended = true;
            updates.is_available = false;
          }
          await base44.asServiceRole.entities.TalentProfile.update(profile.id, updates);
        }
      }
    }

    // Seeker confirming the booking emails the talent a calendar invite
    if (isSeeker && newStatus === 'confirmed') {
      try {
        await base44.functions.invoke('sendBookingConfirmedEmail', { booking_id: bookingId });
      } catch (e) {}
    }

    // Tell the other party what happened
    try {
      const recipientId = isSeeker ? booking.talent_user_id : booking.seeker_id;
      await base44.asServiceRole.entities.Notification.create({
        user_id: recipientId,
        type: 'booking',
        title: 'Booking update',
        body: `"${booking.event_name || 'Your event'}" ${STATUS_MESSAGES[newStatus] || 'was updated'}.`,
        link_url: '/Bookings'
      });
    } catch (e) {}

    return Response.json({ booking: { ...booking, status: newStatus } });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}