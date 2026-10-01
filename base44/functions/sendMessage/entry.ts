import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Server-side copy of the off-platform contact filter (see src/lib/messageFilter.js).
// Messages are created ONLY here, so a direct SDK/API call cannot bypass the block.
const PHONE_REGEX = /\b\d[\d\s\-().]{6,}\d\b/;

const SOCIAL_REGEXES = [
  /@[a-zA-Z0-9._]{2,30}\b/,
  /\binsta(gram)?\b/i,
  /\bfacebook\b/i,
  /\bsnapchat\b/i,
  /\btiktok\b/i,
  /\btwitter\b/i,
  /\bwhatsapp\b/i,
  /\btelegram\b/i,
  /\bt\.me\b/i,
  /\bwa\.me\b/i,
  /https?:\/\/(www\.)?(instagram|facebook|snapchat|tiktok|twitter|x\.com|wa\.me|t\.me|youtube|linkedin)\b/i,
];

function containsContactInfo(text) {
  const reasons = [];
  if (!text) return reasons;
  if (PHONE_REGEX.test(text)) reasons.push('a phone number');
  SOCIAL_REGEXES.forEach((re) => { if (re.test(text)) reasons.push('social media details'); });
  return [...new Set(reasons)];
}

// Creates a chat message as the authenticated sender. Contact details (phone
// numbers, social handles) are rejected unless a confirmed or completed booking
// exists between the two users — the same rule the UI enforces, now on the server.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const conversationId = String(body?.conversation_id || '');
    const receiverId = String(body?.receiver_id || '');
    const content = String(body?.content || '').trim();
    if (!conversationId || !receiverId || !content) {
      return Response.json({ error: 'conversation_id, receiver_id and content are required' }, { status: 400 });
    }
    if (receiverId === user.id) {
      return Response.json({ error: 'You cannot message yourself' }, { status: 400 });
    }

    // Contact-info block: only shareable once a booking between these two users
    // is confirmed or completed through the platform.
    const reasons = containsContactInfo(content);
    if (reasons.length > 0) {
      const bookings = await base44.asServiceRole.entities.Booking.filter({
        $or: [
          { seeker_id: user.id, talent_user_id: receiverId },
          { seeker_id: receiverId, talent_user_id: user.id }
        ]
      });
      const verified = (bookings || []).some(b => ['confirmed', 'completed'].includes(b.status));
      if (!verified) {
        return Response.json({
          error: `This message was blocked because it contains ${reasons.join(' and ')}. Contact details can only be shared once a booking is confirmed through Grab Talent.`,
          blocked: true
        }, { status: 400 });
      }
    }

    const created = await base44.asServiceRole.entities.Message.create({
      conversation_id: conversationId,
      sender_id: user.id,
      receiver_id: receiverId,
      sender_name: String(body?.sender_name || user.full_name || 'User'),
      receiver_name: String(body?.receiver_name || 'User'),
      content,
      is_read: false
    });

    return Response.json({ message: created });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}