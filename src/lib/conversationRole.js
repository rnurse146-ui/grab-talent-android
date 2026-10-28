import { base44 } from '@/api/base44Client';

// What the other person is in this chat — a collab partner from the Talent
// Network, a performer, or someone hiring talent. Collab wins over talent
// because every network partner is a performer too.
export async function buildConversationRoleMap(userIds, currentUserId) {
  const ids = [...new Set((userIds || []).filter(Boolean))];
  if (ids.length === 0 || !currentUserId) return {};

  const [matches, profiles] = await Promise.all([
    base44.entities.NetworkMatch.filter(
      { $or: [{ user_a_id: currentUserId }, { user_b_id: currentUserId }] },
      '', 200
    ),
    base44.entities.TalentProfile.filter({ user_id: { $in: ids } }, '', 200),
  ]);

  const collabIds = new Set();
  (matches.items || matches || []).forEach(m => {
    collabIds.add(m.user_a_id === currentUserId ? m.user_b_id : m.user_a_id);
  });
  const talentIds = new Set(
    (profiles.items || profiles || []).map(p => p.user_id).filter(Boolean)
  );

  const map = {};
  ids.forEach(id => {
    map[id] = collabIds.has(id) ? 'collab' : talentIds.has(id) ? 'talent' : 'seeker';
  });
  return map;
}