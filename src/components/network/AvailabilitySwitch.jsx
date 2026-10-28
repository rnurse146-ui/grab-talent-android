import React from 'react';

// On/off control that decides whether a talent takes part in Talent Network.
export default function AvailabilitySwitch({ on, onChange, busy, label = 'Available to connect' }) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={busy}
      className="flex w-full items-center justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-left transition-colors hover:border-zinc-700 disabled:opacity-60"
    >
      <span>
        <span className="block text-sm font-semibold text-white">{label}</span>
        <span className="block text-xs text-zinc-400">
          {on ? 'You appear in Talent Network and can request collabs' : 'You are hidden from other talent'}
        </span>
      </span>
      <span className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${on ? 'bg-green-500' : 'bg-zinc-700'}`}>
        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${on ? 'translate-x-6' : 'translate-x-0.5'}`} />
      </span>
    </button>
  );
}