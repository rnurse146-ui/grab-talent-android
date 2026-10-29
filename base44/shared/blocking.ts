// Blocking checks shared by the messaging, collab and network functions.
// A block counts in both directions: whoever blocked whom, neither side can
// reach the other through the app.

export async function blockBetween(base44, userIdA, userIdB) {
  if (!userIdA || !userIdB || userIdA === userIdB) return false;
  const rows = await base44.asServiceRole.entities.Block.filter({
    $or: [
      { blocker_id: userIdA, blocked_user_id: userIdB },
      { blocker_id: userIdB, blocked_user_id: userIdA }
    ]
  }, '', 1);
  return (rows || []).length > 0;
}

// Every user id this person must not see or be seen by, in both directions.
export async function hiddenUserIds(base44, userId) {
  if (!userId) return [];
  const [mine, theirs] = await Promise.all([
    base44.asServiceRole.entities.Block.filter({ blocker_id: userId }),
    base44.asServiceRole.entities.Block.filter({ blocked_user_id: userId })
  ]);
  return [...new Set([
    ...(mine || []).map(r => r.blocked_user_id),
    ...(theirs || []).map(r => r.blocker_id)
  ])].filter(Boolean);
}