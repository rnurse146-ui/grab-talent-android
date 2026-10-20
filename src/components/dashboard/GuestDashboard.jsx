import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, UserPlus } from 'lucide-react';
import Logo from '@/components/Logo';

export default function GuestDashboard() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-6 text-center">
      <Logo className="h-20 w-auto" variant="light" />
      <h1 className="mt-8 text-3xl font-bold leading-tight">Find amazing talent for your event</h1>
      <p className="mt-3 text-zinc-400 max-w-sm">
        Browse performers, save your favourites and book in minutes.
      </p>
      <div className="mt-8 w-full max-w-xs flex flex-col gap-3">
        <Link
          to="/Discover"
          className="flex items-center justify-center gap-2 w-full bg-white text-black font-semibold rounded-xl py-4 min-h-[44px] active:scale-[0.98] transition-transform"
        >
          <Compass className="w-5 h-5" />
          Browse talent
        </Link>
        <Link
          to="/register"
          className="flex items-center justify-center gap-2 w-full border border-zinc-700 text-white font-semibold rounded-xl py-4 min-h-[44px] active:scale-[0.98] transition-transform"
        >
          <UserPlus className="w-5 h-5" />
          Create account
        </Link>
      </div>
    </div>
  );
}