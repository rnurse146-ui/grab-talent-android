import React from 'react';
import { Users, Plus } from 'lucide-react';

// Groups formed from Talent Connect matches, listed above direct chats.
export default function CollabGroupList({ groups, activeGroupId, onOpen, onNew }) {
  return (
    <div className="border-b border-zinc-800 bg-zinc-950/40">
      <div className="flex items-center justify-between px-4 py-2.5">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-purple-300 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> Collab chats
          </p>
          <p className="text-[10px] text-zinc-500 mt-0.5">Collaborations — separate from bookings</p>
        </div>
        <button
          type="button"
          onClick={onNew}
          className="flex items-center gap-1 text-xs font-semibold text-purple-300 hover:text-white transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> New
        </button>
      </div>

      {groups.length > 0 && (
        <div className="max-h-44 overflow-y-auto pb-2">
          {groups.map(group => (
            <button
              key={group.id}
              type="button"
              onClick={() => onOpen(group)}
              className={`w-full px-4 py-2 flex items-center gap-3 text-left transition-colors hover:bg-zinc-800/60 ${
                group.id === activeGroupId ? 'bg-white/10 border-r-2 border-white' : ''
              }`}
            >
              <div className="w-9 h-9 rounded-full bg-purple-600/20 border border-purple-700/60 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 text-purple-300" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-100 truncate">{group.name}</p>
                  <span className="text-xs text-zinc-500 shrink-0">{group.member_ids?.length || 0}</span>
                </div>
                <p className="text-xs text-zinc-500 truncate">
                  {group.last_message
                    ? `${group.last_message.sender_name}: ${group.last_message.content}`
                    : 'No messages yet'}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}