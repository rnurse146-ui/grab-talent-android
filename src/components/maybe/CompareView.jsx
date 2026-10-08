import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { categoryLabel } from '@/lib/categoryLabel';
import { Button } from '@/components/ui/button';
import { Star, MapPin, Banknote, Calendar, X } from 'lucide-react';

const Row = ({ label, children }) => (
  <div className="flex items-center gap-2 text-sm">
    <span className="text-zinc-500 w-16 shrink-0 text-xs">{label}</span>
    <span className="text-zinc-200 truncate">{children}</span>
  </div>
);

// Side-by-side comparison of 2-3 shortlisted talents: price, rating, category, location.
export default function CompareView({ items, onExit, isGuest, onLoginPrompt, onDeselect }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Compare ({items.length})</h2>
        <Button variant="outline" size="sm" onClick={onExit} className="border-zinc-700 bg-transparent hover:bg-zinc-800">
          <X className="w-4 h-4 mr-1" />Exit compare
        </Button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4 -mx-6 px-6 snap-x">
        {items.map(item => (
          <div key={item.id} className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden shrink-0 w-[70vw] max-w-[260px] snap-center flex flex-col">
            <div className="relative aspect-square">
              {item.talent_photo ? (
                <img src={item.talent_photo} alt={item.talent_stage_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-900 to-orange-900 flex items-center justify-center"><span className="text-4xl">🎭</span></div>
              )}
              <button
                onClick={() => onDeselect(item.id)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center hover:bg-red-600"
                aria-label="Remove from comparison"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-2 flex-1">
              <h3 className="font-semibold truncate">{item.talent_stage_name}</h3>
              <Row label="Price">
                <span className="flex items-center gap-1"><Banknote className="w-3 h-3 text-zinc-500" />{item.talent_hourly_rate ? `from £${item.talent_hourly_rate}/hr` : 'Not set'}</span>
              </Row>
              <Row label="Rating">
                <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-400" />{item.talent_rating ? item.talent_rating.toFixed(1) : 'No reviews'}</span>
              </Row>
              <Row label="Type">{categoryLabel(item.talent_category)}</Row>
              <Row label="Based in">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-zinc-500" />{item.talent_city || 'Not set'}</span>
              </Row>
            </div>

            <div className="p-4 pt-0 flex gap-2">
              <Link to={createPageUrl('TalentProfile') + `?id=${item.talent_profile_id}`} className="flex-1">
                <Button variant="outline" size="sm" className="w-full border-zinc-700 bg-transparent hover:bg-zinc-800">View Profile</Button>
              </Link>
              {isGuest ? (
                <Button size="sm" onClick={onLoginPrompt} className="bg-white text-black hover:bg-zinc-100" aria-label="Book talent"><Calendar className="w-4 h-4" /></Button>
              ) : (
                <Link to={createPageUrl('BookTalent') + `?talent_id=${item.talent_profile_id}`}><Button size="sm" className="bg-white text-black hover:bg-zinc-100"><Calendar className="w-4 h-4" /></Button></Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}