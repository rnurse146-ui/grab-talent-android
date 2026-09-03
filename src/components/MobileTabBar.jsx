import React from 'react';
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
  if (isLoadingAuth || !isAuthenticated) return null;

  // Tapping the already-active tab returns to the clean base view (strips search params)
  const handleTabTap = (e, to) => {
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