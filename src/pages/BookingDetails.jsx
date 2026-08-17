import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft, Calendar, Clock, MapPin, Banknote,
  Loader2, CheckCircle2, XCircle, AlertCircle,
  MessageSquare, Star, User, Phone, CalendarX, ShieldCheck
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import PageHeader from '@/components/PageHeader';

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: AlertCircle },
  accepted:  { label: 'Accepted',  color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',       icon: CheckCircle2 },
  confirmed: { label: 'Confirmed', color: 'bg-green-500/20 text-green-400 border-green-500/30',    icon: CheckCircle2 },
  completed: { label: 'Completed', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: CheckCircle2 },
  declined:  { label: 'Declined',  color: 'bg-red-500/20 text-red-400 border-red-500/30',          icon: XCircle },
  cancelled: { label: 'Cancelled', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30',    icon: XCircle },
  no_show:   { label: 'No Show',   color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: XCircle },
};

export default function BookingDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const bookingId = urlParams.get('id');

  const [user, setUser]       = useState(null);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [attendanceInput, setAttendanceInput] = useState('');
  const [showRatingPrompt, setShowRatingPrompt] = useState(false);
  const [quickRating, setQuickRating] = useState(0);
  const [quickRatingHover, setQuickRatingHover] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [talentProfile, setTalentProfile] = useState(null);

  useEffect(() => { loadData(); }, [bookingId]);

  const loadData = async () => {
    const currentUser = await base44.auth.me();
    setUser(currentUser);
    if (bookingId) {
      const bookings = await base44.entities.Booking.filter({ id: bookingId });
      if (bookings.length > 0) {
        setBooking(bookings[0]);
        if (bookings[0].talent_profile_id) {
          const profiles = await base44.entities.TalentProfile.filter({ id: bookings[0].talent_profile_id });
          if (profiles.length > 0) setTalentProfile(profiles[0]);
        }
      }
    }
    setLoading(false);
  };

  const handleStatusUpdate = async (newStatus) => {
    setUpdating(true);
    await base44.entities.Booking.update(booking.id, { status: newStatus });
    setBooking(prev => ({ ...prev, status: newStatus }));

    // Send email with calendar invite to talent when seeker confirms the booking
    if (newStatus === 'confirmed') {
      const talentUsers = await base44.entities.User.filter({ id: booking.talent_user_id });
      if (talentUsers.length > 0 && talentUsers[0].email) {
        const talentEmail = talentUsers[0].email;
        const eventDateFormatted = booking.event_date ? format(new Date(booking.event_date), 'EEEE, MMMM d, yyyy') : 'TBD';

        // Build ICS calendar invite content
        const icsDate = booking.event_date ? booking.event_date.replace(/-/g, '') : '';
        const startTime = booking.start_time ? booking.start_time.replace(':', '') + '00' : '090000';
        const endTime = booking.end_time ? booking.end_time.replace(':', '') + '00' : '180000';
        const dtStart = icsDate ? `${icsDate}T${startTime}` : '';
        const dtEnd = icsDate ? `${icsDate}T${endTime}` : '';
        const uid = `grabtalent-${booking.id}@grabtalent.app`;
        const icsContent = [
          'BEGIN:VCALENDAR',
          'VERSION:2.0',
          'PRODID:-//Grab Talent//EN',
          'CALSCALE:GREGORIAN',
          'METHOD:REQUEST',
          'BEGIN:VEVENT',
          `UID:${uid}`,
          `DTSTART:${dtStart}`,
          `DTEND:${dtEnd}`,
          `SUMMARY:🎭 ${booking.event_name || 'Gig'} — ${booking.event_type?.replace(/_/g, ' ')}`,
          `LOCATION:${[booking.venue_name, booking.venue_address, booking.venue_city].filter(Boolean).join(', ')}`,
          `DESCRIPTION:Booked by ${booking.seeker_name}${booking.seeker_phone ? ` (${booking.seeker_phone})` : ''}. Payout: £${booking.talent_payout}.${booking.special_requirements ? ' Notes: ' + booking.special_requirements : ''}`,
          `ORGANIZER:mailto:noreply@grabtalent.app`,
          `ATTENDEE:mailto:${talentEmail}`,
          'STATUS:CONFIRMED',
          'END:VEVENT',
          'END:VCALENDAR'
        ].join('\r\n');

        await base44.integrations.Core.SendEmail({
          to: talentEmail,
          subject: `🎉 Confirmed Gig: ${booking.event_name || 'New Booking'} on ${eventDateFormatted}`,
          body: `Hi ${booking.talent_stage_name},

Great news — you've been hired! ${booking.seeker_name} has confirmed their booking with you.

📅 Event: ${booking.event_name || 'Event'}
🗓️ Date: ${eventDateFormatted}
⏰ Time: ${booking.start_time} – ${booking.end_time} (${booking.duration_hours}h)
📍 Venue: ${booking.venue_name}, ${booking.venue_address}, ${booking.venue_city}
💷 Your Payout: £${booking.talent_payout}
${booking.seeker_phone ? `📞 Client Phone: ${booking.seeker_phone}` : ''}
${booking.special_requirements ? `\n📝 Special Requirements: ${booking.special_requirements}` : ''}

📆 ADD TO YOUR CALENDAR
Copy the text below, save it as a file called "gig.ics", then open it to add the event directly to your calendar app (works with Google Calendar, Apple Calendar, Outlook and more):

--- COPY FROM HERE ---
${icsContent}
--- COPY TO HERE ---

Log in to Grab Talent to view full booking details and message your client.

Good luck and have a great performance! 🎭

— The Grab Talent Team`
        });
      }
    }

    setUpdating(false);
  };

  const handleAttendanceConfirm = async () => {
    if (attendanceInput.toLowerCase() !== 'confirm') return;
    setUpdating(true);
    await base44.entities.Booking.update(booking.id, { status: 'completed' });
    setBooking(prev => ({ ...prev, status: 'completed' }));
    setShowAttendanceModal(false);
    setAttendanceInput('');
    setUpdating(false);
    setShowRatingPrompt(true);
  };

  const handleQuickRatingSubmit = async () => {
    if (!quickRating) return;
    setSubmittingRating(true);
    await base44.entities.Review.create({
      booking_id: booking.id,
      talent_profile_id: booking.talent_profile_id,
      reviewer_id: user.id,
      reviewer_name: user.full_name,
      rating: quickRating,
      event_type: booking.event_type,
      event_date: booking.event_date
    });
    const profiles = await base44.entities.TalentProfile.filter({ id: booking.talent_profile_id });
    if (profiles.length > 0) {
      const profile = profiles[0];
      const newTotal = (profile.total_reviews || 0) + 1;
      const newAvg = ((profile.average_rating || 0) * (profile.total_reviews || 0) + quickRating) / newTotal;
      await base44.entities.TalentProfile.update(profile.id, { total_reviews: newTotal, average_rating: newAvg });
    }
    setRatingSubmitted(true);
    setSubmittingRating(false);
  };

  const handlePaymentRelease = async () => {
    await base44.entities.Booking.update(booking.id, {
      payment_status: 'released',
      status: 'completed'
    });
    setBooking(prev => ({ ...prev, payment_status: 'released', status: 'completed' }));
  };

  const handleTalentCancel = async () => {
    setUpdating(true);
    await base44.entities.Booking.update(booking.id, { status: 'cancelled' });
    setBooking(prev => ({ ...prev, status: 'cancelled' }));

    // 3-strike rule: cancelling within 7 days of the event counts as a violation
    if (booking.event_date) {
      const eventDate = new Date(booking.event_date + 'T12:00:00');
      const daysUntil = Math.ceil((eventDate - new Date(new Date().toDateString())) / (1000 * 60 * 60 * 24));
      if (daysUntil <= 7) {
        const profiles = await base44.entities.TalentProfile.filter({ id: booking.talent_profile_id });
        if (profiles.length > 0) {
          const profile = profiles[0];
          const newStrikes = (profile.strikes_count || 0) + 1;
          const updates = { strikes_count: newStrikes };
          if (newStrikes >= 3) {
            updates.account_suspended = true;
            updates.is_available = false;
          }
          await base44.entities.TalentProfile.update(profile.id, updates);
          setTalentProfile(prev => ({ ...prev, ...updates }));
        }
      }
    }
    setUpdating(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-white" />
    </div>
  );

  if (!booking) return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
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

  // Show payment release when: seeker + booking is confirmed + payment not yet released
  const showPaymentRelease = isSeeker &&
    booking.status === 'confirmed' &&
    booking.payment_status !== 'released';

  return (
    <div className="min-h-screen bg-black text-white">
      <PageHeader backTo={createPageUrl('Bookings')} />

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
        <div className="p-5 bg-zinc-900 rounded-2xl border border-zinc-800">
          <h2 className="text-sm font-medium text-slate-400 mb-3">{isSeeker ? 'Talent' : 'Booked By'}</h2>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600/30 to-orange-600/30 flex items-center justify-center">
              <User className="w-6 h-6 text-slate-400" />
            </div>
            <div>
              <p className="font-semibold">{isSeeker ? booking.talent_stage_name : booking.seeker_name}</p>
              <p className="text-sm text-purple-400 capitalize">
                {isSeeker ? booking.talent_category?.replace(/_/g, ' ') : 'Event Organiser'}
              </p>
            </div>
          </div>
        </div>

        {/* Event Details */}
        <div className="p-5 bg-zinc-900 rounded-2xl border border-zinc-800 space-y-4">
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




        {isSeeker && (
          <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
              <p className="text-xs text-zinc-400 leading-relaxed">This talent is held to our <strong className="text-white">3-strike policy</strong>: if they cancel within 7 days of your event it counts as a violation, and after 3 strikes their account is deactivated. You're also protected with a full refund if they let you down at short notice.</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {/* Talent actions */}
          {isTalent && booking.status === 'pending' && (
            <div className="flex gap-3">
              <Button onClick={() => handleStatusUpdate('accepted')} disabled={updating} className="flex-1 bg-white text-black hover:bg-zinc-100">
                {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                Accept Booking
              </Button>
              <Button onClick={() => handleStatusUpdate('declined')} disabled={updating} variant="outline" className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/20">
                <XCircle className="w-4 h-4 mr-2" />
                Decline
              </Button>
            </div>
          )}

          {isTalent && ['accepted', 'confirmed'].includes(booking.status) && (
            <div className="p-5 bg-red-900/20 rounded-2xl border border-red-700/40 space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <p className="text-white font-medium">Need to cancel this booking?</p>
              </div>
              <p className="text-zinc-400 text-sm">
                Cancelling within 7 days of the event counts as a <strong className="text-red-400">violation</strong> under our 3-strike policy. You currently have <strong className="text-white">{talentProfile?.strikes_count || 0}/3</strong> strikes — after 3 your account is deactivated from the platform.
              </p>
              <Button onClick={handleTalentCancel} disabled={updating} variant="outline" className="w-full border-red-500/50 text-red-400 hover:bg-red-500/20">
                {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                Cancel Booking
              </Button>
            </div>
          )}

          {isSeeker && booking.status === 'accepted' && (
            <div className="p-5 bg-zinc-900 rounded-2xl border border-zinc-700 space-y-3">
              <p className="text-white font-medium">🎉 {booking.talent_stage_name} has accepted your booking!</p>
              <p className="text-zinc-400 text-sm">Confirm to lock in the booking.</p>
              <div className="flex gap-3">
                <Button onClick={() => handleStatusUpdate('confirmed')} disabled={updating} className="flex-1 bg-white text-black hover:bg-zinc-100">
                  {updating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                  Confirm Booking
                </Button>
                <Button onClick={() => handleStatusUpdate('cancelled')} disabled={updating} variant="outline" className="border-zinc-700 text-zinc-400">
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {isSeeker && booking.status === 'pending' && (
            <Button onClick={() => handleStatusUpdate('cancelled')} disabled={updating} variant="outline" className="w-full border-zinc-700 text-zinc-400">
              Cancel Request
            </Button>
          )}

          {/* Attendance Confirmation — seeker confirms talent has arrived */}
          {isSeeker && booking.status === 'confirmed' && (
            <div className="p-5 bg-green-900/20 rounded-2xl border border-green-700/40 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-green-400" />
                <p className="text-white font-medium">Has the talent arrived?</p>
              </div>
              <p className="text-zinc-400 text-sm">Once {booking.talent_stage_name} has arrived at the venue, confirm their attendance to mark the booking as completed.</p>
              <Button
                onClick={() => setShowAttendanceModal(true)}
                className="w-full bg-green-600 hover:bg-green-500 text-white"
              >
                <ShieldCheck className="w-4 h-4 mr-2" />
                Confirm Talent Arrived
              </Button>
            </div>
          )}

          {isSeeker && booking.status === 'completed' && (
            <Link to={createPageUrl('WriteReview') + `?booking_id=${booking.id}`}>
              <Button className="w-full bg-white text-black hover:bg-zinc-100">
                <Star className="w-4 h-4 mr-2" />
                Leave a Review
              </Button>
            </Link>
          )}

          {['accepted', 'confirmed', 'completed'].includes(booking.status) && (
            <Link to={createPageUrl('Messages') + `?to=${otherUserId}`}>
              <Button variant="outline" className="w-full border-zinc-700 text-zinc-300 hover:text-white">
                <MessageSquare className="w-4 h-4 mr-2" />
                Message {isSeeker ? booking.talent_stage_name : booking.seeker_name}
              </Button>
            </Link>
          )}

          {isTalent && booking.event_date && (
            <Link to={`/TalentAvailability`}>
              <Button variant="outline" className="w-full border-purple-700/50 text-purple-400 hover:bg-purple-500/10">
                <CalendarX className="w-4 h-4 mr-2" />
                Manage Availability / Block Dates
              </Button>
            </Link>
          )}

          {isSeeker && (
            <Link to={createPageUrl('TalentProfile') + `?id=${booking.talent_profile_id}`}>
              <Button variant="ghost" className="w-full text-zinc-400 hover:text-white">
                View Talent Profile
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Uber-style post-completion rating prompt */}
      {showRatingPrompt && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-8 w-full max-w-sm text-center space-y-5">
            {ratingSubmitted ? (
              <>
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-green-400" />
                </div>
                <h2 className="text-xl font-bold">Thanks for rating!</h2>
                <p className="text-zinc-400 text-sm">Your feedback helps others find great talent.</p>
                <div className="flex flex-col gap-2 pt-2">
                  <Link to={createPageUrl('WriteReview') + `?booking_id=${booking.id}`}>
                    <Button variant="outline" className="w-full border-zinc-700 text-zinc-300">
                      Write a full review
                    </Button>
                  </Link>
                  <Button onClick={() => setShowRatingPrompt(false)} className="w-full bg-white text-black hover:bg-zinc-100">
                    Done
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto">
                  <Star className="w-8 h-8 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold mb-1">How was {booking.talent_stage_name}?</h2>
                  <p className="text-zinc-400 text-sm">Rate your experience</p>
                </div>
                <div className="flex justify-center gap-3">
                  {[1,2,3,4,5].map(star => (
                    <button
                      key={star}
                      onClick={() => setQuickRating(star)}
                      onMouseEnter={() => setQuickRatingHover(star)}
                      onMouseLeave={() => setQuickRatingHover(0)}
                      className="transition-transform hover:scale-125 active:scale-110"
                    >
                      <Star className={`w-10 h-10 transition-colors ${star <= (quickRatingHover || quickRating) ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-600'}`} />
                    </button>
                  ))}
                </div>
                {quickRating > 0 && (
                  <p className="text-sm font-medium text-yellow-400">
                    {['','Poor','Fair','Good','Very Good','Excellent'][quickRating]}
                  </p>
                )}
                <div className="flex flex-col gap-2 pt-2">
                  <Button
                    onClick={handleQuickRatingSubmit}
                    disabled={!quickRating || submittingRating}
                    className="w-full bg-white text-black hover:bg-zinc-100 h-12 text-base font-semibold disabled:opacity-40"
                  >
                    {submittingRating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Rating'}
                  </Button>
                  <button onClick={() => setShowRatingPrompt(false)} className="text-zinc-500 text-sm hover:text-zinc-300 transition-colors py-1">
                    Skip for now
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showAttendanceModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm space-y-5">
            <div className="text-center">
              <ShieldCheck className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <h2 className="text-xl font-bold mb-1">Confirm Attendance</h2>
              <p className="text-zinc-400 text-sm">Type <span className="text-white font-semibold">confirm</span> below to verify that {booking.talent_stage_name} has arrived at the venue.</p>
            </div>
            <Input
              value={attendanceInput}
              onChange={(e) => setAttendanceInput(e.target.value)}
              placeholder='Type "confirm" here'
              className="bg-zinc-800 border-zinc-700 text-center text-white"
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-zinc-700 text-zinc-400"
                onClick={() => { setShowAttendanceModal(false); setAttendanceInput(''); }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAttendanceConfirm}
                disabled={attendanceInput.toLowerCase() !== 'confirm' || updating}
                className="flex-1 bg-green-600 hover:bg-green-500 text-white disabled:opacity-40"
              >
                {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}