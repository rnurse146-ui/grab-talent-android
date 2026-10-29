import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Reminds performers about collab requests still waiting for an answer.
// In-app the request only shows as a pop-up once they open the app, so people
// who haven't opened it never hear about it — this nudges them by notification
// and email instead. Runs daily from the "Pending Request Reminders" workflow,
// once per request, a day after it was sent.
const MIN_AGE_HOURS = 24;
const MAX_ROWS = 200;

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    // Workflow-only endpoint: it has a public URL, so anyone could hit it.
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const cutoff = new Date(Date.now() - MIN_AGE_HOURS * 60 * 60 * 1000).toISOString();

    const pending = await base44.asServiceRole.entities.NetworkSwipe.filter({
      action: 'collab',
      target_seen: { $ne: true },
      reminder_sent: { $ne: true },
      created_date: { $lt: cutoff }
    });

    const swipes = (pending || []).slice(0, MAX_ROWS);
    if (swipes.length === 0) return Response.json({ ok: true, checked: 0, reminded: 0 });

    // Requests that already became a match need no reminder
    const conversationIds = swipes.map((s) => [s.swiper_user_id, s.target_user_id].sort().join('_'));
    const matches = await base44.asServiceRole.entities.NetworkMatch.filter({
      conversation_id: { $in: conversationIds }
    });
    const matchedPairs = new Set((matches || []).map((m) => m.conversation_id));

    const profileIds = [...new Set(swipes.map((s) => s.swiper_profile_id).filter(Boolean))];
    const profiles = profileIds.length > 0
      ? await base44.asServiceRole.entities.TalentProfile.filter({ id: { $in: profileIds } })
      : [];
    const profileById = new Map((profiles || []).map((p) => [p.id, p]));

    const targetIds = [...new Set(swipes.map((s) => s.target_user_id).filter(Boolean))];
    const targets = targetIds.length > 0
      ? await base44.asServiceRole.entities.User.filter({ id: { $in: targetIds } })
      : [];
    const userById = new Map((targets || []).map((u) => [u.id, u]));

    // One reminder per person, even when several requests are waiting
    const byTarget = new Map();
    const handledIds = [];

    for (const swipe of swipes) {
      const pairKey = [swipe.swiper_user_id, swipe.target_user_id].sort().join('_');
      if (matchedPairs.has(pairKey)) {
        handledIds.push(swipe.id);
        continue;
      }

      const requester = profileById.get(swipe.swiper_profile_id);
      if (!requester || requester.network_open !== true) {
        // They closed their network since asking — nothing to remind anyone about
        handledIds.push(swipe.id);
        continue;
      }

      const target = userById.get(swipe.target_user_id);
      if (!target?.email) {
        handledIds.push(swipe.id);
        continue;
      }

      const group = byTarget.get(swipe.target_user_id) || { user: target, names: [], ids: [] };
      group.names.push(requester.stage_name || 'A performer');
      group.ids.push(swipe.id);
      byTarget.set(swipe.target_user_id, group);
    }

    let reminded = 0;
    const skipped = [];

    for (const { user: target, names, ids } of byTarget.values()) {
      const requesterName = names[0];
      const extra = names.length - 1;
      const summary = extra > 0
        ? `and ${extra} other performer${extra > 1 ? 's' : ''} ${extra > 1 ? 'are' : 'is'} waiting for your reply`
        : 'Open Talent Network to see their profile and reply.';
      const firstName = String(target.full_name || '').trim().split(' ')[0] || 'there';

      try {
        await base44.asServiceRole.entities.Notification.create({
          user_id: target.id,
          type: 'message',
          title: extra > 0 ? `${names.length} collab requests are waiting` : `${requesterName} is waiting for your reply`,
          body: 'Your collab request is still unanswered. Open Talent Network to see their profile and say yes to a chat.',
          link_url: '/TalentNetwork',
          is_read: false
        });

        await base44.asServiceRole.integrations.Core.SendEmail({
          to: target.email,
          template_name: 'CollabRequestReminder',
          variables: {
            first_name: firstName,
            requester_name: requesterName,
            request_summary: summary
          },
          category: 'transactional'
        });

        handledIds.push(...ids);
        reminded++;
      } catch (e) {
        skipped.push({ user_id: target.id, error: e.message });
      }
    }

    if (handledIds.length > 0) {
      await base44.asServiceRole.entities.NetworkSwipe.bulkUpdate(
        [...new Set(handledIds)].map((id) => ({ id, reminder_sent: true }))
      );
    }

    return Response.json({ ok: true, checked: swipes.length, reminded, skipped });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}