import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import confetti from 'canvas-confetti';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { X, Calendar, Send, Loader2, CheckCircle2, ChevronRight } from 'lucide-react';

const seenKey = (userId) => `gt_seen_pending_bookings_${userId}`;

// Celebrates a brand-new booking request the first time the talent sees their
// dashboard after it arrives, and lets them message the client straight away.
export default function NewBookingCelebration({ user }) {
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    const run = async () => {
      const page = await base44.entities.Booking.filter(
        { talent_user_id: user.id, status: 'pending' },
        { sort: '-created_date', limit: 20 }
      );
      const pending = page.items || [];
      if (cancelled || pending.length === 0) return;

      let seen = [];
      try { seen = JSON.parse(localStorage.getItem(seenKey(user.id)) || '[]'); } catch { seen = []; }
      const fresh = pending.find(b => !seen.includes(b.id));
      if (!fresh) return;

      setBooking(fresh);
      confetti({ particleCount: 140, spread: 90, origin: { y: 0.3 }, colors: ['#a855f7', '#f97316', '#ffffff'] });
      setTimeout(() => {
        confetti({ particleCount: 90, spread: 120, origin: { y: 0.4 }, colors: ['#a855f7', '#f97316', '#ffffff'] });
      }, 400);
    };
    run();
    return () => { cancelled = true; };
  }, [user?.id]);

  const markSeen = () => {
    if (!user?.id || !booking) return;
    try {
      const seen = JSON.parse(localStorage.getItem(seenKey(user.id)) || '[]');
      localStorage.setItem(seenKey(user.id), JSON.stringify([...new Set([...seen, booking.id])]));
    } catch (e) { /* ignore */ }
  };

  const close = () => {
    markSeen();
    setBooking(null);
  };

  const openBooking = () => {
    markSeen();
    setBooking(null);
    navigate(`/BookingDetails?id=${booking.id}`);
  };

  const openMessages = () => {
    markSeen();
    const seekerId = booking.seeker_id;
    setBooking(null);
    navigate(`/Messages?to=${seekerId}`);
  };

  const sendQuickMessage = async () => {
    const text = message.trim();
    if (!text || !booking) return;
    setSending(true);
    const conversationId = [user.id, booking.seeker_id].sort().join('_');
    await base44.functions.invoke('sendMessage', {
      conversation_id: conversationId,
      receiver_id: booking.seeker_id,
      content: text
    });
    setSending(false);
    setSent(true);
    setMessage('');
  };

  if (!booking) return null;

  const eventDate = booking.event_date ? format(new Date(booking.event_date), 'EEEE, MMMM d, yyyy') : 'Date to be confirmed';

  return (
    <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-3xl p-6 text-white relative">
        <button
          onClick={close}
          aria-label="Close"
          className="absolute right-4 top-4 p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5">
          <div className="text-4xl mb-3">🎉</div>
          <h2 className="text-2xl font-bold mb-2 text-white">You have a booking!</h2>
          <p className="text-zinc-100 text-base leading-relaxed">Someone wants to book you. Message them now to start the conversation.</p>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-800/70 border border-zinc-600 space-y-2 mb-5">
          <p className="font-bold text-xl text-white">{booking.event_name || 'Event'}</p>
          <p className="text-base text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-300 shrink-0" />
            {eventDate}
          </p>
          <p className="text-base text-zinc-100">
            Requested by <span className="text-white font-semibold">{booking.seeker_name || 'a client'}</span>
            {booking.venue_city ? ` • ${booking.venue_city}` : ''}
          </p>
        </div>

        {sent ? (
          <div className="mb-5 p-4 rounded-2xl bg-green-950/40 border border-green-700/50 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-base font-semibold text-green-100">Message sent</p>
              <p className="text-sm text-green-100/80 mt-1">{booking.seeker_name || 'The client'} can reply in your Messages.</p>
            </div>
          </div>
        ) : (
          <div className="mb-5 space-y-2">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Say hi to ${booking.seeker_name || 'the client'}...`}
              className="bg-zinc-950 border-zinc-600 min-h-[90px] text-base text-white placeholder:text-zinc-400"
            />
            <Button
              onClick={sendQuickMessage}
              disabled={!message.trim() || sending}
              className="w-full bg-white text-black hover:bg-zinc-100 font-semibold disabled:opacity-40"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4 mr-2" />Send message</>}
            </Button>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Button variant="outline" onClick={openBooking} className="w-full h-11 border-zinc-500 text-white text-base font-semibold hover:bg-zinc-800 hover:text-white">
            Review the request
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
          <button onClick={openMessages} className="text-zinc-200 text-base font-medium hover:text-white transition-colors py-2 underline underline-offset-4">
            Open Messages
          </button>
        </div>
      </div>
    </div>
  );
}