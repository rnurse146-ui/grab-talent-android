import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, AlertTriangle, CheckCircle2, CalendarClock } from 'lucide-react';

// Lets the client move a booking to a different date after a mistake. Only dates
// the talent is free on can be picked, and the booking goes back to pending so
// the talent re-accepts it (the server validates both).
export default function AmendDateDialog({ open, onOpenChange, booking, onAmended }) {
  const [date, setDate] = useState(null);
  const [unavailable, setUnavailable] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open || !booking?.talent_profile_id) return;
    let cancelled = false;
    base44.entities.TalentAvailability
      .filter({ talent_profile_id: booking.talent_profile_id })
      .then(records => {
        if (cancelled) return;
        const taken = new Set();
        records.forEach(rec => {
          (rec.blocked_dates || []).forEach(d => taken.add(String(d).slice(0, 10)));
          (rec.booking_dates || []).forEach(d => taken.add(String(d).slice(0, 10)));
        });
        setUnavailable(taken);
      })
      .catch(() => { /* fall back to no restrictions; the server still checks */ });
    return () => { cancelled = true; };
  }, [open, booking?.talent_profile_id]);

  const submit = async () => {
    if (!date || !booking) return;
    setSaving(true);
    setError('');
    try {
      const res = await base44.functions.invoke('amendBookingDate', {
        booking_id: booking.id,
        event_date: format(date, 'yyyy-MM-dd')
      });
      if (res?.data?.error) {
        setError(res.data.error);
        return;
      }
      setDone(true);
      onAmended?.(res?.data?.booking);
    } catch (e) {
      setError(e?.data?.error || e?.message || 'Could not change the date. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenChange = (next) => {
    if (!next) {
      setDate(null);
      setError('');
      setDone(false);
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-700 text-white max-w-md max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <CalendarClock className="w-5 h-5 text-purple-400" />
            Amend the date
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Currently {booking?.event_date ? format(new Date(booking.event_date), 'EEEE, MMMM d, yyyy') : 'unconfirmed'}. Only dates the talent is free on can be picked.
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="py-4 space-y-5">
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-green-950/40 border border-green-700/50">
              <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-100">Date changed</p>
                <p className="text-sm text-green-100/80 mt-1">
                  We've let the talent know. The booking is back to pending until they accept the new date.
                </p>
              </div>
            </div>
            <Button onClick={() => handleOpenChange(false)} className="w-full h-12 bg-white text-black hover:bg-zinc-100 text-base font-semibold">
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                disabled={(day) => day < new Date() || unavailable.has(format(day, 'yyyy-MM-dd'))}
                className="rounded-xl border border-zinc-800 bg-zinc-950 p-3"
              />
            </div>

            <p className="text-xs text-zinc-500 text-center -mt-1">
              Greyed-out dates are already booked or blocked off by the talent.
            </p>

            {date && (
              <p className="text-sm text-purple-300 text-center">
                New date: {format(date, 'EEEE, MMMM d, yyyy')}
              </p>
            )}

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-950/40 border border-red-700/50">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-sm text-red-200">{error}</p>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Button
                onClick={submit}
                disabled={!date || saving}
                className="w-full h-12 text-base font-semibold bg-white text-black hover:bg-zinc-100 disabled:opacity-40"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Request the new date'}
              </Button>
              <p className="text-xs text-zinc-500 text-center">The talent will be notified and asked to accept again.</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}