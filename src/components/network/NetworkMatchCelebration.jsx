import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PartyPopper, X, Send, Loader2, CheckCircle2, MessageSquare } from 'lucide-react';

// The "you got a collaboration" moment — confetti, a reply box straight away
// (like the booking pop-up), and a link into the chat that's already open.
export default function NetworkMatchCelebration({ name, conversationId, otherUserId, onClose }) {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!name) return;
    confetti({ particleCount: 150, spread: 90, origin: { y: 0.3 }, colors: ['#a855f7', '#22c55e', '#ffffff'] });
    const t = setTimeout(() => {
      confetti({ particleCount: 90, spread: 120, origin: { y: 0.4 }, colors: ['#a855f7', '#22c55e', '#ffffff'] });
    }, 400);
    return () => clearTimeout(t);
  }, [name]);

  if (!name) return null;

  const send = async () => {
    const text = message.trim();
    if (!text || sending || !otherUserId || !conversationId) return;
    setSending(true);
    setError('');
    try {
      await base44.functions.invoke('sendMessage', {
        conversation_id: conversationId,
        receiver_id: otherUserId,
        content: text
      });
      setMessage('');
      setSent(true);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Could not send your message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const openChat = () => {
    onClose();
    navigate('/Messages');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 px-4 py-6 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        className="relative w-full max-w-md rounded-3xl border border-purple-500/40 bg-zinc-900 p-6 text-white shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 p-2 rounded-full text-zinc-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5">
          <div className="text-4xl mb-2">🎉</div>
          <h2 className="text-2xl font-extrabold leading-tight mb-2">You got a collaboration!</h2>
          <p className="text-base text-zinc-100 leading-relaxed">
            You and <span className="font-semibold text-white">{name}</span> both want to work together. A chat is already open.
          </p>
        </div>

        {sent ? (
          <div className="mb-5 p-4 rounded-2xl bg-green-950/40 border border-green-700/50 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-base font-semibold text-green-100">Message sent</p>
              <p className="text-sm text-green-100/80 mt-1">{name} can reply in your Messages.</p>
            </div>
          </div>
        ) : (
          <div className="mb-5 space-y-2">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Say hi to ${name}...`}
              className="bg-zinc-950 border-zinc-600 min-h-[90px] text-base text-white placeholder:text-zinc-400"
            />
            {error && <p className="text-sm text-amber-300">{error}</p>}
            <Button
              onClick={send}
              disabled={!message.trim() || sending}
              className="w-full h-11 bg-white text-black hover:bg-zinc-100 font-semibold disabled:opacity-40"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4 mr-2" />Send message</>}
            </Button>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            onClick={openChat}
            className="w-full h-11 border-zinc-500 text-white text-base font-semibold hover:bg-zinc-800 hover:text-white"
          >
            <MessageSquare className="w-4 h-4 mr-2" />Open the chat
          </Button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-sm font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            Keep browsing
          </button>
        </div>
      </motion.div>
    </div>
  );
}