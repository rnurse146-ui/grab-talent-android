// Geocodes a city name to coordinates using OpenStreetMap Nominatim (free, no key).
// Public lookup — no auth needed, since guests also search by city in Discover.
export default async function(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const city = String(body.city || '').trim();
    if (!city || city.length > 100) {
      return Response.json({ error: 'Missing city' }, { status: 400 });
    }
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'GrabTalent/1.0 (talent discovery)', 'Accept-Language': 'en' },
      signal: AbortSignal.timeout(8000)
    });
    if (!res.ok) {
      return Response.json({ error: 'Geocoding service unavailable' }, { status: 502 });
    }
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      return Response.json({ lat: null, lng: null });
    }
    return Response.json({
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      display_name: data[0].display_name
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}