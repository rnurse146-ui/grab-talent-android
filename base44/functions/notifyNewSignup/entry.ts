import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const NOTIFY_EMAIL = 'grab-talent-limited@hotmail.com';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    const email = body.email || 'unknown';
    const full_name = body.full_name || body.email || 'A new user';
    const role = body.role || 'user';
    const auth_method = body.auth_method || 'unknown';
    const occurred_at = body.occurred_at || new Date().toISOString();

    const subject = `New Grab Talent sign-up: ${full_name}`;
    const text =
      `A new user has signed up to Grab Talent.\n\n` +
      `Name: ${full_name}\n` +
      `Email: ${email}\n` +
      `Role: ${role}\n` +
      `Signed up via: ${auth_method}\n` +
      `At: ${occurred_at}\n`;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: NOTIFY_EMAIL,
      subject,
      body: text,
      from_name: 'Grab Talent'
    });

    return Response.json({ ok: true, sent_to: NOTIFY_EMAIL });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}