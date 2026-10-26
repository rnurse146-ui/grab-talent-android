import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { AlertTriangle, X, ChevronRight } from 'lucide-react';

// The server writes a notification titled CANCELLED_TITLE to the talent when the
// client backs out of a booking. This pops that message on screen straight away
// so a talent never misses a cancellation, then marks it read.
export const CANCELLED_TITLE = 'Booking cancelled by the client';

export default function BookingCancelledAlert({ user }) {
  const navigate = useNavigate();
  const [note, setNote] = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    base44.entities.Notification
      .filter({ user_id: user.id, is_read: false, title: CANCELLED_TITLE }, '-created_date', 5)
      .then(items => {
        if (!cancelled && items.length > 0) setNote(items[0]);
      })
      .catch(() => { /* nothing to show */ });

    const unsubscribe = base44.entities.Notification.subscribe((event) => {
      const notification = event.data;
      if (
        event.type === 'create' &&
        notification?.user_id === user.id &&
        notification?.title === CANCELLED_TITLE
      ) {
        setNote(prev => prev || notification);
      }
    });

    return () => { cancelled = true; unsubscribe(); };
  }, [user?.id]);

  const dismiss = () => {
    const current = note;
    setNote(null);
    if (current?.id) {
      base44.entities.Notification.update(current.id, { is_read: true }).catch(() => { /* ignore */ });
    }
  };

  const openBooking = () => {
    const url = note?.link_url;
    dismiss();
    if (url) navigate(url);
  };

  if (!note) return null;

  return (
    <div className="fixed inset-0 bg-black/85 z-[60] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-3xl p-6 text-white relative">
        <button
          onClick={dismiss}
          aria-label="Close"
          className="absolute right-4 top-4 p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5">
          <div className="w-14 h-14 rounded-full bg-amber-500/15 border border-amber-500/40 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-7 h-7 text-amber-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-white">Booking cancelled</h2>
          <p className="text-zinc-100 text-base leading-relaxed">{note.body}</p>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-800/70 border border-zinc-600 mb-5">
          <p className="text-sm text-zinc-200 leading-relaxed">
            Cancellations like this are sometimes sent by mistake. You can open the booking to message the client and check.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Button onClick={openBooking} className="w-full h-11 bg-white text-black hover:bg-zinc-100 text-base font-semibold">
            View the booking
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
          <button onClick={dismiss} className="text-zinc-200 text-base font-medium hover:text-white transition-colors py-2 underline underline-offset-4">
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}