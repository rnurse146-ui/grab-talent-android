import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Compass, Calendar, MessageSquare, Settings as SettingsIcon, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { resolveTab } from '@/lib/tabNavigation';
import Logo from '@/components/Logo';

const TABS = [
  { to: '/Dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/Discover', label: 'Discover', Icon: Compass },
  { to: '/Bookings', label: 'Bookings', Icon: Calendar },
  { to: '/Messages', label: 'Messages', Icon: MessageSquare },
  { to: '/Settings', label: 'Settings', Icon: SettingsIcon },
];

// Desktop top navigation — mirrors the mobile tab bar on wider screens.
export default function DesktopNavBar() {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const location = useLocation();

  if (isLoadingAuth || !isAuthenticated) return null;

  const activeTab = resolveTab(location.pathname);

  return (
    <nav className="hidden md:flex fixed top-0 inset-x-0 z-50 h-14 items-center gap-2 px-6 bg-black/95 backdrop-blur-md border-b border-zinc-800">
      <Link to="/Dashboard" aria-label="Dashboard" className="mr-4 shrink-0">
        <Logo className="h-9 w-auto" variant="light" />
      </Link>
      {TABS.map(({ to, label, Icon }) => {
        const isActive = to === activeTab;
        return (
          <Link
            key={to}
            to={to}
            className={`flex items-center gap-2 px-4 h-9 rounded-full text-sm font-medium transition-colors ${isActive ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}
          >
            <Icon className={`w-4 h-4 ${isActive ? 'text-purple-400' : ''}`} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}