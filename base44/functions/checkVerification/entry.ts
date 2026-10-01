import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { getOwnVerificationProfile } from '../../shared/verificationDocuments.ts';

// Accept image bytes, NOT private-file references. Upload within this
// authenticated operation so the documents have server-established ownership.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // A URI alone is not proof of file ownership. Reject the old JSON interface
    // before any signing, AI access, or profile mutation.
    if (!req.headers.get('content-type')?.toLowerCase().startsWith('multipart/form-data')) {
      return Response.json({ error: 'Upload your ID and selfie images; file references are not accepted' }, { status: 400 });
    }
    const form = await req.formData();
    const idFile = form.get('id_file');
    const selfieFile = form.get('selfie_file');
    const isImage = (file) => file instanceof File && file.size > 0 && file.size <= 10 * 1024 * 1024 &&
      ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'].includes(file.type);
    if (!isImage(idFile) || !isImage(selfieFile)) {
      return Response.json({ error: 'Two image files are required (maximum 10 MB each)' }, { status: 400 });
    }
    const profile = await getOwnVerificationProfile(base44, user.id);
    if (!profile) return Response.json({ error: 'Talent profile not found' }, { status: 404 });

    // Only use storage URIs returned directly by our own authenticated upload.
    const [idUpload, selfieUpload] = await Promise.all([
      base44.asServiceRole.integrations.Core.UploadPrivateFile({ file: idFile }),
      base44.asServiceRole.integrations.Core.UploadPrivateFile({ file: selfieFile })
    ]);
    const idUri = idUpload.file_uri;
    const selfieUri = selfieUpload.file_uri;
    if (!idUri || !selfieUri) throw new Error('Document upload failed');

    // Sign only these newly uploaded documents (server-side only).
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

    await base44.asServiceRole.entities.TalentProfile.update(profile.id, {
      verification_id_url: idUri,
      verification_selfie_url: selfieUri,
      verification_documents_owner_id: user.id,
      ...(isAutoVerified ? { is_verified: true } : {})
    });

    return Response.json({ result: outcome, verified: isAutoVerified });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}