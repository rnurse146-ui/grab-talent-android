// Shared pricing helpers — talents can charge hourly, a flat evening rate, a flat
// day rate, or any combination. Used across discovery, profiles and booking.

// Best comparable hourly figure: hourly rate, else evening rate, else day rate.
export function effectiveHourlyRate(talent) {
  return talent?.hourly_rate ?? talent?.evening_rate ?? talent?.day_rate ?? null;
}

// Typical cost of one booking (for total-spend budget filtering).
export function typicalTotalRate(talent) {
  if (talent?.day_rate) return talent.day_rate;
  if (talent?.evening_rate) return talent.evening_rate;
  const hourly = effectiveHourlyRate(talent);
  return hourly ? hourly * (talent?.minimum_hours || 1) : null;
}

// Human-readable summary of whatever rates a talent has set, e.g. "£150/hr • £400 evening".
export function rateSummary(talent) {
  const parts = [];
  if (talent?.hourly_rate) parts.push(`£${talent.hourly_rate}/hr`);
  if (talent?.evening_rate) parts.push(`£${talent.evening_rate} evening`);
  if (talent?.day_rate) parts.push(`£${talent.day_rate} day`);
  return parts.join(' • ');
}

// Booking price for a given start hour and duration.
// Prefers the hourly rate; falls back to the evening rate (start 4pm or later)
// then the day rate. Returns null when no rate can price the booking.
export function estimateBookingPrice(talent, startHour, hours) {
  if (!talent) return null;
  if (talent.hourly_rate) {
    const basePrice = hours * talent.hourly_rate;
    return { hours, basePrice, commission: basePrice * 0.11, total: basePrice * 1.11 };
  }
  const flat = talent.evening_rate && startHour >= 16 ? talent.evening_rate : talent.day_rate;
  if (flat) {
    return { hours, basePrice: flat, commission: flat * 0.11, total: flat * 1.11 };
  }
  return null;
}