import React, { useState } from 'react';
import { Ban, Flag, MoreVertical, ShieldCheck, Undo2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import ReportDialog from '@/components/safety/ReportDialog';
import { blockUser, unblockUser } from '@/lib/safety';

// Report / block control for a member, used on their profile and in a chat.
export default function SafetyMenu({
  userId, name, profileId, context, conversationId, excerpt = '', className = '', trigger = null, onBlocked
}) {
  const [reportOpen, setReportOpen] = useState(false);
  const [isBlocked, setIsBlocked] = useState(null);
  const [busy, setBusy] = useState(false);

  // Know whether this member is already blocked, so the menu offers Unblock
  const checkBlocked = async () => {
    if (isBlocked !== null) return;
    try {
      const res = await base44.functions.invoke('blockUser', { action: 'list' });
      const blocks = res?.data?.blocks || [];
      setIsBlocked(blocks.some(b => b.blocked_user_id === userId));
    } catch {
      setIsBlocked(false);
    }
  };

  const toggleBlock = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (isBlocked) {
        await unblockUser(userId);
        setIsBlocked(false);
      } else {
        await blockUser(userId);
        setIsBlocked(true);
        onBlocked?.();
      }
    } finally {
      setBusy(false);
    }
  };

  if (!userId) return null;

  return (
    <>
      <DropdownMenu onOpenChange={(open) => open && checkBlocked()}>
        <DropdownMenuTrigger asChild>
          {trigger || (
            <button
              type="button"
              aria-label="Report or block"
              className={`p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 ${className}`}
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-700 text-white w-52">
          <DropdownMenuItem onClick={() => setReportOpen(true)} className="cursor-pointer focus:bg-zinc-800 focus:text-white">
            <Flag className="w-4 h-4 mr-2" />
            Report {name || 'member'}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={toggleBlock}
            disabled={busy}
            className={`cursor-pointer focus:bg-zinc-800 ${isBlocked ? 'focus:text-white text-zinc-300' : 'text-red-400 focus:text-red-300'}`}
          >
            {isBlocked ? <Undo2 className="w-4 h-4 mr-2" /> : <Ban className="w-4 h-4 mr-2" />}
            {isBlocked ? 'Unblock' : 'Block'}
          </DropdownMenuItem>
          {isBlocked && (
            <DropdownMenuItem disabled className="text-xs text-zinc-500 focus:bg-transparent">
              <ShieldCheck className="w-3.5 h-3.5 mr-2" />
              Can't match or message you
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        target={{ userId, name, profileId, context, conversationId, excerpt }}
      />
    </>
  );
}