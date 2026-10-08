import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const SYSTEM_CONTEXT = `You are the help assistant for Grab Talent, a UK-based platform that connects event organisers (called "seekers") with local performers and entertainers (called "talent") for events like weddings, birthdays, corporate events, clubs, pubs, festivals and private parties.

HOW THE PLATFORM WORKS:
- Seekers discover talent through a Tinder-style swipe feed ("Discover") filtered by location, event date, price, category, rating, verification and equipment. They can save talent to a "Maybe list" and send booking requests.
- IMPORTANT: Talent do NOT browse seekers, gigs or venues. Talent get discovered BY seekers. They create a profile, keep their availability calendar updated, and receive booking requests which they accept or decline. To get booked, talent should: complete their profile (stage name, category, bio, photos/video, hourly rate, minimum hours, travel radius, equipment), keep availability updated, turn on last-minute availability, get ID-verified, and share their public profile link on social media.
- Messaging: seekers and talent can chat, but phone numbers and social media handles are automatically blocked until a booking is confirmed, to keep bookings on the platform.
- Booking lifecycle: seeker sends request (pending) → talent accepts or declines → confirmed → after the event the seeker confirms the talent arrived → payment is released to talent → both sides can leave a rating and review.
- Pricing: the seeker pays hourly rate × hours (subject to the talent's minimum hours). The platform takes an 11% commission; the talent keeps 89%. Payment is held by the platform and only released to the talent after the seeker confirms arrival.
- Cancellation policy: a talent who cancels within 7 days of an event gets a strike; 3 strikes deactivates their account.
- Verification: talent can upload ID for a verified badge, which builds trust.
- Roles: a user can be a seeker, talent, or both, and can switch between views on the dashboard.

Your job: answer accurately based on the above. Be friendly, concise and specific to Grab Talent. Never invent features that do not exist. If a talent asks how to find gigs, seekers or venues, clarify that talent don't search for gigs — they get discovered by seekers and receive booking requests; tell them the actions above to increase bookings. The platform is currently free to use.

WHEN TO ESCALATE TO A PERSON (set wants_human to true): whenever the user asks to speak to a real person, or raises an issue you cannot resolve yourself — payment problems, booking disputes, account or access issues, safety concerns, complaints or refunds. In those cases your reply should briefly confirm that their message has been passed to the Grab Talent team, who will reply by email. For anything you can answer yourself, set wants_human to false.`;

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const message = String(body?.message || '').slice(0, 2000).trim();
    if (!message) return Response.json({ error: 'Message is required' }, { status: 400 });

    const history = (Array.isArray(body?.history) ? body.history : []).slice(-20)
      .map(m => `${m?.role === 'user' ? 'User' : 'Assistant'}: ${String(m?.content || '').slice(0, 2000)}`)
      .join('\n');

    const response = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `${SYSTEM_CONTEXT}\n\nConversation so far:\n${history}\n\nUser: ${message}\n\nAssistant:`,
      response_json_schema: {
        type: 'object',
        properties: {
          reply: { type: 'string' },
          wants_human: { type: 'boolean' }
        },
        required: ['reply', 'wants_human']
      }
    });
    let reply = response?.reply || '';
    const wantsHuman = response?.wants_human === true;

    // A user who needs a real person gets their message emailed to the team
    if (wantsHuman) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: 'Grab-talent-limited@hotmail.com',
          subject: `Grab Talent support request from ${user.full_name || user.email}`,
          body: `A user asked for help from a person in the Grab Talent help chat.\n\nName: ${user.full_name || 'Not provided'}\nEmail: ${user.email}\n\nMessage:\n${message}\n\nRecent conversation:\n${history}`
        });
        reply = reply || `I've passed your message to the Grab Talent team — they'll reply to ${user.email} as soon as they can.`;
      } catch {
        reply = reply || "I couldn't forward your message just now — please try again in a moment.";
      }
    }

    return Response.json({ reply: reply || "Sorry, I couldn't answer that just now." });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}