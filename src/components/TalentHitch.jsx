import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mic, X, Loader2, Send, Volume2, VolumeX } from 'lucide-react';
import MobileSheetSelect from '@/components/MobileSheetSelect';

const SYSTEM_PROMPT = `You are "Talent Hitch", the friendly voice guide inside the Grab Talent app — a UK platform connecting event organisers ("seekers") with performers ("talent"). The user hears your replies spoken aloud, so keep them short, warm and conversational (2-4 sentences). Guide people step-by-step. Your personality is warm, confident and easy-going with a little playful charisma — like a friendly film-star narrator cracking a light grin — but always helpful and on-point.

SEEKER FLOW (finding talent):
1. Onboarding: choose "I'm looking for talent", enter your city, optional phone, then finish.
2. Discover is a 3-step search wizard: Step 1 pick performer types (DJ, singer, band, dancer, magician, etc.); Step 2 set the event date (required), city, hourly budget and minimum rating; Step 3 choose equipment the performer must bring and toggle "verified only". Then swipe through talent cards — swipe right to save to the Maybe List, left to pass, tap the arrow to book, or "View full profile" for more.
3. Booking: pick the talent, fill event name, type, date, start/end time, venue and special requests, then send the request (pending). The talent accepts or declines, then it's confirmed.
4. After the event: the seeker confirms the talent arrived, payment is released, and both sides leave a rating and review.

TALENT FLOW (getting booked):
1. Onboarding: choose "I'm a talent", enter city, optional phone.
2. TalentSetup has 5 steps: Step 1 stage name + category + bio; Step 2 upload a profile photo and optional intro video or music sample, plus a gallery; Step 3 hourly rate, minimum hours, travel radius, experience and specialties; Step 4 equipment provided and a last-minute availability toggle; Step 5 add social links and get a shareable profile link.
3. Get ID-verified for a verified badge (Verification page).
4. Set availability by blocking dates you can't work (Availability page).
5. Receive booking requests on the dashboard, accept or decline them, then after the event you're paid 89% — the platform keeps an 11% commission.

KEY RULES: Talent CANNOT browse seekers, gigs or venues — they get discovered by seekers and receive booking requests. To get booked, tell talent to complete their profile, keep availability updated, turn on last-minute availability, get verified, and share their profile link. Phone numbers and social media handles are blocked in chat until a booking is confirmed. The platform is currently free to use. If asked something outside Grab Talent, gently steer back to getting them set up or searching.`;

const PAGE_HINTS = {
  '/Onboarding': 'The user is currently on onboarding, choosing whether they are a seeker or talent and entering their city.',
  '/Discover': 'The user is currently on Discover, the talent search wizard (3 steps: performer types, event date/budget/rating, equipment/verified) and the swipe feed.',
  '/TalentSetup': 'The user is currently on TalentSetup, creating or editing their talent profile across 5 steps.',
};

function pickVoice(voices) {
  const maleNames = /(male|daniel|george|ryan|arthur|oliver|guy|fred|james|brian)/i;
  return voices.find(v => maleNames.test(v.name) && v.lang === 'en-GB')
    || voices.find(v => maleNames.test(v.name) && v.lang.startsWith('en'))
    || voices.find(v => v.lang === 'en-GB')
    || voices.find(v => v.lang && v.lang.startsWith('en'));
}

