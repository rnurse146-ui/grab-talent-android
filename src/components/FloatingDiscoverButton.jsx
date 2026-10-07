import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

// Pages where the floating button would be redundant or intrusive
const HIDDEN_PATHS = ['/Discover', '/login', '/register', '/forgot-password', '/reset-password'];

// Always-visible floating shortcut to the Discover deck, on mobile and desktop
export default function FloatingDiscoverButton() {
  const { isAuthenticated, isLoadingAuth, isGuest } = useAuth();
  const location = useLocation();

  if (isLoadingAuth) return null;
  if (!isAuthenticated && !isGuest) return null; // plain login screen needs no shortcut
  if (HIDDEN_PATHS.some((p) => location.pathname === p || location.pathname.startsWith(p + '/'))) return null;

  return (
    <Link
      to="/Discover"
      aria-label="Go to Discover"
      className="fab-bottom fixed right-4 md:right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-purple-600 text-white shadow-lg shadow-purple-600/40 hover:bg-purple-500 active:scale-95 transition-transform"
    >
      <Compass className="w-6 h-6" />
    </Link>
  );
}