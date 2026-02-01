import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, Send, Loader2, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import Logo from '@/components/Logo';

export default function Messages() {
  const urlParams = new URLSearchParams(window.location.search);
  const toUserId = urlParams.get('to');

  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const currentUser = await base44.auth.me();
    setUser(currentUser);
    
    const allMessages = await base44.entities.Message.filter(
      { $or: [{ sender_id: currentUser.id }, { receiver_id: currentUser.id }] },
      '-created_date'
    );
    
    // Group by conversation
    const convMap = {};
    allMessages.forEach(msg => {
      const convId = msg.conversation_id;
      if (!convMap[convId]) {
        const otherId = msg.sender_id === currentUser.id ? msg.receiver_id : msg.sender_id;
        const otherName = msg.sender_id === currentUser.id ? msg.receiver_id : msg.sender_name;
        convMap[convId] = { id: convId, otherId, otherName: otherName || 'User', lastMessage: msg, messages: [] };
      }
      convMap[convId].messages.push(msg);
    });
    
    const convList = Object.values(convMap).sort((a, b) => new Date(b.lastMessage.created_date) - new Date(a.lastMessage.created_date));
    setConversations(convList);
    
    if (toUserId) {
      const existingConv = convList.find(c => c.otherId === toUserId);
      if (existingConv) {
        setActiveConversation(existingConv);
        setMessages(existingConv.messages.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)));
      } else {
        const newConvId = `${currentUser.id}_${toUserId}`;
        setActiveConversation({ id: newConvId, otherId: toUserId, otherName: 'User', messages: [] });
        setMessages([]);
      }
    } else if (convList.length > 0) {
      setActiveConversation(convList[0]);
      setMessages(convList[0].messages.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)));
    }
    
    setLoading(false);
  };

  const selectConversation = (conv) => {
    setActiveConversation(conv);
    setMessages(conv.messages.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)));
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConversation) return;
    setSending(true);
    
    const msg = await base44.entities.Message.create({
      conversation_id: activeConversation.id,
      sender_id: user.id,
      receiver_id: activeConversation.otherId,
      sender_name: user.full_name,
      content: newMessage,
      is_read: false
    });
    
    setMessages(prev => [...prev, msg]);
    setNewMessage('');
    setSending(false);
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) return (<div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <Link to={createPageUrl('Dashboard')}><Button variant="ghost" size="sm" className="text-slate-400"><ChevronLeft className="w-4 h-4 mr-1" />Back</Button></Link>
        <Logo className="h-8 w-auto" />
        <div className="w-16" />
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Conversations List */}
        <div className="w-80 border-r border-slate-800 overflow-y-auto hidden md:block">
          <div className="p-4"><h2 className="font-semibold text-lg">Messages</h2></div>
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-slate-400"><MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-600" /><p className="text-sm">No messages yet</p></div>
          ) : (
            <div className="space-y-1 p-2">
              {conversations.map(conv => (
                <button key={conv.id} onClick={() => selectConversation(conv)} className={`w-full p-3 rounded-xl text-left transition-colors ${activeConversation?.id === conv.id ? 'bg-purple-500/20' : 'hover:bg-slate-800'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-sm font-medium">{conv.otherName?.charAt(0)?.toUpperCase() || '?'}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{conv.otherName}</p>
                      <p className="text-xs text-slate-400 truncate">{conv.lastMessage?.content}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {activeConversation ? (
            <>
              <div className="p-4 border-b border-slate-800">
                <h3 className="font-semibold">{activeConversation.otherName}</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] px-4 py-2 rounded-2xl ${msg.sender_id === user.id ? 'bg-purple-600' : 'bg-slate-800'}`}>
                      <p>{msg.content}</p>
                      <p className="text-xs opacity-60 mt-1">{format(new Date(msg.created_date), 'HH:mm')}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-4 border-t border-slate-800">
                <div className="flex gap-2">
                  <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." className="bg-slate-900 border-slate-700" onKeyPress={(e) => e.key === 'Enter' && sendMessage()} />
                  <Button onClick={sendMessage} disabled={sending || !newMessage.trim()} className="bg-purple-600 hover:bg-purple-500"><Send className="w-4 h-4" /></Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center"><div className="text-center text-slate-400"><MessageSquare className="w-12 h-12 mx-auto mb-3 text-slate-600" /><p>Select a conversation or start a new one</p></div></div>
          )}
        </div>
      </div>
    </div>
  );
}