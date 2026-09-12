import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { KeyRound, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export default function ChangePassword({ user }) {
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const close = () => {
    setOpen(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
  };

  const submit = async () => {
    setError('');
    if (newPassword.length < 8) { setError('New password must be at least 8 characters.'); return; }
    if (newPassword !== confirmPassword) { setError("New passwords don't match."); return; }
    setBusy(true);
    try {
      await base44.auth.changePassword({ userId: user.id, currentPassword, newPassword });
      toast({ title: 'Password updated', description: 'Your password has been changed successfully.' });
      close();
    } catch (e) {
      setError(e?.data?.error || e?.message || 'Could not change password — check your current password and try again.');
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} variant="outline" className="w-full border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800">
        <KeyRound className="w-4 h-4 mr-2" />Change Password
      </Button>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-zinc-400">Current Password</Label>
        <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="bg-zinc-800 border-zinc-700 mt-2 text-white" />
      </div>
      <div>
        <Label className="text-zinc-400">New Password</Label>
        <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 8 characters" className="bg-zinc-800 border-zinc-700 mt-2 text-white" />
      </div>
      <div>
        <Label className="text-zinc-400">Confirm New Password</Label>
        <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="bg-zinc-800 border-zinc-700 mt-2 text-white" />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex gap-3">
        <Button variant="outline" onClick={close} className="flex-1 border-zinc-700 text-zinc-400">Cancel</Button>
        <Button onClick={submit} disabled={busy || !currentPassword || !newPassword || !confirmPassword} className="flex-1 bg-white text-black hover:bg-zinc-100">
          {busy ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Updating…</> : 'Update Password'}
        </Button>
      </div>
    </div>
  );
}