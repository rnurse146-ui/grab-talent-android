import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Loader2, Save, Info } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isToday, isPast, addMonths, subMonths } from 'date-fns';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function AvailabilityManager({ talentProfileId, talentUserId }) {
  const [availabilityRecord, setAvailabilityRecord] = useState(null);
  const [blockedDates, setBlockedDates] = useState(new Set());
  const [bookingDates, setBookingDates] = useState(new Set());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => { loadData(); }, [talentProfileId]);

  const loadData = async () => {
    const avRecords = await base44.entities.TalentAvailability.filter({ talent_profile_id: talentProfileId });
    const avRecord = avRecords[0] || null;
    setAvailabilityRecord(avRecord);
    if (avRecord) setBlockedDates(new Set(avRecord.blocked_dates || []));

    const bookings = await base44.entities.Booking.filter({ talent_user_id: talentUserId }, '-created_date', 100);
    const confirmedDates = bookings
      .filter(b => ['confirmed', 'accepted', 'completed'].includes(b.status) && b.event_date)
      .map(b => b.event_date);
    setBookingDates(new Set(confirmedDates));
    setLoading(false);
  };

  const toggleDate = (day) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    if (bookingDates.has(dateStr)) return;
    setBlockedDates(prev => {
      const next = new Set(prev);
      if (next.has(dateStr)) next.delete(dateStr); else next.add(dateStr);
      return next;
    });
    setHasChanges(true);
    setSaved(false);
  };

  const save = async () => {
    setSaving(true);
    const data = {
      talent_profile_id: talentProfileId,
      talent_user_id: talentUserId,
      blocked_dates: Array.from(blockedDates),
      booking_dates: Array.from(bookingDates),
    };
    if (availabilityRecord) {
      await base44.entities.TalentAvailability.update(availabilityRecord.id, data);
    } else {
      const created = await base44.entities.TalentAvailability.create(data);
      setAvailabilityRecord(created);
    }
    setSaving(false);
    setSaved(true);
    setHasChanges(false);
    setTimeout(() => setSaved(false), 3000);
  };

  const days = useCallback(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth])();

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-purple-500" /></div>;

  return (
    <div className="space-y-4">
      {/* Info banner */}
      <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex gap-3">
        <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <p className="text-sm text-slate-300">
          <span className="text-blue-300 font-medium">Tap dates to block them.</span> Seekers only see talent available on their event date — keeping your calendar updated helps you get discovered.
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 px-1">
        <div className="flex items-center gap-1.5 text-xs text-slate-400"><div className="w-3 h-3 rounded bg-slate-700 border border-slate-600" />Available</div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400"><div className="w-3 h-3 rounded bg-orange-500/40 border border-orange-500/60" />Blocked</div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400"><div className="w-3 h-3 rounded bg-purple-600/40 border border-purple-500" />Booked</div>
      </div>

      {/* Calendar */}
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800">
          <button onClick={() => setCurrentMonth(m => subMonths(m, 1))} className="p-1 text-zinc-400 hover:text-white"><ChevronLeft className="w-5 h-5" /></button>
          <h3 className="font-semibold">{format(currentMonth, 'MMMM yyyy')}</h3>
          <button onClick={() => setCurrentMonth(m => addMonths(m, 1))} className="p-1 text-zinc-400 hover:text-white"><ChevronRight className="w-5 h-5" /></button>
        </div>

        <div className="grid grid-cols-7 border-b border-zinc-800">
          {DAY_LABELS.map(d => <div key={d} className="text-center text-xs text-zinc-500 py-2 font-medium">{d}</div>)}
        </div>

        <div className="grid grid-cols-7 p-2 gap-1">
          {days.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const inMonth = isSameMonth(day, currentMonth);
            const isPastDay = isPast(day) && !isToday(day);
            const isBooked = bookingDates.has(dateStr);
            const isBlocked = blockedDates.has(dateStr);
            const todayDay = isToday(day);

            let cls = 'aspect-square flex items-center justify-center rounded-xl text-sm font-medium transition-all select-none relative ';
            if (!inMonth) cls += 'opacity-20 cursor-default ';
            else if (isPastDay) cls += 'text-zinc-700 cursor-default ';
            else if (isBooked) cls += 'bg-purple-600/40 text-purple-300 border border-purple-500/50 cursor-not-allowed ';
            else if (isBlocked) cls += 'bg-orange-500/25 text-orange-300 border border-orange-500/40 hover:bg-orange-500/40 cursor-pointer ';
            else cls += 'text-zinc-200 hover:bg-zinc-700 cursor-pointer ';
            if (todayDay && !isBooked && !isBlocked) cls += 'ring-2 ring-purple-500 ';

            return (
              <button key={dateStr} className={cls} onClick={() => inMonth && !isPastDay && toggleDate(day)}>
                {format(day, 'd')}
                {isBooked && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-purple-400" />}
                {isBlocked && !isBooked && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-orange-400" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Stats row */}
      <div className="flex gap-3">
        <div className="flex-1 p-3 bg-zinc-900 rounded-xl border border-zinc-800 text-center">
          <p className="text-xl font-bold text-orange-400">{blockedDates.size}</p>
          <p className="text-xs text-zinc-400">Blocked</p>
        </div>
        <div className="flex-1 p-3 bg-zinc-900 rounded-xl border border-zinc-800 text-center">
          <p className="text-xl font-bold text-purple-400">{bookingDates.size}</p>
          <p className="text-xs text-zinc-400">Booked</p>
        </div>
        <Button
          onClick={save}
          disabled={saving || !hasChanges}
          className={`flex-1 h-auto ${saved ? 'bg-green-600 hover:bg-green-500' : hasChanges ? 'bg-white text-black hover:bg-zinc-100' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}`}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? '✓ Saved!' : <><Save className="w-4 h-4 mr-1" />Save</>}
        </Button>
      </div>
    </div>
  );
}