import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { MessageSquare, ChevronRight } from 'lucide-react';

// Conversations tied to bookings — latest message, unread count, opens Messages
export default function BookingMessages({ user }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const msgs = await base44.entities.Message.filter(
        { $or: [{ sender_id: user.id }, { receiver_id: user.id }] },
        { sort: '-created_date', limit: 50 }
      );
      const byConversation = {};
      msgs.forEach(m => {
        const key = m.booking_id || m.conversation_id;
        if (!byConversation[key]) {
          byConversation[key] = { last: m, unread: 0, booking_id: m.booking_id };
        }
        if (!m.is_read && m.receiver_id === user.id) byConversation[key].unread += 1;
      });
      setGroups(Object.values(byConversation).slice(0, 6));
      setLoading(false);
    };
    load();
  }, [user]);

  return (
    <div className="p-6 bg-zinc-900 rounded-2xl border border-zinc-800">
      <h2 className="font-semibold mb-4 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-purple-400" />Booking Messages</h2>
      {loading ? (
        <p className="text-zinc-500 text-sm">Loading…</p>
      ) : groups.length === 0 ? (
        <p className="text-zinc-500 text-sm">No messages yet — messages from your bookings will appear here.</p>
      ) : (
        <div className="space-y-2">
          {groups.map(g => {
            const otherId = g.last.sender_id === user.id ? g.last.receiver_id : g.last.sender_id;
            return (
              <Link key={g.last.id} to={createPageUrl('Messages') + `?to=${otherId}`}>
                <div className="flex items-center gap-3 p-3 rounded-xl border border-zinc-800 hover:bg-zinc-800/50">
                  <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-4 h-4 text-zinc-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{g.last.sender_name || 'Message'}</p>
                    <p className="text-xs text-zinc-500 truncate">{g.last.content}</p>
                  </div>
                  {g.unread > 0 && (
                    <span className="bg-white text-black text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shrink-0">{g.unread}</span>
                  )}
                  <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}