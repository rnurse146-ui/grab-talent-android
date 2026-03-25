import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Search, Star, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { checkAuth(); }, []);

  const checkAuth = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const u = await base44.auth.me();
        setUser(u);
      }
    } catch (e) {}
    setLoading(false);
  };

  const handleLogin = () => base44.auth.redirectToLogin(createPageUrl('Dashboard'));

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Background glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-60 -right-60 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-orange-500/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-pink-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-5">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697f3da7f123570707b055b1/9b7629a4f_IMG_7722.jpg"
            alt="Grab Talent"
            className="h-10 w-auto"
          />
          {user && (
            <Link to={createPageUrl('Dashboard')}>
              <Button variant="ghost" className="text-slate-300 hover:text-white">
                Dashboard <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          )}
        </div>

        {/* Main auth card */}
        <div className="flex-1 flex items-center justify-center px-4 py-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            {/* Heading */}
            <div className="text-center mb-10">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-4xl font-bold mb-3"
              >
                Welcome to{' '}
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                  Grab Talent
                </span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-slate-400 text-lg"
              >
                Book world-class performers or get discovered as talent.
              </motion.p>
            </div>

            {/* Auth card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl shadow-black/40 space-y-4"
            >
              {/* Social logins */}
              <button
                onClick={handleLogin}
                className="w-full flex items-center gap-4 px-5 py-3.5 rounded-xl bg-white text-slate-900 font-semibold hover:bg-slate-100 transition-all"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>

              <button
                onClick={handleLogin}
                className="w-full flex items-center gap-4 px-5 py-3.5 rounded-xl bg-[#1877F2] text-white font-semibold hover:bg-[#1565d8] transition-all"
              >
                <svg className="w-5 h-5 shrink-0" fill="white" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Continue with Facebook
              </button>

              <button
                onClick={handleLogin}
                className="w-full flex items-center gap-4 px-5 py-3.5 rounded-xl bg-black border border-slate-600 text-white font-semibold hover:bg-slate-900 transition-all"
              >
                <svg className="w-5 h-5 shrink-0" fill="white" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                Continue with Apple
              </button>

              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-slate-700" />
                <span className="text-slate-500 text-sm">or</span>
                <div className="flex-1 h-px bg-slate-700" />
              </div>

              {/* Email sign in */}
              <button
                onClick={handleLogin}
                className="w-full px-5 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 text-white font-semibold hover:from-purple-500 hover:to-purple-400 transition-all"
              >
                Sign In / Sign Up with Email
              </button>

              <p className="text-center text-slate-500 text-xs pt-2">
                By continuing you agree to our Terms of Service and Privacy Policy.
              </p>
            </motion.div>

            {/* Role pills */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex justify-center gap-4 mt-8"
            >
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/15 border border-purple-500/25 text-purple-300 text-sm">
                <Search className="w-3.5 h-3.5" /> Find Talent
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/15 border border-orange-500/25 text-orange-300 text-sm">
                <Star className="w-3.5 h-3.5" /> Be Discovered
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Footer */}
        <div className="text-center pb-6 text-slate-600 text-xs">
          © 2024 Grab Talent. All rights reserved.
        </div>
      </div>
    </div>
  );
}