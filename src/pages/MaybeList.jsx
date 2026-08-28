import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Star, MapPin, Banknote, Trash2, Calendar, ChevronLeft, Loader2 } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { toast } from '@/components/ui/use-toast';

export default function MaybeList() {
  const [user, setUser] = useState(null);
  const [maybeList, setMaybeList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const currentUser = await base44.auth.me();
    setUser(currentUser);
    const list = await base44.entities.MaybeList.filter({ seeker_id: currentUser.id }, '-created_date');
    setMaybeList(list);
    setLoading(false);
  };

  const removeFromList = async (id) => {
    const snapshot = maybeList;
    setMaybeList(prev => prev.filter(item => item.id !== id));
    try {
      await base44.entities.MaybeList.delete(id);
    } catch (e) {
      setMaybeList(snapshot);
      toast({ title: 'Could not remove', description: e.message || 'Please try again.', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <PageHeader backTo={createPageUrl('Dashboard')} />

      <div className="max-w-4xl mx-auto px-6 pt-8 pb-24 md:pb-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center">
            <Heart className="w-6 h-6 text-pink-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Maybe List</h1>
            <p className="text-slate-400 text-sm">{maybeList.length} saved talents</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>
        ) : maybeList.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No saved talents yet</h2>
            <p className="text-zinc-400 mb-6">Swipe right on talents you're interested in</p>
            <Link to={createPageUrl('Discover')}><Button className="bg-white text-black hover:bg-zinc-100">Discover Talent</Button></Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {maybeList.map((item, index) => (
              <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden group">
                <div className="relative aspect-square">
                  {item.talent_photo ? (
                    <img src={item.talent_photo} alt={item.talent_stage_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-900 to-orange-900 flex items-center justify-center"><span className="text-4xl">🎭</span></div>
                  )}
                  <button onClick={() => removeFromList(item.id)} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold mb-1 truncate">{item.talent_stage_name}</h3>
                  <p className="text-zinc-400 text-sm capitalize mb-3">{item.talent_category?.replace(/_/g, ' ')}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {item.talent_city && (<Badge variant="secondary" className="bg-zinc-800 text-zinc-300 text-xs"><MapPin className="w-3 h-3 mr-1" />{item.talent_city}</Badge>)}
                    {item.talent_hourly_rate && (<Badge variant="secondary" className="bg-zinc-800 text-zinc-300 text-xs"><Banknote className="w-3 h-3 mr-1" />£{item.talent_hourly_rate}/hr</Badge>)}
                    {item.talent_rating && (<Badge variant="secondary" className="bg-zinc-800 text-zinc-300 text-xs"><Star className="w-3 h-3 mr-1" />{item.talent_rating.toFixed(1)}</Badge>)}
                  </div>
                  <div className="flex gap-2">
                    <Link to={createPageUrl('TalentProfile') + `?id=${item.talent_profile_id}`} className="flex-1"><Button variant="outline" size="sm" className="w-full border-zinc-700 bg-transparent hover:bg-zinc-800">View Profile</Button></Link>
                    <Link to={createPageUrl('BookTalent') + `?talent_id=${item.talent_profile_id}`}><Button size="sm" className="bg-white text-black hover:bg-zinc-100"><Calendar className="w-4 h-4" /></Button></Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}