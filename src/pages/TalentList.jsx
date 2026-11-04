import React from 'react';
import PageHeader from '@/components/PageHeader';
import TalentAZList from '@/components/talent/TalentAZList';

// Standalone screen for the alphabetical talent list
export default function TalentList() {
  return (
    <div className="min-h-[100dvh] bg-black text-white pb-28">
      <PageHeader backTo="/Discover" backLabel="Discover" />
      <div className="px-6 pt-4 pb-3 border-b border-zinc-800">
        <h1 className="text-2xl font-bold">All Talent A–Z</h1>
      </div>
      <TalentAZList className="px-4 pt-2" />
    </div>
  );
}