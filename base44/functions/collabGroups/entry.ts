import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const MAX_MEMBERS = 20;
const MAX_MESSAGE = 2000;

// Talent Connect group chats: performers who matched can form a group to plan a
// collab. Every action checks membership server-side — group records and their
// messages are not readable by app users directly.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || '');

    const stageName = async (userId, fallback) => {
      const profiles = await base44.asServiceRole.entities.TalentProfile.filter({ user_id: userId }, '', 1);
      return profiles?.[0]?.stage_name || fallback || 'Performer';
    };

    const myConnectionIds = async () => {
      const matches = await base44.asServiceRole.entities.NetworkMatch.filter({
        $or: [{ user_a_id: user.id }, { user_b_id: user.id }]
      });
      return new Set((matches || []).map(m => (m.user_a_id === user.id ? m.user_b_id : m.user_a_id)));
    };

    if (action === 'list') {
      const groups = await base44.asServiceRole.entities.CollabGroup.filter({ member_ids: user.id }, '-created_date', 50);
      const list = await Promise.all((groups || []).map(async (g) => {
        const last = await base44.asServiceRole.entities.CollabGroupMessage.filter({ group_id: g.id }, '-created_date', 1);
        return { ...g, last_message: last?.[0] || null };
      }));
      return Response.json({ groups: list });
    }

    if (action === 'connections') {
      const others = [...(await myConnectionIds())];
      const profiles = others.length
        ? await base44.asServiceRole.entities.TalentProfile.filter({ user_id: { $in: others } })
        : [];
      const byUser = {};
      (profiles || []).forEach((p) => { byUser[p.user_id] = p; });
      return Response.json({
        connections: others.map((id) => ({
          user_id: id,
          stage_name: byUser[id]?.stage_name || 'Performer',
          photo: byUser[id]?.profile_photo || null
        }))
      });
    }

    if (action === 'create') {
      const name = String(body?.name || '').trim().slice(0, 60);
      const requested = Array.isArray(body?.member_ids) ? body.member_ids.map(String) : [];
      const memberIds = [...new Set(requested)].filter((id) => id && id !== user.id);
      if (memberIds.length === 0) return Response.json({ error: 'Pick at least one performer you connected with' }, { status: 400 });
      if (memberIds.length > MAX_MEMBERS) return Response.json({ error: 'Too many members for one group' }, { status: 400 });

      const connected = await myConnectionIds();
      if (memberIds.some((id) => !connected.has(id))) {
        return Response.json({ error: 'Only performers you connected with on Talent Network can join' }, { status: 400 });
      }

      const myName = await stageName(user.id, user.full_name);
      const names = await Promise.all(memberIds.map((id) => stageName(id)));
      const group = await base44.asServiceRole.entities.CollabGroup.create({
        name: name || 'Collab group',
        owner_id: user.id,
        member_ids: [user.id, ...memberIds],
        member_names: [myName, ...names]
      });

      await base44.asServiceRole.entities.CollabGroupMessage.create({
        group_id: group.id,
        sender_id: user.id,
        sender_name: myName,
        content: `${myName} started this group to plan a collab 🎉`
      });

      return Response.json({ group });
    }

    const groupId = String(body?.group_id || '');
    if (!groupId) return Response.json({ error: 'group_id is required' }, { status: 400 });

    const group = await base44.asServiceRole.entities.CollabGroup
      .get(groupId)
      .catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (!group) return Response.json({ error: 'Group not found' }, { status: 404 });
    if (!(group.member_ids || []).includes(user.id)) {
      return Response.json({ error: 'You are not in this group' }, { status: 403 });
    }

    if (action === 'messages') {
      const messages = await base44.asServiceRole.entities.CollabGroupMessage.filter({ group_id: groupId }, 'created_date', 200);
      return Response.json({ group, messages });
    }

    if (action === 'send') {
      const content = String(body?.content || '').trim().slice(0, MAX_MESSAGE);
      if (!content) return Response.json({ error: 'Message cannot be empty' }, { status: 400 });
      const myName = await stageName(user.id, user.full_name);
      const message = await base44.asServiceRole.entities.CollabGroupMessage.create({
        group_id: groupId,
        sender_id: user.id,
        sender_name: myName,
        content
      });
      return Response.json({ message });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}