import React, { useState, useEffect } from 'react';
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
  Filter, ChevronRight, Loader2
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
  
  const [filters, setFilters] = useState({
    category: 'all',
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
    
    const history = await base44.entities.SwipeHistory.filter({ seeker_id: currentUser.id });
    const swipedSet = new Set(history.map(h => h.talent_profile_id));
    setSwipedIds(swipedSet);
    
    await loadTalents(swipedSet);
  };

  const loadTalents = async (alreadySwiped = swipedIds) => {
    setLoading(true);
    
    let query = { is_available: true };
    if (filters.category !== 'all') {
      query.talent_category = filters.category;
    }
    
    const allTalents = await base44.entities.TalentProfile.filter(query, '-average_rating', 50);
    
    let filtered = allTalents.filter(t => !alreadySwiped.has(t.id));

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

  const handleSwipe = async (direction) => {
    if (!talents[currentIndex]) return;
    
    const talent = talents[currentIndex];
    setSwiping(direction);
    
    await base44.entities.SwipeHistory.create({
      seeker_id: user.id,
      talent_profile_id: talent.id,
      action: direction === 'right' ? 'maybe' : 'pass'
    });
    
    if (direction === 'right') {
      await base44.entities.MaybeList.create({
        seeker_id: user.id,
        talent_profile_id: talent.id,
        talent_stage_name: talent.stage_name,
        talent_category: talent.talent_category,
        talent_photo: talent.profile_photo,
        talent_hourly_rate: talent.hourly_rate,
        talent_rating: talent.average_rating,
        talent_city: talent.location_city
      });
    }
    
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

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <Link to={createPageUrl('Dashboard')}>
          <Logo className="h-8 w-auto" />
        </Link>
        <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="border-slate-700 bg-transparent">
          <Filter className="w-4 h-4 mr-2" />Filters
        </Button>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-b border-slate-800 overflow-hidden">
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
                    setFilters({ category: 'all', maxPrice: '', minPrice: '', city: '', minRating: '', verifiedOnly: false, equipment: [] });
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
        {loading ? (
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
                  x: swiping === 'left' ? -300 : swiping === 'right' ? 300 : 0,
                  rotate: swiping === 'left' ? -10 : swiping === 'right' ? 10 : 0
                }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-sm"
              >
                <div className="bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
                  <div className="relative aspect-[3/4]">
                    {currentTalent.profile_photo ? (
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
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleSwipe('left')} className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center hover:border-red-500 hover:bg-red-500/20 transition-colors">
                <X className="w-8 h-8 text-red-400" />
              </motion.button>
              <Link to={createPageUrl('TalentProfile') + `?id=${currentTalent.id}`}>
                <motion.button whileTap={{ scale: 0.9 }} className="w-12 h-12 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center hover:border-purple-500 transition-colors">
                  <ChevronRight className="w-6 h-6 text-purple-400" />
                </motion.button>
              </Link>
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleSwipe('right')} className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center hover:border-green-500 hover:bg-green-500/20 transition-colors">
                <Heart className="w-8 h-8 text-green-400" />
              </motion.button>
            </div>
            <p className="text-slate-500 text-sm mt-4">{currentIndex + 1} of {talents.length} talents</p>
          </>
        )}
      </div>
    </div>
  );
}