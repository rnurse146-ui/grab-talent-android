import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = user.id;
    const sr = base44.asServiceRole;

    // Delete the account record first (the critical step).
    await sr.entities.User.delete(userId);

    // Best-effort cleanup of related app data. Account is already gone,
    // so failures here only leave orphaned data — never a live account.
    try {
      await sr.entities.TalentProfile.deleteMany({ user_id: userId });
      await sr.entities.TalentAvailability.deleteMany({ talent_user_id: userId });
      await sr.entities.Booking.deleteMany({ $or: [{ seeker_id: userId }, { talent_user_id: userId }] });
      await sr.entities.MaybeList.deleteMany({ seeker_id: userId });
      await sr.entities.SwipeHistory.deleteMany({ seeker_id: userId });
      await sr.entities.Message.deleteMany({ $or: [{ sender_id: userId }, { receiver_id: userId }] });
      await sr.entities.Review.deleteMany({ reviewer_id: userId });
    } catch (cleanupErr) {
      // best-effort — ignore
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message || 'Failed to delete account' }, { status: 500 });
  }
}