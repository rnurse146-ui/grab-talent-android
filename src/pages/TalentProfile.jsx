import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Banknote, CheckCircle2, Clock, Calendar, ChevronLeft, MessageSquare, Image, Loader2, Award, Eye, Pencil, Instagram, Facebook, Youtube, Globe, Music2 } from 'lucide-react';
import AvailabilityMiniCalendar from '@/components/talent/AvailabilityMiniCalendar';
import AvailabilityManager from '@/components/talent/AvailabilityManager';
import ShareProfile from '@/components/talent/ShareProfile';
import PageHeader from '@/components/PageHeader';
import Logo from '@/components/Logo';

export default function TalentProfile() {
  const urlParams = new URLSearchParams(window.location.search);
  const profileId = urlParams.get('id');
  const eventDate = urlParams.get('event_date');
  const eventName = urlParams.get('event_name');

  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [user, setUser] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => { loadData(); }, [profileId]);

  const loadData = async () => {
    if (!profileId) { setLoading(false); return; }
    const currentUser = await base44.auth.me();
    setUser(currentUser);
    const profiles = await base44.entities.TalentProfile.filter({ id: profileId });
    if (profiles.length > 0) {
      setProfile(profiles[0]);
      setIsOwner(profiles[0].user_id === currentUser.id);
      const profileReviews = await base44.entities.Review.filter({ talent_profile_id: profileId }, '-created_date', 10);
      setReviews(profileReviews);
    }
    setLoading(false);
  };

  if (loading) return (<div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-white" /></div>);
  if (!profile) return (<div className="min-h-screen bg-black text-white flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold mb-4">Profile not found</h1><Link to={createPageUrl('Dashboard')}><Button>Go to Dashboard</Button></Link></div></div>);

  const socialLinks = [
    { key: 'instagram', url: profile.social_links?.instagram, Icon: Instagram },
    { key: 'tiktok', url: profile.social_links?.tiktok, Icon: Music2 },
    { key: 'facebook', url: profile.social_links?.facebook, Icon: Facebook },
    { key: 'youtube', url: profile.social_links?.youtube, Icon: Youtube },
    { key: 'website', url: profile.social_links?.website, Icon: Globe },
  ].map(s => {
    const raw = (s.url || '').trim().replace(/^@/, '');
    if (!raw) return { ...s, href: '' };
    if (/^https?:\/\//i.test(raw)) return { ...s, href: raw };
    if (s.key === 'website') return { ...s, href: `https://${raw}` };
    if (s.key === 'facebook') return { ...s, href: `https://facebook.com/${raw}` };
    return { ...s, href: `https://${s.key}.com/${s.key === 'tiktok' ? '@' : ''}${raw}` };
  });
  const hasSocial = socialLinks.some(s => s.href);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-black sticky top-0 z-10">
        <Link to={createPageUrl('Dashboard')}><Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white"><ChevronLeft className="w-4 h-4 mr-1" />Back</Button></Link>
        <Logo className="h-12 w-auto" variant="light" />
        {isOwner ? (<Link to={createPageUrl('TalentSetup') + '?edit=true'}><Button size="sm" className="bg-white text-black hover:bg-zinc-100">Edit Profile</Button></Link>) : (<div className="w-20" />)}
      </div>

      {isOwner && (
        <div className="bg-purple-900/30 border-b border-purple-700/40 px-6 py-3">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-purple-300 text-sm">
              <Eye className="w-4 h-4" />
              <span>You're viewing your public profile — this is exactly how others see you</span>
            </div>
            <Link to={createPageUrl('TalentSetup') + '?edit=true'}>
              <Button size="sm" className="bg-white text-black hover:bg-zinc-100 shrink-0">
                <Pencil className="w-3.5 h-3.5 mr-1.5" />
                Edit Profile
              </Button>
            </Link>
          </div>
        </div>
      )}

      {!isOwner && eventDate && (
        <div className="bg-amber-950/40 border-b border-amber-700/40 px-6 py-3">
          <div className="max-w-4xl mx-auto flex items-center gap-3 text-sm">
            <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-amber-200">
              Booking for{eventName ? <strong className="text-white"> {eventName}</strong> : ''} on{' '}
              <strong className="text-white">{new Date(eventDate + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong>
            </span>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row gap-8 mb-10">
          <div className="md:w-1/3">
            <div className="rounded-3xl overflow-hidden bg-slate-800">
              {profile.profile_video ? (
                profile.profile_video.match(/\.(mp4|mov|webm)/i) ? (
                  <video src={profile.profile_video} controls autoPlay muted loop playsInline className="w-full aspect-square object-cover" poster={profile.profile_photo || undefined} />
                ) : (
                  <div className="aspect-square flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-purple-900 to-orange-900 p-6">
                    {profile.profile_photo && <img src={profile.profile_photo} alt={profile.stage_name} className="w-24 h-24 rounded-full object-cover border-4 border-white/20" />}
                    <audio src={profile.profile_video} controls className="w-full" />
                    <p className="text-sm text-slate-300 text-center">🎵 Music Sample</p>
                  </div>
                )
              ) : profile.profile_photo ? (
                <img src={profile.profile_photo} alt={profile.stage_name} className="w-full aspect-square object-cover" />
              ) : (
                <div className="aspect-square bg-gradient-to-br from-purple-900 to-orange-900 flex items-center justify-center"><span className="text-6xl">🎭</span></div>
              )}
            </div>
          </div>
          <div className="md:w-2/3">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{profile.stage_name}</h1>
                  {profile.is_verified && (<Badge className="bg-green-500 text-white"><CheckCircle2 className="w-3 h-3 mr-1" />Verified</Badge>)}
                </div>
                <p className="text-zinc-400 text-lg capitalize">{profile.talent_category?.replace(/_/g, ' ')}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex items-center gap-2 text-slate-300"><MapPin className="w-4 h-4 text-slate-500" />{profile.location_city}<span className="text-slate-500">({profile.location_radius} mile radius)</span></div>
              <div className="flex items-center gap-2 text-slate-300"><Banknote className="w-4 h-4 text-slate-500" />£{profile.hourly_rate}/hour</div>
              <div className="flex items-center gap-2 text-slate-300"><Clock className="w-4 h-4 text-slate-500" />Min {profile.minimum_hours}h</div>
            </div>
            <div className="flex gap-6 mb-6">
              {profile.average_rating && (
                <div className="flex items-center gap-2">
                  <div className="flex">{[1,2,3,4,5].map(i => (<Star key={i} className={`w-5 h-5 ${i <= profile.average_rating ? 'text-yellow-500 fill-yellow-500' : 'text-slate-600'}`} />))}</div>
                  <span className="font-semibold">{profile.average_rating.toFixed(1)}</span>
                  <span className="text-slate-500">({profile.total_reviews} reviews)</span>
                </div>
              )}
              {profile.total_bookings > 0 && (<div className="flex items-center gap-2 text-slate-400"><Calendar className="w-4 h-4" />{profile.total_bookings} bookings</div>)}
            </div>
            {(profile.experience_years || profile.specialties?.length > 0) && (
              <div className="flex flex-wrap gap-2 mb-6">
                {profile.experience_years && (<Badge className="bg-purple-500/20 text-purple-300"><Award className="w-3 h-3 mr-1" />{profile.experience_years} years experience</Badge>)}
                {profile.specialties?.map((spec, i) => (<Badge key={i} variant="secondary" className="bg-slate-800 text-slate-300">{spec}</Badge>))}
              </div>
            )}

            {hasSocial && (
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className="text-sm text-slate-500">Find me on:</span>
                {socialLinks.filter(s => s.href).map(s => (
                  <a key={s.key} href={s.href} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors">
                    <s.Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            )}
            {!isOwner && (
              <div className="flex gap-3">
                <Link to={createPageUrl('BookTalent') + `?talent_id=${profile.id}${eventDate ? '&event_date=' + eventDate : ''}${eventName ? '&event_name=' + encodeURIComponent(eventName) : ''}`}><Button size="lg" className="bg-white text-black hover:bg-zinc-100"><Calendar className="w-5 h-5 mr-2" />Book Now</Button></Link>
                <Link to={createPageUrl('Messages') + `?to=${profile.user_id}`}><Button size="lg" variant="outline" className="border-zinc-700 bg-transparent"><MessageSquare className="w-5 h-5 mr-2" />Message</Button></Link>
              </div>
            )}
          </div>
        </div>

        {isOwner && (<ShareProfile profile={profile} />)}

        {profile.bio && (<div className="mb-10"><h2 className="text-xl font-semibold mb-4">About</h2><p className="text-slate-300 whitespace-pre-line">{profile.bio}</p></div>)}

        <div className="mb-10">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Calendar className="w-5 h-5 text-purple-400" />Availability</h2>
          {isOwner ? (
            <AvailabilityManager talentProfileId={profile.id} talentUserId={profile.user_id} />
          ) : (
            <AvailabilityMiniCalendar talentProfileId={profile.id} />
          )}
        </div>

        {profile.media_gallery?.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Image className="w-5 h-5 text-purple-400" />Gallery</h2>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
              {profile.media_gallery.map((url, i) => (<motion.div key={i} whileHover={{ scale: 1.02 }} className="aspect-square rounded-xl overflow-hidden cursor-pointer bg-slate-800" onClick={() => setSelectedImage(url)}><img src={url} alt="" className="w-full h-full object-cover" /></motion.div>))}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Star className="w-5 h-5 text-yellow-500" />Reviews</h2>
          {reviews.length === 0 ? (
            <div className="text-center py-10 bg-slate-900/50 rounded-2xl border border-slate-800"><Star className="w-10 h-10 text-slate-700 mx-auto mb-3" /><p className="text-slate-400">No reviews yet</p></div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="p-5 bg-zinc-900 rounded-2xl border border-zinc-800">
                  <div className="flex items-start justify-between mb-3">
                    <div><p className="font-medium">{review.reviewer_name || 'Anonymous'}</p><p className="text-sm text-slate-500">{review.event_type} • {review.event_date}</p></div>
                    <div className="flex">{[1,2,3,4,5].map(i => (<Star key={i} className={`w-4 h-4 ${i <= review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-slate-600'}`} />))}</div>
                  </div>
                  {review.review_text && (<p className="text-slate-300">{review.review_text}</p>)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedImage && (<div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6" onClick={() => setSelectedImage(null)}><img src={selectedImage} alt="" className="max-w-full max-h-full object-contain" /></div>)}
    </div>
  );
}