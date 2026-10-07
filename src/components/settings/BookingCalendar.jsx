import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, CalendarDays } from 'lucide-react';

const toKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Month calendar with booked dates highlighted — tap a date to see its bookings
export default function BookingCalendar({ bookings }) {
  const [selected, setSelected] = useState(null);

  const bookedDates = bookings.map(b => new Date(b.event_date + 'T00:00:00'));
  const dayBookings = selected ? bookings.filter(b => b.event_date === toKey(selected)) : [];

  return (
    <div className="p-6 bg-zinc-900 rounded-2xl border border-zinc-800">
      <h2 className="font-semibold mb-4 flex items-center gap-2"><CalendarDays className="w-4 h-4 text-purple-400" />Booking Calendar</h2>
      <Calendar
        mode="single"
        selected={selected}
        onSelect={setSelected}
        modifiers={{ booked: bookedDates }}
        modifiersClassNames={{ booked: 'bg-purple-500/40 text-white rounded-full font-bold' }}
        className="text-white bg-transparent"
      />
      {selected && (
        <div className="mt-4 space-y-2">
          <p className="text-xs text-zinc-500">{dayBookings.length} booking{dayBookings.length === 1 ? '' : 's'} on {toKey(selected)}</p>
          {dayBookings.map(b => (
            <Link key={b.id} to={createPageUrl('BookingDetails') + `?id=${b.id}`}>
              <div className="flex items-center gap-3 p-3 rounded-xl border border-zinc-800 hover:bg-zinc-800/50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{b.event_name || b.talent_stage_name || 'Event'}</p>
                  <p className="text-xs text-zinc-500 truncate">{b.talent_stage_name || b.seeker_name} • {b.start_time || ''}</p>
                </div>
                <Badge className={b.status === 'confirmed' ? 'bg-white/20 text-white' : 'bg-zinc-700 text-zinc-300'}>{b.status}</Badge>
                <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}