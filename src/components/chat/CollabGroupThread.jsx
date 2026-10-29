import React, { useEffect, useRef, useState } from 'react';
import { format, isToday } from 'date-fns';
import { ArrowLeft, Loader2, LogOut, Pencil, Send, UserPlus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import AddCollabMembersDialog from '@/components/chat/AddCollabMembersDialog';
import { leaveCollabGroup, loadCollabThread, renameCollabGroup, sendCollabMessage } from '@/lib/collabGroups';

const initials = (name) => name?.charAt(0)?.toUpperCase() || '?';

// The group thread for a Talent Connect collab. Messages are read and written
// through the collabGroups function, which checks membership server-side.
export default function CollabGroupThread({ groupId, user, initialGroup, onBack, onLeft, onGroupChange }) {
  const [group, setGroup] = useState(initialGroup || null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const endRef = useRef(null);

  // Anyone in the group can rename it — the new name shows for every member.
  const startRename = () => {
    setNameDraft(group?.name || '');
    setEditingName(true);
  };

  // Leave the collab — the backend removes your membership, and in a two-person
  // collab it disconnects the pair while keeping this chat and its history.
  const leave = async () => {
    if (leaving) return;
    setLeaving(true);
    setError('');
    try {
      await leaveCollabGroup(groupId);
      onLeft?.();
    } catch (e) {
      setError(e?.response?.data?.error || 'Could not leave this collab.');
    } finally {
      setLeaving(false);
    }
  };

  const saveName = async () => {
    const name = nameDraft.trim();
    if (!name || savingName) return;
    setSavingName(true);
    setError('');
    try {
      const updated = await renameCollabGroup(groupId, name);
      setGroup(prev => ({ ...(prev || {}), ...(updated || { name }) }));
      setEditingName(false);
    } catch (e) {
      setError(e?.response?.data?.error || 'Could not rename the group.');
    } finally {
      setSavingName(false);
    }
  };

  useEffect(() => {
    let active = true;
    const load = async (silent) => {
      if (!silent) setLoading(true);
      try {
        const thread = await loadCollabThread(groupId);
        if (!active) return;
        setGroup(thread.group);
        setMessages(thread.messages);
      } catch (e) {
        if (active && !silent) setError(e?.response?.data?.error || 'Could not load this group.');
      } finally {
        if (active && !silent) setLoading(false);
      }
    };
    load();
    const timer = setInterval(() => load(true), 10000);
    return () => { active = false; clearInterval(timer); };
  }, [groupId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const content = draft.trim();
    if (!content || sending) return;
    setSending(true);
    setError('');
    setDraft('');
    const optimistic = {
      id: `temp_${Date.now()}`,
      sender_id: user.id,
      sender_name: user.full_name,
      content,
      created_date: new Date().toISOString()
    };
    setMessages(prev => [...prev, optimistic]);
    try {
      const created = await sendCollabMessage(groupId, content);
      setMessages(prev => prev.map(m => (m.id === optimistic.id ? created : m)));
    } catch (e) {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
      setDraft(content);
      setError(e?.response?.data?.error || 'Message not sent. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-3 shrink-0 bg-black/80 backdrop-blur-sm">
        <button onClick={onBack} className="md:hidden text-slate-400 hover:text-white" aria-label="Back">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-9 h-9 rounded-full bg-purple-600/20 border border-purple-700/60 flex items-center justify-center shrink-0">
          <Users className="w-4 h-4 text-purple-300" />
        </div>
        <div className="min-w-0 flex-1">
          {editingName ? (
            <div className="flex items-center gap-2">
              <Input
                autoFocus
                value={nameDraft}
                maxLength={60}
                onChange={(e) => setNameDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveName();
                  if (e.key === 'Escape') setEditingName(false);
                }}
                className="h-8 bg-zinc-900 border-zinc-700 text-sm px-2"
              />
              <button
                type="button"
                onClick={saveName}
                disabled={savingName || !nameDraft.trim()}
                className="text-xs font-semibold text-purple-300 hover:text-white disabled:opacity-50 shrink-0"
              >
                {savingName ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => setEditingName(false)}
                className="text-xs text-zinc-500 hover:text-white shrink-0"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 min-w-0">
              <p className="font-semibold text-sm truncate">{group?.name || 'Collab group'}</p>
              <button
                type="button"
                onClick={startRename}
                aria-label="Rename group"
                title="Rename group"
                className="text-zinc-500 hover:text-white shrink-0"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <p className="text-xs text-zinc-500 truncate">
            <span className="text-purple-300 font-semibold">Collab chat</span>
            {' · '}
            {(group?.member_names || []).join(' · ') || 'Talent Network collab'}
          </p>
        </div>

        <div className="ml-auto flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            aria-label="Add talent to this collab"
            title="Add talent to this collab"
            className="p-2 text-zinc-400 hover:text-white"
          >
            <UserPlus className="w-4 h-4" />
          </button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                type="button"
                aria-label="Leave this collab"
                title="Leave this collab"
                className="p-2 text-zinc-400 hover:text-red-400"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-zinc-950 border-zinc-800 text-white">
              <AlertDialogHeader>
                <AlertDialogTitle>Leave this collab?</AlertDialogTitle>
                <AlertDialogDescription className="text-zinc-400">
                  With more than two performers you're taken out of the group. If it's just the two of you,
                  you'll be disconnected on Talent Network — this chat and its history stay open.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-zinc-700 bg-transparent text-white hover:bg-zinc-900">
                  Stay
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={leave}
                  disabled={leaving}
                  className="bg-red-600 text-white hover:bg-red-500"
                >
                  {leaving ? 'Leaving…' : 'Leave collab'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
            <Users className="w-8 h-8 text-slate-700" />
            <p className="text-sm">Start planning your collab</p>
          </div>
        ) : (
          messages.map(msg => {
            const isMe = msg.sender_id === user.id;
            return (
              <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                {!isMe && (
                  <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-semibold shrink-0">
                    {initials(msg.sender_name)}
                  </div>
                )}
                <div className="max-w-[75%]">
                  {!isMe && <p className="text-xs text-zinc-500 mb-0.5 ml-1">{msg.sender_name}</p>}
                  <div className={`selectable-text px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isMe
                      ? 'bg-gradient-to-br from-purple-600 to-purple-500 text-white rounded-br-sm'
                      : 'bg-slate-800 text-slate-100 rounded-bl-sm'
                  }`}>
                    <p>{msg.content}</p>
                  </div>
                  <p className={`text-[10px] text-zinc-600 mt-0.5 ${isMe ? 'text-right mr-1' : 'ml-1'}`}>
                    {format(new Date(msg.created_date), isToday(new Date(msg.created_date)) ? 'HH:mm' : 'MMM d, HH:mm')}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {error && (
        <div className="px-4 py-2 border-t border-amber-700/40 shrink-0 bg-amber-950/40">
          <p className="text-xs text-amber-200">{error}</p>
        </div>
      )}

      <div className="px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+4rem)] md:pb-3 border-t border-zinc-800 shrink-0 bg-black">
        <div className="flex gap-2 items-center">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Message the group..."
            className="bg-zinc-900 border-zinc-700 rounded-full px-4"
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
          />
          <Button
            onClick={send}
            disabled={sending || !draft.trim()}
            className="bg-white text-black hover:bg-zinc-100 rounded-full w-10 h-10 p-0 shrink-0"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <AddCollabMembersDialog
        open={showAdd}
        onOpenChange={setShowAdd}
        group={group}
        onAdded={(updated) => {
          if (updated) setGroup(prev => ({ ...(prev || {}), ...updated }));
          onGroupChange?.();
        }}
      />
    </>
  );
}