import React, { useEffect, useState } from 'react';
import { Loader2, ShieldAlert } from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { REPORT_REASONS, reportUser } from '@/lib/safety';

// Report a member — the report is stored for admin review and given an
// automated first pass for rude language, spam and threats.
export default function ReportDialog({ open, onOpenChange, target }) {
  const [reason, setReason] = useState('rude_language');
  const [details, setDetails] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (open) {
      setReason('rude_language');
      setDetails('');
      setError('');
      setSent(false);
    }
  }, [open]);

  const submit = async () => {
    if (!target?.userId || sending) return;
    setSending(true);
    setError('');
    try {
      await reportUser({
        user_id: target.userId,
        reason,
        details,
        context: target.context || 'other',
        group_id: target.groupId || '',
        conversation_id: target.conversationId || '',
        excerpt: target.excerpt || ''
      });
      setSent(true);
    } catch (e) {
      setError(e?.response?.data?.error || e?.data?.error || 'Could not send this report. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            Report {target?.name || 'this member'}
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Reports are reviewed by our team for abuse, spam and threats. The member is not told who reported them.
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <div className="py-6 text-center">
            <p className="font-semibold mb-1">Report sent</p>
            <p className="text-sm text-zinc-400">Thanks — our team will review it.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label className="text-zinc-300 mb-2 block">What happened?</Label>
              <div className="space-y-2">
                {REPORT_REASONS.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setReason(option.value)}
                    className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition-colors ${
                      reason === option.value
                        ? 'border-purple-500 bg-purple-500/10 text-white'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-600'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="report-details" className="text-zinc-300 mb-2 block">Anything else we should know?</Label>
              <Textarea
                id="report-details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                maxLength={1000}
                rows={3}
                placeholder="Optional — add any detail that helps us review this."
                className="bg-zinc-900 border-zinc-700 text-white"
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
          </div>
        )}

        <DialogFooter>
          {sent ? (
            <Button onClick={() => onOpenChange(false)} className="bg-white text-black hover:bg-zinc-200">Done</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)} className="border-zinc-700 bg-transparent text-white hover:bg-zinc-900">
                Cancel
              </Button>
              <Button onClick={submit} disabled={sending} className="bg-amber-500 text-black hover:bg-amber-400">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send report'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}