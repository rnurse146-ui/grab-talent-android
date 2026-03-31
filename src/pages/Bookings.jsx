import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, ChevronLeft, Clock, MapPin, Loader2, CheckCircle2, XCircle, AlertCircle, Banknote } from 'lucide-react';
import { format } from 'date-fns';
import Logo from '@/components/Logo';

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-yellow-500/20 text-yellow-400', icon: AlertCircle },
  accepted: { label: 'Accepted', color: 'bg-blue-500/20 text-blue-400', icon: CheckCircle2 },
  confirmed: { label: 'Confirmed', color: 'bg-green-500/20 text-green-400', icon: CheckCircle2 },
  completed: { label: 'Completed', color: 'bg-purple-500/20 text-purple-400', icon: CheckCircle2 },
  declined: { label: 'Declined', color: 'bg-red-500/20 text-red-400', icon: XCircle },
  cancelled: { label: 'Cancelled', color: 'bg-slate-500/20 text-slate-400', icon: XCircle },
};

export default function Bookings() {
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [isTalent, setIsTalent] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const currentUser = await base44.auth.me();
    setUser(currentUser);
    setIsTalent(currentUser.user_type === 'talent' || currentUser.user_type === 'both');
    const allBookings = await base44.entities.Booking.filter({ $or: [{ seeker_id: currentUser.id }, { talent_user_id: currentUser.id }] }, '-created_date');
    setBookings(allBookings);
    setLoading(false);
  };

  const handleStatusUpdate = async (bookingId, newStatus) => {
    await base44.entities.Booking.update(bookingId, { status: newStatus });
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: newStatus } : b));
  };

  const filteredBookings = bookings.filter(b => {
    if (activeTab === 'all') return true;
    if (activeTab === 'upcoming') return ['pending', 'accepted', 'confirmed'].includes(b.status);
    if (activeTab === 'past') return ['completed', 'cancelled', 'declined'].includes(b.status);
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <Link to={createPageUrl('Dashboard')}><Button variant="ghost" size="sm" className="text-slate-400"><ChevronLeft className="w-4 h-4 mr-1" />Back</Button></Link>
        <Logo className="h-8 w-auto" />
        <div className="w-16" />
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-6">My Bookings</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="bg-slate-900 border border-slate-800">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="w-16 h-16 text-slate-700 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No bookings yet</h2>
            <p className="text-slate-400 mb-6">{isTalent ? "Booking requests will appear here" : "Book some talent to get started"}</p>
            {!isTalent && (<Link to={createPageUrl('Discover')}><Button className="bg-purple-600 hover:bg-purple-500">Discover Talent</Button></Link>)}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => {
              const status = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
              const StatusIcon = status.icon;
              const isMyBooking = booking.seeker_id === user?.id;

              return (
                <div key={booking.id} className="p-5 bg-slate-900 rounded-2xl border border-slate-800">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{booking.event_name || 'Event'}</h3>
                      <p className="text-purple-400 text-sm">{isMyBooking ? booking.talent_stage_name : `Booked by ${booking.seeker_name}`}</p>
                    </div>
                    <Badge className={status.color}><StatusIcon className="w-3 h-3 mr-1" />{status.label}</Badge>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3 text-sm mb-4">
                    <div className="flex items-center gap-2 text-slate-400"><Calendar className="w-4 h-4" />{booking.event_date ? format(new Date(booking.event_date), 'PPP') : 'TBD'}</div>
                    <div className="flex items-center gap-2 text-slate-400"><Clock className="w-4 h-4" />{booking.start_time} - {booking.end_time} ({booking.duration_hours}h)</div>
                    <div className="flex items-center gap-2 text-slate-400"><MapPin className="w-4 h-4" />{booking.venue_name}, {booking.venue_city}</div>

                  </div>

                  {!isMyBooking && booking.status === 'pending' && (
                    <div className="flex gap-2 pt-3 border-t border-slate-800">
                      <Button onClick={() => handleStatusUpdate(booking.id, 'accepted')} className="bg-green-600 hover:bg-green-500" size="sm">Accept</Button>
                      <Button onClick={() => handleStatusUpdate(booking.id, 'declined')} variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/20" size="sm">Decline</Button>
                    </div>
                  )}
                  {isMyBooking && booking.status === 'accepted' && (
                    <div className="flex gap-2 pt-3 border-t border-slate-800">
                      <Button onClick={() => handleStatusUpdate(booking.id, 'confirmed')} className="bg-purple-600 hover:bg-purple-500" size="sm">Confirm Booking</Button>
                      <Button onClick={() => handleStatusUpdate(booking.id, 'cancelled')} variant="outline" className="border-slate-700" size="sm">Cancel</Button>
                    </div>
                  )}
                  {booking.status === 'confirmed' && (
                    <div className="flex gap-2 pt-3 border-t border-slate-800">
                      <Link to={createPageUrl('Messages') + `?to=${isMyBooking ? booking.talent_user_id : booking.seeker_id}`}><Button variant="outline" className="border-slate-700" size="sm">Message</Button></Link>
                      {!isMyBooking && (<Button onClick={() => handleStatusUpdate(booking.id, 'completed')} className="bg-purple-600 hover:bg-purple-500" size="sm">Mark Complete</Button>)}
                    </div>
                  )}
                  {isMyBooking && booking.status === 'completed' && (
                    <div className="pt-3 border-t border-slate-800"><Link to={createPageUrl('WriteReview') + `?booking_id=${booking.id}`}><Button variant="outline" className="border-slate-700" size="sm">Leave Review</Button></Link></div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}