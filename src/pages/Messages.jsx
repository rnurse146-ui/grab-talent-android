import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, Send, Loader2, MessageSquare, ArrowLeft, ShieldCheck, ShieldAlert } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import Logo from '@/components/Logo';
import HelpChat from '@/components/HelpChat';
import { containsContactInfo } from '@/lib/messageFilter';
import PullToRefresh from '@/components/PullToRefresh';

function formatTime(dateStr) {
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, 'HH:mm');
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'dd MMM');
}

function Avatar({ name, photo, size = 10 }) {
  const initials = name?.charAt(0)?.toUpperCase() || '?';
  return (
    <div className={`w-${size} h-${size} rounded-full bg-gradient-to-br from-purple-600/40 to-orange-600/40 border border-slate-700 flex items-center justify-center text-sm font-semibold shrink-0 overflow-hidden`}>
      {photo ? <img src={photo} alt={name} className="w-full h-full object-cover" /> : initials}
    </div>
  );
}

export default function Messages() {
  const urlParams = new URLSearchParams(window.location.search);
  const toUserId = urlParams.get('to');

  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showList, setShowList] = useState(true); // mobile nav
  const [bookingVerified, setBookingVerified] = useState(false);
  const [blockedWarning, setBlockedWarning] = useState('');
  const messagesEndRef = useRef(null);
  const activeConvIdRef = useRef(null);
  const userRef = useRef(null);

  useEffect(() => { loadData(); }, []);

  // Keep ref in sync for use inside subscription callback
  useEffect(() => { activeConvIdRef.current = activeConvId; }, [activeConvId]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const buildConversations = useCallback((allMessages, currentUser) => {
    const convMap = {};
    // Sort oldest first so lastMessage is correct
    const sorted = [...allMessages].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    sorted.forEach(msg => {
      const convId = msg.conversation_id;
      const isMe = msg.sender_id === currentUser.id;
      const otherId = isMe ? msg.receiver_id : msg.sender_id;
      const otherName = isMe ? (msg.receiver_name || 'User') : (msg.sender_name || 'User');
      if (!convMap[convId]) {
        convMap[convId] = { id: convId, otherId, otherName, lastMessage: msg, messages: [], unread: 0 };
      }
      convMap[convId].messages.push(msg);
      convMap[convId].lastMessage = msg;
      if (!isMe && !msg.is_read) convMap[convId].unread++;
    });
    return Object.values(convMap).sort((a, b) => new Date(b.lastMessage.created_date) - new Date(a.lastMessage.created_date));
  }, []);

  const loadData = async () => {
    const currentUser = await base44.auth.me();
    setUser(currentUser);
    userRef.current = currentUser;

    const allMessages = await base44.entities.Message.filter(
      { $or: [{ sender_id: currentUser.id }, { receiver_id: currentUser.id }] },
      '-created_date', 200
    );

    const convList = buildConversations(allMessages, currentUser);
    setConversations(convList);

    let initialConv = null;
    if (toUserId) {
      initialConv = convList.find(c => c.otherId === toUserId);
      if (!initialConv) {
        const newConvId = [currentUser.id, toUserId].sort().join('_');
        initialConv = { id: newConvId, otherId: toUserId, otherName: 'User', messages: [], unread: 0, lastMessage: null };
        setConversations(prev => [initialConv, ...prev]);
      }
    } else if (convList.length > 0) {
      initialConv = convList[0];
    }

    if (initialConv) {
      openConversation(initialConv, currentUser);
      setShowList(false);
    }

    setLoading(false);
  };

  const refreshMessages = async () => {
    const currentUser = userRef.current;
    if (!currentUser) return;
    try {
      const allMessages = await base44.entities.Message.filter(
        { $or: [{ sender_id: currentUser.id }, { receiver_id: currentUser.id }] },
        '-created_date', 200
      );
      const convList = buildConversations(allMessages, currentUser);
      setConversations(convList);
      const activeId = activeConvIdRef.current;
      if (activeId) {
        const conv = convList.find(c => c.id === activeId);
        if (conv) {
          setMessages([...conv.messages].sort((a, b) => new Date(a.created_date) - new Date(b.created_date)));
        }
      }
    } catch (e) {
      // ignore — keep existing data on refresh failure
    }
  };

  const openConversation = async (conv, currentUser) => {
    const cu = currentUser || userRef.current;
    setActiveConvId(conv.id);
    setShowList(false);
    setBlockedWarning('');
    const sorted = [...conv.messages].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    setMessages(sorted);

    // Contact sharing is unlocked once a booking between these users is confirmed/completed
    const otherId = conv.otherId;
    const bookings = await base44.entities.Booking.filter({
      $or: [
        { seeker_id: cu.id, talent_user_id: otherId },
        { seeker_id: otherId, talent_user_id: cu.id }
      ]
    });
    setBookingVerified(bookings.some(b => ['confirmed', 'completed'].includes(b.status)));

    // Mark unread messages as read
    const unreadMsgs = conv.messages.filter(m => !m.is_read && m.receiver_id === cu.id);
    if (unreadMsgs.length > 0) {
      await Promise.all(unreadMsgs.map(m => base44.entities.Message.update(m.id, { is_read: true })));
      setConversations(prev => prev.map(c =>
        c.id === conv.id ? { ...c, unread: 0, messages: c.messages.map(m => ({ ...m, is_read: true })) } : c
      ));
    }
  };

  // Real-time subscription
  useEffect(() => {
    if (!user) return;
    const unsubscribe = base44.entities.Message.subscribe((event) => {
      const msg = event.data;
      if (!msg) return;
      const isForMe = msg.receiver_id === user.id || msg.sender_id === user.id;
      if (!isForMe) return;

      const convId = msg.conversation_id;
      const isActive = activeConvIdRef.current === convId;
      const isMe = msg.sender_id === user.id;

      if (event.type === 'create') {
        // Own messages are added optimistically on send; skip the subscription echo.
        if (isMe) return;
        // Update conversations list
        setConversations(prev => {
          const existing = prev.find(c => c.id === convId);
          const otherId = isMe ? msg.receiver_id : msg.sender_id;
          const otherName = isMe ? (msg.receiver_name || 'User') : (msg.sender_name || 'User');
          const updatedMsg = { ...msg, is_read: isActive ? true : msg.is_read };
          if (existing) {
            return [
              { ...existing, lastMessage: msg, messages: [...existing.messages, msg], unread: isActive || isMe ? 0 : existing.unread + (msg.is_read ? 0 : 1) },
              ...prev.filter(c => c.id !== convId)
            ];
          } else {
            return [{ id: convId, otherId, otherName, lastMessage: msg, messages: [msg], unread: isActive || isMe ? 0 : 1 }, ...prev];
          }
        });

        // Add to active chat
        if (isActive) {
          setMessages(prev => {
            if (prev.find(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          // Mark as read immediately if received
          if (!isMe) base44.entities.Message.update(msg.id, { is_read: true });
        }
      }

      if (event.type === 'update' && isActive) {
        setMessages(prev => prev.map(m => m.id === msg.id ? msg : m));
      }
    });

    return () => unsubscribe();
  }, [user]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConvId) return;
    const content = newMessage.trim();

    // Block phone numbers and social media handles until the booking is confirmed through the app
    if (!bookingVerified) {
      const { blocked, reasons } = containsContactInfo(content);
      if (blocked) {
        setBlockedWarning(`This message was blocked because it contains ${reasons.join(' and ')}. To protect both users, contact details can only be shared once a booking is confirmed through Grab Talent.`);
        return;
      }
    }
    setBlockedWarning('');

    setSending(true);
    const conv = conversations.find(c => c.id === activeConvId);

    const tempId = `temp_${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      conversation_id: activeConvId,
      sender_id: user.id,
      receiver_id: conv.otherId,
      sender_name: user.full_name,
      receiver_name: conv.otherName,
      content,
      is_read: false,
      created_date: new Date().toISOString(),
    };

    // Show the message instantly — don't wait for the server round-trip
    setMessages(prev => [...prev, optimisticMsg]);
    setConversations(prev => {
      const updated = prev.map(c => c.id === activeConvId
        ? { ...c, lastMessage: optimisticMsg, messages: [...c.messages, optimisticMsg] }
        : c);
      return updated.sort((a, b) => new Date(b.lastMessage?.created_date || 0) - new Date(a.lastMessage?.created_date || 0));
    });
    setNewMessage('');

    try {
      const created = await base44.entities.Message.create({
        conversation_id: activeConvId,
        sender_id: user.id,
        receiver_id: conv.otherId,
        sender_name: user.full_name,
        receiver_name: conv.otherName,
        content,
        is_read: false
      });
      // Swap the temp message for the persisted record
      setMessages(prev => prev.map(m => m.id === tempId ? created : m));
      setConversations(prev => prev.map(c => c.id === activeConvId
        ? { ...c, lastMessage: created, messages: c.messages.map(m => m.id === tempId ? created : m) }
        : c));
    } catch (e) {
      // Rollback on failure
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setConversations(prev => prev.map(c => {
        if (c.id !== activeConvId) return c;
        const msgs = c.messages.filter(m => m.id !== tempId);
        return { ...c, messages: msgs, lastMessage: msgs[msgs.length - 1] || c.lastMessage };
      }));
      setNewMessage(content);
      setBlockedWarning('Message failed to send. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const activeConv = conversations.find(c => c.id === activeConvId);
  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread || 0), 0);

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
    </div>
  );

  return (
    <>
    <div className="h-screen bg-black text-white flex flex-col overflow-hidden">
      {/* Top Nav */}
      <div className="flex items-center justify-between px-6 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] border-b border-zinc-800 bg-black shrink-0">
        <Link to={createPageUrl('Dashboard')}>
          <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
            <ChevronLeft className="w-4 h-4 mr-1" />Back
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Logo className="h-12 w-auto" variant="light" />
          {totalUnread > 0 && (
            <span className="bg-white text-black text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
              {totalUnread}
            </span>
          )}
        </div>
        <div className="w-16" />
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar — Conversations */}
        <div className={`
          w-full md:w-80 border-r border-zinc-800 flex flex-col shrink-0
          ${showList ? 'flex' : 'hidden md:flex'}
        `}>
          <div className="px-4 py-3 border-b border-zinc-800">
            <h2 className="font-semibold text-base flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-400" />
              Conversations
              {totalUnread > 0 && (
                <span className="bg-purple-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {totalUnread}
                </span>
              )}
            </h2>
          </div>

          <PullToRefresh onRefresh={refreshMessages} className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3 p-8">
                <MessageSquare className="w-10 h-10 text-slate-700" />
                <p className="text-sm text-center">No conversations yet. Message a talent or seeker to get started.</p>
              </div>
            ) : (
              <div className="py-2">
                {conversations.map(conv => {
                  const isActive = conv.id === activeConvId;
                  return (
                    <button
                      key={conv.id}
                      onClick={() => openConversation(conv)}
                      className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors hover:bg-zinc-800/60 ${isActive ? 'bg-white/10 border-r-2 border-white' : ''}`}
                    >
                      <Avatar name={conv.otherName} size={10} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className={`text-sm truncate ${conv.unread > 0 ? 'font-semibold text-white' : 'font-medium text-slate-200'}`}>
                            {conv.otherName}
                          </p>
                          <p className="text-xs text-slate-500 shrink-0 ml-2">
                            {conv.lastMessage ? formatTime(conv.lastMessage.created_date) : ''}
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className={`text-xs truncate ${conv.unread > 0 ? 'text-slate-300' : 'text-slate-500'}`}>
                            {conv.lastMessage?.content || 'Start a conversation'}
                          </p>
                          {conv.unread > 0 && (
                            <span className="ml-2 bg-purple-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full shrink-0 min-w-[18px] text-center">
                              {conv.unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </PullToRefresh>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col overflow-hidden ${showList ? 'hidden md:flex' : 'flex'}`}>
          {activeConv ? (
            <>
              {/* Chat Header */}
              <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-3 shrink-0 bg-black/80 backdrop-blur-sm">
                <button onClick={() => setShowList(true)} className="md:hidden text-slate-400 hover:text-white">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <Avatar name={activeConv.otherName} size={9} />
                <div>
                  <p className="font-semibold text-sm">{activeConv.otherName}</p>
                  <p className="text-xs text-green-400">● Online</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
                    <MessageSquare className="w-8 h-8 text-slate-700" />
                    <p className="text-sm">Say hello! 👋</p>
                  </div>
                )}
                {messages.map((msg, idx) => {
                  const isMe = msg.sender_id === user.id;
                  const showTime = idx === 0 || (new Date(msg.created_date) - new Date(messages[idx - 1].created_date)) > 5 * 60 * 1000;
                  return (
                    <div key={msg.id}>
                      {showTime && (
                        <p className="text-center text-xs text-slate-600 my-2">
                          {format(new Date(msg.created_date), isToday(new Date(msg.created_date)) ? 'HH:mm' : 'MMM d, HH:mm')}
                        </p>
                      )}
                      <div className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                        {!isMe && <Avatar name={activeConv.otherName} size={7} />}
                        <div className={`selectable-text max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          isMe
                            ? 'bg-gradient-to-br from-purple-600 to-purple-500 text-white rounded-br-sm'
                            : 'bg-slate-800 text-slate-100 rounded-bl-sm'
                        }`}>
                          <p>{msg.content}</p>
                        </div>
                        {isMe && (
                          <span className="text-xs text-slate-600 shrink-0">
                            {msg.is_read ? '✓✓' : '✓'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Contact sharing protection */}
              {!bookingVerified && (
                <div className="px-4 py-2 border-t border-zinc-800 shrink-0 bg-black flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-green-500 shrink-0" />
                  <p className="text-xs text-zinc-500">Contact details are locked until a booking is confirmed through Grab Talent.</p>
                </div>
              )}
              {blockedWarning && (
                <div className="px-4 py-3 border-t border-amber-700/40 shrink-0 bg-amber-950/40 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-200 leading-relaxed">{blockedWarning}</p>
                </div>
              )}

              {/* Input */}
              <div className="px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+4rem)] md:pb-3 border-t border-zinc-800 shrink-0 bg-black">
                <div className="flex gap-2 items-center">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="bg-zinc-900 border-zinc-700 rounded-full px-4"
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={sending || !newMessage.trim()}
                    className="bg-white text-black hover:bg-zinc-100 rounded-full w-10 h-10 p-0 shrink-0"
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-zinc-500">
                <MessageSquare className="w-14 h-14 mx-auto mb-3 text-zinc-700" />
                <p className="font-medium">Select a conversation</p>
                <p className="text-sm mt-1">Choose a chat from the sidebar to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    <HelpChat />
    </>
  );
}