function speak(text, muted) {
  if (muted || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-GB';
  const voice = pickVoice(window.speechSynthesis.getVoices());
  if (voice) u.voice = voice;
  u.rate = 0.95;   // smooth, easy-going pace
  u.pitch = 0.85;  // warm, mid-deep tone
  u.volume = 1;
  window.speechSynthesis.speak(u);
}

const VOICES = [
  { value: 'honey', label: 'Honey — warm & smooth' },
  { value: 'river', label: 'River — calm & neutral' },
  { value: 'storm', label: 'Storm — deep & authoritative' },
  { value: 'sunny', label: 'Sunny — bright & upbeat' },
  { value: 'spark', label: 'Spark — energetic' },
  { value: 'browser', label: 'Browser (instant)' },
];

export default function TalentHitch() {
  const location = useLocation();
  const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
  const supported = !!SpeechRecognition;

  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [muted, setMuted] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hey! I'm Talent Hitch, your voice guide. Tap the mic and ask me anything — like 'how do I find a DJ?' or 'what should I put in my profile?' 🎙️" }
  ]);
  const recRef = useRef(null);
  const bottomRef = useRef(null);
  const audioRef = useRef(null);
  const [voice, setVoice] = useState('honey');

  useEffect(() => { if ('speechSynthesis' in window) window.speechSynthesis.getVoices(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const playReply = async (text) => {
    if (muted) return;
    if (voice === 'browser') { speak(text, false); return; }
    try {
      audioRef.current?.pause();
      const res = await base44.integrations.Core.GenerateSpeech({ text, voice, language_code: 'en' });
      const url = res?.url || res?.file_url;
      if (!url) return;
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.play().catch(() => {});
    } catch (e) {
      speak(text, false);
    }
  };

  const handleSend = async (text) => {
    const userMsg = (text || '').trim();
    if (!userMsg || loading) return;
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setLoading(true);
    const history = messages.map(m => `${m.role === 'user' ? 'User' : 'Talent Hitch'}: ${m.content}`).join('\n');
    const pageHint = PAGE_HINTS[location.pathname] || '';
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `${SYSTEM_PROMPT}\n\n${pageHint}\n\nConversation so far:\n${history}\n\nUser: ${userMsg}\n\nTalent Hitch (reply in 2-4 short spoken sentences):`
      });
      const reply = typeof response === 'string' ? response : (response?.response || 'Sorry, I did not catch that.');
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      playReply(reply);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I couldn't connect just now. Try again in a moment." }]);
    }
    setLoading(false);
  };

  const toggleListen = () => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    if (listening) { try { recRef.current?.stop(); } catch {} setListening(false); return; }
    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-GB';
    rec.onresult = (e) => handleSend(e.results[0][0].transcript);
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    try { rec.start(); setListening(true); } catch {}
  };

  const submitText = (e) => { e.preventDefault(); handleSend(input); };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed fab-bottom left-6 z-50 flex items-center gap-2 h-14 pl-4 pr-5 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-2xl hover:scale-105 transition-transform"
        aria-label="Talent Hitch voice guide"
      >
        <Mic className="w-5 h-5" />
        <span className="font-semibold text-sm">Talent Hitch</span>
      </button>

      {open && (
        <div className="fixed fab-panel-bottom left-6 z-50 w-[calc(100vw-3rem)] max-w-sm h-[28rem] bg-zinc-950 border border-purple-800/60 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="px-4 py-3 bg-gradient-to-r from-purple-700 to-fuchsia-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"><Mic className="w-4 h-4 text-white" /></div>
              <div>
                <p className="font-semibold text-sm text-white leading-tight">Talent Hitch</p>
                <p className="text-[10px] text-purple-100 leading-tight">Voice guide · {supported ? 'tap mic to speak' : 'type below'}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setMuted(!muted)} className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center text-white">
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="px-4 py-2 border-b border-zinc-800 flex items-center gap-2">
            <span className="text-[10px] text-zinc-500 shrink-0">Voice</span>
            <MobileSheetSelect
              value={voice}
              onChange={setVoice}
              options={VOICES}
              title="Voice"
              triggerClassName="h-7 text-xs bg-zinc-900 border-zinc-700 flex-1"
            />
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-100'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-zinc-800 px-3 py-2 rounded-2xl"><Loader2 className="w-4 h-4 animate-spin text-purple-400" /></div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={submitText} className="px-3 py-3 border-t border-zinc-800 flex items-center gap-2">
            {supported && (
              <button type="button" onClick={toggleListen} className={`shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all ${listening ? 'bg-red-500 animate-pulse' : 'bg-purple-600 hover:bg-purple-500'} text-white`}>
                <Mic className="w-5 h-5" />
              </button>
            )}
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={supported ? "Or type a question..." : "Type a question..."}
              className="bg-zinc-900 border-zinc-700 text-sm rounded-xl flex-1"
            />
            <Button type="submit" disabled={loading || !input.trim()} size="icon" className="bg-white text-black hover:bg-zinc-100 shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}