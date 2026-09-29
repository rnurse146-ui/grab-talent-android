// Ranking for the Discover deck: well-made, relevant talent surfaces more,
// while a light per-session shuffle keeps every profile getting exposure.

export function discoverScore(talent, { eventCity = '', daysUntilEvent = null } = {}) {
  let score = 0;

  // Average rating (0-5 → up to 10 points)
  score += (talent.average_rating || 0) * 2;

  // Review volume, capped so one great review can't outweigh a track record
  score += Math.min(talent.total_reviews || 0, 20) * 0.25;

  // Verified identity
  if (talent.is_verified) score += 4;

  // A profile video is the strongest signal of a serious profile
  if (talent.profile_video) score += 3;

  // Profile completeness (up to 6 points)
  const gallery = talent.media_gallery || [];
  const social = talent.social_links || {};
  const hasRate = talent.hourly_rate || talent.day_rate || talent.evening_rate;
  let completeness = 0;
  if (talent.bio && talent.bio.length > 50) completeness++;
  if (talent.profile_photo) completeness++;
  if (gallery.length >= 3) completeness++;
  if (hasRate) completeness++;
  if ((talent.specialties || []).length > 0) completeness++;
  if (Object.values(social).some(Boolean)) completeness++;
  score += completeness;

  // Urgent event (within 7 days): last-minute-available talent jumps the queue
  if (daysUntilEvent != null && daysUntilEvent <= 7 && talent.last_minute_available) score += 8;

  // Local talent first when the seeker hasn't filtered by city themselves
  const city = (eventCity || '').trim().toLowerCase();
  if (city && (talent.location_city || '').trim().toLowerCase() === city) score += 6;

  return score;
}

export function rankTalents(talents, options = {}) {
  return talents
    .map((t) => ({ t, score: discoverScore(t, options) + Math.random() * 3 }))
    .sort((a, b) => b.score - a.score)
    .map(({ t }) => t);
}