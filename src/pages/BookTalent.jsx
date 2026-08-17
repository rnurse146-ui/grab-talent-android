import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, Calendar as CalendarIcon, Clock, MapPin, Banknote, Loader2, CheckCircle2, Star, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import PageHeader from '@/components/PageHeader';

const EVENT_TYPES = [
  { value: 'wedding', label: 'Wedding' },
  { value: 'corporate', label: 'Corporate Event' },
  { value: 'birthday', label: 'Birthday Party' },
  { value: 'club', label: 'Club Night' },
  { value: 'pub', label: 'Pub/Bar' },
  { value: 'festival', label: 'Festival' },
  { value: 'private_party', label: 'Private Party' },
  { value: 'charity', label: 'Charity Event' },
  { value: 'other', label: 'Other' },
];

export default function BookTalent() {
  const urlParams = new URLSearchParams(window.location.search);
  const talentId = urlParams.get('talent_id');
  const prefillDate = urlParams.get('event_date');

  const [talent, setTalent] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const initialDate = prefillDate ? new Date(prefillDate + 'T12:00:00') : null;
  const [formData, setFormData] = useState({ event_name: '', event_type: '', event_date: initialDate, start_time: '', end_time: '', venue_name: '', venue_address: '', venue_city: '', special_requirements: '', seeker_phone: '' });
  const [calendarMonth, setCalendarMonth] = useState(initialDate || new Date());

  useEffect(() => { loadData(); }, [talentId]);

  const loadData = async () => {
    const currentUser = await base44.auth.me();
    setUser(currentUser);
    setFormData(prev => ({ ...prev, seeker_phone: currentUser.phone || '' }));
    if (talentId) {
      const profiles = await base44.entities.TalentProfile.filter({ id: talentId });
      if (profiles.length > 0) setTalent(profiles[0]);
    }
    setLoading(false);
  };

  const calculatePricing = () => {
    if (!talent || !formData.start_time || !formData.end_time) return null;
    const start = parseInt(formData.start_time.split(':')[0]);
    const end = parseInt(formData.end_time.split(':')[0]);
    let hours = end - start;
    if (hours < 0) hours += 24;
    if (hours < talent.minimum_hours) hours = talent.minimum_hours;
    const basePrice = hours * talent.hourly_rate;
    const commission = basePrice * 0.11;
    return { hours, basePrice, commission, total: basePrice + commission };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const pricing = calculatePricing();
    await base44.entities.Booking.create({
      talent_profile_id: talent.id, seeker_id: user.id, talent_user_id: talent.user_id,
      event_name: formData.event_name, event_type: formData.event_type,
      event_date: formData.event_date ? format(formData.event_date, 'yyyy-MM-dd') : '',
      start_time: formData.start_time, end_time: formData.end_time, duration_hours: pricing.hours,
      venue_name: formData.venue_name, venue_address: formData.venue_address, venue_city: formData.venue_city,
      special_requirements: formData.special_requirements,
      base_price: pricing.basePrice, commission_amount: pricing.commission, total_price: pricing.total, talent_payout: pricing.basePrice,
      status: 'pending', payment_status: 'pending',
      seeker_name: user.full_name, seeker_phone: formData.seeker_phone,
      talent_stage_name: talent.stage_name, talent_category: talent.talent_category
    });
    setSuccess(true);
    setSubmitting(false);
  };

  if (loading) return (<div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-white" /></div>);
  if (!talent) return (<div className="min-h-screen bg-black text-white flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold mb-4">Talent not found</h1><Link to={createPageUrl('Discover')}><Button>Find Talent</Button></Link></div></div>);

  if (success) return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6"><CheckCircle2 className="w-10 h-10 text-green-500" /></div>
        <h1 className="text-2xl font-bold mb-2">Booking Request Sent!</h1>
        <p className="text-zinc-400 mb-6">Your booking request has been sent to {talent.stage_name}. They'll review and respond soon.</p>
        <div className="flex gap-3 justify-center">
          <Link to={createPageUrl('Bookings')}><Button className="bg-white text-black hover:bg-zinc-100">View Bookings</Button></Link>
          <Link to={createPageUrl('Dashboard')}><Button variant="outline" className="border-zinc-700">Dashboard</Button></Link>
        </div>
      </div>
    </div>
  );

  const pricing = calculatePricing();

  return (
    <div className="min-h-screen bg-black text-white">
      <PageHeader backTo={createPageUrl('TalentProfile') + `?id=${talentId}`} />

      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-8 p-4 bg-zinc-900 rounded-2xl border border-zinc-800">
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-800">
            {talent.profile_photo ? (<img src={talent.profile_photo} alt="" className="w-full h-full object-cover" />) : (<div className="w-full h-full flex items-center justify-center text-2xl">🎭</div>)}
          </div>
          <div>
            <h2 className="font-semibold text-lg">{talent.stage_name}</h2>
            <p className="text-zinc-400 text-sm capitalize">{talent.talent_category?.replace(/_/g, ' ')}</p>
            <div className="flex items-center gap-3 text-sm text-zinc-400 mt-1">
              <span>£{talent.hourly_rate}/hr</span><span>•</span><span>Min {talent.minimum_hours}h</span>
              {talent.average_rating && (<><span>•</span><span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />{talent.average_rating.toFixed(1)}</span></>)}
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-6">Book {talent.stage_name}</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label className="text-zinc-400">Event Name</Label><Input value={formData.event_name} onChange={(e) => setFormData({...formData, event_name: e.target.value})} placeholder="e.g. Sarah's Wedding" className="bg-zinc-900 border-zinc-800 mt-2" required /></div>
            <div><Label className="text-zinc-400">Event Type</Label><Select value={formData.event_type} onValueChange={(v) => setFormData({...formData, event_type: v})} required><SelectTrigger className="bg-slate-900 border-slate-800 mt-2"><SelectValue placeholder="Select type" /></SelectTrigger><SelectContent className="bg-slate-900 border-slate-800">{EVENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></div>
          </div>

          <div>
            <Label className="text-zinc-400">Event Date</Label>
            {formData.event_date && (
              <p className="text-sm text-purple-400 mt-1">
                Selected: {format(formData.event_date, 'EEEE, MMMM d yyyy')}
              </p>
            )}
            <div className="mt-2">
              <Calendar
                mode="single"
                selected={formData.event_date}
                onSelect={(date) => setFormData({...formData, event_date: date})}
                month={calendarMonth}
                onMonthChange={setCalendarMonth}
                disabled={(date) => date < new Date()}
                className="rounded-xl border border-zinc-800 bg-zinc-900 p-3"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label className="text-zinc-400">Start Time</Label><Input type="time" value={formData.start_time} onChange={(e) => setFormData({...formData, start_time: e.target.value})} className="bg-zinc-900 border-zinc-800 mt-2" required /></div>
            <div><Label className="text-zinc-400">End Time</Label><Input type="time" value={formData.end_time} onChange={(e) => setFormData({...formData, end_time: e.target.value})} className="bg-zinc-900 border-zinc-800 mt-2" required /></div>
          </div>

          <div><Label className="text-zinc-400">Venue Name</Label><Input value={formData.venue_name} onChange={(e) => setFormData({...formData, venue_name: e.target.value})} placeholder="e.g. The Grand Hotel" className="bg-zinc-900 border-zinc-800 mt-2" required /></div>
          <div><Label className="text-zinc-400">Venue Address</Label><Input value={formData.venue_address} onChange={(e) => setFormData({...formData, venue_address: e.target.value})} placeholder="Full address" className="bg-zinc-900 border-zinc-800 mt-2" required /></div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label className="text-zinc-400">City</Label><Input value={formData.venue_city} onChange={(e) => setFormData({...formData, venue_city: e.target.value})} placeholder="e.g. London" className="bg-zinc-900 border-zinc-800 mt-2" required /></div>
            <div><Label className="text-zinc-400">Your Phone</Label><Input value={formData.seeker_phone} onChange={(e) => setFormData({...formData, seeker_phone: e.target.value})} placeholder="+44 7XXX" className="bg-zinc-900 border-zinc-800 mt-2" /></div>
          </div>

          <div><Label className="text-zinc-400">Special Requirements (optional)</Label><Textarea value={formData.special_requirements} onChange={(e) => setFormData({...formData, special_requirements: e.target.value})} placeholder="Any special requests..." className="bg-zinc-900 border-zinc-800 mt-2 h-24" /></div>

          <div className="p-4 rounded-2xl bg-green-950/40 border border-green-700/40">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-200 text-sm">Booking Protection included</p>
                <p className="text-xs text-green-200/70 mt-1 leading-relaxed">If your talent cancels with less than 7 days' notice, we'll refund your money back as soon as we're notified — no hassle, no chasing.</p>
              </div>
            </div>
          </div>

          <Button type="submit" disabled={submitting || !formData.event_date} className="w-full h-12 bg-white text-black hover:bg-zinc-100 text-base font-semibold">
            {submitting ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Sending...</> : 'Send Booking Request'}
          </Button>
        </form>
      </div>
    </div>
  );
}