// Guest Maybe List — saved on this device only until the guest signs in,
// then merged into their real Maybe List so the account shows it everywhere.
import { base44 } from '@/api/base44Client';

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

// Move anything saved on this device into the signed-in account, so a list
// built while browsing as a guest on the phone also appears on the web.
export async function mergeGuestMaybes(userId) {
  const guestItems = getGuestMaybes();
  if (!userId || guestItems.length === 0) return 0;
  const existing = await base44.entities.MaybeList.filter({ seeker_id: userId });
  const existingIds = new Set(existing.map(item => item.talent_profile_id));
  const toCreate = guestItems
    .filter(item => !existingIds.has(item.talent_profile_id))
    .map(({ id, ...rest }) => ({ ...rest, seeker_id: userId }));
  if (toCreate.length > 0) await base44.entities.MaybeList.bulkCreate(toCreate);
  clearGuestMaybes();
  return toCreate.length;
}