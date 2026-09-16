import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft, LayoutDashboard } from 'lucide-react';
import Logo from '@/components/Logo';
import NotificationBell from '@/components/NotificationBell';

export default function PageHeader({ backTo, backLabel = "Back", showBack = true }) {
  const navigate = useNavigate();

  const handleBack = () => {
    // Use the history stack when available; fall back to the Dashboard
    // for direct-entry (deep link) cases where there's no previous entry.
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(backTo || '/Dashboard');
    }
  };

  return (
    <div className="flex items-center justify-between px-6 pb-4 pt-[calc(env(safe-area-inset-top)+1rem)] border-b border-zinc-800 bg-black sticky top-0 md:top-14 z-10">
      {showBack ? (
        <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white" onClick={handleBack}>
          <ChevronLeft className="w-4 h-4 mr-1" />{backLabel}
        </Button>
      ) : (
        <div className="w-20 md:w-44" />
      )}
      <Link to="/Dashboard" aria-label="Go to Dashboard">
        <Logo className="h-12 w-auto" variant="light" />
      </Link>
      <div className="w-20 md:w-44 flex items-center justify-end gap-1">
        <Button asChild variant="ghost" size="sm" className="text-zinc-400 hover:text-white" aria-label="Dashboard">
          <Link to="/Dashboard" className="flex items-center gap-1.5">
            <LayoutDashboard className="w-4 h-4" />
            <span className="hidden sm:inline text-xs">Dashboard</span>
          </Link>
        </Button>
        <NotificationBell />
      </div>
    </div>
  );
}