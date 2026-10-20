import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Search, Star } from 'lucide-react';

// Talent side of the dashboard for guests — creating a profile prompts sign-up
export default function GuestTalentDashboard({ onCreateProfile }) {
  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Create Profile Banner */}
      <div className="rounded-3xl border-2 border-orange-500/60 bg-gradient-to-br from-orange-600/20 via-zinc-900 to-zinc-950 p-6 sm:p-8 mb-8">
        <span className="text-4xl">🎤</span>
        <h2 className="text-xl sm:text-2xl font-bold mt-4 mb-1">Got talent? Get booked.</h2>
        <p className="text-zinc-400 text-sm sm:text-base">Create your profile so event organizers can find and book you.</p>
        <Button
          onClick={onCreateProfile}
          className="mt-6 bg-orange-600 hover:bg-orange-500 text-white h-12 px-6 text-base font-semibold"
        >
          <Star className="w-5 h-5 mr-2" />
          Create Profile
        </Button>
        <p className="text-xs text-zinc-500 mt-3">You'll be asked to create a free account first.</p>
      </div>

      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden mb-8 bg-zinc-900 border border-zinc-700 p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-3">Your Talent Dashboard</h1>
          <p className="text-zinc-500 max-w-md mb-6">Manage bookings, showcase your talent, and grow your audience.</p>
          <Link to="/Discover">
            <Button className="bg-white text-black hover:bg-zinc-100 h-12 px-6 text-base font-semibold">
              <Search className="w-5 h-5 mr-2" />
              Browse Talent
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}