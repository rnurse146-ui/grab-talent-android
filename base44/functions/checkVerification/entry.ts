import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// AI identity check for the talent Verification page: compares the uploaded
// ID document with the uploaded selfie. Narrow operation — the prompt and
// output schema are fixed server-side so the endpoint can't be repurposed.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const idUrl = String(body?.id_url || '');
    const selfieUrl = String(body?.selfie_url || '');
    if (!idUrl || !selfieUrl) return Response.json({ error: 'Both ID and selfie images are required' }, { status: 400 });

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: 'You are an AI identity verification system. The first image is a government-issued ID document, the second is a selfie. Compare the faces. Determine if they appear to be the same person based on facial features (eyes, nose, face shape, jawline). Allow for lighting/angle differences.',
      file_urls: [idUrl, selfieUrl],
      response_json_schema: {
        type: 'object',
        properties: {
          match: { type: 'boolean' },
          confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
          reason: { type: 'string' }
        }
      }
    });

    return Response.json({ result: result || { match: false, confidence: 'low', reason: 'The AI could not complete the comparison.' } });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}