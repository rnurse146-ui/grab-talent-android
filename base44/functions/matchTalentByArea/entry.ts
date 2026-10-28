import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { geocodeCityName } from '../../shared/geocode.ts';

// Talent coordinates (TalentProfile.lat / .lng) are private: only the profile's
// owner and admins may read them. Discovery still needs area and travel-distance
// matching, so the browser sends the searched city name and the candidate ids
// and only coarse match flags come back — never a position, never a distance.
//
// The searched place is resolved here, not supplied by the caller: the browser
// cannot hand us an arbitrary point, so the reply cannot be used as a precise
// distance oracle to triangulate a profile's stored coordinates.
const toRad = (d) => (d * Math.PI) / 180;

const haversineMiles = (lat1, lng1, lat2, lng2) => {
  const R = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};

// Only the distance options the Discover filter offers are honoured.
const ALLOWED_DISTANCES = [10, 25, 50, 100];
// Geocoded points are snapped to a coarse grid (~3.5 miles) and distances are
// reported in 5-mile bands, so no answer pins down a performer's exact base.
const GRID = 0.05;
const MIN_BBOX_SPAN = 0.1;
const snap = (v) => Math.round(v / GRID) * GRID;

// A county/region search keeps its real bounding box; a street-level lookup is
// widened to at least a ~7 mile cell so it cannot act as a pin-point probe.
const resolveArea = (geo) => {
  const lat = snap(geo.lat);
  const lng = snap(geo.lng);
  const b = geo.bbox;
  const wideEnough = b && Number.isFinite(b.south) && Number.isFinite(b.north) && Number.isFinite(b.west) && Number.isFinite(b.east)
    && (b.north - b.south) >= MIN_BBOX_SPAN && (b.east - b.west) >= MIN_BBOX_SPAN;
  return {
    lat,
    lng,
    bbox: wideEnough ? b : {
      south: lat - MIN_BBOX_SPAN / 2,
      north: lat + MIN_BBOX_SPAN / 2,
      west: lng - MIN_BBOX_SPAN / 2,
      east: lng + MIN_BBOX_SPAN / 2,
    },
  };
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    const ids = Array.isArray(body?.profile_ids)
      ? [...new Set(body.profile_ids.filter((id) => typeof id === 'string' && id))].slice(0, 300)
      : [];
    const city = typeof body?.city === 'string' ? body.city.trim().slice(0, 100) : '';
    const requestedDistance = Number(body?.max_distance);
    const maxDistance = ALLOWED_DISTANCES.includes(requestedDistance) ? requestedDistance : null;

    if (!city || ids.length === 0) return Response.json({ results: [] });

    const resolved = await geocodeCityName(city);
    if (!resolved || !Number.isFinite(resolved.lat) || !Number.isFinite(resolved.lng)) {
      return Response.json({ results: [] });
    }
    const area = resolveArea(resolved);

    // Service role is required because these coordinates are unreadable for a
    // visitor; only coarse yes/no flags are returned, never the position.
    const profiles = await base44.asServiceRole.entities.TalentProfile.filter({ id: { $in: ids } });

    const results = (profiles || []).map((talent) => {
      const hasCoords = Number.isFinite(talent.lat) && Number.isFinite(talent.lng);
      const distance = hasCoords ? haversineMiles(talent.lat, talent.lng, area.lat, area.lng) : null;
      // 5-mile bands: the comparison below can only ever say "within 10/25/50/100"
      const banded = distance == null ? null : Math.round(distance / 5) * 5;

      const inArea = hasCoords
        && talent.lat >= area.bbox.south && talent.lat <= area.bbox.north
        && talent.lng >= area.bbox.west && talent.lng <= area.bbox.east;

      // Travel radius as the profile states it, with the generous fallback used
      // for profiles saved before coordinates existed.
      const radius = Number(talent.location_radius) || 0;
      const travelsTo = banded == null ? radius >= 30 : banded <= radius;
      const withinMaxDistance = maxDistance == null || banded == null ? null : banded <= maxDistance;

      return { id: talent.id, in_area: inArea, travels_to: travelsTo, within_max_distance: withinMaxDistance };
    });

    return Response.json({ results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}