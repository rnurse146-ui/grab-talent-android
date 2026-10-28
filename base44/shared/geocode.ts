// Shared city geocoder (OpenStreetMap Nominatim, free, no key).
// Used by the public geocodeCity lookup and by the discovery area matcher,
// which must resolve the searched place on the server itself.
const UA = { 'User-Agent': 'GrabTalent/1.0 (talent discovery)', 'Accept-Language': 'en' };

// Small in-memory cache so repeated searches do not hammer Nominatim.
const cache = new Map<string, { at: number; value: any }>();
const TTL = 60 * 60 * 1000;

export async function geocodeCityName(rawCity: string) {
  const city = String(rawCity || '').trim();
  if (!city || city.length > 100) return null;

  const key = city.toLowerCase();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.value;

  // UK-first: prefer a GB match, fall back to a worldwide search
  const base = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`;
  let res = await fetch(`${base}&countrycodes=gb`, { headers: UA, signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error('Geocoding service unavailable');
  let data = await res.json();
  if (!Array.isArray(data) || data.length === 0) {
    res = await fetch(base, { headers: UA, signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error('Geocoding service unavailable');
    data = await res.json();
  }

  if (!Array.isArray(data) || data.length === 0) {
    const value = { lat: null, lng: null, display_name: '', bbox: null };
    cache.set(key, { at: Date.now(), value });
    return value;
  }

  // boundingbox = [south, north, west, east] — lets county/region searches
  // match every talent based anywhere inside the area, not just near its centre
  const bb = Array.isArray(data[0].boundingbox) ? data[0].boundingbox.map(Number) : null;
  const value = {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
    display_name: data[0].display_name,
    bbox: bb && bb.length === 4 && bb.every((n: number) => Number.isFinite(n))
      ? { south: bb[0], north: bb[1], west: bb[2], east: bb[3] }
      : null,
  };
  cache.set(key, { at: Date.now(), value });
  return value;
}