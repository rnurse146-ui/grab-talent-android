import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { CheckCircle2, Flag, Loader2, ShieldAlert, XCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { REPORT_REASONS } from '@/lib/safety';

const VERDICT_STYLES = {
  clean: 'bg-emerald-500/20 text-emerald-300',
  rude_language: 'bg-amber-500/20 text-amber-300',
  spam: 'bg-orange-500/20 text-orange-300',
  harassment: 'bg-red-500/20 text-red-300',
  threat: 'bg-red-500/20 text-red-300',
  fake_profile: 'bg-orange-500/20 text-orange-300',
  unclear: 'bg-zinc-500/20 text-zinc-300',
  unreviewed: 'bg-zinc-500/20 text-zinc-300'
};

const reasonLabel = (value) => REPORT_REASONS.find(r => r.value === value)?.label || 'Report';
const verdictLabel = (value) => (value || 'unreviewed').replace(/_/g, ' ');

// Admin moderation queue for member reports. Each one arrives with an automated
// first pass (rude language, spam, threats) so the worst can be handled first.
export default function AdminReports() {
  const [user, setUser] = useState(null);
  const [reports, setReports] = useState([]);
  const [status, setStatus] = useState('open');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => { load(); }, [status]);

  const load = async () => {
    setLoading(true);
    try {
      const me = await base44.auth.me();
      setUser(me);
      if (me?.role !== 'admin') {
        setReports([]);
        return;
      }
      const page = await base44.entities.Report.filter({ status }, { sort: '-created_date', limit: 100 });
      setReports(page?.items || []);
    } finally {
      setLoading(false);
    }
  };

  const review = async (report, nextStatus) => {
    setBusyId(report.id);
    try {
      await base44.entities.Report.update(report.id, {
        status: nextStatus,
        reviewed_by: user?.id || '',
        reviewed_at: new Date().toISOString()
      });
      setReports(prev => prev.filter(r => r.id !== report.id));
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
        <div className="text-center">
          <ShieldAlert className="w-10 h-10 text-zinc-600 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Admins only</h1>
          <p className="text-zinc-400 mb-6">This page is for reviewing member reports.</p>
          <Link to={createPageUrl('Dashboard')}>
            <Button className="bg-white text-black hover:bg-zinc-200">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24 md:pb-8">
      <div className="max-w-3xl mx-auto px-6 pt-8">
        <h1 className="text-2xl font-bold flex items-center gap-2 mb-1">
          <ShieldAlert className="w-6 h-6 text-amber-400" />
          Reported content
        </h1>
        <p className="text-zinc-400 text-sm mb-6">
          Reports from members, each checked automatically for rude language, spam and threats.
        </p>

        <div className="flex gap-2 mb-6">
          {['open', 'reviewed', 'dismissed'].map(tab => (
            <button
              key={tab}
              onClick={() => setStatus(tab)}
              className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-colors ${
                status === tab ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {reports.length === 0 ? (
          <div className="text-center py-16 bg-zinc-900/50 rounded-2xl border border-zinc-800">
            <CheckCircle2 className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-400">Nothing {status} right now</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map(report => (
              <div key={report.id} className="p-5 bg-zinc-900 rounded-2xl border border-zinc-800">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm">
                      {report.reported_name || 'Member'}
                      <span className="text-zinc-500 font-normal"> reported by {report.reporter_name || 'Member'}</span>
                    </p>
                    <p className="text-xs text-zinc-500">
                      {reasonLabel(report.reason)} · {(report.context || 'other').replace('_', ' ')} · {format(new Date(report.created_date), 'd MMM yyyy, HH:mm')}
                    </p>
                  </div>
                  <Badge className={`${VERDICT_STYLES[report.ai_verdict] || VERDICT_STYLES.unreviewed} capitalize shrink-0`}>
                    <Flag className="w-3 h-3 mr-1" />
                    {verdictLabel(report.ai_verdict)}{report.ai_severity ? ` · ${report.ai_severity}/5` : ''}
                  </Badge>
                </div>

                {report.ai_summary && <p className="text-sm text-zinc-300 mb-2">{report.ai_summary}</p>}
                {report.excerpt && (
                  <p className="text-sm text-zinc-400 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 mb-2 selectable-text">
                    “{report.excerpt}”
                  </p>
                )}
                {report.details && <p className="text-sm text-zinc-400 mb-2 selectable-text">{report.details}</p>}

                {status === 'open' && (
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      onClick={() => review(report, 'reviewed')}
                      disabled={busyId === report.id}
                      className="bg-white text-black hover:bg-zinc-200"
                    >
                      {busyId === report.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4 mr-1.5" />Mark reviewed</>}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => review(report, 'dismissed')}
                      disabled={busyId === report.id}
                      className="border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-white"
                    >
                      <XCircle className="w-4 h-4 mr-1.5" />Dismiss
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}