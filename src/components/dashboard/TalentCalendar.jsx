import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Badge } from '@/components/ui/badge';
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export default function TalentCalendar({ bookings }) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const confirmedBookings = bookings.filter(b => ['accepted', 'confirmed', 'completed'].includes(b.status));

  const bookingsByDate = {};
  confirmedBookings.forEach(b => {
    if (b.event_date) bookingsByDate[b.event_date] = [...(bookingsByDate[b.event_date] || []), b];
  });

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const [selected, setSelected] = useState(null);
  const selectedDateStr = selected ? `${year}-${String(month + 1).padStart(2,'0')}-${String(selected).padStart(2,'0')}` : null;
  const selectedBookings = selectedDateStr ? (bookingsByDate[selectedDateStr] || []) : [];

  return (
    <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
      <h2 className="text-lg font-semibold mb-5 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-orange-400" />
        Booking Calendar
      </h2>

      {/* Month Nav */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={prevMonth} className="text-slate-400 hover:text-white">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="font-semibold">{MONTHS[month]} {year}</span>
        <Button variant="ghost" size="icon" onClick={nextMonth} className="text-slate-400 hover:text-white">
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 mb-2">
        {DAYS.map(d => (
          <div key={d} className="text-center text-xs text-slate-500 py-1">{d}</div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />;
          const dateStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
          const hasBooking = !!bookingsByDate[dateStr];
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          const isSelected = day === selected;
          return (
            <button
              key={day}
              onClick={() => setSelected(isSelected ? null : day)}
              className={`
                relative aspect-square rounded-lg text-sm font-medium transition-all
                ${isSelected ? 'bg-orange-600 text-white' : isToday ? 'bg-slate-700 text-white' : 'hover:bg-slate-800 text-slate-300'}
              `}
            >
              {day}
              {hasBooking && (
                <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-orange-400'}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Day Bookings */}
      {selected && (
        <div className="mt-5 pt-5 border-t border-slate-800">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">
            {MONTHS[month]} {selected} — {selectedBookings.length === 0 ? 'No bookings' : `${selectedBookings.length} booking${selectedBookings.length > 1 ? 's' : ''}`}
          </h3>
          {selectedBookings.length === 0 ? (
            <p className="text-sm text-slate-500">Free day!</p>
          ) : (
            <div className="space-y-3">
              {selectedBookings.map(b => (
                <Link key={b.id} to={createPageUrl('BookingDetails') + `?id=${b.id}`}>
                  <div className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-sm">{b.event_name || 'Event'}</p>
                      <Badge className={
                        b.status === 'confirmed' ? 'bg-green-500/20 text-green-400 text-xs' :
                        b.status === 'accepted' ? 'bg-blue-500/20 text-blue-400 text-xs' :
                        'bg-slate-500/20 text-slate-400 text-xs'
                      }>{b.status}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      {b.start_time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{b.start_time}</span>}
                      {b.venue_city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{b.venue_city}</span>}
                      <span className="text-green-400 ml-auto font-semibold">£{b.talent_payout?.toFixed(0)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}