import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

// Shown to guests when they try to book, message or swipe — browsing stays free
export default function GuestLoginPrompt({ open, onOpenChange }) {
  const navigate = useNavigate();
  const returnTo = encodeURIComponent(window.location.pathname + window.location.search);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-white">Sign in to continue</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Browsing is free — you'll only need a free account to book talent or send messages.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            onClick={() => navigate(`/login?returnTo=${returnTo}`)}
            className="w-full bg-white text-black hover:bg-zinc-100"
          >
            Sign In / Sign Up
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full border-zinc-700 bg-transparent text-white hover:bg-zinc-800"
          >
            Keep browsing
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}