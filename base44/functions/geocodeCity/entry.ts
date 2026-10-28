import { geocodeCityName } from '../../shared/geocode.ts';

// Geocodes a city name to coordinates using OpenStreetMap Nominatim (free, no key).
// Public lookup — no auth needed, since guests also search by city in Discover.
export default async function(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const city = String(body.city || '').trim();
    if (!city || city.length > 100) {
      return Response.json({ error: 'Missing city' }, { status: 400 });
    }
    const result = await geocodeCityName(city);
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}