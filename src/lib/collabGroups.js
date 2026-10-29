import { base44 } from '@/api/base44Client';

// Talent Connect group chats run through the collabGroups function so membership
// and the group's messages stay server-side.
const invoke = (payload) => base44.functions.invoke('collabGroups', payload);

export async function listCollabGroups() {
  const res = await invoke({ action: 'list' });
  return res.data?.groups || [];
}

export async function listCollabConnections() {
  const res = await invoke({ action: 'connections' });
  return res.data?.connections || [];
}

export async function createCollabGroup({ name, memberIds }) {
  const res = await invoke({ action: 'create', name, member_ids: memberIds });
  return res.data?.group;
}

export async function addCollabMembers(groupId, memberIds) {
  const res = await invoke({ action: 'add', group_id: groupId, member_ids: memberIds });
  return res.data?.group;
}

export async function leaveCollabGroup(groupId) {
  const res = await invoke({ action: 'leave', group_id: groupId });
  return res.data;
}

export async function renameCollabGroup(groupId, name) {
  const res = await invoke({ action: 'rename', group_id: groupId, name });
  return res.data?.group;
}

export async function loadCollabThread(groupId) {
  const res = await invoke({ action: 'messages', group_id: groupId });
  return { group: res.data?.group || null, messages: res.data?.messages || [] };
}

export async function sendCollabMessage(groupId, content) {
  const res = await invoke({ action: 'send', group_id: groupId, content });
  return res.data?.message;
}