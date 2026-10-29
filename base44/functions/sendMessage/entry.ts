import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { blockBetween } from '../../shared/blocking.ts';

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
    // Voice notes arrive already uploaded; the caller sends their private URI
    const audioUri = String(body?.audio_uri || '').trim();
    if (audioUri && (audioUri.length > 500 || /\s/.test(audioUri))) {
      return Response.json({ error: 'Invalid audio file' }, { status: 400 });
    }
    if (!conversationId || !receiverId || (!content && !audioUri)) {
      return Response.json({ error: 'conversation_id, receiver_id and content or audio_uri are required' }, { status: 400 });
    }
    if (receiverId === user.id) {
      return Response.json({ error: 'You cannot message yourself' }, { status: 400 });
    }

    // A block stops messages in both directions
    if (await blockBetween(base44, user.id, receiverId)) {
      return Response.json({ error: 'This conversation is closed — you can no longer message this person.' }, { status: 403 });
    }

    // Identity is server-resolved, never taken from the request body — a caller
    // cannot choose the display name a recipient sees.
    const canonicalConversationId = [user.id, receiverId].sort().join('_');
    if (conversationId !== canonicalConversationId) {
      return Response.json({ error: 'conversation_id does not match this sender/receiver pair' }, { status: 400 });
    }
    const receiver = await base44.asServiceRole.entities.User.get(receiverId).catch(() => null);

    // Contact-info block: only shareable once a booking between these two users
    // is confirmed or completed through the platform.
    let bookingVerified = null;
    const isVerified = async () => {
      if (bookingVerified === null) {
        const bookings = await base44.asServiceRole.entities.Booking.filter({
          $or: [
            { seeker_id: user.id, talent_user_id: receiverId },
            { seeker_id: receiverId, talent_user_id: user.id }
          ]
        });
        bookingVerified = (bookings || []).some(b => ['confirmed', 'completed'].includes(b.status));
      }
      return bookingVerified;
    };
    const blocked = (reasons) => Response.json({
      error: `This message was blocked because it contains ${reasons.join(' and ')}. Contact details can only be shared once a booking is confirmed through Grab Talent.`,
      blocked: true
    }, { status: 400 });

    const reasons = content ? containsContactInfo(content) : [];
    if (reasons.length > 0 && !(await isVerified())) return blocked(reasons);

    // Voice notes obey the same rule: the audio is transcribed and checked
    // exactly like typed text, so speaking a number or handle cannot bypass
    // the pre-booking block. Audio that cannot be checked is refused.
    if (audioUri && !(await isVerified())) {
      let transcript = '';
      try {
        const signed = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({ file_uri: audioUri, expires_in: 120 });
        const audioUrl = signed?.signed_url || signed;
        transcript = String((await base44.asServiceRole.integrations.Core.TranscribeAudio({ audio_url: audioUrl })) || '');
      } catch {
        return Response.json({
          error: 'We could not check this voice note for contact details. Please send it as a text message instead.',
          blocked: true
        }, { status: 400 });
      }
      const audioReasons = containsContactInfo(transcript);
      if (audioReasons.length > 0) return blocked(audioReasons);
    }

    const created = await base44.asServiceRole.entities.Message.create({
      conversation_id: conversationId,
      sender_id: user.id,
      receiver_id: receiverId,
      sender_name: String(user.full_name || 'User'),
      receiver_name: String(receiver?.full_name || 'User'),
      content: content || '🎤 Voice note',
      ...(audioUri ? { audio_uri: audioUri } : {}),
      is_read: false
    });

    return Response.json({ message: created });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}