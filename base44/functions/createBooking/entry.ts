import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Server-side booking creation. Pricing is always derived from the talent's
// stored profile rates — client-supplied amounts are ignored.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const talentProfileId = String(body?.talent_profile_id || '');
    if (!talentProfileId) return Response.json({ error: 'talent_profile_id is required' }, { status: 400 });

    let talent = null;
    try {
      talent = await base44.asServiceRole.entities.TalentProfile.get(talentProfileId);
    } catch (e) {
      return Response.json({ error: 'Talent not found' }, { status: 404 });
    }
    if (!talent) return Response.json({ error: 'Talent not found' }, { status: 404 });

    // Price the booking server-side from the talent's rates
    const startTime = String(body?.start_time || '');
    const endTime = String(body?.end_time || '');
    let pricing = null;
    if (startTime && endTime) {
      let hours = parseInt(endTime.split(':')[0]) - parseInt(startTime.split(':')[0]);
      if (hours < 0) hours += 24;
      if (talent.minimum_hours && hours < talent.minimum_hours) hours = talent.minimum_hours;
      const startHour = parseInt(startTime.split(':')[0]);
      if (talent.hourly_rate) {
        const basePrice = hours * talent.hourly_rate;
        pricing = { duration_hours: hours, base_price: basePrice, commission_amount: basePrice * 0.11, total_price: basePrice * 1.11, talent_payout: basePrice };
      } else {
        const flat = talent.evening_rate && startHour >= 16 ? talent.evening_rate : talent.day_rate;
        if (flat) {
          pricing = { duration_hours: hours, base_price: flat, commission_amount: flat * 0.11, total_price: flat * 1.11, talent_payout: flat };
        }
      }
    }

    const booking = await base44.asServiceRole.entities.Booking.create({
      talent_profile_id: talent.id,
      seeker_id: user.id,
      talent_user_id: talent.user_id,
      event_name: String(body?.event_name || ''),
      event_type: String(body?.event_type || ''),
      event_date: String(body?.event_date || ''),
      start_time: startTime,
      end_time: endTime,
      venue_name: String(body?.venue_name || ''),
      venue_address: String(body?.venue_address || ''),
      venue_city: String(body?.venue_city || ''),
      special_requirements: String(body?.special_requirements || ''),
      seeker_name: user.full_name,
      seeker_phone: String(body?.seeker_phone || ''),
      talent_stage_name: talent.stage_name,
      talent_category: talent.talent_category,
      status: 'pending',
      payment_status: 'pending',
      ...(pricing || {})
    });

    // Best-effort: notify the talent in-app and by email
    try {
      await base44.asServiceRole.entities.Notification.create({
        user_id: talent.user_id,
        type: 'booking',
        title: 'New booking request',
        body: `${user.full_name} requested you for "${body?.event_name}" in ${body?.venue_city}`,
        link_url: '/Bookings'
      });
    } catch (e) {}
    try {
      await base44.functions.invoke('notifyTalentByEmail', { kind: 'booking_request', booking_id: booking.id });
    } catch (e) {}

    return Response.json({ booking });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}