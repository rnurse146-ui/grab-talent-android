import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Nudges seekers to rate the talent once their event date has passed.
// Runs daily from the "Review Reminders" scheduled workflow: one in-app
// notification per booking, marked on the booking so it never repeats.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    // Workflow-only endpoint: it has a public URL, so anyone could hit it.
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    // Event dates are calendar dates in the app's home timezone (Europe/London).
    const ukToday = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(new Date());

    const bookings = await base44.asServiceRole.entities.Booking.filter({
      event_date: { $lt: ukToday },
      status: { $in: ['confirmed', 'completed'] },
      review_reminder_sent: { $ne: true }
    });

    let nudged = 0;
    const skipped = [];

    for (const booking of bookings) {
      if (!booking.seeker_id) continue;

      // Already reviewed — nothing to ask for, and never ask again
      const reviews = await base44.asServiceRole.entities.Review.filter({ booking_id: booking.id });
      if (reviews && reviews.length > 0) {
        await base44.asServiceRole.entities.Booking.update(booking.id, { review_reminder_sent: true });
        continue;
      }

      const talentName = booking.talent_stage_name || 'your performer';
      const eventName = booking.event_name || 'your event';

      try {
        await base44.asServiceRole.entities.Notification.create({
          user_id: booking.seeker_id,
          type: 'review',
          title: `How was ${talentName}?`,
          body: `Your event "${eventName}" on ${booking.event_date} has passed. Rate ${talentName} and leave a review — it takes a minute and helps other seekers choose with confidence.`,
          link_url: `/BookingDetails?id=${booking.id}`,
          is_read: false
        });
        await base44.asServiceRole.entities.Booking.update(booking.id, { review_reminder_sent: true });
        nudged++;
      } catch (e) {
        skipped.push({ booking_id: booking.id, error: e.message });
      }
    }

    return Response.json({ ok: true, today: ukToday, checked: bookings.length, nudged, skipped });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}