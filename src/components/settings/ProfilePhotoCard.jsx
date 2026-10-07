import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Camera, Loader2, Star } from 'lucide-react';

const roleLabel = (user) => {
  switch (user?.user_type) {
    case 'talent': return 'Talent';
    case 'both': return 'Talent & Grabber';
    default: return 'Grabbing Talent';
  }
};

// Account card with the user's own photo — upload replaces it instantly
export default function ProfilePhotoCard({ user, onUpdate }) {
  const [photoUrl, setPhotoUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const stored = user?.profile_photo;
      if (!stored) { setPhotoUrl(null); return; }
      if (stored.startsWith('http')) { setPhotoUrl(stored); return; }
      try {
        const res = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: stored });
        if (active) setPhotoUrl(res.signed_url);
      } catch {
        if (active) setPhotoUrl(null);
      }
    };
    load();
    return () => { active = false; };
  }, [user?.profile_photo]);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      await base44.auth.updateMe({ profile_photo: file_uri });
      onUpdate && onUpdate({ ...user, profile_photo: file_uri });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="flex items-center gap-4 mb-8">
      <div className="relative shrink-0">
        <div className="w-20 h-20 rounded-full bg-zinc-800 border-2 border-zinc-700 overflow-hidden flex items-center justify-center">
          {photoUrl ? (
            <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-bold text-zinc-500">{user?.full_name?.[0]?.toUpperCase() || '?'}</span>
          )}
        </div>
        <label className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white text-black flex items-center justify-center cursor-pointer hover:bg-zinc-200" aria-label="Upload profile photo">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
          <input type="file" accept="image/*" onChange={handleFile} className="hidden" disabled={uploading} />
        </label>
      </div>
      <div className="min-w-0">
        <h2 className="text-xl font-bold truncate">{user?.full_name}</h2>
        <div className="flex items-center gap-1.5 mt-1">
          <Star className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-sm text-zinc-400">{roleLabel(user)}</span>
        </div>
      </div>
    </div>
  );
}