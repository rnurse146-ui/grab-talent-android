import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { hiddenUserIds } from '../../shared/blocking.ts';

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

    if (action === 'add') {
      const requested = Array.isArray(body?.member_ids) ? body.member_ids.map(String) : [];
      const existing = group.member_ids || [];
      const toAdd = [...new Set(requested)].filter((id) => id && id !== user.id && !existing.includes(id));
      if (toAdd.length === 0) return Response.json({ error: 'Pick at least one performer to add' }, { status: 400 });
      if (existing.length + toAdd.length > MAX_MEMBERS) {
        return Response.json({ error: 'Too many members for one group' }, { status: 400 });
      }

      const connected = await myConnectionIds();
      if (toAdd.some((id) => !connected.has(id))) {
        return Response.json({ error: 'Only performers you connected with on Talent Network can join' }, { status: 400 });
      }

      const names = await Promise.all(toAdd.map((id) => stageName(id)));
      const updated = await base44.asServiceRole.entities.CollabGroup.update(groupId, {
        member_ids: [...existing, ...toAdd],
        member_names: [...(group.member_names || []), ...names]
      });

      const myName = await stageName(user.id, user.full_name);
      await base44.asServiceRole.entities.CollabGroupMessage.create({
        group_id: groupId,
        sender_id: user.id,
        sender_name: myName,
        content: `${myName} added ${names.join(', ')} to the collab 🎉`
      });
      await base44.asServiceRole.entities.Notification.bulkCreate(toAdd.map((id) => ({
        user_id: id,
        type: 'message',
        title: `${myName} added you to a collab group`,
        body: group.name || 'Collab group',
        link_url: '/Messages',
        is_read: false
      })));

      return Response.json({ group: updated });
    }

    if (action === 'leave') {
      const members = group.member_ids || [];
      const names = group.member_names || [];
      const idx = members.indexOf(user.id);
      const remainingIds = members.filter((id) => id !== user.id);
      const remainingNames = names.filter((_, i) => i !== idx);
      const myName = await stageName(user.id, user.full_name);

      // A pair's collab: leaving disconnects the two on Talent Network, but the
      // chat and its whole history stay in Messages — nothing is ever erased.
      if (remainingIds.length === 1) {
        const otherId = remainingIds[0];
        const conversationId = [user.id, otherId].sort().join('_');
        const matches = await base44.asServiceRole.entities.NetworkMatch.filter({ conversation_id: conversationId });
        if (!matches || matches.length === 0) {
          return Response.json({ error: 'You are already disconnected from this performer' }, { status: 400 });
        }

        await base44.asServiceRole.entities.NetworkMatch.deleteMany({ conversation_id: conversationId });
        await base44.asServiceRole.entities.NetworkSwipe.deleteMany({ swiper_user_id: user.id, target_user_id: otherId });
        await base44.asServiceRole.entities.NetworkSwipe.deleteMany({ swiper_user_id: otherId, target_user_id: user.id });

        await base44.asServiceRole.entities.CollabGroupMessage.create({
          group_id: groupId,
          sender_id: user.id,
          sender_name: myName,
          content: `${myName} disconnected from Talent Network — this chat stays open`
        });

        await base44.asServiceRole.entities.Notification.create({
          user_id: otherId,
          type: 'message',
          title: `${myName} disconnected from your collab`,
          body: 'Your chat and its history are still in Messages.',
          link_url: '/Messages',
          is_read: false
        });

        return Response.json({ group });
      }

      // Only member left in a broken group — nothing to keep
      if (remainingIds.length === 0) {
        await base44.asServiceRole.entities.CollabGroupMessage.deleteMany({ group_id: groupId });
        await base44.asServiceRole.entities.CollabGroup.delete(groupId);
        return Response.json({ left: true });
      }

      const updated = await base44.asServiceRole.entities.CollabGroup.update(groupId, {
        member_ids: remainingIds,
        member_names: remainingNames
      });
      await base44.asServiceRole.entities.CollabGroupMessage.create({
        group_id: groupId,
        sender_id: user.id,
        sender_name: myName,
        content: `${myName} left the collab`
      });

      return Response.json({ group: updated });
    }

    if (action === 'rename') {
      const newName = String(body?.name || '').trim().slice(0, 60);
      if (newName.length < 2) return Response.json({ error: 'Give the group a longer name' }, { status: 400 });
      const updated = await base44.asServiceRole.entities.CollabGroup.update(groupId, { name: newName });
      return Response.json({ group: updated });
    }

    if (action === 'messages') {
      const messages = await base44.asServiceRole.entities.CollabGroupMessage.filter({ group_id: groupId }, 'created_date', 200);
      return Response.json({ group, messages });
    }

    if (action === 'send') {
      const content = String(body?.content || '').trim().slice(0, MAX_MESSAGE);
      if (!content) return Response.json({ error: 'Message cannot be empty' }, { status: 400 });

      // Someone blocked in this group cannot post into it — the block applies
      // to shared collab chats too, not just direct messages.
      const hidden = new Set(await hiddenUserIds(base44, user.id));
      if ((group.member_ids || []).some((id) => id !== user.id && hidden.has(id))) {
        return Response.json({ error: 'You can no longer post in this collab.' }, { status: 403 });
      }

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