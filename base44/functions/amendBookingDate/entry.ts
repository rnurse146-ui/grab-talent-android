import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Lets the client who made a booking move it to a different date when they got
// it wrong. The new date must still be free for the talent (not blocked and not
// already booked), the booking returns to 'pending' so the talent re-accepts,
// and the talent is notified straight away.
const label = (value) => {
  if (!value) return 'the original date';
  const d = new Date(`${String(value).slice(0, 10)}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return String(value);
  return new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(d);
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const bookingId = String(body?.booking_id || '');
    const newDate = String(body?.event_date || '').slice(0, 10);
    if (!bookingId || !/^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
      return Response.json({ error: 'booking_id and a valid event_date are required' }, { status: 400 });
    }

    let booking = null;
    try {
      booking = await base44.asServiceRole.entities.Booking.get(bookingId);
    } catch (e) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }
    if (!booking) return Response.json({ error: 'Booking not found' }, { status: 404 });
    if (booking.seeker_id !== user.id) {
      return Response.json({ error: 'Only the client who made this booking can change its date' }, { status: 403 });
    }
    if (!['pending', 'accepted', 'confirmed'].includes(booking.status)) {
      return Response.json({ error: 'This booking can no longer be changed' }, { status: 403 });
    }

    const ukToday = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(new Date());
    if (newDate < ukToday) {
      return Response.json({ error: 'Please pick a date in the future' }, { status: 400 });
    }
    if (String(booking.event_date || '').slice(0, 10) === newDate) {
      return Response.json({ error: 'That is already the booked date' }, { status: 400 });
    }

    // The talent must actually be free on the new date
    if (booking.talent_profile_id) {
      const availability = await base44.asServiceRole.entities.TalentAvailability.filter({ talent_profile_id: booking.talent_profile_id });
      const taken = new Set();
      availability.forEach(rec => {
        (rec.blocked_dates || []).forEach(d => taken.add(String(d).slice(0, 10)));
        (rec.booking_dates || []).forEach(d => taken.add(String(d).slice(0, 10)));
      });
      if (taken.has(newDate)) {
        return Response.json({ error: 'The talent is not available on that date — please choose another date.' }, { status: 400 });
      }
    }

    const previousDate = booking.event_date;
    await base44.asServiceRole.entities.Booking.update(bookingId, { event_date: newDate, status: 'pending' });

    try {
      await base44.asServiceRole.entities.Notification.create({
        user_id: booking.talent_user_id,
        type: 'booking',
        title: 'Booking date changed by the client',
        body: `"${booking.event_name || 'An event'}" has moved from ${label(previousDate)} to ${label(newDate)}. The booking is back to pending — accept it again once you've checked you're free.`,
        link_url: `/BookingDetails?id=${bookingId}`
      });
    } catch (e) {}

    return Response.json({ booking: { ...booking, event_date: newDate, status: 'pending' }, previous_date: previousDate });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}