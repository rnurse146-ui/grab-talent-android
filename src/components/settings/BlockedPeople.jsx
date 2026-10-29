import React, { useEffect, useState } from 'react';
import { Ban, Loader2, Undo2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { listMyBlocks, unblockUser } from '@/lib/safety';

// The people this member has blocked — unblocking restores discovery, matching
// and messaging for both of them.
export default function BlockedPeople() {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    listMyBlocks().then(setBlocks).finally(() => setLoading(false));
  }, []);

  const unblock = async (userId) => {
    setBusyId(userId);
    try {
      await unblockUser(userId);
      setBlocks(prev => prev.filter(b => b.blocked_user_id !== userId));
    } finally {
      setBusyId(null);
    }
  };

  if (loading || blocks.length === 0) return null;

  return (
    <div className="p-6 bg-zinc-900 rounded-2xl border border-zinc-800">
      <h2 className="font-semibold mb-2 flex items-center gap-2">
        <Ban className="w-4 h-4 text-red-400" />
        Blocked people
      </h2>
      <p className="text-zinc-400 text-sm mb-4">
        They can't see your profile, match with you or message you.
      </p>
      <div className="space-y-2">
        {blocks.map(block => (
          <div key={block.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
            <div className="w-11 h-11 rounded-full overflow-hidden bg-zinc-800 border border-zinc-700 shrink-0 flex items-center justify-center">
              {block.blocked_photo ? (
                <img
                  src={block.blocked_photo}
                  alt={block.blocked_name || 'Blocked member'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-5 h-5 text-zinc-500" />
              )}
            </div>
            <span className="text-sm font-medium truncate flex-1">{block.blocked_name || 'Member'}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => unblock(block.blocked_user_id)}
              disabled={busyId === block.blocked_user_id}
              className="border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-white shrink-0"
            >
              {busyId === block.blocked_user_id
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <><Undo2 className="w-3.5 h-3.5 mr-1.5" />Unblock</>}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}