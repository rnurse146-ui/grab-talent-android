import React from 'react';

// Each conversation shows what the other person is, in brackets, so it's
// obvious at a glance which chat is a collab, a talent booking or a hire.
const ROLE_STYLES = {
  booking: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
  collab: 'bg-purple-500/15 text-purple-300 border-purple-500/40',
  talent: 'bg-orange-500/15 text-orange-300 border-orange-500/40',
  seeker: 'bg-sky-500/15 text-sky-300 border-sky-500/40',
};

const ROLE_LABELS = {
  booking: 'Booking',
  collab: 'Collab',
  talent: 'Talent',
  seeker: 'Seeker',
};

export default function RoleBadge({ role, className = '' }) {
  const style = ROLE_STYLES[role];
  if (!style) return null;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide shrink-0 ${style} ${className}`}
    >
      ({ROLE_LABELS[role]})
    </span>
  );
}