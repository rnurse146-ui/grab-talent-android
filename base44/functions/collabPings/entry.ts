import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// The collab pop-up feed for the current performer: a fresh mutual match first,
// otherwise the newest one-way "wants to collab" request they haven't answered.
// Reading other performers' swipes needs the service role, so it happens here.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));

    // Dismissing a pop-up marks it seen so it never comes back
    if (body?.action === 'seen') {
      const kind = String(body.kind || '');
      const id = String(body.id || '');
      if (!id) return Response.json({ error: 'id is required' }, { status: 400 });

      if (kind === 'match') {
        const match = await base44.asServiceRole.entities.NetworkMatch
          .get(id)
          .catch((e) => (e.status === 404 ? null : Promise.reject(e)));
        if (!match) return Response.json({ error: 'Not found' }, { status: 404 });
        if (match.user_a_id !== user.id && match.user_b_id !== user.id) {
          return Response.json({ error: 'Forbidden' }, { status: 403 });
        }
        await base44.asServiceRole.entities.NetworkMatch.update(id,
          match.user_a_id === user.id ? { a_celebrated: true } : { b_celebrated: true });
      } else if (kind === 'request') {
        const swipe = await base44.asServiceRole.entities.NetworkSwipe
          .get(id)
          .catch((e) => (e.status === 404 ? null : Promise.reject(e)));
        if (!swipe) return Response.json({ error: 'Not found' }, { status: 404 });
        if (swipe.target_user_id !== user.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
        await base44.asServiceRole.entities.NetworkSwipe.update(id, { target_seen: true });
      }

      return Response.json({ ok: true });
    }

    // 1. A match they haven't celebrated yet
    const matches = await base44.asServiceRole.entities.NetworkMatch.filter({
      $or: [{ user_a_id: user.id }, { user_b_id: user.id }]
    }, '-created_date', 20);
    const unseenMatch = (matches || []).find(m =>
      m.user_a_id === user.id ? !m.a_celebrated : !m.b_celebrated
    );
    if (unseenMatch) {
      const iAmA = unseenMatch.user_a_id === user.id;
      const otherProfile = await base44.asServiceRole.entities.TalentProfile
        .get(iAmA ? unseenMatch.profile_b_id : unseenMatch.profile_a_id)
        .catch((e) => (e.status === 404 ? null : Promise.reject(e)));
      return Response.json({
        kind: 'match',
        id: unseenMatch.id,
        name: otherProfile?.stage_name || 'A performer',
        other_user_id: iAmA ? unseenMatch.user_b_id : unseenMatch.user_a_id,
        conversation_id: unseenMatch.conversation_id
      });
    }

    // 2. Someone asked to collab with them but they haven't answered yet
    const requests = await base44.asServiceRole.entities.NetworkSwipe.filter({
      target_user_id: user.id,
      action: 'collab',
      target_seen: { $ne: true }
    }, '-created_date', 20);

    if (requests && requests.length > 0) {
      const profiles = await base44.asServiceRole.entities.TalentProfile.filter({
        id: { $in: requests.map(r => r.swiper_profile_id) }
      });
      const byId = new Map((profiles || []).map(p => [p.id, p]));

      for (const r of requests) {
        // Already a mutual match — the match pop-up covers this pair
        const conversationId = [user.id, r.swiper_user_id].sort().join('_');
        const matched = await base44.asServiceRole.entities.NetworkMatch.filter({ conversation_id: conversationId });
        if (matched && matched.length > 0) continue;

        const p = byId.get(r.swiper_profile_id);
        if (!p || p.network_open !== true) continue;

        return Response.json({
          kind: 'request',
          id: r.id,
          name: p.stage_name || 'A performer',
          other_user_id: r.swiper_user_id,
          category: p.talent_category || null,
          photo: p.profile_photo || null
        });
      }
    }

    return Response.json({ kind: null });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}