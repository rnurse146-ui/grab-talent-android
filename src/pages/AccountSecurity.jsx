import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Shield, Loader2, Lock, Info } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { useToast } from '@/components/ui/use-toast';

const PROVIDERS = [
  {
    id: 'google',
    name: 'Google',
    supported: true,
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    ),
  },
  {
    id: 'apple',
    name: 'Apple',
    supported: true,
    icon: (
      <svg className="w-5 h-5" fill="white" viewBox="0 0 24 24">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
      </svg>
    ),
  },
  {
    id: 'facebook',
    name: 'Facebook',
    supported: true,
    icon: (
      <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  },
  {
    id: 'x',
    name: 'X',
    supported: false,
    icon: (
      <svg className="w-5 h-5" fill="white" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  },
];

export default function AccountSecurity() {
  const [connecting, setConnecting] = useState(null);
  const { toast } = useToast();

  const handleConnect = async (provider) => {
    if (!provider.supported) {
      toast({ title: `${provider.name} is not available`, description: 'This provider isn\'t supported by the platform yet.', variant: 'destructive' });
      return;
    }
    setConnecting(provider.id);
    try {
      await base44.auth.loginWithProvider(provider.id, window.location.pathname);
    } catch (e) {
      toast({ title: `Couldn't connect ${provider.name}`, description: e.message || 'Please try again.', variant: 'destructive' });
      setConnecting(null);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <PageHeader backTo={createPageUrl('Dashboard')} />

      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-7 h-7 text-purple-400" />
          <h1 className="text-2xl font-bold">Account Security</h1>
        </div>
        <p className="text-zinc-400 mb-8">
          Link a social account to sign in faster. Your email and password always stay available as a fallback.
        </p>

        <div className="space-y-3 mb-6">
          {PROVIDERS.map((provider) => (
            <div key={provider.id} className="flex items-center justify-between p-4 bg-zinc-900 rounded-2xl border border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center border border-zinc-800">
                  {provider.icon}
                </div>
                <div>
                  <p className="font-semibold">{provider.name}</p>
                  <p className="text-xs text-zinc-500">
                    {provider.supported ? 'Tap to link this sign-in method' : 'Not supported yet on this platform'}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => handleConnect(provider)}
                disabled={!provider.supported || connecting === provider.id}
                className={provider.supported ? 'bg-white text-black hover:bg-zinc-100' : ''}
                variant={provider.supported ? 'default' : 'outline'}
              >
                {connecting === provider.id ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Connecting…</>
                ) : provider.supported ? (
                  <>Link {provider.name}</>
                ) : (
                  'Unavailable'
                )}
              </Button>
            </div>
          ))}
        </div>

        <div className="flex gap-3 p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800">
          <Info className="w-5 h-5 text-zinc-500 shrink-0 mt-0.5" />
          <p className="text-sm text-zinc-400">
            Unlinking a connected provider isn't available from within the app — to remove a connected account, use the
            sign-in options on the platform login screen. Need help? Contact Base44 support.
          </p>
        </div>

        <div className="flex items-center gap-2 mt-6 text-zinc-500 text-sm">
          <Lock className="w-4 h-4" />
          Your password and connected accounts are managed securely by the platform.
        </div>
      </div>
    </div>
  );
}