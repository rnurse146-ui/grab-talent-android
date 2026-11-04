import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Star, MapPin, Banknote, CheckCircle2 } from 'lucide-react';
import { categoryLabel } from '@/lib/categoryLabel';

// One row in the A–Z talent list
export default function TalentListItem({ profile, eventDate = '' }) {
  const photo = profile.profile_photo || profile.media_gallery?.[0];
  const categories = profile.talent_categories?.length ? profile.talent_categories : [profile.talent_category];
  const price = profile.hourly_rate
    ? `£${profile.hourly_rate}/hr`
    : profile.day_rate
      ? `£${profile.day_rate}/day`
      : profile.evening_rate
        ? `£${profile.evening_rate}/evening`
        : null;

  return (
    <Link
      to={createPageUrl('TalentProfile') + `?id=${profile.id}${eventDate ? '&event_date=' + eventDate : ''}`}
      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-colors"
    >
      <div className="w-14 h-14 rounded-lg overflow-hidden bg-zinc-800 shrink-0">
        {photo ? (
          <img src={photo} alt={profile.stage_name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-500 text-lg font-bold">
            {(profile.stage_name || '?').charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="font-semibold text-white truncate">{profile.stage_name}</p>
          {profile.is_verified && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
        </div>
        <p className="text-xs text-zinc-400 truncate">
          {categories.filter(Boolean).map(categoryLabel).join(' · ')}
        </p>
        <div className="flex items-center gap-3 text-xs text-zinc-400 mt-0.5">
          {profile.location_city && (
            <span className="flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3" />{profile.location_city}
            </span>
          )}
          {profile.average_rating > 0 && (
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {profile.average_rating.toFixed(1)}
            </span>
          )}
          {price && (
            <span className="flex items-center gap-1 text-green-400">
              <Banknote className="w-3 h-3" />{price}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}