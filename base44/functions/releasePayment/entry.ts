import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Escrow release. Only the seeker may release the held payment, and only once
// the booking is confirmed and the payment isn't already released — payment
// state is never client-writable.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const bookingId = String(body?.booking_id || '');
    if (!bookingId) return Response.json({ error: 'booking_id is required' }, { status: 400 });

    let booking = null;
    try {
      booking = await base44.asServiceRole.entities.Booking.get(bookingId);
    } catch (e) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }
    if (!booking) return Response.json({ error: 'Booking not found' }, { status: 404 });

    if (booking.seeker_id !== user.id) return Response.json({ error: 'Only the seeker can release payment' }, { status: 403 });
    if (booking.status !== 'confirmed') return Response.json({ error: 'Payment can only be released for a confirmed booking' }, { status: 403 });
    if (booking.payment_status === 'released') return Response.json({ error: 'Payment has already been released' }, { status: 403 });

    await base44.asServiceRole.entities.Booking.update(bookingId, { payment_status: 'released', status: 'completed' });
    return Response.json({ booking: { ...booking, payment_status: 'released', status: 'completed' } });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}