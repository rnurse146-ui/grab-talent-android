import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Search, Star, Loader2 } from 'lucide-react';
import Logo from '@/components/Logo';
import { Link } from 'react-router-dom';
import SeekerDashboard from '@/components/dashboard/SeekerDashboard';
import TalentDashboard from '@/components/dashboard/TalentDashboard';
import HelpChat from '@/components/HelpChat';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [talentProfile, setTalentProfile] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [maybeList, setMaybeList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState(null); // 'seeker' | 'talent'

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const currentUser = await base44.auth.me();
    setUser(currentUser);

    if (!currentUser.onboarding_complete) {
      window.location.href = createPageUrl('Onboarding');
      return;
    }

    const isTalent = currentUser.user_type === 'talent' || currentUser.user_type === 'both';
    const isSeeker = currentUser.user_type === 'seeker' || currentUser.user_type === 'both' || !currentUser.user_type;

    // Set default view
    if (currentUser.user_type === 'both') {
      setActiveView('seeker');
    } else if (isTalent && !isSeeker) {
      setActiveView('talent');
    } else {
      setActiveView('seeker');
    }

    // Load talent profile
    if (isTalent) {
      const profiles = await base44.entities.TalentProfile.filter({ user_id: currentUser.id });
      if (profiles.length > 0) setTalentProfile(profiles[0]);
    }

    // Load bookings for both roles
    const bookings = await base44.entities.Booking.filter(
      { $or: [{ seeker_id: currentUser.id }, { talent_user_id: currentUser.id }] },
      '-created_date', 10
    );
    setRecentBookings(bookings);

    // Load maybe list
    if (isSeeker) {
      const maybe = await base44.entities.MaybeList.filter({ seeker_id: currentUser.id }, '-created_date', 5);
      setMaybeList(maybe);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isTalent = user?.user_type === 'talent' || user?.user_type === 'both';
  const isSeeker = true; // all users can browse as seeker

  // Filter bookings by role
  const seekerBookings = recentBookings.filter(b => b.seeker_id === user?.id);
  const talentBookings = recentBookings.filter(b => b.talent_user_id === user?.id);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Top Nav */}
      <div className="border-b border-slate-800 bg-black/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col items-center gap-4">
          <Link to={createPageUrl('Dashboard')}>
            <Logo className="h-16 w-auto" variant="light" />
          </Link>

          {/* Role switcher */}
          <div className="flex items-center bg-zinc-900 rounded-2xl p-1.5 border border-zinc-700 shadow-lg">
            <button
              onClick={() => setActiveView('seeker')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeView === 'seeker'
                  ? 'bg-white text-black shadow-md scale-105'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Search className="w-4 h-4" />
              Grabbing Talent
            </button>
            <button
              onClick={() => setActiveView('talent')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeView === 'talent'
                  ? 'bg-white text-black shadow-md scale-105'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Star className="w-4 h-4" />
              I'm a Talent
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      {activeView === 'seeker' && (
        <SeekerDashboard
          user={user}
          recentBookings={seekerBookings}
          maybeList={maybeList}
        />
      )}
      {activeView === 'talent' && (
        <TalentDashboard
          user={user}
          talentProfile={talentProfile}
          recentBookings={talentBookings}
        />
      )}
      <HelpChat />
    </div>
  );
}