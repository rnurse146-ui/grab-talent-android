// Geocodes a city name to coordinates using OpenStreetMap Nominatim (free, no key).
// Public lookup — no auth needed, since guests also search by city in Discover.
export default async function(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const city = String(body.city || '').trim();
    if (!city || city.length > 100) {
      return Response.json({ error: 'Missing city' }, { status: 400 });
    }
    // UK-first: prefer a GB match, fall back to a worldwide search
    const base = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`;
    const ua = { 'User-Agent': 'GrabTalent/1.0 (talent discovery)', 'Accept-Language': 'en' };
    let res = await fetch(`${base}&countrycodes=gb`, { headers: ua, signal: AbortSignal.timeout(8000) });
    if (!res.ok) {
      return Response.json({ error: 'Geocoding service unavailable' }, { status: 502 });
    }
    let data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      res = await fetch(base, { headers: ua, signal: AbortSignal.timeout(8000) });
      if (!res.ok) {
        return Response.json({ error: 'Geocoding service unavailable' }, { status: 502 });
      }
      data = await res.json();
    }
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