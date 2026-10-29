import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Check, Users } from 'lucide-react';
import { listCollabConnections, createCollabGroup } from '@/lib/collabGroups';

const initials = (name) => name?.charAt(0)?.toUpperCase() || '?';

// Start a group chat with performers you matched with on Talent Network.
export default function NewCollabGroupDialog({ open, onOpenChange, onCreated }) {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState([]);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError('');
    listCollabConnections()
      .then(setConnections)
      .catch(() => setError('Could not load your Talent Connect matches.'))
      .finally(() => setLoading(false));
  }, [open]);

  const toggle = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const create = async () => {
    if (selected.length === 0) {
      setError('Pick at least one performer you connected with.');
      return;
    }
    setCreating(true);
    setError('');
    try {
      const group = await createCollabGroup({ name, memberIds: selected });
      setSelected([]);
      setName('');
      onOpenChange(false);
      onCreated?.(group);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Could not create the group.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">New collab group</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Pick the performers you connected with to plan a collab together.
          </DialogDescription>
        </DialogHeader>

        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Group name (e.g. Summer festival set)"
          maxLength={60}
          className="bg-zinc-900 border-zinc-700 text-white"
        />

        <div className="max-h-64 overflow-y-auto -mx-1 px-1 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
            </div>
          ) : connections.length === 0 ? (
            <div className="text-center py-8 px-2">
              <Users className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
              <p className="text-sm text-zinc-400">No Talent Connect matches yet</p>
              <p className="text-xs text-zinc-500 mt-1">Match with performers in Talent Network, then start a group here.</p>
            </div>
          ) : (
            connections.map(c => {
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
            onClick={create}
            disabled={creating || loading}
            className="flex-1 bg-white text-black hover:bg-zinc-200 font-bold"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create group'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}