import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Bell, Calendar, MessageSquare, Star, Banknote, CheckCheck, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import PageHeader from '@/components/PageHeader';
import PullToRefresh from '@/components/PullToRefresh';

const TYPE_CONFIG = {
  booking: { icon: Calendar, classes: 'text-blue-400 bg-blue-500/10' },
  message: { icon: MessageSquare, classes: 'text-purple-400 bg-purple-500/10' },
  review: { icon: Star, classes: 'text-yellow-400 bg-yellow-500/10' },
  payment: { icon: Banknote, classes: 'text-green-400 bg-green-500/10' },
};

export default function Notifications() {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadData = async () => {
    const currentUser = await base44.auth.me();
    setUser(currentUser);
    const items = await base44.entities.Notification.filter({ user_id: currentUser.id }, '-created_date');
    setNotifications(items);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const unsubscribe = base44.entities.Notification.subscribe(() => loadData());
    return unsubscribe;
  }, []);

  const handleTap = async (n) => {
    if (!n.is_read) {
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
      await base44.entities.Notification.update(n.id, { is_read: true });
    }
    if (n.link_url) navigate(n.link_url);
  };

  const markAllRead = async () => {
    setNotifications(prev => prev.map(x => ({ ...x, is_read: true })));
    await base44.entities.Notification.updateMany(
      { user_id: user.id, is_read: false },
      { $set: { is_read: true } }
    );
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <PullToRefresh onRefresh={loadData} className="h-[100dvh] bg-black text-white">
      <PageHeader />

      <div className="max-w-2xl mx-auto px-6 pt-6 pb-24 md:pb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <Button onClick={markAllRead} variant="outline" size="sm" className="border-zinc-700 text-zinc-400">
              <CheckCheck className="w-4 h-4 mr-1" />Mark all read
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20">
            <Bell className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">You're all caught up</h2>
            <p className="text-zinc-400">Booking updates, messages, reviews and payment alerts will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => {
              const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.booking;
              const Icon = config.icon;
              return (
                <button
                  key={n.id}
                  onClick={() => handleTap(n)}
                  className={`w-full text-left p-4 rounded-2xl border flex items-start gap-3 transition-colors ${
                    n.is_read ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-900 border-purple-500/30'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${config.classes}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-semibold ${n.is_read ? 'text-zinc-300' : 'text-white'}`}>{n.title}</h3>
                      {!n.is_read && <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />}
                    </div>
                    <p className="text-sm text-zinc-400 mt-0.5 line-clamp-2">{n.body}</p>
                    <p className="text-xs text-zinc-600 mt-1">
                      {n.created_date ? formatDistanceToNow(new Date(n.created_date), { addSuffix: true }) : ''}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </PullToRefresh>
  );
}