import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronLeft, User, MapPin, Phone, LogOut, Loader2, Check, Trash2, AlertTriangle } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { toast } from '@/components/ui/use-toast';

export default function Settings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
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

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const res = await base44.functions.invoke('deleteAccount', {});
      if (res?.status && res.status >= 400) throw new Error(res.data?.error || 'Failed to delete account');
      toast({ title: 'Account deleted', description: 'Your account has been permanently removed.' });
      base44.auth.logout(createPageUrl('Home'));
    } catch (e) {
      setDeleting(false);
      toast({ title: 'Could not delete account', description: e?.data?.error || e.message || 'Please try again or contact support.', variant: 'destructive' });
    }
  };

  if (loading) return (<div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-white" /></div>);

  return (
    <div className="min-h-screen bg-black text-white">
      <PageHeader showBack={false} />

      <div className="max-w-lg mx-auto px-6 pt-8 pb-24 md:pb-8">
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

          <div className="p-6 bg-red-950/30 rounded-2xl border border-red-800/50">
            <h2 className="font-semibold mb-2 flex items-center gap-2 text-red-300"><AlertTriangle className="w-4 h-4" />Danger Zone</h2>
            <p className="text-zinc-400 text-sm mb-4">Permanently delete your account, profile, bookings and messages. This cannot be undone.</p>
            <Button onClick={() => { setDeleteOpen(true); setDeleteConfirm(''); }} variant="outline" className="w-full border-red-500/50 text-red-400 hover:bg-red-500/20">
              <Trash2 className="w-4 h-4 mr-2" />Delete Account
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-400" />Delete account permanently?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              This will permanently erase your account, talent profile, bookings and messages. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div>
            <Label className="text-zinc-400">Type <span className="text-red-400 font-bold">DELETE</span> to confirm</Label>
            <Input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="DELETE"
              className="bg-zinc-800 border-zinc-700 mt-2 text-white"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700">Cancel</AlertDialogCancel>
            <Button
              disabled={deleteConfirm !== 'DELETE' || deleting}
              onClick={handleDeleteAccount}
              className="bg-red-600 text-white hover:bg-red-500"
            >
              {deleting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Deleting...</> : 'Delete my account'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}