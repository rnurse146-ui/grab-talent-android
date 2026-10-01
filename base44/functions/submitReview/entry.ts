import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Reviews are server-validated: the caller must be the booking's seeker, the
// booking must be completed, and each booking can be reviewed once. The
// talent's rating aggregates are recomputed server-side from all reviews —
// clients can never inflate them.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const bookingId = String(body?.booking_id || '');
    const rating = Number(body?.rating);
    const reviewText = String(body?.review_text || '');
    if (!bookingId || !rating || rating < 1 || rating > 5) {
      return Response.json({ error: 'A rating between 1 and 5 is required' }, { status: 400 });
    }

    let booking = null;
    try {
      booking = await base44.asServiceRole.entities.Booking.get(bookingId);
    } catch (e) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }
    if (!booking) return Response.json({ error: 'Booking not found' }, { status: 404 });

    if (booking.seeker_id !== user.id) return Response.json({ error: 'Only the seeker can review this booking' }, { status: 403 });
    if (booking.status !== 'completed') return Response.json({ error: 'Only completed bookings can be reviewed' }, { status: 403 });

    const existing = await base44.asServiceRole.entities.Review.filter({ booking_id: bookingId });
    if (existing && existing.length > 0) return Response.json({ error: 'A review was already submitted for this booking' }, { status: 409 });

    const review = await base44.asServiceRole.entities.Review.create({
      booking_id: bookingId,
      talent_profile_id: booking.talent_profile_id,
      reviewer_id: user.id,
      reviewer_name: user.full_name,
      rating,
      review_text: reviewText,
      event_type: booking.event_type,
      event_date: booking.event_date
    });

    // Recompute the talent's aggregates from every review on record
    try {
      const agg = await base44.asServiceRole.entities.Review.aggregate({
        query: { talent_profile_id: booking.talent_profile_id },
        avg: ['rating']
      });
      const row = agg?.rows?.[0];
      if (row && booking.talent_profile_id) {
        await base44.asServiceRole.entities.TalentProfile.update(booking.talent_profile_id, {
          total_reviews: row.count,
          average_rating: row.avg_rating != null ? Math.round(row.avg_rating * 10) / 10 : null
        });
      }
    } catch (e) {}

    // Best-effort: tell the talent
    try {
      await base44.asServiceRole.entities.Notification.create({
        user_id: booking.talent_user_id,
        type: 'review',
        title: `New ${rating}-star review`,
        body: `${user.full_name} reviewed "${booking.event_name || 'your booking'}"`,
        link_url: '/Bookings'
      });
    } catch (e) {}

    return Response.json({ review });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}