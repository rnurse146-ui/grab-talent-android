import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Shield, Upload, Camera, CheckCircle2, Loader2, AlertCircle, Zap } from 'lucide-react';
import PageHeader from '@/components/PageHeader';

export default function Verification() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [idUrl, setIdUrl] = useState('');
  const [selfieUrl, setSelfieUrl] = useState('');
  const [aiStatus, setAiStatus] = useState(null); // 'checking' | 'done'
  const [aiResult, setAiResult] = useState(null);

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
    setAiStatus('checking');

    // AI facial recognition comparison
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: 'You are an AI identity verification system. The first image is a government-issued ID document, the second is a selfie. Compare the faces. Determine if they appear to be the same person based on facial features (eyes, nose, face shape, jawline). Allow for lighting/angle differences.',
      file_urls: [idUrl, selfieUrl],
      response_json_schema: {
        type: 'object',
        properties: {
          match: { type: 'boolean' },
          confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
          reason: { type: 'string' }
        }
      }
    });

    setAiResult(result);
    setAiStatus('done');

    const isAutoVerified = result.match && result.confidence !== 'low';

    await base44.entities.TalentProfile.update(profile.id, {
      verification_id_url: idUrl,
      verification_selfie_url: selfieUrl,
      ...(isAutoVerified ? { is_verified: true } : {})
    });

    setSubmitted(true);
    setUploading(false);
  };

  if (loading) return (<div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-white" /></div>);

  if (profile?.is_verified) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6"><CheckCircle2 className="w-10 h-10 text-green-500" /></div>
          <h1 className="text-2xl font-bold mb-2">You're Verified!</h1>
          <p className="text-zinc-400 mb-6">Your identity has been verified. The verification badge is now visible on your profile.</p>
          <Link to={createPageUrl('Dashboard')}><Button className="bg-white text-black hover:bg-zinc-100">Go to Dashboard</Button></Link>
        </div>
      </div>
    );
  }

  if (submitted) {
    const autoVerified = aiResult?.match && aiResult?.confidence !== 'low';
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${autoVerified ? 'bg-green-500/20' : 'bg-zinc-800'}`}>
            {autoVerified ? <CheckCircle2 className="w-10 h-10 text-green-500" /> : <AlertCircle className="w-10 h-10 text-zinc-400" />}
          </div>
          <h1 className="text-2xl font-bold mb-2">{autoVerified ? '✅ Auto-Verified!' : 'Submitted for Review'}</h1>
          <p className="text-zinc-400 mb-3">
            {autoVerified
              ? 'Our AI has matched your face with your ID. Your verified badge is now live!'
              : 'Our AI could not confidently match your faces. Your documents have been flagged for manual review within 24-48 hours.'}
          </p>
          {aiResult?.reason && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6 text-left">
              <p className="text-xs text-zinc-500 mb-1 flex items-center gap-1"><Zap className="w-3 h-3" /> AI Analysis</p>
              <p className="text-sm text-zinc-300">{aiResult.reason}</p>
              <p className="text-xs text-zinc-500 mt-2">Confidence: {aiResult.confidence}</p>
            </div>
          )}
          <Link to={createPageUrl('Dashboard')}><Button className="bg-white text-black hover:bg-zinc-100">Go to Dashboard</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <PageHeader backTo={createPageUrl('Dashboard')} />

      <div className="max-w-lg mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4"><Shield className="w-8 h-8 text-white" /></div>
          <h1 className="text-2xl font-bold mb-2">Get Verified</h1>
          <p className="text-zinc-400">Our AI will instantly compare your ID photo with your selfie to verify your identity.</p>
        </div>

        <div className="space-y-6">
          {/* ID Upload */}
          <div className="p-6 bg-zinc-900 rounded-2xl border border-zinc-800">
            <h3 className="font-semibold mb-2">1. Upload your ID</h3>
            <p className="text-zinc-400 text-sm mb-4">Upload a clear photo of your government-issued ID (passport, driver's license, etc.)</p>
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
          <div className="p-6 bg-zinc-900 rounded-2xl border border-zinc-800">
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

          {aiStatus === 'checking' && (
            <div className="flex items-center gap-3 p-4 bg-zinc-900 rounded-xl border border-zinc-700">
              <Loader2 className="w-5 h-5 animate-spin text-white shrink-0" />
              <div>
                <p className="font-medium text-sm">AI is analysing your documents...</p>
                <p className="text-xs text-zinc-500">Comparing facial features</p>
              </div>
            </div>
          )}

          <Button onClick={handleSubmit} disabled={!idUrl || !selfieUrl || uploading} className="w-full h-12 bg-white text-black hover:bg-zinc-100 text-base font-semibold">
            {uploading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Analysing with AI...</> : <><Zap className="w-5 h-5 mr-2" />Verify with AI</>}
          </Button>
        </div>
      </div>
    </div>
  );
}