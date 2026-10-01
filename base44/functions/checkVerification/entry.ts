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
      prompt: 'You are an AI identity verification system. The first image should be a government-issued ID document (e.g. passport, driving licence or national ID card) and the second is a selfie. ' +
        'Step 1: Determine whether the first image is actually a recognizable government-issued ID document — it must show an official document layout with a visible photograph, document type and identity details. If the first image is instead an ordinary photo, another selfie, a picture of a person, or anything that is not a genuine ID document, set is_id_document to false. ' +
        'Step 2: If the first image is a genuine ID document, compare the face on the ID document with the face in the selfie. Determine if they appear to be the same person based on facial features (eyes, nose, face shape, jawline). Allow for lighting/angle differences. ' +
        'Set match to true only if the first image is a genuine ID document AND the faces match.',
      file_urls: [idSigned.signed_url, selfieSigned.signed_url],
      response_json_schema: {
        type: 'object',
        properties: {
          is_id_document: { type: 'boolean', description: 'Whether the first image is a genuine government-issued ID document' },
          match: { type: 'boolean' },
          confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
          reason: { type: 'string' }
        },
        required: ['is_id_document', 'match', 'confidence', 'reason']
      }
    });

    const outcome = result || { is_id_document: false, match: false, confidence: 'low', reason: 'The AI could not complete the comparison.' };
    // Auto-verification requires a genuine ID document, a matching face, and
    // non-low confidence — two selfies or any non-ID images can never pass.
    const isAutoVerified = outcome.is_id_document === true && outcome.match && outcome.confidence !== 'low';

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