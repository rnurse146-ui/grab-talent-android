import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[80] bg-black/95 backdrop-blur-sm flex items-center justify-center px-6"
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
            className="text-center max-w-md w-full"
          >
            <Logo className="h-24 w-auto mx-auto" variant="light" />
            <h1 className="mt-8 text-4xl sm:text-5xl font-bold text-white leading-tight">
              Welcome to Grab Talent
            </h1>
            <p className="mt-5 text-lg text-zinc-400 leading-relaxed">
              Empowering talented people to find work easy, and anyone looking for people for events & parties to hire them easy.
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