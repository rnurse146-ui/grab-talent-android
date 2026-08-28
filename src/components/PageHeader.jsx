import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Logo from '@/components/Logo';

export default function PageHeader({ backTo, backLabel = "Back" }) {
  return (
    <div className="flex items-center justify-between px-6 pb-4 pt-[calc(env(safe-area-inset-top)+1rem)] border-b border-zinc-800 bg-black sticky top-0 z-10">
      <Link to={backTo}>
        <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
          <ChevronLeft className="w-4 h-4 mr-1" />{backLabel}
        </Button>
      </Link>
      <Logo className="h-12 w-auto" variant="light" />
      <div className="w-20" />
    </div>
  );
}