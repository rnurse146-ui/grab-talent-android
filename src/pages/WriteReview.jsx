import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, Star, Loader2, CheckCircle2 } from 'lucide-react';
import PageHeader from '@/components/PageHeader';

export default function WriteReview() {
  const urlParams = new URLSearchParams(window.location.search);
  const bookingId = urlParams.get('booking_id');

  const [user, setUser] = useState(null);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');

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

  const handleSubmit = async () => {
    setSubmitting(true);
    
    await base44.entities.Review.create({
      booking_id: booking.id,
      talent_profile_id: booking.talent_profile_id,
      reviewer_id: user.id,
      reviewer_name: user.full_name,
      rating,
      review_text: reviewText,
      event_type: booking.event_type,
      event_date: booking.event_date
    });

    // Update talent profile stats
    const profiles = await base44.entities.TalentProfile.filter({ id: booking.talent_profile_id });
    if (profiles.length > 0) {
      const profile = profiles[0];
      const newTotalReviews = (profile.total_reviews || 0) + 1;
      const currentTotal = (profile.average_rating || 0) * (profile.total_reviews || 0);
      const newAverage = (currentTotal + rating) / newTotalReviews;
      
      await base44.entities.TalentProfile.update(profile.id, {
        total_reviews: newTotalReviews,
        average_rating: newAverage
      });
    }

    setSuccess(true);
    setSubmitting(false);
  };

  if (loading) return (<div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-white" /></div>);

  if (!booking) return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center"><h1 className="text-2xl font-bold mb-4">Booking not found</h1><Link to={createPageUrl('Bookings')}><Button>View Bookings</Button></Link></div>
    </div>
  );

  if (success) return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6"><CheckCircle2 className="w-10 h-10 text-green-500" /></div>
        <h1 className="text-2xl font-bold mb-2">Review Submitted!</h1>
        <p className="text-zinc-400 mb-6">Thank you for your feedback. Your review helps other seekers find great talent.</p>
        <Link to={createPageUrl('Bookings')}><Button className="bg-white text-black hover:bg-zinc-100">Back to Bookings</Button></Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white">
      <PageHeader backTo={createPageUrl('Bookings')} />

      <div className="max-w-lg mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Review {booking.talent_stage_name}</h1>
          <p className="text-slate-400">{booking.event_name} • {booking.event_date}</p>
        </div>

        <div className="space-y-6">
          {/* Rating */}
          <div className="p-6 bg-zinc-900 rounded-2xl border border-zinc-800 text-center">
            <h3 className="font-semibold mb-4">How was your experience?</h3>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star className={`w-10 h-10 ${star <= (hoverRating || rating) ? 'text-yellow-500 fill-yellow-500' : 'text-slate-600'}`} />
                </button>
              ))}
            </div>
            <p className="text-slate-400 mt-2">
              {rating === 1 && 'Poor'}
              {rating === 2 && 'Fair'}
              {rating === 3 && 'Good'}
              {rating === 4 && 'Very Good'}
              {rating === 5 && 'Excellent'}
            </p>
          </div>

          {/* Review Text */}
          <div className="p-6 bg-zinc-900 rounded-2xl border border-zinc-800">
            <h3 className="font-semibold mb-4">Write a review (optional)</h3>
            <Textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Tell others about your experience..."
              className="bg-zinc-800 border-zinc-700 h-32"
            />
          </div>

          <Button onClick={handleSubmit} disabled={!rating || submitting} className="w-full h-12 bg-white text-black hover:bg-zinc-100 text-base font-semibold">
            {submitting ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Submitting...</> : 'Submit Review'}
          </Button>
        </div>
      </div>
    </div>
  );
}