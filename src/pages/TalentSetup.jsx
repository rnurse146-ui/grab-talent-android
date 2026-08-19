import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronRight, ChevronLeft, Camera, Upload, Music, Star, Banknote, Check, X, Loader2, Zap, Share2, Eye } from 'lucide-react';
import Logo from '@/components/Logo';

const TALENT_CATEGORIES = [
  { value: 'dj', label: 'DJ', icon: '🎧' },
  { value: 'dancer', label: 'Dancer', icon: '💃' },
  { value: 'band', label: 'Band', icon: '🎸' },
  { value: 'guitarist', label: 'Guitarist', icon: '🎸' },
  { value: 'singer', label: 'Singer', icon: '🎤' },
  { value: 'pianist', label: 'Pianist', icon: '🎹' },
  { value: 'harpist', label: 'Harpist', icon: '🎵' },
  { value: 'saxophonist', label: 'Saxophonist', icon: '🎷' },
  { value: 'flute_player', label: 'Flute Player', icon: '🎶' },
  { value: 'drummer', label: 'Drummer', icon: '🥁' },
  { value: 'violinist', label: 'Violinist', icon: '🎻' },
  { value: 'cello_player', label: 'Cello Player', icon: '🎻' },
  { value: 'rapper', label: 'Rapper', icon: '🎤' },
  { value: 'magician', label: 'Magician', icon: '🎩' },
  { value: 'circus_performer', label: 'Circus Performer', icon: '🎪' },
  { value: 'vr_artist', label: 'VR Artist', icon: '🥽' },
  { value: 'fortune_teller', label: 'Fortune Teller', icon: '🔮' },
  { value: 'juggler', label: 'Juggler', icon: '🤹' },
  { value: 'caricature_artist', label: 'Caricature Artist', icon: '🎨' },
  { value: 'comedian', label: 'Comedian', icon: '😂' },
  { value: 'pyrotechnics', label: 'Pyrotechnics', icon: '🎆' },
  { value: 'live_painter', label: 'Live Painter', icon: '🖼️' },
  { value: 'photographer', label: 'Photographer', icon: '📸' },
  { value: 'lighting_specialist', label: 'Lighting Specialist', icon: '💡' },
];

