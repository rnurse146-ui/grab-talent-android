import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { getOwnVerificationProfile, hasOwnedVerificationDocuments } from '../../shared/verificationDocuments.ts';

// Sign only documents with server-established upload ownership.
// No caller-provided URIs; legacy unproven document references are not signed.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const profile = await getOwnVerificationProfile(base44, user.id);
    if (!hasOwnedVerificationDocuments(profile, user.id)) {
      return Response.json({ id_url: '', selfie_url: '' });
    }

    const sign = async (uri) => {
      if (!uri) return '';
      const { signed_url } = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({ file_uri: uri });
      return signed_url || '';
    };

    const [id_url, selfie_url] = profile
      ? await Promise.all([sign(profile.verification_id_url), sign(profile.verification_selfie_url)])
      : ['', ''];

    return Response.json({ id_url, selfie_url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}