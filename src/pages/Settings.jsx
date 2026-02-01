import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronLeft, User, MapPin, Phone, LogOut, Loader2, Check } from 'lucide-react';
import Logo from '@/components/Logo';

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

  if (loading) return (<div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <Link to={createPageUrl('Dashboard')}><Button variant="ghost" size="sm" className="text-slate-400"><ChevronLeft className="w-4 h-4 mr-1" />Back</Button></Link>
        <Logo className="h-8 w-auto" />
        <div className="w-16" />
      </div>

      <div className="max-w-lg mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-8">Settings</h1>

        <div className="space-y-6">
          <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800">
            <h2 className="font-semibold mb-4 flex items-center gap-2"><User className="w-4 h-4 text-purple-400" />Profile</h2>
            <div className="space-y-4">
              <div><Label className="text-slate-400">Full Name</Label><Input value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} className="bg-slate-800 border-slate-700 mt-2" /></div>
              <div><Label className="text-slate-400">Email</Label><Input value={user?.email || ''} disabled className="bg-slate-800 border-slate-700 mt-2 opacity-50" /></div>
              <div><Label className="text-slate-400">Phone</Label><Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="+44 7XXX" className="bg-slate-800 border-slate-700 mt-2" /></div>
              <div><Label className="text-slate-400">City</Label><Input value={formData.preferred_city} onChange={(e) => setFormData({...formData, preferred_city: e.target.value})} placeholder="London" className="bg-slate-800 border-slate-700 mt-2" /></div>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full mt-6 bg-purple-600 hover:bg-purple-500">
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : saved ? <><Check className="w-4 h-4 mr-2" />Saved!</> : 'Save Changes'}
            </Button>
          </div>

          <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800">
            <h2 className="font-semibold mb-4">Account</h2>
            <p className="text-slate-400 text-sm mb-4">You're signed in as {user?.email}</p>
            <Button onClick={handleLogout} variant="outline" className="w-full border-red-500/50 text-red-400 hover:bg-red-500/20"><LogOut className="w-4 h-4 mr-2" />Sign Out</Button>
          </div>
        </div>
      </div>
    </div>
  );
}