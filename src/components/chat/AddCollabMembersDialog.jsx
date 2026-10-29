import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Check, Users } from 'lucide-react';
import { listCollabConnections, addCollabMembers } from '@/lib/collabGroups';

const initials = (name) => name?.charAt(0)?.toUpperCase() || '?';

// Grow an existing collab group: pick more of your Talent Network matches.
export default function AddCollabMembersDialog({ open, onOpenChange, group, onAdded }) {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState([]);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  const memberIds = group?.member_ids || [];

  useEffect(() => {
    if (!open) return;
    setSelected([]);
    setError('');
    setLoading(true);
    listCollabConnections()
      .then(setConnections)
      .catch(() => setError('Could not load your Talent Connect matches.'))
      .finally(() => setLoading(false));
  }, [open]);

  const available = connections.filter(c => !memberIds.includes(c.user_id));
  const toggle = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const add = async () => {
    if (selected.length === 0) {
      setError('Pick at least one performer to add.');
      return;
    }
    setAdding(true);
    setError('');
    try {
      const updated = await addCollabMembers(group.id, selected);
      onOpenChange(false);
      onAdded?.(updated);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Could not add them to the group.');
    } finally {
      setAdding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Add talent to this collab</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Pick performers you matched with on Talent Network to join the group.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-64 overflow-y-auto -mx-1 px-1 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
            </div>
          ) : available.length === 0 ? (
            <div className="text-center py-8 px-2">
              <Users className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
              <p className="text-sm text-zinc-400">No other matches to add</p>
              <p className="text-xs text-zinc-500 mt-1">Match with more performers in Talent Network, then grow this group.</p>
            </div>
          ) : (
            available.map(c => {
              const active = selected.includes(c.user_id);
              return (
                <button
                  key={c.user_id}
                  type="button"
                  onClick={() => toggle(c.user_id)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition-colors ${
                    active ? 'border-purple-500 bg-purple-600/20' : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600'
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600/40 to-orange-600/40 border border-zinc-700 flex items-center justify-center text-sm font-semibold overflow-hidden shrink-0">
                    {c.photo ? <img src={c.photo} alt={c.stage_name} className="w-full h-full object-cover" /> : initials(c.stage_name)}
                  </div>
                  <p className="flex-1 text-sm font-medium text-zinc-100 truncate">{c.stage_name}</p>
                  {active && <Check className="w-4 h-4 text-purple-300 shrink-0" />}
                </button>
              );
            })
          )}
        </div>

        {error && <p className="text-sm text-amber-300">{error}</p>}

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 border-zinc-700 bg-transparent text-white hover:bg-zinc-900"
          >
            Cancel
          </Button>
          <Button
            onClick={add}
            disabled={adding || loading}
            className="flex-1 bg-white text-black hover:bg-zinc-200 font-bold"
          >
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add to group'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}