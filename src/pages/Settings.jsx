import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronLeft, User, MapPin, Phone, LogOut, Loader2, Check } from 'lucide-react';
import PageHeader from '@/components/PageHeader';

export default function Settings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({ full_name: '', phone: '', preferred_city: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const currentUser = await base44.auth.me();
    setUser(currentUser);
    setFormData({ full_name: currentUser.full_name || '', phone: currentUser.phone || '', preferred_city: currentUser.preferred_city || '' });
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await base44.auth.updateMe(formData);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogout = () => {
    base44.auth.logout(createPageUrl('Home'));
  };

  if (loading) return (<div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-white" /></div>);

  return (
    <div className="min-h-screen bg-black text-white">
      <PageHeader backTo={createPageUrl('Dashboard')} />

      <div className="max-w-lg mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-8">Settings</h1>

        <div className="space-y-6">
          <div className="p-6 bg-zinc-900 rounded-2xl border border-zinc-800">
            <h2 className="font-semibold mb-4 flex items-center gap-2"><User className="w-4 h-4 text-purple-400" />Profile</h2>
            <div className="space-y-4">
              <div><Label className="text-zinc-400">Full Name</Label><Input value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} className="bg-zinc-800 border-zinc-700 mt-2 text-white placeholder:text-zinc-500" /></div>
              <div><Label className="text-zinc-400">Email</Label><Input value={user?.email || ''} disabled className="bg-zinc-800 border-zinc-700 mt-2 text-white placeholder:text-zinc-500 opacity-50" /></div>
              <div><Label className="text-zinc-400">Phone</Label><Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="+44 7XXX" className="bg-zinc-800 border-zinc-700 mt-2 text-white placeholder:text-zinc-500" /></div>
              <div><Label className="text-zinc-400">City</Label><Input value={formData.preferred_city} onChange={(e) => setFormData({...formData, preferred_city: e.target.value})} placeholder="London" className="bg-zinc-800 border-zinc-700 mt-2 text-white placeholder:text-zinc-500" /></div>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full mt-6 bg-white text-black hover:bg-zinc-100">
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : saved ? <><Check className="w-4 h-4 mr-2" />Saved!</> : 'Save Changes'}
            </Button>
          </div>

          <div className="p-6 bg-zinc-900 rounded-2xl border border-zinc-800">
            <h2 className="font-semibold mb-4">Account</h2>
            <p className="text-zinc-400 text-sm mb-4">You're signed in as {user?.email}</p>
            <Button onClick={handleLogout} className="w-full bg-zinc-900 border border-red-500/50 text-red-400 hover:bg-red-500/20"><LogOut className="w-4 h-4 mr-2" />Sign Out</Button>
          </div>
        </div>
      </div>
    </div>
  );
}