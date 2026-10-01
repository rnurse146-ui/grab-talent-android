import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Returns short-lived signed URLs for the CALLER'S OWN verification documents.
// Takes no parameters: it only ever signs the document URIs that the
// checkVerification function stored on the caller's talent profile, so
// documents belonging to other users can never be previewed. This keeps
// CreateFileSignedUrl (and the raw storage URIs) out of client reach.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const profiles = await base44.asServiceRole.entities.TalentProfile.filter({ user_id: user.id });
    const profile = profiles && profiles[0];

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