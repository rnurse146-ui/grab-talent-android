import React, { useState } from 'react';
import { Mail, X } from 'lucide-react';

export const JUNK_REMINDER_KEY = 'gt_junk_reminder_dismissed';

// Talent only hear about bookings and reminders by email — if those land in the
// junk folder the booking quietly disappears. This nudge stays until dismissed.
export default function JunkFolderReminder({ className = '' }) {
  const [hidden, setHidden] = useState(() => {
    try { return localStorage.getItem(JUNK_REMINDER_KEY) === '1'; } catch { return false; }
  });

  if (hidden) return null;

  const dismiss = () => {
    try { localStorage.setItem(JUNK_REMINDER_KEY, '1'); } catch { /* private mode */ }
    setHidden(true);
  };

  return (
    <div className={`relative rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 pr-12 ${className}`}>
      <button
        onClick={dismiss}
        aria-label="Dismiss this reminder"
        className="absolute top-1.5 right-1.5 p-2 rounded-full text-amber-300 hover:text-white hover:bg-amber-500/20 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
      <div className="flex items-start gap-3 text-sm text-amber-100">
        <Mail className="w-5 h-5 shrink-0 mt-0.5 text-amber-300" />
        <span className="leading-relaxed">
          <strong className="text-white">Don't miss a booking.</strong> Booking requests, reminders and updates reach you by
          email, and they sometimes land in the junk or spam folder. Check it after signing up — and add
          <strong className="text-white"> grab-talent-limited@hotmail.com</strong> to your contacts so nothing gets missed.
        </span>
      </div>
    </div>
  );
}