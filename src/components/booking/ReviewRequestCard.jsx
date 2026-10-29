import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Star, Loader2, CheckCircle2 } from 'lucide-react';

// The review request shown on a booking once its event date has passed.
// Stars submit straight away; the full review form is one tap away.
export default function ReviewRequestCard({ booking, onSubmitted }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!rating || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      // Review validation and the talent's rating aggregates are handled server-side
      await base44.functions.invoke('submitReview', { booking_id: booking.id, rating });
      setDone(true);
      onSubmitted?.();
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Could not send your rating. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="p-5 bg-green-900/20 rounded-2xl border border-green-700/40 space-y-3 text-center">
        <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6 text-green-400" />
        </div>
        <div>
          <p className="text-white font-semibold">Thanks for rating {booking.talent_stage_name}!</p>
          <p className="text-zinc-400 text-sm mt-1">Your feedback helps other seekers find great talent.</p>
        </div>
        <Link to={createPageUrl('WriteReview') + `?booking_id=${booking.id}`}>
          <Button variant="outline" className="w-full border-zinc-700 text-zinc-300">
            Write a full review
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-5 bg-purple-900/20 rounded-2xl border border-purple-700/40 space-y-3">
      <div>
        <p className="text-white font-semibold">How was {booking.talent_stage_name}?</p>
        <p className="text-zinc-400 text-sm mt-1">
          Your event {booking.event_name ? `"${booking.event_name}" ` : ''}has passed — rate your experience and leave a review.
        </p>
      </div>

      <div className="flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="p-1 transition-transform hover:scale-110 active:scale-95"
          >
            <Star className={`w-8 h-8 ${star <= (hover || rating) ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-600'}`} />
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-amber-300 text-center">{error}</p>}

      <Button
        onClick={submit}
        disabled={!rating || submitting}
        className="w-full bg-white text-black hover:bg-zinc-100 font-semibold"
      >
        {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</> : 'Send rating'}
      </Button>
      <Link to={createPageUrl('WriteReview') + `?booking_id=${booking.id}`}>
        <Button variant="ghost" className="w-full text-zinc-400 hover:text-white">
          Write a full review instead
        </Button>
      </Link>
    </div>
  );
}