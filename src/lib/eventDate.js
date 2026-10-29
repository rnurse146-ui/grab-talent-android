// Event dates are stored as YYYY-MM-DD calendar dates. A review request only
// appears once the event day itself is behind us.
export function hasEventPassed(eventDate) {
  if (!eventDate) return false;
  const today = new Date();
  const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return String(eventDate).slice(0, 10) < iso;
}