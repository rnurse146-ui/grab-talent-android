// Guest Maybe List — saved on this device only until the guest signs in,
// then merged into their real Maybe List by the MaybeList page.
const KEY = 'gt_guest_maybes';

export function getGuestMaybes() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addGuestMaybe(talent) {
  const list = getGuestMaybes();
  if (list.some(item => item.talent_profile_id === talent.id)) return list.length;
  list.push({
    id: 'guest_' + talent.id,
    talent_profile_id: talent.id,
    talent_stage_name: talent.stage_name,
    talent_category: talent.talent_category,
    talent_photo: talent.profile_photo,
    talent_hourly_rate: talent.hourly_rate,
    talent_rating: talent.average_rating,
    talent_city: talent.location_city,
  });
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* storage unavailable */ }
  return list.length;
}

export function removeGuestMaybe(id) {
  const list = getGuestMaybes().filter(item => item.id !== id);
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* storage unavailable */ }
  return list;
}

export function clearGuestMaybes() {
  try { localStorage.removeItem(KEY); } catch { /* storage unavailable */ }
}