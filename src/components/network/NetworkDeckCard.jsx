import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Star, CheckCircle2, Users, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import DeckVideo from '@/components/DeckVideo';
import { categoryLabel } from '@/lib/categoryLabel';

// One performer in the collab deck — same swipe feel as the hire deck, but the
// card is about what they do rather than what they cost.
export default function NetworkDeckCard({ talent, onSwipe, swiping, disabled, footnote = 'Swipe right to invite them to collab' }) {
  const handleDragEnd = (event, info) => {
    if (disabled || swiping) return;
    if (info.offset.x > 90) onSwipe('right');
    else if (info.offset.x < -90) onSwipe('left');
  };

  const categories = talent.talent_categories?.length ? talent.talent_categories : [talent.talent_category];
  const isVideo = talent.profile_video && talent.profile_video.match(/\.(mp4|mov|webm)/i);

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{
        scale: 1,
        opacity: 1,
        x: swiping === 'left' ? -420 : swiping === 'right' ? 420 : 0,
        rotate: swiping === 'left' ? -15 : swiping === 'right' ? 15 : 0
      }}
      drag={disabled || swiping ? false : 'x'}
      dragConstraints={{ left: -20, right: 20 }}
      dragElastic={0.8}
      onDragEnd={handleDragEnd}
      transition={{ duration: 0.3 }}
      className="w-full max-w-sm cursor-grab active:cursor-grabbing select-none"
      style={{ touchAction: 'none' }}
    >
      <div className="bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl">
        <div className="relative aspect-[3/4]">
          {isVideo ? (
            <DeckVideo src={talent.profile_video} poster={talent.profile_photo} />
          ) : talent.profile_photo ? (
            <img src={talent.profile_photo} alt={talent.stage_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-900 to-orange-900 flex items-center justify-center">
              <span className="text-6xl">🎭</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

          {talent.is_verified && (
            <div className="absolute top-4 right-4">
              <Badge className="bg-green-500 text-white"><CheckCircle2 className="w-3 h-3 mr-1" />Verified</Badge>
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-5">
            <h2 className="text-3xl font-bold mb-1">{talent.stage_name}</h2>
            <p className="text-purple-300 text-base font-medium capitalize mb-3">
              {categoryLabel(categories[0])}
              {categories.length > 1 && <span className="text-zinc-400"> +{categories.length - 1} more</span>}
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              {talent.location_city && (
                <Badge variant="secondary" className="bg-white/20 text-white text-sm">
                  <MapPin className="w-4 h-4 mr-1" />{talent.location_city}
                </Badge>
              )}
              {talent.experience_years > 0 && (
                <Badge variant="secondary" className="bg-white/20 text-white text-sm">
                  {talent.experience_years} yr{talent.experience_years === 1 ? '' : 's'} experience
                </Badge>
              )}
              {talent.average_rating > 0 && (
                <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-300 text-sm">
                  <Star className="w-4 h-4 mr-1 fill-yellow-300" />{talent.average_rating.toFixed(1)}
                </Badge>
              )}
            </div>
            {talent.bio && <p className="text-base text-zinc-200 line-clamp-2">{talent.bio}</p>}
            {talent.specialties?.length > 0 && (
              <p className="mt-2 text-sm text-zinc-300 line-clamp-1">
                <Sparkles className="inline w-4 h-4 mr-1" />
                {talent.specialties.slice(0, 4).join(' · ')}
              </p>
            )}
            <p className="mt-3 text-sm text-zinc-400">
              <Users className="inline w-4 h-4 mr-1" />{footnote}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}