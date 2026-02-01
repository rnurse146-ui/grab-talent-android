import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Shield, Upload, Camera, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import Logo from '@/components/Logo';

export default function Verification() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [idUrl, setIdUrl] = useState('');
  const [selfieUrl, setSelfieUrl] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const currentUser = await base44.auth.me();
    setUser(currentUser);
    const profiles = await base44.entities.TalentProfile.filter({ user_id: currentUser.id });
    if (profiles.length > 0) {
      setProfile(profiles[0]);
      setIdUrl(profiles[0].verification_id_url || '');
      setSelfieUrl(profiles[0].verification_selfie_url || '');
    }
    setLoading(false);
  };

  const handleIdUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setIdUrl(file_url);
    setUploading(false);
  };

  const handleSelfieUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setSelfieUrl(file_url);
    setUploading(false);
  };

  const handleSubmit = async () => {
    setUploading(true);
    await base44.entities.TalentProfile.update(profile.id, {
      verification_id_url: idUrl,
      verification_selfie_url: selfieUrl
    });
    setSubmitted(true);
    setUploading(false);
  };

  if (loading) return (<div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>);

  if (profile?.is_verified) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6"><CheckCircle2 className="w-10 h-10 text-green-500" /></div>
          <h1 className="text-2xl font-bold mb-2">You're Verified!</h1>
          <p className="text-slate-400 mb-6">Your identity has been verified. The verification badge is now visible on your profile.</p>
          <Link to={createPageUrl('Dashboard')}><Button className="bg-purple-600 hover:bg-purple-500">Go to Dashboard</Button></Link>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-6"><AlertCircle className="w-10 h-10 text-blue-500" /></div>
          <h1 className="text-2xl font-bold mb-2">Verification Submitted</h1>
          <p className="text-slate-400 mb-6">Your documents have been submitted for review. We'll verify your identity within 24-48 hours.</p>
          <Link to={createPageUrl('Dashboard')}><Button className="bg-purple-600 hover:bg-purple-500">Go to Dashboard</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <Link to={createPageUrl('Dashboard')}><Button variant="ghost" size="sm" className="text-slate-400"><ChevronLeft className="w-4 h-4 mr-1" />Back</Button></Link>
        <Logo className="h-8 w-auto" />
        <div className="w-16" />
      </div>

      <div className="max-w-lg mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-green-500/20 flex items-center justify-center mx-auto mb-4"><Shield className="w-8 h-8 text-green-400" /></div>
          <h1 className="text-2xl font-bold mb-2">Get Verified</h1>
          <p className="text-slate-400">Verify your identity to build trust with talent seekers and get the verification badge on your profile.</p>
        </div>

        <div className="space-y-6">
          {/* ID Upload */}
          <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800">
            <h3 className="font-semibold mb-2">1. Upload your ID</h3>
            <p className="text-slate-400 text-sm mb-4">Upload a clear photo of your government-issued ID (passport, driver's license, etc.)</p>
            {idUrl ? (
              <div className="relative rounded-xl overflow-hidden bg-slate-800 aspect-video">
                <img src={idUrl} alt="ID" className="w-full h-full object-cover" />
                <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                  <input type="file" accept="image/*" onChange={handleIdUpload} className="hidden" />
                  <span className="text-sm">Change photo</span>
                </label>
              </div>
            ) : (
              <label className="block cursor-pointer">
                <input type="file" accept="image/*" onChange={handleIdUpload} className="hidden" />
                <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center hover:border-slate-600 transition-colors">
                  <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                  <p className="text-slate-400">Click to upload</p>
                </div>
              </label>
            )}
          </div>

          {/* Selfie Upload */}
          <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800">
            <h3 className="font-semibold mb-2">2. Take a selfie</h3>
            <p className="text-slate-400 text-sm mb-4">Take a clear photo of your face to match with your ID</p>
            {selfieUrl ? (
              <div className="relative rounded-xl overflow-hidden bg-slate-800 aspect-video">
                <img src={selfieUrl} alt="Selfie" className="w-full h-full object-cover" />
                <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                  <input type="file" accept="image/*" capture="user" onChange={handleSelfieUpload} className="hidden" />
                  <span className="text-sm">Retake photo</span>
                </label>
              </div>
            ) : (
              <label className="block cursor-pointer">
                <input type="file" accept="image/*" capture="user" onChange={handleSelfieUpload} className="hidden" />
                <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center hover:border-slate-600 transition-colors">
                  <Camera className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                  <p className="text-slate-400">Click to take photo</p>
                </div>
              </label>
            )}
          </div>

          <Button onClick={handleSubmit} disabled={!idUrl || !selfieUrl || uploading} className="w-full h-12 bg-gradient-to-r from-green-600 to-green-500 text-lg">
            {uploading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Processing...</> : 'Submit for Verification'}
          </Button>
        </div>
      </div>
    </div>
  );
}