import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import NetworkMatchCelebration from '@/components/network/NetworkMatchCelebration';
import CollabRequestCelebration from '@/components/network/CollabRequestCelebration';

// The collab pop-up: a mutual match gets the full celebration with the instant
// reply box, a one-way request gets the "wants to collab with you" card.
// Mounted on the dashboard and in Talent Network.
export default function CollabCelebration({ user }) {
  const [ping, setPing] = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    base44.functions.invoke('collabPings', {})
      .then(res => {
        if (!cancelled && res.data?.kind) setPing(res.data);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user?.id]);

  const close = async () => {
    const current = ping;
    setPing(null);
    if (!current) return;
    await base44.functions
      .invoke('collabPings', { action: 'seen', kind: current.kind, id: current.id })
      .catch(() => {});
  };

  if (!ping) return null;

  if (ping.kind === 'match') {
    return (
      <NetworkMatchCelebration
        name={ping.name}
        conversationId={ping.conversation_id}
        otherUserId={ping.other_user_id}
        onClose={close}
      />
    );
  }

  return (
    <CollabRequestCelebration
      name={ping.name}
      category={ping.category}
      photo={ping.photo}
      onClose={close}
    />
  );
}