import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// Bell with a live unread badge — shown in the page headers.
export default function NotificationBell() {
  const [unread, setUnread] = useState(0);

  const fetchCount = async () => {
    try {
      const user = await base44.auth.me();
      const items = await base44.entities.Notification.filter({ user_id: user.id, is_read: false }, '-created_date', 50);
      setUnread(items.length);
    } catch {
      // Not signed in yet — nothing to count
    }
  };

  useEffect(() => {
    fetchCount();
    const unsubscribe = base44.entities.Notification.subscribe(() => fetchCount());
    return unsubscribe;
  }, []);

  return (
    <Link
      to="/Notifications"
      className="relative inline-flex items-center justify-center w-10 h-10 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
      aria-label="Notifications"
    >
      <Bell className="w-5 h-5" />
      {unread > 0 && (
        <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </Link>
  );
}