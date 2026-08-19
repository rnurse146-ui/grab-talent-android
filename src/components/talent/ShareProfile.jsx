import React, { useState } from 'react';
import { Share2, Copy, Check, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ShareProfile({ profile }) {
  const [copied, setCopied] = useState(false);
  const profileUrl = `${window.location.origin}/TalentProfile?id=${profile.id}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile.stage_name} on Grab Talent`,
          text: `🎵 ${profile.stage_name} is available for bookings on Grab Talent — check out their profile and available dates:`,
          url: profileUrl,
        });
      } catch { /* user cancelled */ }
    } else {
      copyLink();
    }
  };

  return (
    <div className="mb-10 p-5 rounded-2xl bg-gradient-to-br from-purple-900/40 to-orange-900/30 border border-purple-700/40">
      <div className="flex items-center gap-2 mb-1">
        <Share2 className="w-5 h-5 text-purple-300" />
        <h2 className="text-xl font-semibold">Share your profile</h2>
      </div>
      <p className="text-sm text-slate-300 mb-4">Post this link on your social media so people can see you're looking for work — your available dates show right on your profile.</p>
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 flex items-center gap-2 bg-black/40 rounded-lg px-3 py-2 border border-zinc-700 min-w-0">
          <Calendar className="w-4 h-4 text-purple-300 shrink-0" />
          <span className="text-xs text-slate-300 truncate">{profileUrl}</span>
        </div>
        <Button onClick={copyLink} variant="outline" className="border-zinc-700 text-white bg-transparent shrink-0">
          {copied ? <><Check className="w-4 h-4 mr-1.5" />Copied</> : <><Copy className="w-4 h-4 mr-1.5" />Copy link</>}
        </Button>
        <Button onClick={nativeShare} className="bg-white text-black hover:bg-zinc-100 shrink-0">
          <Share2 className="w-4 h-4 mr-1.5" />Share
        </Button>
      </div>
    </div>
  );
}