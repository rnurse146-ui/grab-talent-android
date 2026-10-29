import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { hiddenUserIds } from '../../shared/blocking.ts';

// Blocking is two-way: a blocked performer cannot see the profile in discovery
// or Talent Network, cannot match, and cannot message or post in shared collab
// chats. Records are written here only, so a block cannot be forged or skipped.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || '');

    if (action === 'hidden_ids') {
      return Response.json({ ids: await hiddenUserIds(base44, user.id) });
    }

    if (action === 'list') {
      const rows = await base44.asServiceRole.entities.Block.filter({ blocker_id: user.id }, '-created_date', 100);
      return Response.json({ blocks: rows || [] });
    }

    const targetId = String(body?.user_id || '');
    if (!targetId) return Response.json({ error: 'user_id is required' }, { status: 400 });
    if (targetId === user.id) return Response.json({ error: 'You cannot block yourself' }, { status: 400 });

    if (action === 'unblock') {
      await base44.asServiceRole.entities.Block.deleteMany({ blocker_id: user.id, blocked_user_id: targetId });
      return Response.json({ blocked: false });
    }

    if (action !== 'block') return Response.json({ error: 'Unknown action' }, { status: 400 });

    const target = await base44.asServiceRole.entities.User
      .get(targetId)
      .catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (!target) return Response.json({ error: 'User not found' }, { status: 404 });

    const existing = await base44.asServiceRole.entities.Block.filter({
      blocker_id: user.id,
      blocked_user_id: targetId
    }, '', 1);

    const stageNameFor = async (userId, fallback) => {
      const profiles = await base44.asServiceRole.entities.TalentProfile.filter({ user_id: userId }, '', 1);
      return profiles?.[0]?.stage_name || fallback || 'Member';
    };

    if (!existing || existing.length === 0) {
      const [myName, theirName] = await Promise.all([
        stageNameFor(user.id, user.full_name),
        stageNameFor(targetId, target.full_name)
      ]);
      await base44.asServiceRole.entities.Block.create({
        blocker_id: user.id,
        blocked_user_id: targetId,
        blocker_name: myName,
        blocked_name: theirName
      });
    }

    // Any Talent Network connection between the two is disconnected, and the
    // one-way requests are cleared so neither side can complete a match.
    const pairConversationId = [user.id, targetId].sort().join('_');
    await Promise.allSettled([
      base44.asServiceRole.entities.NetworkMatch.deleteMany({ conversation_id: pairConversationId }),
      base44.asServiceRole.entities.NetworkSwipe.deleteMany({ swiper_user_id: user.id, target_user_id: targetId }),
      base44.asServiceRole.entities.NetworkSwipe.deleteMany({ swiper_user_id: targetId, target_user_id: user.id })
    ]);

    return Response.json({ blocked: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}