export default function TalentSetup() {
  const urlParams = new URLSearchParams(window.location.search);
  const isEdit = urlParams.get('edit') === 'true';

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [existingProfile, setExistingProfile] = useState(null);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [profileVideo, setProfileVideo] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({ stage_name: '', talent_category: '', bio: '', hourly_rate: '', minimum_hours: '1', location_city: '', location_radius: '25', experience_years: '', specialties: [], profile_photo: '', media_gallery: [], equipment_provided: [], last_minute_available: false, social_links: { instagram: '', tiktok: '', facebook: '', youtube: '', website: '' } });
  const [specialtyInput, setSpecialtyInput] = useState('');

  useEffect(() => { loadUser(); }, []);

  const loadUser = async () => {
    const currentUser = await base44.auth.me();
    setUser(currentUser);
    const profiles = await base44.entities.TalentProfile.filter({ user_id: currentUser.id });
    if (profiles.length > 0) {
      const profile = profiles[0];
      setExistingProfile(profile);
      setFormData({ stage_name: profile.stage_name || '', talent_category: profile.talent_category || '', bio: profile.bio || '', hourly_rate: profile.hourly_rate?.toString() || '', minimum_hours: profile.minimum_hours?.toString() || '1', location_city: profile.location_city || '', location_radius: profile.location_radius?.toString() || '25', experience_years: profile.experience_years?.toString() || '', specialties: profile.specialties || [], profile_photo: profile.profile_photo || '', profile_video: profile.profile_video || '', media_gallery: profile.media_gallery || [], equipment_provided: profile.equipment_provided || [], last_minute_available: profile.last_minute_available || false, social_links: { instagram: profile.social_links?.instagram || '', tiktok: profile.social_links?.tiktok || '', facebook: profile.social_links?.facebook || '', youtube: profile.social_links?.youtube || '', website: profile.social_links?.website || '' } });
      setProfileVideo(profile.profile_video || null);
      setProfilePhoto(profile.profile_photo);
    } else if (currentUser.preferred_city) {
      setFormData(prev => ({ ...prev, location_city: currentUser.preferred_city }));
    }
    setInitialLoading(false);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setProfilePhoto(file_url);
    setFormData(prev => ({ ...prev, profile_photo: file_url }));
    setUploading(false);
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setProfileVideo(file_url);
    setFormData(prev => ({ ...prev, profile_video: file_url }));
    setUploading(false);
  };

  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    const results = await Promise.all(files.map(file => base44.integrations.Core.UploadFile({ file })));
    setFormData(prev => ({ ...prev, media_gallery: [...prev.media_gallery, ...results.map(r => r.file_url)].slice(0, 25) }));
    setUploading(false);
  };

  const removeFromGallery = (index) => setFormData(prev => ({ ...prev, media_gallery: prev.media_gallery.filter((_, i) => i !== index) }));
  const addSpecialty = () => { if (specialtyInput.trim() && !formData.specialties.includes(specialtyInput.trim())) { setFormData(prev => ({ ...prev, specialties: [...prev.specialties, specialtyInput.trim()] })); setSpecialtyInput(''); } };
  const removeSpecialty = (index) => setFormData(prev => ({ ...prev, specialties: prev.specialties.filter((_, i) => i !== index) }));

  const handleSubmit = async () => {
    setLoading(true);
    const profileData = { ...formData, user_id: user.id, hourly_rate: parseFloat(formData.hourly_rate), minimum_hours: parseInt(formData.minimum_hours), location_radius: parseInt(formData.location_radius), experience_years: formData.experience_years ? parseInt(formData.experience_years) : null, last_minute_available: !!formData.last_minute_available, is_available: true };
    let savedProfile;
    if (existingProfile) {
      savedProfile = await base44.entities.TalentProfile.update(existingProfile.id, profileData);
    } else {
      savedProfile = await base44.entities.TalentProfile.create({ ...profileData, is_verified: false, average_rating: null, total_reviews: 0, total_bookings: 0 });
    }
    const profileId = savedProfile?.id || existingProfile?.id;
    window.location.href = profileId ? `/TalentProfile?id=${profileId}` : createPageUrl('Dashboard');
  };

  if (initialLoading) return (<div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 -left-40 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-2xl">
        <div className="text-center mb-8">
          <Logo className="h-12 w-auto mx-auto mb-4" />
          <h1 className="text-xl font-bold">{existingProfile ? 'Edit' : 'Create'} Your Profile</h1>
          {existingProfile && (
            <Link to={`/TalentProfile?id=${existingProfile.id}`} className="inline-flex items-center gap-1.5 mt-3 text-sm text-purple-300 hover:text-purple-200 transition-colors">
              <Eye className="w-4 h-4" />
              Preview my profile as customers see it
            </Link>
          )}
        </div>

        <div className="flex gap-2 mb-10">{[1, 2, 3, 4, 5].map(i => (<div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= step ? 'bg-gradient-to-r from-orange-500 to-purple-500' : 'bg-slate-800'}`} />))}</div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="text-center mb-6"><Music className="w-10 h-10 text-orange-400 mx-auto mb-3" /><h2 className="text-xl font-semibold">Basic Info</h2></div>
              <div className="space-y-4">
                <div><Label className="text-slate-400">Stage Name</Label><Input value={formData.stage_name} onChange={(e) => setFormData({ ...formData, stage_name: e.target.value })} placeholder="e.g. DJ Shadow" className="bg-slate-900 border-slate-800 h-12 mt-2" /></div>
                <div><Label className="text-slate-400">Category</Label>
                  <Select value={formData.talent_category} onValueChange={(value) => setFormData({ ...formData, talent_category: value })}>
                    <SelectTrigger className="bg-slate-900 border-slate-800 h-12 mt-2"><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 max-h-64">{TALENT_CATEGORIES.map((cat) => (<SelectItem key={cat.value} value={cat.value}><span className="flex items-center gap-2"><span>{cat.icon}</span><span>{cat.label}</span></span></SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div><Label className="text-slate-400">Years of Experience</Label><Input type="number" value={formData.experience_years} onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })} placeholder="e.g. 5" className="bg-slate-900 border-slate-800 h-12 mt-2" /></div>
              </div>
              <div className="flex justify-end pt-4"><Button onClick={() => setStep(2)} disabled={!formData.stage_name || !formData.talent_category} className="bg-gradient-to-r from-orange-600 to-orange-500">Continue<ChevronRight className="w-4 h-4 ml-2" /></Button></div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="text-center mb-6"><Star className="w-10 h-10 text-purple-400 mx-auto mb-3" /><h2 className="text-xl font-semibold">Your Story</h2></div>
              <div className="space-y-4">
                <div><Label className="text-slate-400">Bio</Label><Textarea value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} placeholder="Tell seekers about yourself..." className="bg-slate-900 border-slate-800 h-32 mt-2 resize-none" /></div>
                <div><Label className="text-slate-400">Specialties</Label>
                  <div className="flex gap-2 mt-2"><Input value={specialtyInput} onChange={(e) => setSpecialtyInput(e.target.value)} placeholder="e.g. Wedding DJ" className="bg-slate-900 border-slate-800" onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialty())} /><Button onClick={addSpecialty} variant="outline" className="border-slate-700">Add</Button></div>
                  {formData.specialties.length > 0 && (<div className="flex flex-wrap gap-2 mt-3">{formData.specialties.map((s, i) => (<span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">{s}<button onClick={() => removeSpecialty(i)} className="hover:text-white"><X className="w-3 h-3" /></button></span>))}</div>)}
                </div>

                <div>
                  <Label className="text-slate-400">Equipment You Provide</Label>
                  <p className="text-xs text-slate-500 mt-1 mb-3">Let bookers know what you bring to the event</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'sound_system', label: '🔊 Sound System' },
                      { value: 'lighting', label: '💡 Lighting' },
                      { value: 'microphones', label: '🎤 Microphones' },
                      { value: 'back_lights', label: '🔦 Back Lights' },
                      { value: 'fog_machine', label: '🌫️ Fog Machine' },
                      { value: 'stage', label: '🎪 Stage' },
                    ].map(eq => {
                      const active = formData.equipment_provided.includes(eq.value);
                      return (
                        <button
                          key={eq.value}
                          type="button"
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            equipment_provided: active
                              ? prev.equipment_provided.filter(e => e !== eq.value)
                              : [...prev.equipment_provided, eq.value]
                          }))}
                          className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                            active
                              ? 'bg-orange-600 border-orange-500 text-white'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600'
                          }`}
                        >
                          {eq.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-4"><Button variant="outline" onClick={() => setStep(1)} className="flex-1 bg-transparent border-slate-700"><ChevronLeft className="w-4 h-4 mr-2" />Back</Button><Button onClick={() => setStep(3)} className="flex-1 bg-gradient-to-r from-orange-600 to-orange-500">Continue<ChevronRight className="w-4 h-4 ml-2" /></Button></div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="text-center mb-6"><Banknote className="w-10 h-10 text-green-400 mx-auto mb-3" /><h2 className="text-xl font-semibold">Pricing & Location</h2></div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><Label className="text-slate-400">Hourly Rate (£)</Label><Input type="number" value={formData.hourly_rate} onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })} placeholder="150" className="bg-slate-900 border-slate-800 h-12 mt-2" /></div>
                <div><Label className="text-slate-400">Min Hours</Label><Select value={formData.minimum_hours} onValueChange={(value) => setFormData({ ...formData, minimum_hours: value })}><SelectTrigger className="bg-slate-900 border-slate-800 h-12 mt-2"><SelectValue /></SelectTrigger><SelectContent className="bg-slate-900 border-slate-800">{[1,2,3,4,5,6].map(h => (<SelectItem key={h} value={h.toString()}>{h}h</SelectItem>))}</SelectContent></Select></div>
                <div><Label className="text-slate-400">City</Label><Input value={formData.location_city} onChange={(e) => setFormData({ ...formData, location_city: e.target.value })} placeholder="London" className="bg-slate-900 border-slate-800 h-12 mt-2" /></div>
                <div><Label className="text-slate-400">Travel Radius</Label><Select value={formData.location_radius} onValueChange={(value) => setFormData({ ...formData, location_radius: value })}><SelectTrigger className="bg-slate-900 border-slate-800 h-12 mt-2"><SelectValue /></SelectTrigger><SelectContent className="bg-slate-900 border-slate-800">{[10,25,50,100,200].map(r => (<SelectItem key={r} value={r.toString()}>{r} miles</SelectItem>))}</SelectContent></Select></div>
              </div>

              <div
                onClick={() => setFormData(prev => ({ ...prev, last_minute_available: !prev.last_minute_available }))}
                className={`flex items-center justify-between p-5 rounded-2xl border-2 cursor-pointer transition-all ${formData.last_minute_available ? 'border-orange-500 bg-orange-500/10' : 'border-slate-700 bg-slate-900 hover:border-slate-600'}`}
              >
                <div className="flex items-start gap-3">
                  <Zap className={`w-5 h-5 mt-0.5 shrink-0 ${formData.last_minute_available ? 'text-orange-400' : 'text-slate-500'}`} />
                  <div>
                    <p className="font-bold text-white">Available for last-minute cover</p>
                    <p className="text-sm text-slate-400 mt-1">Opt in to take on urgent bookings (same-day or within a week). You'll be shown first to seekers needing cover at short notice.</p>
                  </div>
                </div>
                <div className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ml-4 ${formData.last_minute_available ? 'bg-orange-500' : 'bg-slate-700'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${formData.last_minute_available ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </div>
              </div>

              <div className="flex gap-3 pt-4"><Button variant="outline" onClick={() => setStep(2)} className="flex-1 bg-transparent border-slate-700"><ChevronLeft className="w-4 h-4 mr-2" />Back</Button><Button onClick={() => setStep(4)} disabled={!formData.hourly_rate || !formData.location_city} className="flex-1 bg-gradient-to-r from-orange-600 to-orange-500">Continue<ChevronRight className="w-4 h-4 ml-2" /></Button></div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="text-center mb-6"><Camera className="w-10 h-10 text-pink-400 mx-auto mb-3" /><h2 className="text-xl font-semibold">Photos</h2></div>
              <div><Label className="text-slate-400">Profile Photo</Label>
                <div className="mt-3 flex items-center gap-6">
                  <div className="w-24 h-24 rounded-2xl bg-slate-900 border-2 border-dashed border-slate-700 flex items-center justify-center overflow-hidden">{profilePhoto ? <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" /> : <Camera className="w-8 h-8 text-slate-600" />}</div>
                  <label className="cursor-pointer"><input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" /><div className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium">{uploading ? 'Uploading...' : 'Upload'}</div></label>
                </div>
              </div>

              <div>
                <Label className="text-slate-400">Intro Video / Music Sample <span className="text-slate-500 text-xs font-normal">(shown first on your profile)</span></Label>
                <p className="text-xs text-slate-500 mt-1 mb-3">Upload a short video clip or audio file. Supports MP4, MOV, MP3, WAV.</p>
                <div className="flex items-center gap-4">
                  {profileVideo ? (
                    <div className="flex-1">
                      {profileVideo.match(/\.(mp4|mov|webm)/i) ? (
                        <video src={profileVideo} controls className="w-full rounded-xl max-h-40 bg-slate-900" />
                      ) : (
                        <audio src={profileVideo} controls className="w-full" />
                      )}
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-slate-900 border-2 border-dashed border-slate-700 flex items-center justify-center shrink-0">
                      <Music className="w-8 h-8 text-slate-600" />
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <label className="cursor-pointer"><input type="file" accept="video/*,audio/*" onChange={handleVideoUpload} className="hidden" /><div className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium">{uploading ? 'Uploading...' : profileVideo ? 'Replace' : 'Upload'}</div></label>
                    {profileVideo && <button type="button" onClick={() => { setProfileVideo(null); setFormData(prev => ({ ...prev, profile_video: '' })); }} className="px-4 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-lg text-sm">Remove</button>}
                  </div>
                </div>
              </div>

              <div><Label className="text-slate-400">Gallery (up to 25)</Label>
                <div className="mt-3 grid grid-cols-4 gap-3">
                  {formData.media_gallery.map((url, i) => (<div key={i} className="relative aspect-square rounded-lg overflow-hidden group"><img src={url} alt="" className="w-full h-full object-cover" /><button onClick={() => removeFromGallery(i)} className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100"><X className="w-4 h-4" /></button></div>))}
                  {formData.media_gallery.length < 25 && (<label className="aspect-square rounded-lg bg-slate-900 border-2 border-dashed border-slate-700 flex items-center justify-center cursor-pointer hover:border-slate-600"><input type="file" accept="image/*,video/*" multiple onChange={handleGalleryUpload} className="hidden" /><Upload className="w-6 h-6 text-slate-600" /></label>)}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800"><h3 className="font-medium mb-3 flex items-center gap-2"><Check className="w-4 h-4 text-green-400" />Summary</h3><div className="text-sm text-slate-400 space-y-1"><p><span className="text-white">{formData.stage_name}</span> • {TALENT_CATEGORIES.find(c => c.value === formData.talent_category)?.label}</p><p>📍 {formData.location_city} • 💷 £{formData.hourly_rate}/hr</p></div></div>
              <div className="flex gap-3 pt-4"><Button variant="outline" onClick={() => setStep(3)} className="flex-1 bg-transparent border-slate-700"><ChevronLeft className="w-4 h-4 mr-2" />Back</Button><Button onClick={() => setStep(5)} disabled={!formData.profile_photo} className="flex-1 bg-gradient-to-r from-orange-600 via-pink-600 to-purple-600">Continue<ChevronRight className="w-4 h-4 ml-2" /></Button></div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="text-center mb-6"><Share2 className="w-10 h-10 text-blue-400 mx-auto mb-3" /><h2 className="text-xl font-semibold">Social Media & Sharing</h2><p className="text-sm text-slate-400 mt-1">Link your profiles so bookers can see more of your work. Optional.</p></div>
              <div className="space-y-4">
                <div><Label className="text-slate-400">Instagram</Label><Input value={formData.social_links.instagram} onChange={(e) => setFormData({ ...formData, social_links: { ...formData.social_links, instagram: e.target.value } })} placeholder="@yourhandle or instagram.com/yourhandle" className="bg-slate-900 border-slate-800 h-12 mt-2" /></div>
                <div><Label className="text-slate-400">TikTok</Label><Input value={formData.social_links.tiktok} onChange={(e) => setFormData({ ...formData, social_links: { ...formData.social_links, tiktok: e.target.value } })} placeholder="@yourhandle or tiktok.com/@yourhandle" className="bg-slate-900 border-slate-800 h-12 mt-2" /></div>
                <div><Label className="text-slate-400">Facebook</Label><Input value={formData.social_links.facebook} onChange={(e) => setFormData({ ...formData, social_links: { ...formData.social_links, facebook: e.target.value } })} placeholder="facebook.com/yourpage" className="bg-slate-900 border-slate-800 h-12 mt-2" /></div>
                <div><Label className="text-slate-400">YouTube</Label><Input value={formData.social_links.youtube} onChange={(e) => setFormData({ ...formData, social_links: { ...formData.social_links, youtube: e.target.value } })} placeholder="youtube.com/@yourchannel" className="bg-slate-900 border-slate-800 h-12 mt-2" /></div>
                <div><Label className="text-slate-400">Website</Label><Input value={formData.social_links.website} onChange={(e) => setFormData({ ...formData, social_links: { ...formData.social_links, website: e.target.value } })} placeholder="yourdomain.com" className="bg-slate-900 border-slate-800 h-12 mt-2" /></div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-400"><p className="flex items-center gap-2"><Share2 className="w-4 h-4 text-blue-400 shrink-0" />After saving, you'll get a shareable link to your Grab Talent profile — post it on your socials to show you're available for work.</p></div>
              <div className="flex gap-3 pt-4"><Button variant="outline" onClick={() => setStep(4)} className="flex-1 bg-transparent border-slate-700"><ChevronLeft className="w-4 h-4 mr-2" />Back</Button><Button onClick={handleSubmit} disabled={loading} className="flex-1 bg-gradient-to-r from-orange-600 via-pink-600 to-purple-600">{loading ? 'Saving...' : existingProfile ? 'Save Changes' : 'Create Profile'}</Button></div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}