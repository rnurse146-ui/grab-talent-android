import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2, LifeBuoy } from 'lucide-react';

// Help section embedded in Settings — chat with the Grab Talent assistant.
// Messages asking for a person are forwarded to the team by the helpChat function.
export default function HelpSection() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm the Grab Talent assistant 👋 How can I help you today? If you'd rather speak to a person, just say so and I'll pass your message to the team." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);
    const response = await base44.functions.invoke('helpChat', { message: userMsg, history: messages });
    const reply = response?.data?.reply;
    setMessages(prev => [...prev, { role: 'assistant', content: reply || "Sorry, I couldn't answer that just now." }]);
    setLoading(false);
  };

  return (
    <div className="p-6 bg-zinc-900 rounded-2xl border border-zinc-800">
      <h2 className="font-semibold mb-1 flex items-center gap-2"><LifeBuoy className="w-4 h-4 text-purple-400" />Help</h2>
      <p className="text-zinc-400 text-sm mb-4">Ask anything about Grab Talent — or ask for a person and your message goes straight to the team.</p>

      <div className="h-72 overflow-y-auto rounded-xl bg-zinc-950 border border-zinc-800 p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm leading-relaxed selectable-text ${
              msg.role === 'user' ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-100'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-zinc-800 px-3 py-2 rounded-xl">
              <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="mt-3 flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Ask anything..."
          className="bg-zinc-800 border-zinc-700 text-white rounded-xl"
        />
        <Button onClick={sendMessage} disabled={loading || !input.trim()} size="icon" className="bg-white text-black hover:bg-zinc-100 shrink-0">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}