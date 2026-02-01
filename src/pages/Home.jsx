import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { 
  Music, Sparkles, Search, Star, Users, Calendar,
  ArrowRight, ChevronRight, Shield, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      }
    } catch (e) {
      console.log('Not authenticated');
    }
    setLoading(false);
  };

  const handleGetStarted = async (type) => {
    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) {
      base44.auth.redirectToLogin(createPageUrl('Onboarding') + `?type=${type}`);
    } else {
      window.location.href = createPageUrl('Onboarding') + `?type=${type}`;
    }
  };

  const talentCategories = [
    { name: 'DJs', icon: '🎧' },
    { name: 'Bands', icon: '🎸' },
    { name: 'Singers', icon: '🎤' },
    { name: 'Magicians', icon: '🎩' },
    { name: 'Dancers', icon: '💃' },
    { name: 'Comedians', icon: '😂' },
    { name: 'Photographers', icon: '📸' },
    { name: 'More...', icon: '✨' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* Hero Section */}
      <div className="relative">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl" />
          <div className="absolute top-60 -left-40 w-80 h-80 bg-orange-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl" />
        </div>

        {/* Navigation */}
        <nav className="relative z-10 flex items-center justify-between px-6 lg:px-12 py-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center"
          >
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697f3da7f123570707b055b1/9b7629a4f_IMG_7722.jpg" 
              alt="Grab Talent" 
              className="h-12 w-auto"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {user ? (
              <Link to={createPageUrl('Dashboard')}>
                <Button className="bg-white/10 hover:bg-white/20 border border-white/20">
                  Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            ) : (
              <Button 
                onClick={() => base44.auth.redirectToLogin()}
                className="bg-white/10 hover:bg-white/20 border border-white/20"
              >
                Sign In
              </Button>
            )}
          </motion.div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 px-6 lg:px-12 pt-16 pb-32">
          <div className="max-w-6xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-sm font-medium mb-8">
                <Zap className="w-4 h-4" />
                The Future of Talent Booking
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-6"
            >
              Find Amazing
              <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                Local Talent
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-slate-400 max-w-2xl mx-auto mb-12"
            >
              Connect with verified performers for your events or showcase your talent 
              and take control of your bookings. Swipe, discover, and hire with ease.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button
                size="lg"
                onClick={() => handleGetStarted('seeker')}
                className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-lg px-8 py-6 rounded-2xl shadow-lg shadow-purple-500/30"
              >
                <Search className="w-5 h-5 mr-2" />
                Looking for Talent
              </Button>
              <Button
                size="lg"
                onClick={() => handleGetStarted('talent')}
                className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-lg px-8 py-6 rounded-2xl shadow-lg shadow-orange-500/30"
              >
                <Star className="w-5 h-5 mr-2" />
                I'm a Talent
              </Button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Categories Scroll */}
      <div className="relative z-10 -mt-16 pb-20">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide"
          >
            {talentCategories.map((cat, i) => (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + i * 0.1 }}
                className="flex-shrink-0 px-6 py-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:bg-white/10 transition-all cursor-pointer"
              >
                <span className="text-2xl mb-2 block">{cat.icon}</span>
                <span className="text-sm font-medium text-slate-300">{cat.name}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative z-10 py-24 bg-slate-900/50">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Why Grab Talent?</h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              The first platform that puts both talent and seekers in complete control.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Shield className="w-8 h-8" />,
                title: "Verified Talent",
                description: "Every performer is ID verified for your peace of mind. Look for the verification badge.",
                color: "from-green-500 to-emerald-500"
              },
              {
                icon: <Calendar className="w-8 h-8" />,
                title: "Smart Scheduling",
                description: "In-app calendar lets talent manage availability. Book based on real-time availability.",
                color: "from-purple-500 to-violet-500"
              },
              {
                icon: <Users className="w-8 h-8" />,
                title: "Direct Connection",
                description: "Message talent directly, negotiate details, and build relationships. No middleman.",
                color: "from-orange-500 to-amber-500"
              }
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="p-8 rounded-3xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 transition-all group"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-slate-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="relative z-10 py-24">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-slate-400">Three simple steps to find or become amazing talent</p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* For Seekers */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="p-8 rounded-3xl bg-gradient-to-br from-purple-900/50 to-purple-800/30 border border-purple-500/30"
            >
              <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
                <Search className="w-6 h-6 text-purple-400" />
                For Talent Seekers
              </h3>
              <div className="space-y-6">
                {[
                  { step: "1", title: "Swipe & Discover", desc: "Browse talent cards, swipe right to save to your maybe list" },
                  { step: "2", title: "Review & Choose", desc: "Compare your saved talents, view profiles and reviews" },
                  { step: "3", title: "Book & Enjoy", desc: "Send booking requests, confirm details, and enjoy your event" }
                ].map(item => (
                  <div key={item.step} className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center font-bold flex-shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{item.title}</h4>
                      <p className="text-slate-400 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* For Talent */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="p-8 rounded-3xl bg-gradient-to-br from-orange-900/50 to-orange-800/30 border border-orange-500/30"
            >
              <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
                <Star className="w-6 h-6 text-orange-400" />
                For Talent
              </h3>
              <div className="space-y-6">
                {[
                  { step: "1", title: "Create Your Profile", desc: "Showcase your talent with photos, videos, and your story" },
                  { step: "2", title: "Get Verified", desc: "Complete ID verification to earn trust and bookings" },
                  { step: "3", title: "Accept Bookings", desc: "Manage your calendar, accept gigs, and grow your career" }
                ].map(item => (
                  <div key={item.step} className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center font-bold flex-shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{item.title}</h4>
                      <p className="text-slate-400 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="relative z-10 py-24 bg-gradient-to-t from-purple-900/30 to-transparent">
        <div className="max-w-3xl mx-auto text-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Ready to Grab Some Talent?
            </h2>
            <p className="text-xl text-slate-400 mb-10">
              Join thousands of performers and event organizers already using Grab Talent.
            </p>
            <Button
              size="lg"
              onClick={() => handleGetStarted('seeker')}
              className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 hover:opacity-90 text-lg px-12 py-6 rounded-2xl"
            >
              Get Started Free
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 py-12 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-6 lg:px-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697f3da7f123570707b055b1/9b7629a4f_IMG_7722.jpg" 
              alt="Grab Talent" 
              className="h-10 w-auto"
            />
          </div>
          <p className="text-slate-500 text-sm">
            © 2024 Grab Talent. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}