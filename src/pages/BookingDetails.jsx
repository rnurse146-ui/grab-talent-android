import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft, Calendar, Clock, MapPin, Banknote,
  Loader2, CheckCircle2, XCircle, AlertCircle,
  MessageSquare, Star, User, Phone
} from 'lucide-react';
import { format } from 'date-fns';
import Logo from '@/components/Logo';

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: AlertCircle },
  accepted: { label: 'Accepted', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: CheckCircle2 },
  confirmed: { label: 'Confirmed', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle2 },
  completed: { label: 'Completed', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: CheckCircle2 },
  declined: { label: 'Declined', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle },
  cancelled: { label: 'Cancelled', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', icon: XCircle },
  no_show: { label: 'No Show', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: XCircle },
};

export default function BookingDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const bookingId = urlParams.get('id');

  const [user, setUser] = useState(null);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => { loadData(); }, [bookingId]);

  const loadData = async () => {
    const currentUser = await base44.auth.me();
    setUser(currentUser);
    if (bookingId) {
      const bookings = await base44.entities.Booking.filter({ id: bookingId });
      if (bookings.length > 0) setBooking(bookings[0]);
    }
    setLoading(false);
  };

  const handleStatusUpdate = async (newStatus) => {
    setUpdating(true);
    await base44.entities.Booking.update(booking.id, { status: newStatus });
    setBooking(prev => ({ ...prev, status: newStatus }));
    setUpdating(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
    </div>
  );

  if (!booking) return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Booking not found</h1>
        <Link to={createPageUrl('Bookings')}><Button>View Bookings</Button></Link>
      </div>
    </div>
  );

  const status = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
  const StatusIcon = status.icon;
  const isSeeker = booking.seeker_id === user?.id;
  const isTalent = booking.talent_user_id === user?.id;
  const otherUserId = isSeeker ? booking.talent_user_id : booking.seeker_id;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <Link to={createPageUrl('Bookings')}>
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
            <ChevronLeft className="w-4 h-4 mr-1" />Back
          </Button>
        </Link>
        <Logo className="h-8 w-auto" />
        <div className="w-16" />
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">{booking.event_name || 'Event'}</h1>
            <p className="text-purple-400 capitalize">{booking.event_type?.replace(/_/g, ' ')}</p>
          </div>
          <Badge className={`${status.color} border text-sm px-3 py-1`}>
            <StatusIcon className="w-3 h-3 mr-1.5" />
            {status.label}
          </Badge>
        </div>

        {/* Talent / Seeker Info */}
        <div className="p-5 bg-slate-900 rounded-2xl border border-slate-800">
          <h2 className="text-sm font-medium text-slate-400 mb-3">{isSeeker ? 'Talent' : 'Booked By'}</h2>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600/30 to-orange-600/30 flex items-center justify-center">
              <User className="w-6 h-6 text-slate-400" />
            </div>
            <div>
              <p className="font-semibold">
                {isSeeker ? booking.talent_stage_name : booking.seeker_name}
              </p>
              <p className="text-sm text-purple-400 capitalize">
                {isSeeker ? booking.talent_category?.replace(/_/g, ' ') : 'Event Organiser'}
              </p>
            </div>
          </div>
        </div>

        {/* Event Details */}
        <div className="p-5 bg-slate-900 rounded-2xl border border-slate-800 space-y-4">
          <h2 className="font-semibold">Event Details</h2>
          <div className="grid gap-3">
            <div className="flex items-center gap-3 text-slate-300">
              <Calendar className="w-5 h-5 text-slate-500 shrink-0" />
              <span>{booking.event_date ? format(new Date(booking.event_date), 'EEEE, MMMM d, yyyy') : 'TBD'}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-300">
              <Clock className="w-5 h-5 text-slate-500 shrink-0" />
              <span>{booking.start_time} – {booking.end_time} ({booking.duration_hours}h)</span>
            </div>
            <div className="flex items-start gap-3 text-slate-300">
              <MapPin className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
              <div>
                <p>{booking.venue_name}</p>
                <p className="text-slate-500 text-sm">{booking.venue_address}</p>
                <p className="text-slate-500 text-sm">{booking.venue_city}</p>
              </div>
            </div>
            {booking.seeker_phone && (
              <div className="flex items-center gap-3 text-slate-300">
                <Phone className="w-5 h-5 text-slate-500 shrink-0" />
                <span>{booking.seeker_phone}</span>
              </div>
            )}
          </div>
          {booking.special_requirements && (
            <div className="pt-3 border-t border-slate-800">
              <p className="text-sm text-slate-400 mb-1">Special Requirements</p>
              <p className="text-slate-300">{booking.special_requirements}</p>
            </div>
          )}
        </div>

        {/* Pricing */}
        <div className="p-5 bg-slate-900 rounded-2xl border border-slate-800">
          <h2 className="font-semibold mb-4">Price Breakdown</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-slate-300">
              <span>{booking.duration_hours}h × £{booking.talent_payout / booking.duration_hours || 0}</span>
              <span>£{booking.base_price?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Service fee (11%)</span>
              <span>£{booking.commission_amount?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold text-lg border-t border-slate-700 pt-2 mt-2">
              <span>Total</span>
              <span className="text-purple-400">£{booking.total_price?.toFixed(2)}</span>
            </div>
            {isTalent && (
              <div className="flex justify-between text-green-400 text-sm pt-1">
                <span>Your payout</span>
                <span>£{booking.talent_payout?.toFixed(2)}</span>
              </div>
            )}
          </div>
          <div className="mt-3">
            <Badge className={booking.payment_status === 'paid' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}>
              Payment: {booking.payment_status}
            </Badge>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {/* Talent actions */}
          {isTalent && booking.status === 'pending' && (
            <div className="flex gap-3">
              <Button onClick={() => handleStatusUpdate('accepted')} disabled={updating} className="flex-1 bg-green-600 hover:bg-green-500">
                {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                Accept Booking
              </Button>
              <Button onClick={() => handleStatusUpdate('declined')} disabled={updating} variant="outline" className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/20">
                <XCircle className="w-4 h-4 mr-2" />
                Decline
              </Button>
            </div>
          )}
          {isTalent && booking.status === 'confirmed' && (
            <Button onClick={() => handleStatusUpdate('completed')} disabled={updating} className="w-full bg-purple-600 hover:bg-purple-500">
              Mark as Completed
            </Button>
          )}

          {/* Seeker actions */}
          {isSeeker && booking.status === 'accepted' && (
            <div className="flex gap-3">
              <Button onClick={() => handleStatusUpdate('confirmed')} disabled={updating} className="flex-1 bg-purple-600 hover:bg-purple-500">
                Confirm & Pay
              </Button>
              <Button onClick={() => handleStatusUpdate('cancelled')} disabled={updating} variant="outline" className="flex-1 border-slate-700">
                Cancel
              </Button>
            </div>
          )}
          {isSeeker && booking.status === 'pending' && (
            <Button onClick={() => handleStatusUpdate('cancelled')} disabled={updating} variant="outline" className="w-full border-slate-700 text-slate-400">
              Cancel Request
            </Button>
          )}
          {isSeeker && booking.status === 'completed' && (
            <Link to={createPageUrl('WriteReview') + `?booking_id=${booking.id}`}>
              <Button className="w-full bg-yellow-600 hover:bg-yellow-500">
                <Star className="w-4 h-4 mr-2" />
                Leave a Review
              </Button>
            </Link>
          )}

          {/* Message button for both */}
          {['accepted', 'confirmed', 'completed'].includes(booking.status) && (
            <Link to={createPageUrl('Messages') + `?to=${otherUserId}`}>
              <Button variant="outline" className="w-full border-slate-700">
                <MessageSquare className="w-4 h-4 mr-2" />
                Message {isSeeker ? booking.talent_stage_name : booking.seeker_name}
              </Button>
            </Link>
          )}

          {/* View talent profile */}
          {isSeeker && (
            <Link to={createPageUrl('TalentProfile') + `?id=${booking.talent_profile_id}`}>
              <Button variant="ghost" className="w-full text-slate-400 hover:text-white">
                View Talent Profile
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}