import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Banknote, CheckCircle2, Loader2, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function PaymentRelease({ booking, onRelease }) {
  const [step, setStep] = useState('prompt'); // 'prompt' | 'confirm' | 'done'
  const [confirmText, setConfirmText] = useState('');
  const [releasing, setReleasing] = useState(false);
  const [error, setError] = useState('');

  const handleRelease = async () => {
    if (confirmText.trim().toUpperCase() !== 'CONFIRM') {
      setError('Please type CONFIRM exactly to release the payment.');
      return;
    }
    setError('');
    setReleasing(true);
    await onRelease();
    setReleasing(false);
    setStep('done');
  };

  if (step === 'done' || booking.payment_status === 'released') {
    return (
      <div className="p-5 bg-green-500/10 rounded-2xl border border-green-500/30 text-center">
        <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-3" />
        <h3 className="font-semibold text-green-400 text-lg mb-1">Payment Released!</h3>
        <p className="text-slate-400 text-sm">£{booking.talent_payout?.toFixed(2)} has been sent to {booking.talent_stage_name}.</p>
      </div>
    );
  }

  if (step === 'confirm') {
    return (
      <div className="p-5 bg-slate-900 rounded-2xl border border-orange-500/30 space-y-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-orange-400 shrink-0" />
          <div>
            <h3 className="font-semibold">Confirm Payment Release</h3>
            <p className="text-sm text-slate-400">This will send £{booking.talent_payout?.toFixed(2)} to {booking.talent_stage_name} immediately.</p>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-4 space-y-1 text-sm">
          <div className="flex justify-between text-slate-300">
            <span>Talent payout</span>
            <span className="text-green-400 font-semibold">£{booking.talent_payout?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Platform fee (11%)</span>
            <span>£{booking.commission_amount?.toFixed(2)}</span>
          </div>
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-2">
            Type <span className="text-white font-bold">CONFIRM</span> to release the payment:
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={e => { setConfirmText(e.target.value); setError(''); }}
            placeholder="Type CONFIRM here..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 text-lg tracking-widest font-mono"
            autoFocus
          />
          {error && (
            <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />{error}
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleRelease}
            disabled={releasing}
            className="flex-1 bg-green-600 hover:bg-green-500 h-11"
          >
            {releasing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
            Release Payment Now
          </Button>
          <Button
            onClick={() => { setStep('prompt'); setConfirmText(''); setError(''); }}
            variant="outline"
            className="border-slate-700 text-slate-400"
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // Prompt state
  return (
    <div className="p-5 bg-green-500/10 rounded-2xl border border-green-500/20 space-y-4">
      <div className="flex items-start gap-3">
        <Banknote className="w-6 h-6 text-green-400 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-green-400">Has the talent arrived?</h3>
          <p className="text-sm text-slate-400 mt-1">
            The app is holding <span className="text-white font-semibold">£{booking.total_price?.toFixed(2)}</span> in escrow.
            Once you confirm the talent has arrived at the event, <span className="text-green-400 font-semibold">£{booking.talent_payout?.toFixed(2)}</span> will be released to them instantly.
          </p>
        </div>
      </div>
      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 border">
        💰 Payment held in escrow — awaiting your confirmation
      </Badge>
      <Button
        onClick={() => setStep('confirm')}
        className="w-full bg-green-600 hover:bg-green-500 h-11"
      >
        <CheckCircle2 className="w-4 h-4 mr-2" />
        Talent Has Arrived — Release Payment
      </Button>
    </div>
  );
}