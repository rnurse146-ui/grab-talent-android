import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Loader2, Save, Calendar, Info } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay, isToday, isPast, addMonths, subMonths } from 'date-fns';
import Logo from '@/components/Logo';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function TalentAvailability() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [availabilityRecord, setAvailabilityRecord] = useState(null);
  const [blockedDates, setBlockedDates] = useState(new Set());
  const [bookingDates, setBookingDates] = useState(new Set());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const currentUser = await base44.auth.me();
    setUser(currentUser);

    const profiles = await base44.entities.TalentProfile.filter({ user_id: currentUser.id });
    if (profiles.length === 0) { setLoading(false); return; }
    const p = profiles[0];
    setProfile(p);

    // Load availability record
    const avRecords = await base44.entities.TalentAvailability.filter({ talent_profile_id: p.id });
    let avRecord = avRecords[0] || null;
    setAvailabilityRecord(avRecord);
    if (avRecord) {
      setBlockedDates(new Set(avRecord.blocked_dates || []));
      setBookingDates(new Set(avRecord.booking_dates || []));
    }

    // Sync confirmed/accepted bookings as booking dates
    const bookings = await base44.entities.Booking.filter(
      { talent_user_id: currentUser.id },
      '-created_date', 100
    );
    const confirmedDates = bookings
      .filter(b => ['confirmed', 'accepted', 'completed'].includes(b.status) && b.event_date)
      .map(b => b.event_date);
    setBookingDates(new Set(confirmedDates));

    setLoading(false);
  };

  const toggleDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    if (bookingDates.has(dateStr)) return; // can't unblock booked dates
    setBlockedDates(prev => {
      const next = new Set(prev);
      if (next.has(dateStr)) next.delete(dateStr);
      else next.add(dateStr);
      return next;
    });
    setSaved(false);
  };

  const save = async () => {
    setSaving(true);
    const data = {
      talent_profile_id: profile.id,
      talent_user_id: user.id,
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
    setTimeout(() => setSaved(false), 3000);
  };

  const calendarDays = useCallback(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
    </div>
  );

  if (!profile) return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
      <div className="text-center">
        <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">No Talent Profile</h2>
        <p className="text-slate-400 mb-6">Create your talent profile first</p>
        <Link to={createPageUrl('TalentSetup')}><Button className="bg-purple-600 hover:bg-purple-500">Create Profile</Button></Link>
      </div>
    </div>
  );

  const days = calendarDays();
  const blockedCount = blockedDates.size;
  const bookedCount = bookingDates.size;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Nav */}
      <div className="flex items-center justify-between px-6 pb-4 pt-[calc(env(safe-area-inset-top)+1rem)] border-b border-slate-800 sticky top-0 z-10 bg-slate-950/90 backdrop-blur-sm">
        <Link to={createPageUrl('Dashboard')}>
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
            <ChevronLeft className="w-4 h-4 mr-1" />Back
          </Button>
        </Link>
        <Logo className="h-8 w-auto" />
        <Button
          onClick={save}
          disabled={saving}
          className={saved ? 'bg-green-600 hover:bg-green-500' : 'bg-purple-600 hover:bg-purple-500'}
          size="sm"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          {saved ? 'Saved!' : 'Save'}
        </Button>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">Manage Availability</h1>
          <p className="text-slate-400 text-sm">Click dates to block them. Seekers see your availability in real-time.</p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-6 p-4 bg-slate-900/50 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-2 text-sm"><div className="w-4 h-4 rounded bg-slate-800 border border-slate-600" /><span className="text-slate-300">Available</span></div>
          <div className="flex items-center gap-2 text-sm"><div className="w-4 h-4 rounded bg-orange-500/30 border border-orange-500/60" /><span className="text-slate-300">Blocked by you</span></div>
          <div className="flex items-center gap-2 text-sm"><div className="w-4 h-4 rounded bg-purple-600/40 border border-purple-500" /><span className="text-slate-300">Booked</span></div>
          <div className="flex items-center gap-2 text-sm"><div className="w-4 h-4 rounded bg-slate-950/60 opacity-40" /><span className="text-slate-300">Past</span></div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800 text-center">
            <p className="text-2xl font-bold text-orange-400">{blockedCount}</p>
            <p className="text-sm text-slate-400">Blocked dates</p>
          </div>
          <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800 text-center">
            <p className="text-2xl font-bold text-purple-400">{bookedCount}</p>
            <p className="text-sm text-slate-400">Booked dates</p>
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-slate-900/50 rounded-3xl border border-slate-800 overflow-hidden">
          {/* Month Nav */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(m => subMonths(m, 1))} className="text-slate-400 hover:text-white">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h2 className="font-semibold text-lg">{format(currentMonth, 'MMMM yyyy')}</h2>
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(m => addMonths(m, 1))} className="text-slate-400 hover:text-white">
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-slate-800">
            {DAY_LABELS.map(d => (
              <div key={d} className="text-center text-xs text-slate-500 py-2 font-medium">{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-px bg-slate-800/30 p-2">
            {days.map(day => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isBlocked = blockedDates.has(dateStr);
              const isBooked = bookingDates.has(dateStr);
              const isPastDay = isPast(day) && !isToday(day);
              const isTodayDay = isToday(day);

              let cellClass = 'relative flex items-center justify-center rounded-xl text-sm font-medium transition-all cursor-pointer select-none ';
              cellClass += 'aspect-square ';

              if (!isCurrentMonth) { cellClass += 'opacity-20 cursor-default '; }
              else if (isPastDay) { cellClass += 'text-slate-700 cursor-default '; }
              else if (isBooked) { cellClass += 'bg-purple-600/40 text-purple-300 border border-purple-500/50 cursor-not-allowed '; }
              else if (isBlocked) { cellClass += 'bg-orange-500/25 text-orange-300 border border-orange-500/40 hover:bg-orange-500/35 '; }
              else { cellClass += 'text-slate-200 hover:bg-slate-700 '; }

              if (isTodayDay && !isBooked && !isBlocked) cellClass += 'ring-2 ring-purple-500 ';

              return (
                <button
                  key={dateStr}
                  className={cellClass}
                  onClick={() => isCurrentMonth && !isPastDay && toggleDate(day)}
                  title={isBooked ? 'Booked' : isBlocked ? 'Blocked — click to unblock' : 'Available — click to block'}
                >
                  {format(day, 'd')}
                  {isBooked && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-purple-400" />}
                  {isBlocked && !isBooked && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-orange-400" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex gap-3">
          <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div className="text-sm text-slate-300">
            <p className="font-medium text-blue-300 mb-1">Bookings auto-sync</p>
            <p>Confirmed bookings from your calendar are automatically marked as unavailable. Seekers see your real-time availability when browsing your profile.</p>
          </div>
        </div>
      </div>
    </div>
  );
}