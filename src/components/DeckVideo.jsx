import React, { useRef, useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

/**
 * Autoplaying talent video for the Discover deck.
 * Tries to start WITH sound (browsers allow it once the visitor has
 * interacted with the site); if the browser blocks sound autoplay it
 * falls back to muted and shows a "tap to unmute" button. A mute
 * toggle is always visible in the top-left of the card.
 */
export default function DeckVideo({ src, poster }) {
  const videoRef = useRef(null);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let soundBlocked = false;
    // Browsers block autoplay-with-sound until the visitor has tapped the
    // site once — on the first interaction, unmute automatically
    const unmuteOnFirstInteraction = () => {
      window.removeEventListener('pointerdown', unmuteOnFirstInteraction);
      window.removeEventListener('keydown', unmuteOnFirstInteraction);
      if (soundBlocked && videoRef.current) {
        videoRef.current.muted = false;
        setMuted(false);
        videoRef.current.play().catch(() => {});
      }
    };
    video.play().catch(() => {
      // Sound autoplay blocked — retry muted so the video still plays
      soundBlocked = true;
      video.muted = true;
      setMuted(true);
      video.play().catch(() => {});
      window.addEventListener('pointerdown', unmuteOnFirstInteraction);
      window.addEventListener('keydown', unmuteOnFirstInteraction);
    });
    return () => {
      window.removeEventListener('pointerdown', unmuteOnFirstInteraction);
      window.removeEventListener('keydown', unmuteOnFirstInteraction);
    };
  }, [src]);

  const toggleMute = (e) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.muted = !muted;
    setMuted(!muted);
  };

  return (
    <>
      <video
        ref={videoRef}
        src={src}
        autoPlay
        loop
        playsInline
        className="w-full h-full object-cover"
        poster={poster || undefined}
      />
      <button
        type="button"
        aria-label={muted ? 'Unmute video' : 'Mute video'}
        onClick={toggleMute}
        className="absolute top-4 left-4 z-10 w-11 h-11 rounded-full bg-black/50 backdrop-blur-sm border border-white/25 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
      >
        {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </button>
    </>
  );
}