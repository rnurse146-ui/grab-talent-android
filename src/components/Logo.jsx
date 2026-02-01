import React from 'react';

const LOGO_DARK = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697f3da7f123570707b055b1/9b7629a4f_IMG_7722.jpg";
const LOGO_LIGHT = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697f3da7f123570707b055b1/6b2b09713_IMG_7721.jpg";

export default function Logo({ variant = 'dark', className = 'h-10 w-auto' }) {
  const logoSrc = variant === 'light' ? LOGO_LIGHT : LOGO_DARK;
  
  return (
    <img 
      src={logoSrc} 
      alt="Grab Talent" 
      className={className}
    />
  );
}

export { LOGO_DARK, LOGO_LIGHT };