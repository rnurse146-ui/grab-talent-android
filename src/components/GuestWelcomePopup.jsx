import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import Logo from '@/components/Logo';

export const GUEST_WELCOME_KEY = 'gt_guest_welcome_seen';

export default function GuestWelcomePopup({ open, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
          className="fixed inset-0 z-[80] bg-black/95 backdrop-blur-sm flex items-center justify-center px-6"
        >
          {/* Close button — always visible, top-right */}
          <button
            onClick={onClose}
            aria-label="Close welcome message"
            className="absolute top-[calc(env(safe-area-inset-top)+0.75rem)] right-4 p-3 min-h-[44px] min-w-[44px] rounded-full bg-white/10 text-white active:scale-90 transition-transform"
          >
            <X className="w-6 h-6" />
          </button>

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="text-center max-w-md w-full"
          >
            <Logo className="h-24 w-auto mx-auto" variant="light" />
            <h1 className="mt-8 text-4xl sm:text-5xl font-bold text-white leading-tight">
              Welcome to Grab Talent
            </h1>
            <p className="mt-5 text-lg text-zinc-400 leading-relaxed">
              Aiming to be the Uber for the Talent industry, making talented people find work fast and easy, and people looking for talent for any party or event find them with just a swipe of their finger.
            </p>
            <p className="mt-4 text-sm font-semibold text-zinc-300">
              Grab Talent - Talent at your fingertips
            </p>
            <button
              onClick={onClose}
              className="mt-10 w-full bg-white text-black font-semibold rounded-xl py-4 min-h-[44px] active:scale-[0.98] transition-transform"
            >
              Get Started
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}