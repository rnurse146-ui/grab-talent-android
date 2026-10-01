import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// AI identity check for the talent Verification page. The client uploads the
// ID and selfie to PRIVATE storage and sends the file URIs here; this function
// signs them server-side for the AI, runs the comparison, and — as the only
// writer of the verification decision — stores the documents and the verified
// badge on the talent profile. Clients can never grant is_verified.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const idUri = String(body?.id_uri || '');
    const selfieUri = String(body?.selfie_uri || '');
    if (!idUri || !selfieUri) return Response.json({ error: 'Both ID and selfie images are required' }, { status: 400 });

    const profiles = await base44.asServiceRole.entities.TalentProfile.filter({ user_id: user.id });
    if (!profiles || profiles.length === 0) return Response.json({ error: 'Talent profile not found' }, { status: 404 });

    // Sign the private documents so the AI can read them (server-side only)
    const [idSigned, selfieSigned] = await Promise.all([
      base44.asServiceRole.integrations.Core.CreateFileSignedUrl({ file_uri: idUri }),
      base44.asServiceRole.integrations.Core.CreateFileSignedUrl({ file_uri: selfieUri })
    ]);

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: 'You are an AI identity verification system. The first image is a government-issued ID document, the second is a selfie. Compare the faces. Determine if they appear to be the same person based on facial features (eyes, nose, face shape, jawline). Allow for lighting/angle differences.',
      file_urls: [idSigned.signed_url, selfieSigned.signed_url],
      response_json_schema: {
        type: 'object',
        properties: {
          match: { type: 'boolean' },
          confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
          reason: { type: 'string' }
        }
      }
    });

    const outcome = result || { match: false, confidence: 'low', reason: 'The AI could not complete the comparison.' };
    const isAutoVerified = outcome.match && outcome.confidence !== 'low';

    await base44.asServiceRole.entities.TalentProfile.update(profiles[0].id, {
      verification_id_url: idUri,
      verification_selfie_url: selfieUri,
      ...(isAutoVerified ? { is_verified: true } : {})
    });

    return Response.json({ result: outcome, verified: isAutoVerified });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}