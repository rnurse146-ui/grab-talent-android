import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Search } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import TalentListItem from '@/components/talent/TalentListItem';
import { Input } from '@/components/ui/input';

// Every talent on the platform, A–Z
export default function TalentList() {
  const [profiles, setProfiles] = useState(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const page = await base44.entities.TalentProfile.list({
        sort: 'stage_name',
        limit: 200
      });
      if (!cancelled) setProfiles(page.items || []);
    };
    load();
    return () => { cancelled = true; };
  }, []);

  // Alphabetical by stage name, grouped under its first letter
  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = (profiles || [])
      .filter(p => !q
        || (p.stage_name || '').toLowerCase().includes(q)
        || (p.location_city || '').toLowerCase().includes(q))
      .sort((a, b) => (a.stage_name || '').localeCompare(b.stage_name || '', undefined, { sensitivity: 'base' }));

    const map = new Map();
    list.forEach(p => {
      const first = (p.stage_name || '').trim().charAt(0).toUpperCase();
      const key = /[A-Z]/.test(first) ? first : '#';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(p);
    });
    return Array.from(map.entries());
  }, [profiles, query]);

  const total = groups.reduce((sum, [, items]) => sum + items.length, 0);

  return (
    <div className="min-h-[100dvh] bg-black text-white pb-28">
      <PageHeader backTo="/Discover" backLabel="Discover" />

      <div className="px-6 pt-4 pb-3 border-b border-zinc-800">
        <h1 className="text-2xl font-bold">All Talent A–Z</h1>
        <p className="text-sm text-zinc-400 mt-1">
          {profiles === null ? 'Loading performers…' : `${total} performer${total === 1 ? '' : 's'} in alphabetical order`}
        </p>
        <div className="relative mt-3">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search name or city"
            className="pl-9 bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500"
          />
        </div>
      </div>

      {profiles === null ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-7 h-7 animate-spin text-zinc-500" />
        </div>
      ) : total === 0 ? (
        <p className="px-6 py-16 text-center text-zinc-400">
          {query ? 'No talent matches that search.' : 'No talent listed yet.'}
        </p>
      ) : (
        <div className="px-4 pt-2">
          {groups.map(([letter, items]) => (
            <section key={letter} className="mt-4">
              <h2 className="px-2 mb-2 text-sm font-bold text-purple-400 tracking-widest">{letter}</h2>
              <div className="space-y-2">
                {items.map(profile => (
                  <TalentListItem key={profile.id} profile={profile} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}