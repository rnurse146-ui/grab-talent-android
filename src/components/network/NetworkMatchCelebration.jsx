import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MessageSquare, PartyPopper, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

// The "someone wants to collab" moment — shown instantly on a mutual swipe,
// and again the next time the other performer opens Talent Network.
export default function NetworkMatchCelebration({ name, onClose }) {
  if (!name) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-6">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        className="relative w-full max-w-sm rounded-3xl border border-purple-500/40 bg-zinc-950 p-7 text-center shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 p-2 rounded-full text-zinc-500 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-16 h-16 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center mx-auto mb-4">
          <PartyPopper className="w-8 h-8 text-purple-300" />
        </div>

        <h2 className="text-2xl font-extrabold leading-tight mb-2">
          {name} wants to collab with you
        </h2>
        <p className="text-sm text-zinc-400 mb-6">
          You both swiped right. A chat is already open — say hello and plan something together.
        </p>

        <div className="space-y-2">
          <Link to="/Messages" onClick={onClose}>
            <Button className="w-full bg-white text-black hover:bg-zinc-200 font-bold">
              <MessageSquare className="w-4 h-4 mr-2" />Open the chat
            </Button>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-2xl text-sm font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            Keep browsing
          </button>
        </div>
      </motion.div>
    </div>
  );
}