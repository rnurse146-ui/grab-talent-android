import React from 'react';
import { Link } from 'react-router-dom';
import { Users, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AvailabilitySwitch from '@/components/network/AvailabilitySwitch';

// Shown to anyone who cannot browse the network yet: no talent profile at all,
// or a profile that has not switched itself on.
export default function NetworkGate({ hasProfile, onEnable, busy }) {
  if (!hasProfile) {
    return (
      <div className="max-w-md mx-auto px-6 py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-purple-500/15 border border-purple-500/30 flex items-center justify-center mx-auto mb-5">
          <Users className="w-9 h-9 text-purple-300" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Talent Network is for performers</h2>
        <p className="text-zinc-300 text-base mb-6">
          Create your talent profile to meet other performers, find the missing piece for your band or line-up,
          and get discovered for collabs.
        </p>
        <Link to="/TalentSetup">
          <Button className="h-12 px-6 text-base bg-white text-black hover:bg-zinc-200 font-bold">
            <UserPlus className="w-5 h-5 mr-2" />
            Create my talent profile
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-6 py-12">
      <div className="w-20 h-20 rounded-full bg-purple-500/15 border border-purple-500/30 flex items-center justify-center mx-auto mb-5">
        <Users className="w-9 h-9 text-purple-300" />
      </div>
      <h2 className="text-2xl font-bold mb-2 text-center">Meet performers near you</h2>
      <p className="text-zinc-300 text-base mb-6 text-center">
        Switch yourself on to browse other performers and swipe to connect. A drummer missing a singer,
        a DJ looking for a host — this is where you find them. You can switch off any time.
      </p>
      <AvailabilitySwitch on={false} onChange={onEnable} busy={busy} label="Put me in Talent Network" />
    </div>
  );
}