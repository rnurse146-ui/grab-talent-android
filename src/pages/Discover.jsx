import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  X, Heart, Star, MapPin, Banknote, CheckCircle2,
  Filter, ChevronRight, Loader2, List, Calendar
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from '@/components/Logo';

const TALENT_CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'dj', label: 'DJ' },
  { value: 'dancer', label: 'Dancer' },
  { value: 'band', label: 'Band' },
  { value: 'singer', label: 'Singer' },
  { value: 'magician', label: 'Magician' },
  { value: 'comedian', label: 'Comedian' },
  { value: 'photographer', label: 'Photographer' },
  { value: 'guitarist', label: 'Guitarist' },
  { value: 'pianist', label: 'Pianist' },
  { value: 'saxophonist', label: 'Saxophonist' },
  { value: 'violinist', label: 'Violinist' },
  { value: 'rapper', label: 'Rapper' },
  { value: 'circus_performer', label: 'Circus Performer' },
  { value: 'fortune_teller', label: 'Fortune Teller' },
  { value: 'juggler', label: 'Juggler' },
  { value: 'caricature_artist', label: 'Caricature Artist' },
  { value: 'live_painter', label: 'Live Painter' },
  { value: 'lighting_specialist', label: 'Lighting Specialist' },
];

export default function Discover() {
  const [user, setUser] = useState(null);
  const [talents, setTalents] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [swiping, setSwiping] = useState(null);
  const [swipedIds, setSwipedIds] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [maybeCount, setMaybeCount] = useState(0);
  const [eventDate, setEventDate] = useState('');
  const [lastPass, setLastPass] = useState(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [welcomeStep, setWelcomeStep] = useState(1);
  const WELCOME_STEPS = 3;
  const dragX = useRef(0);

  const [filters, setFilters] = useState({
    categories: [],
    maxPrice: '',
    minPrice: '',
    city: '',
    minRating: '',
    verifiedOnly: false,
    equipment: []
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const currentUser = await base44.auth.me();
    setUser(currentUser);
    
    const [history, maybe] = await Promise.all([
      base44.entities.SwipeHistory.filter({ seeker_id: currentUser.id }),
      base44.entities.MaybeList.filter({ seeker_id: currentUser.id })
    ]);
    const swipedSet = new Set(history.map(h => h.talent_profile_id));
    setSwipedIds(swipedSet);
    setMaybeCount(maybe.length);
    
    await loadTalents(swipedSet);
  };

  const loadTalents = async (alreadySwiped = swipedIds) => {
    setLoading(true);
    
    let query = { is_available: true };
    
    const allTalents = await base44.entities.TalentProfile.filter(query, '-average_rating', 50);
    
    let filtered = allTalents.filter(t => !alreadySwiped.has(t.id));

    if (filters.categories.length > 0) {
      filtered = filtered.filter(t => filters.categories.includes(t.talent_category));
    }

    // Filter by availability date
    if (eventDate) {
      const availabilityRecords = await base44.entities.TalentAvailability.filter({});
      const unavailableIds = new Set();
      availabilityRecords.forEach(rec => {
        const blocked = [...(rec.blocked_dates || []), ...(rec.booking_dates || [])];
        if (blocked.includes(eventDate)) {
          unavailableIds.add(rec.talent_profile_id);
        }
      });
      filtered = filtered.filter(t => !unavailableIds.has(t.id));
    }

    if (filters.minPrice) filtered = filtered.filter(t => t.hourly_rate >= parseFloat(filters.minPrice));
    if (filters.maxPrice) filtered = filtered.filter(t => t.hourly_rate <= parseFloat(filters.maxPrice));
    if (filters.city) filtered = filtered.filter(t => t.location_city?.toLowerCase().includes(filters.city.toLowerCase()));
    if (filters.minRating) filtered = filtered.filter(t => (t.average_rating || 0) >= parseFloat(filters.minRating));
    if (filters.verifiedOnly) filtered = filtered.filter(t => t.is_verified === true);
    if (filters.equipment.length > 0) {
      filtered = filtered.filter(t =>
        filters.equipment.every(eq => (t.equipment_provided || []).includes(eq))
      );
    }
    
    setTalents(filtered);
    setCurrentIndex(0);
    setLoading(false);
  };

  const handleUndo = async () => {
    if (!lastPass) return;
    await base44.entities.SwipeHistory.delete(lastPass.historyId);
    if (lastPass.maybeId) {
      await base44.entities.MaybeList.delete(lastPass.maybeId);
      setMaybeCount(prev => Math.max(0, prev - 1));
    }
    setSwipedIds(prev => { const next = new Set(prev); next.delete(lastPass.talent.id); return next; });
    setCurrentIndex(prev => prev - 1);
    setLastPass(null);
  };

  const handleDragEnd = (event, info) => {
    const threshold = 80;
    if (info.offset.x > threshold) {
      handleSwipe('right');
    } else if (info.offset.x < -threshold) {
      handleSwipe('left');
    }
  };

  const handleSwipe = async (direction) => {
    if (!talents[currentIndex]) return;
    const talent = talents[currentIndex];
    setSwiping(direction);

    const historyRecord = await base44.entities.SwipeHistory.create({
      seeker_id: user.id,
      talent_profile_id: talent.id,
      action: direction === 'right' ? 'maybe' : 'pass'
    });

    let maybeId = null;
    if (direction === 'right') {
      const maybeRecord = await base44.entities.MaybeList.create({
        seeker_id: user.id,
        talent_profile_id: talent.id,
        talent_stage_name: talent.stage_name,
        talent_category: talent.talent_category,
        talent_photo: talent.profile_photo,
        talent_hourly_rate: talent.hourly_rate,
        talent_rating: talent.average_rating,
        talent_city: talent.location_city
      });
      maybeId = maybeRecord.id;
      setMaybeCount(prev => prev + 1);
    }

    setLastPass({ talent, historyId: historyRecord.id, maybeId });
    setSwipedIds(prev => new Set([...prev, talent.id]));

    setTimeout(() => {
      setSwiping(null);
      setCurrentIndex(prev => prev + 1);
    }, 300);
  };

  const currentTalent = talents[currentIndex];

  const applyFilters = () => {
    loadTalents();
    setShowFilters(false);
  };

  const handleWelcomeStart = () => {
    setShowWelcome(false);
    loadTalents();
  };

  if (showWelcome) return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-black">
        <Link to={createPageUrl('Dashboard')}>
          <Logo className="h-12 w-auto" variant="light" />
        </Link>
        <span className="text-zinc-500 text-sm">{welcomeStep} / {WELCOME_STEPS}</span>
      </div>

      {/* Progress bar */}
      <div className="flex gap-1 px-6 pt-4">
        {[1,2,3].map(s => (
          <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-300 ${s <= welcomeStep ? 'bg-white' : 'bg-zinc-800'}`} />
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-6 py-8">

          <AnimatePresence mode="wait">

            {/* Step 1 — Performer Type */}
            {welcomeStep === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.25 }}>
                <div className="text-center mb-8">
                  <div className="text-5xl mb-4">🎭</div>
                  <h1 className="text-2xl font-bold mb-2">What type of performer are you looking for?</h1>
                  <p className="text-zinc-400 text-sm">Select as many as you like, or leave blank to see all.</p>
                </div>
                {filters.categories.length > 0 && (
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-zinc-400">{filters.categories.length} selected</span>
                    <button onClick={() => setFilters(f => ({ ...f, categories: [] }))} className="text-xs text-white underline">Clear all</button>
                  </div>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {TALENT_CATEGORIES.filter(c => c.value !== 'all').map(cat => {
                    const active = filters.categories.includes(cat.value);
                    return (
                      <button
                        key={cat.value}
                        onClick={() => setFilters(f => ({
                          ...f,
                          categories: active
                            ? f.categories.filter(c => c !== cat.value)
                            : [...f.categories, cat.value]
                        }))}
                        className={`px-3 py-3 rounded-xl text-sm font-medium border transition-all text-left flex items-center justify-between gap-1 ${
                          active ? 'bg-white text-black border-white' : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-zinc-500'
                        }`}
                      >
                        <span>{cat.label}</span>
                        {active && <span className="text-black text-xs font-bold">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Step 2 — Location & Budget */}
            {welcomeStep === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.25 }}>
                <div className="text-center mb-8">
                  <div className="text-5xl mb-4">📍</div>
                  <h1 className="text-2xl font-bold mb-2">Where & What's Your Budget?</h1>
                  <p className="text-zinc-400 text-sm">All fields are optional — leave blank to see all.</p>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-semibold text-white mb-2 block">📅 Event Date <span className="text-red-400">*</span></label>
                    <input
                      type="date"
                      value={eventDate}
                      onChange={e => setEventDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className={`w-full bg-zinc-900 rounded-xl px-4 py-3 text-white text-base focus:outline-none h-12 border-2 transition-colors ${eventDate ? 'border-green-500' : 'border-red-500/60 focus:border-red-400'}`}
                    />
                    {eventDate ? (
                      <p className="text-xs text-green-400 mt-1">✓ Only showing performers available on this date</p>
                    ) : (
                      <p className="text-xs text-red-400 mt-1">Required — we need your event date to check talent availability</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-white mb-2 block">📍 Event City</label>
                    <Input
                      value={filters.city}
                      onChange={e => setFilters(f => ({ ...f, city: e.target.value }))}
                      placeholder="e.g. London, Manchester"
                      className="bg-zinc-900 border-zinc-700 text-white h-12 text-base"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-white mb-2 block">💷 Hourly Budget (£)</label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-zinc-500 mb-1">Min</p>
                        <Input type="number" value={filters.minPrice} onChange={e => setFilters(f => ({ ...f, minPrice: e.target.value }))} placeholder="£0" className="bg-zinc-900 border-zinc-700 text-white h-12" />
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 mb-1">Max</p>
                        <Input type="number" value={filters.maxPrice} onChange={e => setFilters(f => ({ ...f, maxPrice: e.target.value }))} placeholder="Any" className="bg-zinc-900 border-zinc-700 text-white h-12" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-white mb-2 block">⭐ Minimum Rating</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[{ value: '', label: 'Any' }, { value: '3', label: '3+' }, { value: '4', label: '4+' }, { value: '4.5', label: '4.5+' }].map(r => (
                        <button
                          key={r.value}
                          onClick={() => setFilters(f => ({ ...f, minRating: r.value }))}
                          className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${
                            filters.minRating === r.value ? 'bg-white text-black border-white' : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-zinc-500'
                          }`}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3 — Equipment & Verification */}
            {welcomeStep === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.25 }}>
                <div className="text-center mb-8">
                  <div className="text-5xl mb-4">🔧</div>
                  <h1 className="text-2xl font-bold mb-2">Equipment & Trust</h1>
                  <p className="text-zinc-400 text-sm">Filter by what the performer brings and verification status.</p>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-semibold text-white mb-3 block">Performer must provide</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 'sound_system', label: '🔊 Sound System' },
                        { value: 'lighting', label: '💡 Lighting' },
                        { value: 'microphones', label: '🎤 Microphones' },
                        { value: 'back_lights', label: '🔦 Back Lights' },
                        { value: 'fog_machine', label: '🌫️ Fog Machine' },
                        { value: 'stage', label: '🎪 Stage' },
                      ].map(eq => {
                        const active = filters.equipment.includes(eq.value);
                        return (
                          <button
                            key={eq.value}
                            onClick={() => setFilters(prev => ({
                              ...prev,
                              equipment: active ? prev.equipment.filter(e => e !== eq.value) : [...prev.equipment, eq.value]
                            }))}
                            className={`px-3 py-3 rounded-xl text-sm font-medium border transition-all ${
                              active ? 'bg-white text-black border-white' : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-zinc-500'
                            }`}
                          >
                            {eq.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div
                    onClick={() => setFilters(f => ({ ...f, verifiedOnly: !f.verifiedOnly }))}
                    className={`flex items-center justify-between p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                      filters.verifiedOnly ? 'border-green-500 bg-green-500/10' : 'border-zinc-700 bg-zinc-900 hover:border-zinc-500'
                    }`}
                  >
                    <div>
                      <p className="font-bold text-white">✅ Verified Performers Only</p>
                      <p className="text-sm text-zinc-400 mt-1">Only show ID-verified talent for extra peace of mind</p>
                    </div>
                    <div className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ml-4 ${
                      filters.verifiedOnly ? 'bg-green-500' : 'bg-zinc-700'
                    }`}>
                      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        filters.verifiedOnly ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

          {/* Navigation */}
          <div className="flex gap-3 mt-10">
            {welcomeStep > 1 && (
              <button
                onClick={() => setWelcomeStep(s => s - 1)}
                className="flex-1 py-3.5 rounded-2xl border border-zinc-700 text-zinc-300 font-semibold hover:border-white hover:text-white transition-colors"
              >
                ← Back
              </button>
            )}
            {welcomeStep < WELCOME_STEPS ? (
              <button
                onClick={() => {
                  if (welcomeStep === 2 && !eventDate) return;
                  setWelcomeStep(s => s + 1);
                }}
                disabled={welcomeStep === 2 && !eventDate}
                className="flex-1 py-3.5 rounded-2xl bg-white text-black font-bold text-base hover:bg-zinc-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleWelcomeStart}
                className="flex-1 py-3.5 rounded-2xl bg-white text-black font-bold text-base hover:bg-zinc-100 transition-colors"
              >
                Find Talent 🎉
              </button>
            )}
          </div>
          <p className="text-center text-zinc-600 text-xs mt-3">All filters are optional — skip to see everyone</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-black sticky top-0 z-10">
        <Link to={createPageUrl('Dashboard')}>
          <Logo className="h-12 w-auto" variant="light" />
        </Link>
        <div className="flex items-center gap-2">
          <Link to={createPageUrl('MaybeList')}>
            <Button variant="outline" size="sm" className="border-zinc-700 bg-transparent relative">
              <List className="w-4 h-4 mr-1" />Maybe List
              {maybeCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-green-500 text-black text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">{maybeCount}</span>
              )}
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="border-zinc-700 bg-transparent">
            <Filter className="w-4 h-4 mr-2" />Filters
          </Button>
        </div>
      </div>

      {/* Event Date Bar */}
      <div className={`flex items-center gap-3 px-6 py-3 border-b ${eventDate ? 'border-zinc-800 bg-zinc-950' : 'border-red-900/50 bg-red-950/30'}`}>
        <Calendar className={`w-4 h-4 shrink-0 ${eventDate ? 'text-zinc-400' : 'text-red-400'}`} />
        <span className={`text-xs shrink-0 ${eventDate ? 'text-zinc-400' : 'text-red-400 font-medium'}`}>Event date:</span>
        <input
          type="date"
          value={eventDate}
          onChange={e => { setEventDate(e.target.value); if (e.target.value) loadTalents(); }}
          className={`bg-transparent rounded-lg px-3 py-1 text-sm text-white focus:outline-none border ${eventDate ? 'border-zinc-700 focus:border-white' : 'border-red-500 focus:border-red-400'}`}
          min={new Date().toISOString().split('T')[0]}
        />
        {eventDate
          ? <span className="text-xs text-green-400">✓ Showing available talent only</span>
          : <span className="text-xs text-red-400">Required to match availability</span>
        }
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-b border-zinc-800 overflow-hidden">
            <div className="p-5 space-y-5">
              {/* Row 1: Category + City */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Category</label>
                  <Select value={filters.category} onValueChange={(v) => setFilters({...filters, category: v})}>
                    <SelectTrigger className="bg-slate-900 border-slate-700"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700">
                      {TALENT_CATEGORIES.map(cat => (<SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">City</label>
                  <Input value={filters.city} onChange={(e) => setFilters({...filters, city: e.target.value})} placeholder="Any location" className="bg-slate-900 border-slate-700" />
                </div>
              </div>

              {/* Row 2: Price range + Rating */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Min Price (£/hr)</label>
                  <Input type="number" value={filters.minPrice} onChange={(e) => setFilters({...filters, minPrice: e.target.value})} placeholder="0" className="bg-slate-900 border-slate-700" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Max Price (£/hr)</label>
                  <Input type="number" value={filters.maxPrice} onChange={(e) => setFilters({...filters, maxPrice: e.target.value})} placeholder="Any" className="bg-slate-900 border-slate-700" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Min Rating ⭐</label>
                  <Select value={filters.minRating} onValueChange={(v) => setFilters({...filters, minRating: v})}>
                    <SelectTrigger className="bg-slate-900 border-slate-700"><SelectValue placeholder="Any" /></SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700">
                      <SelectItem value={null}>Any</SelectItem>
                      <SelectItem value="3">3+ ⭐</SelectItem>
                      <SelectItem value="4">4+ ⭐</SelectItem>
                      <SelectItem value="4.5">4.5+ ⭐</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Verified toggle */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setFilters({...filters, verifiedOnly: !filters.verifiedOnly})}
                  className={`w-11 h-6 rounded-full transition-colors ${
                    filters.verifiedOnly ? 'bg-green-500' : 'bg-slate-700'
                  } relative`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    filters.verifiedOnly ? 'translate-x-5' : 'translate-x-0.5'
                  }`} />
                </button>
                <label className="text-sm text-slate-300">Verified performers only</label>
              </div>

              {/* Equipment */}
              <div>
                <label className="text-xs text-slate-400 mb-2 block">Performer must provide equipment</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'sound_system', label: '🔊 Sound System' },
                    { value: 'lighting', label: '💡 Lighting' },
                    { value: 'microphones', label: '🎤 Microphones' },
                    { value: 'back_lights', label: '🔦 Back Lights' },
                    { value: 'fog_machine', label: '🌫️ Fog Machine' },
                    { value: 'stage', label: '🎪 Stage' },
                  ].map(eq => {
                    const active = filters.equipment.includes(eq.value);
                    return (
                      <button
                        key={eq.value}
                        onClick={() => setFilters(prev => ({
                          ...prev,
                          equipment: active
                            ? prev.equipment.filter(e => e !== eq.value)
                            : [...prev.equipment, eq.value]
                        }))}
                        className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-all ${
                          active
                            ? 'bg-purple-600 border-purple-500 text-white'
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
                        }`}
                      >
                        {eq.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={applyFilters} className="flex-1 bg-purple-600 hover:bg-purple-500">Apply Filters</Button>
                <Button
                  onClick={() => {
                    setFilters({ categories: [], maxPrice: '', minPrice: '', city: '', minRating: '', verifiedOnly: false, equipment: [] });
                    setShowFilters(false);
                    loadTalents(swipedIds);
                  }}
                  variant="outline"
                  className="border-slate-700 text-slate-400"
                >
                  Reset
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {!eventDate ? (
          <div className="text-center max-w-xs">
            <div className="w-24 h-24 rounded-full bg-red-900/30 border-2 border-red-700/50 flex items-center justify-center mx-auto mb-5">
              <Calendar className="w-10 h-10 text-red-400" />
            </div>
            <h2 className="text-xl font-bold mb-2">Set Your Event Date First</h2>
            <p className="text-zinc-400 text-sm mb-6">We need your event date to only show you talent that's actually available on that day — no nasty double-bookings.</p>
            <p className="text-xs text-zinc-500">👆 Pick a date in the bar above to start discovering talent</p>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            <p className="text-slate-400">Finding talent...</p>
          </div>
        ) : !currentTalent ? (
          <div className="text-center">
            <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <Star className="w-10 h-10 text-slate-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No more talent to show</h2>
            <p className="text-slate-400 mb-6">Check back later or adjust your filters</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => setShowFilters(true)} variant="outline" className="border-slate-700">Change Filters</Button>
              <Link to={createPageUrl('MaybeList')}><Button className="bg-purple-600 hover:bg-purple-500">View Maybe List</Button></Link>
            </div>
          </div>
        ) : (
          <>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTalent.id}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ 
                  scale: 1, opacity: 1,
                  x: swiping === 'left' ? -400 : swiping === 'right' ? 400 : 0,
                  rotate: swiping === 'left' ? -15 : swiping === 'right' ? 15 : 0
                }}
                exit={{ scale: 0.95, opacity: 0 }}
                drag={swiping ? false : 'x'}
                dragConstraints={{ left: -20, right: 20 }}
                dragElastic={0.8}
                onDragEnd={handleDragEnd}
                transition={{ duration: 0.3 }}
                className="w-full max-w-sm cursor-grab active:cursor-grabbing select-none"
                style={{ touchAction: 'none' }}
              >
                <div className="bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
                  <div className="relative aspect-[3/4]">
                    {currentTalent.profile_video && currentTalent.profile_video.match(/\.(mp4|mov|webm)/i) ? (
                      <video src={currentTalent.profile_video} autoPlay muted loop playsInline className="w-full h-full object-cover" poster={currentTalent.profile_photo || undefined} />
                    ) : currentTalent.profile_photo ? (
                      <img src={currentTalent.profile_photo} alt={currentTalent.stage_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-900 to-orange-900 flex items-center justify-center">
                        <span className="text-6xl">🎭</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    {currentTalent.is_verified && (
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-green-500 text-white"><CheckCircle2 className="w-3 h-3 mr-1" />Verified</Badge>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <h2 className="text-2xl font-bold mb-1">{currentTalent.stage_name}</h2>
                      <p className="text-purple-300 text-sm font-medium capitalize mb-3">{currentTalent.talent_category?.replace(/_/g, ' ')}</p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="secondary" className="bg-white/20 text-white"><MapPin className="w-3 h-3 mr-1" />{currentTalent.location_city}</Badge>
                        <Badge variant="secondary" className="bg-white/20 text-white"><Banknote className="w-3 h-3 mr-1" />£{currentTalent.hourly_rate}/hr</Badge>
                        {currentTalent.average_rating && (
                          <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-300"><Star className="w-3 h-3 mr-1 fill-yellow-300" />{currentTalent.average_rating.toFixed(1)}</Badge>
                        )}
                      </div>
                      {currentTalent.bio && (<p className="text-sm text-slate-300 line-clamp-2">{currentTalent.bio}</p>)}
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center gap-6 mt-8">
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleSwipe('left')} className="w-16 h-16 rounded-full bg-zinc-900 border-2 border-zinc-700 flex items-center justify-center hover:border-red-500 hover:bg-red-500/20 transition-colors">
                <X className="w-8 h-8 text-red-400" />
              </motion.button>
              <Link to={createPageUrl('BookTalent') + `?talent_id=${currentTalent.id}${eventDate ? '&event_date=' + eventDate : ''}`}>
                <motion.button whileTap={{ scale: 0.9 }} className="w-12 h-12 rounded-full bg-zinc-900 border-2 border-zinc-700 flex items-center justify-center hover:border-white transition-colors">
                  <ChevronRight className="w-6 h-6 text-white" />
                </motion.button>
              </Link>
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleSwipe('right')} className="w-16 h-16 rounded-full bg-zinc-900 border-2 border-zinc-700 flex items-center justify-center hover:border-green-500 hover:bg-green-500/20 transition-colors">
                <Heart className="w-8 h-8 text-green-400" />
              </motion.button>
            </div>
            {/* Undo button */}
            {lastPass && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={handleUndo}
                className="mt-4 flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-300 hover:border-white hover:text-white text-sm transition-colors"
              >
                ↩ Undo last swipe
              </motion.button>
            )}
            {!lastPass && <div className="h-10 mt-4" />}
            <p className="text-zinc-500 text-sm mt-2">{currentIndex + 1} of {talents.length} talents</p>
          </>
        )}
      </div>
    </div>
  );
}