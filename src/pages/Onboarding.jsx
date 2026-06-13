import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Sparkles, Search, Star, ChevronRight, ChevronLeft,
  MapPin, Check
} from 'lucide-react';

export default function Onboarding() {
  const urlParams = new URLSearchParams(window.location.search);
  const initialType = urlParams.get('type') || null;
  const eventDate = urlParams.get('event_date') || null;

  const [step, setStep] = useState(initialType ? 2 : 1);
  const [userType, setUserType] = useState(initialType);
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    setLoading(true);
    try {
      await base44.auth.updateMe({
        user_type: userType,
        preferred_city: city,
        phone: phone,
        onboarding_complete: true
      });

      if (userType === 'talent') {
        window.location.href = createPageUrl('TalentSetup');
      } else {
        window.location.href = createPageUrl('Discover');
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 -left-40 w-80 h-80 bg-orange-500/15 rounded-full blur-3xl" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-lg"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center mb-4">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697f3da7f123570707b055b1/9b7629a4f_IMG_7722.jpg" 
              alt="Grab Talent" 
              className="h-14 w-auto"
            />
          </div>
          <h1 className="text-2xl font-bold">Let's get you set up</h1>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-10">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                i <= step ? 'bg-gradient-to-r from-purple-500 to-orange-500' : 'bg-slate-800'
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Choose Type */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-xl font-semibold text-center mb-8">What brings you here?</h2>
              
              <button
                onClick={() => { setUserType('seeker'); setStep(2); }}
                className="w-full p-6 rounded-2xl bg-slate-900 border-2 border-slate-800 hover:border-purple-500 transition-all group text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-600 to-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Search className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">I'm Looking for Talent</h3>
                    <p className="text-slate-400 text-sm">Find and book amazing performers for my events</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => { setUserType('talent'); setStep(2); }}
                className="w-full p-6 rounded-2xl bg-slate-900 border-2 border-slate-800 hover:border-orange-500 transition-all group text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-600 to-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Star className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">I'm a Talent</h3>
                    <p className="text-slate-400 text-sm">Showcase my skills and get booked for gigs</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => { setUserType('both'); setStep(2); }}
                className="w-full p-4 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all text-center text-slate-400 hover:text-white"
              >
                I'm both a talent and looking for talent
              </button>
            </motion.div>
          )}

          {/* Step 2: Location */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600/20 to-orange-600/20 flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-purple-400" />
                </div>
                <h2 className="text-xl font-semibold">Where are you based?</h2>
                <p className="text-slate-400 text-sm mt-2">
                  {userType === 'talent' 
                    ? "We'll show you to seekers in your area"
                    : "We'll find talent near you"}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-400">City</Label>
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. London, Manchester, Birmingham"
                  className="bg-slate-900 border-slate-800 h-14 text-lg focus:border-purple-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1 h-12 bg-transparent border-slate-700 hover:bg-slate-800"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!city}
                  className="flex-1 h-12 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400"
                >
                  Continue
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Contact */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-600/20 to-emerald-600/20 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-400" />
                </div>
                <h2 className="text-xl font-semibold">Almost there!</h2>
                <p className="text-slate-400 text-sm mt-2">
                  Add your phone number for booking confirmations
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-400">Phone Number (optional)</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+44 7XXX XXXXXX"
                  className="bg-slate-900 border-slate-800 h-14 text-lg focus:border-purple-500"
                />
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  Your Setup
                </h3>
                <div className="text-sm text-slate-400 space-y-1">
                  <p>Type: {userType === 'talent' ? '🎭 Talent' : userType === 'seeker' ? '🔍 Seeker' : '🎭🔍 Both'}</p>
                  <p>Location: 📍 {city}</p>
                  {eventDate && <p>Event Date: 📅 {new Date(eventDate).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</p>}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="flex-1 h-12 bg-transparent border-slate-700 hover:bg-slate-800"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleComplete}
                  disabled={loading}
                  className="flex-1 h-12 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 hover:opacity-90"
                >
                  {loading ? 'Setting up...' : "Let's Go!"}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}