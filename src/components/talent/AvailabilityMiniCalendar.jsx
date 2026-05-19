import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Loader2, Calendar } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isToday, isPast, addMonths, subMonths } from 'date-fns';

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function AvailabilityMiniCalendar({ talentProfileId, talentUserId }) {
  const navigate = useNavigate();
  const [blockedDates, setBlockedDates] = useState(new Set());
  const [bookingDates, setBookingDates] = useState(new Set());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!talentProfileId) return;
    base44.entities.TalentAvailability.filter({ talent_profile_id: talentProfileId }).then(records => {
      if (records[0]) {
        setBlockedDates(new Set(records[0].blocked_dates || []));
        setBookingDates(new Set(records[0].booking_dates || []));
      }
      setLoading(false);
    });
  }, [talentProfileId]);

  const days = useCallback(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const handleDayClick = (day, isAvailable) => {
    if (!isAvailable) return;
    const dateStr = format(day, 'yyyy-MM-dd');
    setSelectedDate(dateStr);
  };

  const handleBookNow = () => {
    const url = `/BookTalent?talent_id=${talentProfileId}&event_date=${selectedDate}`;
    navigate(url);
  };

  if (loading) return (
    <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-purple-500" /></div>
  );

  return (
    <div className="space-y-3">
      <div className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden">
        {/* Month Nav */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(m => subMonths(m, 1))} className="h-7 w-7 text-slate-400 hover:text-white">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-semibold">{format(currentMonth, 'MMMM yyyy')}</span>
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(m => addMonths(m, 1))} className="h-7 w-7 text-slate-400 hover:text-white">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 px-2 pt-2">
          {DAY_LABELS.map(d => (
            <div key={d} className="text-center text-xs text-slate-600 pb-1 font-medium">{d}</div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-px px-2 pb-3">
          {days().map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const inMonth = isSameMonth(day, currentMonth);
            const isBlocked = blockedDates.has(dateStr);
            const isBooked = bookingDates.has(dateStr);
            const past = isPast(day) && !isToday(day);
            const isUnavailable = isBlocked || isBooked || past || !inMonth;
            const isSelected = selectedDate === dateStr;

            let cls = 'relative flex items-center justify-center aspect-square rounded-lg text-xs font-medium transition-all ';
            if (!inMonth || past) {
              cls += 'opacity-20 text-slate-600 cursor-default ';
            } else if (isBooked) {
              cls += 'bg-purple-600/30 text-purple-300 cursor-not-allowed ';
            } else if (isBlocked) {
              cls += 'bg-red-500/20 text-red-400 cursor-not-allowed ';
            } else if (isSelected) {
              cls += 'bg-white text-black ring-2 ring-white cursor-pointer font-bold ';
            } else {
              cls += 'text-slate-200 hover:bg-purple-600/30 hover:text-purple-200 cursor-pointer ';
            }
            if (isToday(day) && !isSelected) cls += 'ring-1 ring-purple-500 ';

            return (
              <button
                key={dateStr}
                className={cls}
                onClick={() => handleDayClick(day, !isUnavailable)}
                title={isBooked ? 'Booked' : isBlocked ? 'Unavailable' : past ? 'Past' : !inMonth ? '' : 'Click to select'}
                disabled={isUnavailable}
              >
                {format(day, 'd')}
                {(isBooked || isBlocked) && inMonth && !past && (
                  <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${isBooked ? 'bg-purple-400' : 'bg-red-400'}`} />
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex gap-4 px-4 pb-3 text-xs text-slate-500">
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-400 inline-block" />Booked</div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />Unavailable</div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />Available</div>
        </div>
      </div>

      {/* Book with selected date CTA */}
      {selectedDate ? (
        <div className="flex items-center gap-3 p-4 bg-purple-600/20 border border-purple-500/40 rounded-2xl">
          <Calendar className="w-5 h-5 text-purple-400 shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-purple-300 font-medium">
              {format(new Date(selectedDate + 'T00:00:00'), 'EEEE, MMMM d yyyy')} selected
            </p>
            <p className="text-xs text-slate-400">This date will be pre-filled in your booking</p>
          </div>
          <Button onClick={handleBookNow} className="bg-white text-black hover:bg-zinc-100 shrink-0">
            Book This Date
          </Button>
        </div>
      ) : (
        <p className="text-center text-xs text-slate-500 py-1">Tap an available date to pre-fill your booking</p>
      )}
    </div>
  );
}