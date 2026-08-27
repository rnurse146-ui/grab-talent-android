import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, MapPin, Loader2, CalendarClock, History, Banknote } from 'lucide-react';
import { format, isAfter, parseISO } from 'date-fns';
import PageHeader from '@/components/PageHeader';

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-yellow-500/20 text-yellow-400' },
  accepted: { label: 'Accepted', color: 'bg-blue-500/20 text-blue-400' },
  confirmed: { label: 'Confirmed', color: 'bg-green-500/20 text-green-400' },
  completed: { label: 'Completed', color: 'bg-purple-500/20 text-purple-400' },
  declined: { label: 'Declined', color: 'bg-red-500/20 text-red-400' },
  cancelled: { label: 'Cancelled', color: 'bg-slate-500/20 text-slate-400' },
  no_show: { label: 'No Show', color: 'bg-red-500/20 text-red-400' },
};

export default function BookingHistory() {
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('upcoming');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const currentUser = await base44.auth.me();
    setUser(currentUser);
    const all = await base44.entities.Booking.filter(
      { $or: [{ seeker_id: currentUser.id }, { talent_user_id: currentUser.id }] },
      '-event_date'
    );
    setBookings(all);
    setLoading(false);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isUpcoming = (b) => b.event_date && isAfter(parseISO(b.event_date), today);
  const upcoming = bookings.filter(isUpcoming);
  const past = bookings.filter((b) => !isUpcoming(b));

  const list = view === 'upcoming' ? upcoming : past;

  return (
    <div className="min-h-screen bg-black text-white">
      <PageHeader backTo={createPageUrl('Dashboard')} />

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <History className="w-7 h-7 text-purple-400" />
          <h1 className="text-2xl font-bold">Booking History</h1>
        </div>

        <Tabs value={view} onValueChange={setView} className="mb-6">
          <TabsList className="bg-zinc-900 border border-zinc-800">
            <TabsTrigger value="upcoming" className="gap-1.5">
              <CalendarClock className="w-4 h-4" /> Upcoming ({upcoming.length})
            </TabsTrigger>
            <TabsTrigger value="past" className="gap-1.5">
              <History className="w-4 h-4" /> Past ({past.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        ) : list.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              {view === 'upcoming' ? 'No upcoming bookings' : 'No past bookings'}
            </h2>
            <p className="text-zinc-400 mb-6">
              {view === 'upcoming'
                ? 'Your upcoming talent bookings will appear here.'
                : 'Your completed and past bookings will appear here.'}
            </p>
            <Link to={createPageUrl('Discover')}>
              <Button className="bg-white text-black hover:bg-zinc-100">Discover Talent</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {list.map((booking) => {
              const status = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
              const isSeeker = booking.seeker_id === user?.id;
              const counterparty = isSeeker ? booking.talent_stage_name : booking.seeker_name;

              return (
                <div key={booking.id} className="p-5 bg-zinc-900 rounded-2xl border border-zinc-800">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{booking.event_name || 'Event'}</h3>
                      <p className="text-purple-400 text-sm">
                        {isSeeker ? 'Booked with' : 'Booked by'} {counterparty || '—'}
                      </p>
                    </div>
                    <Badge className={status.color}>{status.label}</Badge>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3 text-sm mb-3">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Calendar className="w-4 h-4" />
                      {booking.event_date ? format(parseISO(booking.event_date), 'PPP') : 'TBD'}
                    </div>
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Clock className="w-4 h-4" />
                      {booking.start_time} {booking.end_time ? `– ${booking.end_time}` : ''} {booking.duration_hours ? `(${booking.duration_hours}h)` : ''}
                    </div>
                    <div className="flex items-center gap-2 text-zinc-400">
                      <MapPin className="w-4 h-4" />
                      {[booking.venue_name, booking.venue_city].filter(Boolean).join(', ') || 'TBD'}
                    </div>
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Banknote className="w-4 h-4" />
                      {booking.total_price ? `£${booking.total_price}` : '—'}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-zinc-800">
                    <Link to={createPageUrl('BookingDetails') + `?id=${booking.id}`}>
                      <Button variant="outline" size="sm" className="border-zinc-700">View Details</Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}