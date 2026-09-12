import { base44 } from '@/api/base44Client';

// Creates an in-app notification for a user. Fire-and-forget: a failed
// notification must never break the main action that triggered it.
export async function createNotification({ userId, type, title, body, linkUrl = null }) {
  if (!userId) return;
  try {
    await base44.entities.Notification.create({
      user_id: userId,
      type,
      title,
      body,
      link_url: linkUrl,
      is_read: false
    });
  } catch (e) {
    console.error('Failed to create notification', e);
  }
}