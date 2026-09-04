import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Compass, Calendar, MessageSquare, Settings as SettingsIcon } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { trackLocation, getTabLocation } from '@/lib/tabNavigation';

const TABS = [
  { to: '/Discover', label: 'Discover', Icon: Compass },
  { to: '/Bookings', label: 'Bookings', Icon: Calendar },
  { to: '/Messages', label: 'Messages', Icon: MessageSquare },
  { to: '/Settings', label: 'Settings', Icon: SettingsIcon },
];

export default function MobileTabBar() {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  // Per-tab scroll memory — preserves each tab's scroll height/state across switches
  const scrollMemory = useRef({});

  // Track every location so each tab remembers the sub-page it was left on
  const activeTab = trackLocation(location.pathname, location.search);

  // Restore the remembered scroll position when a tab is revisited
  useEffect(() => {
    const saved = scrollMemory.current[location.pathname];
    if (!saved) return;
    const restore = () => {
      const container = document.querySelector('.ptr-scroll');
      if (container) container.scrollTop = saved.containerY || 0;
      window.scrollTo(0, saved.windowY || 0);
    };
    requestAnimationFrame(restore);
    // re-apply once the page content has settled (data loads, layouts settle)
    const t = setTimeout(restore, 350);
    return () => clearTimeout(t);
  }, [location.pathname]);

  if (isLoadingAuth || !isAuthenticated) return null;

  const handleTabTap = (e, to) => {
    e.preventDefault();
    // remember the current tab's scroll state before switching away
    const container = document.querySelector('.ptr-scroll');
    scrollMemory.current[location.pathname] = {
      windowY: window.scrollY,
      containerY: container ? container.scrollTop : 0,
    };

    if (to === activeTab) {
      // Re-tapping the active tab resets it to its clean base view
      if (location.pathname !== to || location.search || location.hash) {
        navigate(to, { replace: true });
      }
      return;
    }

    // Switching tabs: resume the sub-page this tab was last on
    const target = getTabLocation(to);
    navigate(target.pathname + target.search);
  };

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-black/95 backdrop-blur-md border-t border-zinc-800">
      <div className="flex items-stretch justify-around px-2 h-16" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {TABS.map(({ to, label, Icon }) => {
          const isActive = to === activeTab;
          return (
            <button
              key={to}
              type="button"
              onClick={(e) => handleTabTap(e, to)}
              className={`flex flex-col items-center justify-center gap-1 flex-1 text-[11px] font-medium transition-colors ${isActive ? 'text-white' : 'text-zinc-500'}`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-purple-400' : ''}`} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}