import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const REASONS = ['harassment', 'rude_language', 'spam', 'fake_profile', 'other'];
const CONTEXTS = ['direct_chat', 'collab_chat', 'profile', 'booking', 'other'];

// Reports are stored for admin review with an automated first pass that looks
// for rude language, spam and threats — so a reviewer opens the worst first.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const reportedUserId = String(body?.user_id || '');
    const reason = String(body?.reason || '');
    const context = CONTEXTS.includes(String(body?.context || '')) ? String(body.context) : 'other';
    if (!reportedUserId) return Response.json({ error: 'user_id is required' }, { status: 400 });
    if (reportedUserId === user.id) return Response.json({ error: 'You cannot report yourself' }, { status: 400 });
    if (!REASONS.includes(reason)) return Response.json({ error: 'Choose a reason for the report' }, { status: 400 });

    const details = String(body?.details || '').trim().slice(0, 1000);
    const excerpt = String(body?.excerpt || '').trim().slice(0, 800);

    const target = await base44.asServiceRole.entities.User
      .get(reportedUserId)
      .catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (!target) return Response.json({ error: 'User not found' }, { status: 404 });

    const [myProfile] = await base44.asServiceRole.entities.TalentProfile.filter({ user_id: user.id }, '', 1);
    const [theirProfile] = await base44.asServiceRole.entities.TalentProfile.filter({ user_id: reportedUserId }, '', 1);

    // Automated first pass — a failure here must never lose the report
    let verdict = 'unreviewed';
    let severity = 0;
    let summary = 'Awaiting manual review.';
    try {
      const review = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are moderating reports on Grab Talent, a UK platform where performers and event bookers message each other.

A user reported another user. Read the material and judge whether it breaks the rules.

Reporter's reason: ${reason}
Reporter's description: ${details || '(none given)'}
Message quoted from the reported user: ${excerpt || '(none given)'}
Where it happened: ${context}

Judge only the reported user's material. Look for: rude or offensive language, insults, spam or advertising (including off-platform selling or repeated promotional messages), harassment or threats, or an attempt to deceive (fake profile or scam).

verdict must be one of: clean, rude_language, spam, harassment, threat, fake_profile, unclear.
severity is 1 (harmless) to 5 (severe, needs urgent action).
summary is one short factual sentence for the reviewer.`,
        response_json_schema: {
          type: 'object',
          properties: {
            verdict: { type: 'string', enum: ['clean', 'rude_language', 'spam', 'harassment', 'threat', 'fake_profile', 'unclear'] },
            severity: { type: 'integer' },
            summary: { type: 'string' }
          },
          required: ['verdict', 'severity', 'summary']
        }
      });
      verdict = String(review?.verdict || 'unclear');
      severity = Math.max(1, Math.min(5, Number(review?.severity) || 1));
      summary = String(review?.summary || '').slice(0, 300) || 'Awaiting manual review.';
    } catch {
      // keep the report with the default verdict
    }

    const report = await base44.asServiceRole.entities.Report.create({
      reporter_id: user.id,
      reporter_name: myProfile?.stage_name || user.full_name || 'Member',
      reported_user_id: reportedUserId,
      reported_name: theirProfile?.stage_name || target.full_name || 'Member',
      reported_profile_id: theirProfile?.id || '',
      context,
      group_id: String(body?.group_id || '').slice(0, 60),
      conversation_id: String(body?.conversation_id || '').slice(0, 120),
      excerpt,
      reason,
      details,
      status: 'open',
      ai_verdict: verdict,
      ai_severity: severity,
      ai_summary: summary
    });

    // Let every admin know something is waiting in the moderation queue
    const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' }, '', 50);
    const recipients = (admins || []).filter(a => a.id !== user.id);
    if (recipients.length > 0) {
      await base44.asServiceRole.entities.Notification.bulkCreate(recipients.map(a => ({
        user_id: a.id,
        type: 'review',
        title: `New report: ${report.reported_name}`,
        body: summary,
        link_url: '/AdminReports',
        is_read: false
      })));
    }

    return Response.json({ report });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}