import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Opening message both sides find in Messages as soon as a collab match happens.
const OPENING_MESSAGE = '🎉 We matched on Talent Network — let\'s talk about working together!';

// Records a Talent Network swipe. Matching, the opening chat message and the
// notifications are created here so a mutual "collab" can only be confirmed
// server-side, never faked from the browser.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const targetProfileId = String(body?.target_profile_id || '');
    const action = String(body?.action || '');
    if (!targetProfileId || !['collab', 'pass'].includes(action)) {
      return Response.json({ error: 'target_profile_id and a valid action are required' }, { status: 400 });
    }

    const [myProfile] = await base44.entities.TalentProfile.filter({ user_id: user.id });
    if (!myProfile) return Response.json({ error: 'Create a talent profile before using Talent Network' }, { status: 400 });
    if (myProfile.network_open !== true) return Response.json({ error: 'Turn on Talent Network before connecting' }, { status: 400 });

    const target = await base44.asServiceRole.entities.TalentProfile
      .get(targetProfileId)
      .catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (!target) return Response.json({ error: 'Profile not found' }, { status: 404 });
    if (target.id === myProfile.id || target.user_id === user.id) {
      return Response.json({ error: 'You cannot connect with yourself' }, { status: 400 });
    }
    if (target.network_open !== true) {
      return Response.json({ error: 'That performer is not open to collabs' }, { status: 400 });
    }

    // One answer per pair — re-swiping replaces the earlier one
    const previous = await base44.asServiceRole.entities.NetworkSwipe.filter({
      swiper_user_id: user.id,
      target_profile_id: target.id
    });
    await base44.asServiceRole.entities.NetworkSwipe.deleteMany({
      swiper_user_id: user.id,
      target_profile_id: target.id
    });
    await base44.asServiceRole.entities.NetworkSwipe.create({
      swiper_user_id: user.id,
      swiper_profile_id: myProfile.id,
      target_profile_id: target.id,
      target_user_id: target.user_id,
      action
    });

    const myName = myProfile.stage_name || user.full_name || 'A performer';
    const theirName = target.stage_name || 'A performer';

    if (action !== 'collab') return Response.json({ matched: false });

    const reciprocal = await base44.asServiceRole.entities.NetworkSwipe.filter({
      swiper_user_id: target.user_id,
      target_profile_id: myProfile.id,
      action: 'collab'
    });
    if (!reciprocal || reciprocal.length === 0) {
      // A one-way request — tell them straight away, without opening a chat yet
      const alreadyAsked = (previous || []).some(s => s.action === 'collab');
      if (!alreadyAsked) {
        await base44.asServiceRole.entities.Notification.create({
          user_id: target.user_id,
          type: 'message',
          title: `${myName} wants to collab with you`,
          body: 'Open Talent Network to see their profile and say yes to a chat.',
          link_url: '/TalentNetwork',
          is_read: false
        });
      }
      return Response.json({ matched: false });
    }

    const conversationId = [user.id, target.user_id].sort().join('_');
    const existing = await base44.asServiceRole.entities.NetworkMatch.filter({ conversation_id: conversationId });
    let match = existing?.[0] || null;

    if (!match) {
      match = await base44.asServiceRole.entities.NetworkMatch.create({
        user_a_id: user.id,
        user_b_id: target.user_id,
        profile_a_id: myProfile.id,
        profile_b_id: target.id,
        conversation_id: conversationId,
        a_celebrated: false,
        b_celebrated: false
      });

      // Seeded so the conversation already exists on both sides
      await base44.asServiceRole.entities.Message.create({
        conversation_id: conversationId,
        sender_id: target.user_id,
        receiver_id: user.id,
        sender_name: theirName,
        receiver_name: myName,
        content: OPENING_MESSAGE,
        is_read: false
      });

      await base44.asServiceRole.entities.Notification.bulkCreate([
        {
          user_id: user.id,
          type: 'message',
          title: `${theirName} wants to collab`,
          body: 'You matched on Talent Network — say hello and plan something together.',
          link_url: '/Messages',
          is_read: false
        },
        {
          user_id: target.user_id,
          type: 'message',
          title: `${myName} wants to collab`,
          body: 'You matched on Talent Network — say hello and plan something together.',
          link_url: '/Messages',
          is_read: false
        }
      ]);
    }

    return Response.json({
      matched: true,
      match_id: match.id,
      conversation_id: conversationId,
      name: target.stage_name || 'A performer'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}