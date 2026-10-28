import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Talent coordinates (TalentProfile.lat / .lng) are private: only the profile's
// owner and admins may read them. Discovery still needs area and travel-distance
// matching, so the page sends the searched area plus the candidate profiles and
// gets back match flags only — a stored position never leaves the server.
const toRad = (d) => (d * Math.PI) / 180;

const haversineMiles = (lat1, lng1, lat2, lng2) => {
  const R = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    const ids = Array.isArray(body?.profile_ids)
      ? [...new Set(body.profile_ids.filter((id) => typeof id === 'string' && id))].slice(0, 300)
      : [];
    const geo = body?.geo && Number.isFinite(body.geo.lat) && Number.isFinite(body.geo.lng)
      ? { lat: body.geo.lat, lng: body.geo.lng, bbox: body.geo.bbox || null }
      : null;
    const maxDistance = Number.isFinite(body?.max_distance) ? body.max_distance : null;

    if (!geo || ids.length === 0) return Response.json({ results: [] });

    // Service role is required because these coordinates are unreadable for a
    // visitor; only coarse yes/no flags are returned, never the position.
    const profiles = await base44.asServiceRole.entities.TalentProfile.filter({ id: { $in: ids } });

    const results = (profiles || []).map((talent) => {
      const hasCoords = Number.isFinite(talent.lat) && Number.isFinite(talent.lng);
      const distance = hasCoords ? haversineMiles(talent.lat, talent.lng, geo.lat, geo.lng) : null;

      let inArea = false;
      if (geo.bbox && hasCoords) {
        const { south, north, west, east } = geo.bbox;
        inArea = talent.lat >= south && talent.lat <= north && talent.lng >= west && talent.lng <= east;
      }

      // Travel radius as the profile states it, with the generous fallback used
      // for profiles saved before coordinates existed.
      const radius = Number(talent.location_radius) || 0;
      const travelsTo = distance == null ? radius >= 30 : distance <= radius;
      const withinMaxDistance = maxDistance == null || distance == null ? null : distance <= maxDistance;

      return { id: talent.id, in_area: inArea, travels_to: travelsTo, within_max_distance: withinMaxDistance };
    });

    return Response.json({ results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}