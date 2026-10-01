// Resolve only a profile actually created by the authenticated talent.
export async function getOwnVerificationProfile(base44, userId) {
  const page = await base44.asServiceRole.entities.TalentProfile.filter(
    { user_id: userId, created_by_id: userId },
    { sort: '-created_date', limit: 1 }
  );
  return page.items[0];
}

// This server-write-only provenance field is set together with URIs returned
// by the server's UploadPrivateFile call, never from a client-supplied URI.
export function hasOwnedVerificationDocuments(profile, userId) {
  return profile?.user_id === userId && profile?.created_by_id === userId &&
    profile?.verification_documents_owner_id === userId;
}