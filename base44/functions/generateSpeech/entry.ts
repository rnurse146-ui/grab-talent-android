import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const VOICES = ['honey', 'river', 'storm', 'sunny', 'spark'];

// Generates the spoken reply audio for the Talent Hitch voice guide.
// Narrow operation: whitelisted voices and a capped text length only.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const text = String(body?.text || '').slice(0, 1000).trim();
    if (!text) return Response.json({ error: 'Text is required' }, { status: 400 });
    const voice = VOICES.includes(body?.voice) ? body.voice : 'river';

    const res = await base44.asServiceRole.integrations.Core.GenerateSpeech({ text, voice, language_code: 'en' });
    return Response.json({ url: res?.url || res?.file_url || null });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}