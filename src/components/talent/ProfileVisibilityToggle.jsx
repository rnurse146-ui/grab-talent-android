import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export default function ProfileVisibilityToggle({ profile, onUpdated }) {
  const [available, setAvailable] = useState(profile?.is_available !== false);
  const [saving, setSaving] = useState(false);

  const toggle = async () => {
    if (!profile?.id || saving) return;
    const next = !available;
    setSaving(true);
    try {
      await base44.entities.TalentProfile.update(profile.id, { is_available: next });
      setAvailable(next);
      onUpdated?.({ ...profile, is_available: next });
      toast({
        title: next ? 'Profile is visible' : 'Profile hidden',
        description: next
          ? 'You now appear in the discovery feed for seekers.'
          : 'You are hidden from the discovery feed — no one can swipe on you.',
      });
    } catch (e) {
      toast({ title: 'Could not update', description: e.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const isOn = available;

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-700 p-6">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        {isOn ? <Eye className="w-4 h-4 text-zinc-400" /> : <EyeOff className="w-4 h-4 text-zinc-400" />}
        Profile Visibility
      </h3>
      <button
        type="button"
        onClick={toggle}
        disabled={saving}
        className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left ${
          isOn ? 'border-green-500 bg-green-500/10' : 'border-zinc-700 bg-zinc-950 hover:border-zinc-500'
        } ${saving ? 'opacity-60 cursor-wait' : 'cursor-pointer'}`}
      >
        <div className="flex-1">
          <p className="font-bold text-white">
            {saving ? 'Updating...' : isOn ? 'Visible to seekers' : 'Hidden from discovery'}
          </p>
          <p className="text-sm text-zinc-400 mt-1">
            {isOn
              ? 'Your profile appears in the swipe deck. Turn off to remove yourself (e.g. for a demo account).'
              : 'You are completely hidden — no one can find or book you right now.'}
          </p>
        </div>
        <div className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ml-4 ${isOn ? 'bg-green-500' : 'bg-zinc-700'}`}>
          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isOn ? 'translate-x-6' : 'translate-x-0.5'}`}>
            {saving && <Loader2 className="w-5 h-5 p-1 animate-spin text-zinc-500" />}
          </span>
        </div>
      </button>
    </div>
  );
}