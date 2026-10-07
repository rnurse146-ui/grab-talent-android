import { base44 } from '@/api/base44Client';

// Well-known London boroughs and localities — talent based there stays
// discoverable when seekers search "London"
const LONDON_AREAS = new Set([
  'barking', 'barnet', 'bexley', 'brent', 'bromley', 'camden', 'chelsea', 'croydon',
  'dagenham', 'ealing', 'edgware', 'enfield', 'fulham', 'greenwich', 'hackney',
  'hammersmith', 'haringey', 'harrow', 'havering', 'hillingdon', 'hounslow',
  'islington', 'kensington', 'kingston', 'lambeth', 'lewisham', 'newham', 'peckham',
  'redbridge', 'richmond', 'romford', 'shoreditch', 'southwark', 'stratford',
  'sutton', 'tooting', 'twickenham', 'walthamstow', 'wandsworth', 'wembley',
  'westminster', 'wimbledon', 'wood green', 'brixton', 'clapham', 'putney',
  'bermondsey', 'ilford', 'woolwich', 'pinner', 'deptford', 'chiswick'
]);

// Resolves a city or area to a comparable key: London areas -> "london"
export function normalizeCity(text) {
  const t = (text || '').toLowerCase().trim().replace(/\s+/g, ' ');
  if (!t) return '';
  if (t === 'london' || t === 'greater london' || t === 'city of london' || LONDON_AREAS.has(t)) return 'london';
  return t;
}

// A talent matches the searched city when their home city text contains it,
// or both resolve to the same area (e.g. "Dagenham" matches "London")
export function cityMatches(talent, normCity, rawCity) {
  const tc = (talent.location_city || '').toLowerCase().trim();
  if (!tc) return false;
  if (rawCity && tc.includes(rawCity.toLowerCase().trim())) return true;
  return normalizeCity(tc) === normCity;
}

// True when the talent's home coordinates fall inside the searched area's
// bounding box — this is what makes county/region searches (e.g. "Kent")
// find talent based in any town within that area, in any country
export function inSearchArea(talent, geo) {
  if (!geo || !geo.bbox || talent.lat == null || talent.lng == null) return false;
  const { south, north, west, east } = geo.bbox;
  return talent.lat >= south && talent.lat <= north && talent.lng >= west && talent.lng <= east;
}

// Great-circle distance in miles
export function haversineMiles(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// True when the talent is within their travel radius of the event city.
// Falls back to a generous-radius heuristic when coordinates are missing.
export function travelsTo(talent, geo) {
  const radius = talent.location_radius || 0;
  if (geo && talent.lat != null && talent.lng != null) {
    return haversineMiles(talent.lat, talent.lng, geo.lat, geo.lng) <= radius;
  }
  return radius >= 30;
}

const geoCache = new Map();
export async function geocodeCityCached(city) {
  const key = (city || '').toLowerCase().trim();
  if (!key) return null;
  if (geoCache.has(key)) return geoCache.get(key);
  try {
    const res = await base44.functions.invoke('geocodeCity', { city });
    const d = res.data;
    const geo = d?.lat != null
      ? { lat: d.lat, lng: d.lng, bbox: d.bbox || null }
      : null;
    geoCache.set(key, geo);
    return geo;
  } catch (e) {
    geoCache.set(key, null);
    return null;
  }
}