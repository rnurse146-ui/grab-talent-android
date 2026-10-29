import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, Handshake, Users } from 'lucide-react';
import { categoryLabel } from '@/lib/categoryLabel';

// Shown when another performer swipes "let's collab" on you — no match needed.
export default function CollabRequestCelebration({ name, category, photo, onClose }) {
  const navigate = useNavigate();

  useEffect(() => {
    confetti({ particleCount: 110, spread: 85, origin: { y: 0.35 }, colors: ['#a855f7', '#22c55e', '#ffffff'] });
  }, []);

  const openNetwork = () => {
    onClose();
    navigate('/TalentNetwork');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 px-4 py-6 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        className="relative w-full max-w-md rounded-3xl border border-purple-500/40 bg-zinc-900 p-6 text-white shadow-2xl text-center"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 p-2 rounded-full text-zinc-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {photo ? (
          <img src={photo} alt={name} className="w-20 h-20 rounded-full object-cover mx-auto mb-3 border-2 border-purple-500/50" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center mx-auto mb-3">
            <Handshake className="w-8 h-8 text-purple-300" />
          </div>
        )}

        <h2 className="text-2xl font-extrabold leading-tight mb-2">{name} wants to collab with you</h2>
        <p className="text-base text-zinc-300 mb-6">
          {category ? `${categoryLabel(category)} • ` : ''}They've put a collaboration request in. Say yes and a chat opens between you.
        </p>

        <div className="space-y-2">
          <Button
            onClick={openNetwork}
            className="w-full h-11 bg-white text-black hover:bg-zinc-200 font-bold"
          >
            <Users className="w-4 h-4 mr-2" />See who it is
          </Button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-sm font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            Not now
          </button>
        </div>
      </motion.div>
    </div>
  );
}