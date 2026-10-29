import { base44 } from '@/api/base44Client';

// Blocking and reporting run through backend functions so the checks and the
// moderation pass cannot be bypassed from the browser.
const invoke = (payload) => base44.functions.invoke('blockUser', payload);

export async function getHiddenUserIds() {
  try {
    const res = await invoke({ action: 'hidden_ids' });
    return res?.data?.ids || [];
  } catch {
    return [];
  }
}

export async function listMyBlocks() {
  try {
    const res = await invoke({ action: 'list' });
    return res?.data?.blocks || [];
  } catch {
    return [];
  }
}

export async function blockUser(userId) {
  const res = await invoke({ action: 'block', user_id: userId });
  return res?.data;
}

export async function unblockUser(userId) {
  const res = await invoke({ action: 'unblock', user_id: userId });
  return res?.data;
}

export async function reportUser(payload) {
  const res = await base44.functions.invoke('reportUser', payload);
  return res?.data?.report;
}

export const REPORT_REASONS = [
  { value: 'harassment', label: 'Harassment or threats' },
  { value: 'rude_language', label: 'Rude or offensive language' },
  { value: 'spam', label: 'Spam or advertising' },
  { value: 'fake_profile', label: 'Fake profile or scam' },
  { value: 'other', label: 'Something else' }
];