import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Loader2, X, Handshake, SlidersHorizontal, MessageSquare, Users, Eye } from 'lucide-react';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { cityMatches, normalizeCity } from '@/lib/cityMatch';
import AvailabilitySwitch from '@/components/network/AvailabilitySwitch';
import NetworkGate from '@/components/network/NetworkGate';
import NetworkFilters from '@/components/network/NetworkFilters';
import NetworkDeckCard from '@/components/network/NetworkDeckCard';
import NetworkMatchCelebration from '@/components/network/NetworkMatchCelebration';

const burst = () => confetti({ particleCount: 140, spread: 80, origin: { y: 0.55 } });

// Talent Network — performers connecting with performers for gigs and
// collaborations. Completely separate from the hire deck on Discover.
export default function TalentNetwork() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [talents, setTalents] = useState([]);
  const [index, setIndex] = useState(0);
  const [filters, setFilters] = useState({ categories: [], cities: [] });
  const [showFilters, setShowFilters] = useState(false);
  const [started, setStarted] = useState(false);
  const [swiping, setSwiping] = useState(null);
  const [busy, setBusy] = useState(false);
  const [celebration, setCelebration] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadDeck = async (myProfile, currentUser, activeFilters) => {
    const [swipes, all] = await Promise.all([
      base44.entities.NetworkSwipe.filter({ swiper_user_id: currentUser.id }),
      base44.entities.TalentProfile.filter({ network_open: true }, '-average_rating', 200)
    ]);
    const answered = new Set((swipes || []).map(s => s.target_profile_id));
    let list = (all || []).filter(t => t.id !== myProfile.id && !answered.has(t.id));

    if (activeFilters.categories.length > 0) {
      list = list.filter(t => {
        const cats = t.talent_categories?.length ? t.talent_categories : [t.talent_category];
        return activeFilters.categories.some(c => cats.includes(c));
      });
    }
    const cities = activeFilters.cities.map(c => c.trim()).filter(Boolean);
    if (cities.length > 0) {
      list = list.filter(t => cities.some(city => cityMatches(t, normalizeCity(city), city)));
    }

    setTalents(list);
    setIndex(0);
  };

  // A match made while they were away is celebrated the next time they open the tab
  const checkCelebrations = async (currentUser) => {
    const matches = await base44.entities.NetworkMatch.filter({
      $or: [{ user_a_id: currentUser.id }, { user_b_id: currentUser.id }]
    });
    const unseen = (matches || []).find(m =>
      m.user_a_id === currentUser.id ? !m.a_celebrated : !m.b_celebrated
    );
    if (!unseen) return;
    const iAmA = unseen.user_a_id === currentUser.id;
    const otherProfile = await base44.entities.TalentProfile
      .get(iAmA ? unseen.profile_b_id : unseen.profile_a_id)
      .catch(() => null);
    setCelebration({ name: otherProfile?.stage_name || 'A performer', matchId: unseen.id, iAmA });
    burst();
  };

  const loadData = async () => {
    setLoading(true);
    const currentUser = await base44.auth.me().catch(e => (e.status === 401 ? null : Promise.reject(e)));
    if (!currentUser) {
      base44.auth.redirectToLogin('/TalentNetwork');
      return;
    }
    setUser(currentUser);
    const mine = await base44.entities.TalentProfile.filter({ user_id: currentUser.id });
    const myProfile = mine?.[0] || null;
    setProfile(myProfile);
    setPreviewOpen(!!myProfile?.network_open);
    if (myProfile?.network_open) await loadDeck(myProfile, currentUser, filters);
    setLoading(false);
    await checkCelebrations(currentUser);
  };

  const toggleOpen = async () => {
    if (!profile || busy) return;
    const next = !profile.network_open;
    setBusy(true);
    try {
      await base44.entities.TalentProfile.update(profile.id, { network_open: next });
      const updated = { ...profile, network_open: next };
      setProfile(updated);
      if (next) {
        setPreviewOpen(true);
        await loadDeck(updated, user, filters);
        toast({ title: "You're in Talent Network", description: 'Other performers can now find you and request collabs.' });
      } else {
        setTalents([]);
        toast({ title: 'Talent Network switched off', description: 'You are hidden from other talent and cannot send requests.' });
      }
    } finally {
      setBusy(false);
    }
  };

  const closeCelebration = async () => {
    const current = celebration;
    setCelebration(null);
    if (!current?.matchId) return;
    await base44.entities.NetworkMatch
      .update(current.matchId, current.iAmA ? { a_celebrated: true } : { b_celebrated: true })
      .catch(() => {});
  };

  const handleSwipe = async (direction) => {
    const talent = talents[index];
    if (!talent || busy) return;
    setBusy(true);
    setSwiping(direction);
    try {
      const res = await base44.functions.invoke('networkSwipe', {
        target_profile_id: talent.id,
        action: direction === 'right' ? 'collab' : 'pass'
      });
      if (direction === 'right') {
        if (res.data?.matched) {
          burst();
          setCelebration({ name: talent.stage_name });
        } else {
          toast({ title: 'Request sent', description: `We'll let you know when ${talent.stage_name} wants to collab.` });
        }
      }
    } catch (error) {
      setSwiping(null);
      setBusy(false);
      toast({
        title: 'That did not save',
        description: error?.response?.data?.error || error.message,
        variant: 'destructive'
      });
      return;
    }
    setTimeout(() => {
      setSwiping(null);
      setIndex(i => i + 1);
      setBusy(false);
    }, 280);
  };

  // Everyone lands on the search step first — pick what you're after before the deck appears
  const startBrowsing = async (activeFilters) => {
    setPreviewOpen(false);
    setShowFilters(false);
    setStarted(true);
    await loadDeck(profile, user, activeFilters);
  };

  const skipSearch = async () => {
    const empty = { categories: [], cities: [] };
    setFilters(empty);
    await startBrowsing(empty);
  };

  const currentTalent = talents[index];
  const filterCount = filters.categories.length + filters.cities.length;

  return (
    <div className="min-h-[100dvh] bg-black text-white pb-28 md:pb-10">
      <div className="flex items-center justify-between px-6 pb-4 pt-[calc(env(safe-area-inset-top)+1rem)] border-b border-zinc-800 bg-black sticky top-0 md:top-14 z-10">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            aria-label="Back"
            className="p-3 min-h-[44px] min-w-[44px] -ml-2 rounded-full bg-white text-black active:scale-90 transition-transform"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <Link to="/Dashboard">
            <Logo className="h-12 w-auto" variant="light" />
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/Messages">
            <Button variant="outline" className="h-11 text-base border-zinc-700 bg-transparent">
              <MessageSquare className="w-5 h-5 mr-2" />Chats
            </Button>
          </Link>
          {profile?.network_open && started && (
            <Button
              variant="outline"
              onClick={() => setShowFilters(v => !v)}
              className={`h-11 text-base bg-transparent ${filterCount > 0 ? 'border-purple-500' : 'border-zinc-700'}`}
            >
              <SlidersHorizontal className="w-5 h-5 mr-2" />Filters
              {filterCount > 0 && (
                <span className="ml-1 bg-purple-500 text-white text-xs font-bold px-1.5 rounded-full">{filterCount}</span>
              )}
            </Button>
          )}
        </div>
      </div>

      <div className="px-6 pt-4 pb-2">
        <div className="flex items-center gap-2 text-purple-300">
          <Users className="w-4 h-4" />
          <h1 className="text-lg font-bold uppercase tracking-wide">Talent Network</h1>
        </div>
        <p className="text-sm text-zinc-400 mt-1">
          Performers connecting with performers — separate from being hired.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center gap-4 py-20">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          <p className="text-zinc-400">Loading Talent Network...</p>
        </div>
      ) : !profile ? (
        <NetworkGate hasProfile={false} />
      ) : !profile.network_open ? (
        <NetworkGate hasProfile onEnable={toggleOpen} busy={busy} />
      ) : (
        <>
          <div className="px-6 pt-3">
            <AvailabilitySwitch on={profile.network_open} onChange={toggleOpen} busy={busy} />
          </div>

          {!started ? (
            <div className="max-w-lg mx-auto">
              <div className="px-6 pt-6 text-center">
                <h2 className="text-2xl font-extrabold mb-1">Who are you looking for?</h2>
                <p className="text-base text-zinc-400">
                  Pick what you want to work with and where, then search.
                </p>
              </div>
              <NetworkFilters
                firstStep
                filters={filters}
                setFilters={setFilters}
                onSearch={() => startBrowsing(filters)}
                onSkip={skipSearch}
              />
            </div>
          ) : (
          <>
          {showFilters && (
            <NetworkFilters
              filters={filters}
              setFilters={setFilters}
              onSearch={async () => {
                setShowFilters(false);
                await loadDeck(profile, user, filters);
              }}
              onClose={() => setShowFilters(false)}
            />
          )}

          <div className="flex flex-col items-center px-4 pt-6">
            {previewOpen ? (
              <div className="w-full max-w-sm">
                <div className="flex items-center justify-center gap-2 mb-3 text-sm font-bold uppercase tracking-wide text-purple-300">
                  <Eye className="w-4 h-4" /> Your card — how other talent sees you
                </div>
                <NetworkDeckCard
                  talent={profile}
                  onSwipe={() => setPreviewOpen(false)}
                  swiping={null}
                  disabled={false}
                  footnote="This is your public talent card"
                />
                <Button
                  onClick={() => setPreviewOpen(false)}
                  className="mt-6 w-full h-12 text-base bg-white text-black hover:bg-zinc-200 font-bold"
                >
                  Start browsing performers
                </Button>
              </div>
            ) : !currentTalent ? (
              <div className="text-center max-w-sm py-10">
                <div className="w-20 h-20 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-9 h-9 text-zinc-600" />
                </div>
                <h2 className="text-2xl font-bold mb-2">No performers to show</h2>
                <p className="text-base text-zinc-400 mb-6">
                  Try another city or category — or check back as more talent joins the network.
                </p>
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(true)}
                  className="border-zinc-700 bg-transparent text-white hover:bg-zinc-900"
                >
                  <SlidersHorizontal className="w-4 h-4 mr-2" />Change filters
                </Button>
              </div>
            ) : (
              <>
                <AnimatePresence mode="wait">
                  <NetworkDeckCard
                    key={currentTalent.id}
                    talent={currentTalent}
                    onSwipe={handleSwipe}
                    swiping={swiping}
                    disabled={busy}
                  />
                </AnimatePresence>

                <div className="flex items-center gap-10 mt-8">
                  <div className="flex flex-col items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSwipe('left')}
                      disabled={busy}
                      className="w-14 h-14 rounded-full bg-zinc-900 border-2 border-zinc-700 flex items-center justify-center hover:border-red-500 hover:bg-red-500/20 transition-colors disabled:opacity-40"
                    >
                      <X className="w-7 h-7 text-red-400" />
                    </button>
                    <span className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Not now</span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSwipe('right')}
                      disabled={busy}
                      className="w-16 h-16 rounded-full bg-green-500 border-2 border-green-400 flex items-center justify-center hover:bg-green-400 transition-colors disabled:opacity-40"
                    >
                      <Handshake className="w-8 h-8 text-black" />
                    </button>
                    <span className="text-sm font-semibold uppercase tracking-wide text-zinc-200">Let's collab</span>
                  </div>
                </div>

                <p className="text-sm text-zinc-400 mt-4">{index + 1} of {talents.length}</p>
              </>
            )}
          </div>
          </>
          )}
        </>
      )}

      <NetworkMatchCelebration name={celebration?.name} onClose={closeCelebration} />
    </div>
  );
}