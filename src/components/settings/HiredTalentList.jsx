import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Star, Users, ChevronRight } from 'lucide-react';

// Talents this user has hired (seeker side) with the rating they gave each event
export default function HiredTalentList({ user, bookings }) {
  const [reviews, setReviews] = useState({});

  useEffect(() => {
    if (!user) return;
    base44.entities.Review.filter({ reviewer_id: user.id }).then(list => {
      const map = {};
      list.forEach(r => { map[r.booking_id] = r.rating; });
      setReviews(map);
    });
  }, [user]);

  const hired = bookings.filter(b => b.seeker_id === user?.id);

  return (
    <div className="p-6 bg-zinc-900 rounded-2xl border border-zinc-800">
      <h2 className="font-semibold mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-purple-400" />Talent You've Hired</h2>
      {hired.length === 0 ? (
        <p className="text-zinc-500 text-sm">No hires yet — your booked talent will appear here with your event ratings.</p>
      ) : (
        <div className="space-y-2">
          {hired.map(b => (
            <Link key={b.id} to={createPageUrl('BookingDetails') + `?id=${b.id}`}>
              <div className="flex items-center gap-3 p-3 rounded-xl border border-zinc-800 hover:bg-zinc-800/50">
                <div className="w-10 h-10 rounded-xl bg-zinc-800 overflow-hidden shrink-0 flex items-center justify-center">
                  {b.talent_stage_name ? <span className="text-sm font-bold text-zinc-500">{b.talent_stage_name[0]}</span> : <Users className="w-4 h-4 text-zinc-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{b.talent_stage_name || 'Talent'}</p>
                  <p className="text-xs text-zinc-500 truncate">{b.event_name || b.event_type || 'Event'} • {b.event_date}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {reviews[b.id] ? (
                    <span className="flex items-center gap-1 text-sm text-zinc-300"><Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />{reviews[b.id]}</span>
                  ) : (
                    <span className="text-xs text-zinc-600">Not rated yet</span>
                  )}
                  <ChevronRight className="w-4 h-4 text-zinc-500" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}