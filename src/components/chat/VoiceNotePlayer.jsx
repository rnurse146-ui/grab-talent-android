import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Mic } from 'lucide-react';

// Plays a voice note stored privately — the signed URL is created on demand.
export default function VoiceNotePlayer({ audioUri, isMine }) {
  const [url, setUrl] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!audioUri) return;
    base44.integrations.Core.CreateFileSignedUrl({ file_uri: audioUri })
      .then(res => {
        if (!cancelled) setUrl(res?.signed_url || null);
      })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [audioUri]);

  return (
    <div className="flex items-center gap-2 min-w-[190px]">
      <Mic className={`w-4 h-4 shrink-0 ${isMine ? 'text-white/80' : 'text-purple-300'}`} />
      {url ? (
        <audio controls src={url} className="h-9 w-[190px]" />
      ) : (
        <span className={`text-xs flex items-center gap-1.5 ${isMine ? 'text-white/80' : 'text-zinc-400'}`}>
          {failed ? 'Voice note unavailable' : <><Loader2 className="w-3.5 h-3.5 animate-spin" />Loading voice note…</>}
        </span>
      )}
    </div>
  );
}