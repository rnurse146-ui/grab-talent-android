import React, { useEffect, useRef } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Compass, Calendar, MessageSquare, Settings as SettingsIcon } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

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

  // Tapping the already-active tab returns to the clean base view (strips search params)
  const handleTabTap = (e, to) => {
    // remember the current tab's scroll state before switching away
    const container = document.querySelector('.ptr-scroll');
    scrollMemory.current[location.pathname] = {
      windowY: window.scrollY,
      containerY: container ? container.scrollTop : 0,
    };
    if (location.pathname === to && (location.search || location.hash)) {
      e.preventDefault();
      navigate(to, { replace: true });
    }
  };

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-black/95 backdrop-blur-md border-t border-zinc-800">
      <div className="flex items-stretch justify-around px-2 h-16" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {TABS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={(e) => handleTabTap(e, to)}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 flex-1 text-[11px] font-medium transition-colors ${isActive ? 'text-white' : 'text-zinc-500'}`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-5 h-5 ${isActive ? 'text-purple-400' : ''}`} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}