import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';

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

Your job: answer accurately based on the above. Be friendly, concise and specific to Grab Talent. Never invent features that do not exist. If a talent asks how to find gigs, seekers or venues, clarify that talent don't search for gigs — they get discovered by seekers and receive booking requests; tell them the actions above to increase bookings. The platform is currently free to use.`;

export default function HelpChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm the Grab Talent assistant 👋 How can I help you today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    const history = messages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `${SYSTEM_CONTEXT}\n\nConversation so far:\n${history}\n\nUser: ${userMsg}\n\nAssistant:`
    });

    setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    setLoading(false);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed fab-bottom right-6 z-50 w-14 h-14 rounded-full bg-white text-black shadow-2xl flex items-center justify-center hover:bg-zinc-100 transition-all"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed fab-panel-bottom right-6 z-50 w-80 h-96 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="px-4 py-3 bg-black border-b border-zinc-800 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span className="font-semibold text-sm text-white">Grab Talent Help</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-white text-black'
                    : 'bg-zinc-800 text-zinc-100'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-zinc-800 px-3 py-2 rounded-xl">
                  <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="px-3 py-3 border-t border-zinc-800 flex gap-2">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Ask anything..."
              className="bg-zinc-900 border-zinc-700 text-sm rounded-xl"
            />
            <Button onClick={sendMessage} disabled={loading || !input.trim()} size="icon" className="bg-white text-black hover:bg-zinc-100 shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}