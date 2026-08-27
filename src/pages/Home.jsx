import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      let isAuth = false;
      try {
        isAuth = await base44.auth.isAuthenticated();
      } catch (e) {}
      if (isAuth) {
        navigate(createPageUrl('Dashboard'));
        return;
      }
      // Go straight to the sign-in page — no welcome screen first
      base44.auth.redirectToLogin(createPageUrl('Dashboard'));
    })();
  }, []);

  if (!loading) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
    </div>
  );
}