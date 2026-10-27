import React, { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Mic, Square, Loader2 } from 'lucide-react';

const MAX_SECONDS = 60;

// Records a voice note in the browser, uploads it privately, and hands the
// stored file URI to the chat so it can be sent as a message.
export default function VoiceRecorder({ onRecorded }) {
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState('');
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const stop = () => {
    clearInterval(timerRef.current);
    setRecording(false);
    try { recorderRef.current?.stop(); } catch (e) { /* already stopped */ }
  };

  useEffect(() => {
    if (recording && seconds >= MAX_SECONDS) stop();
  }, [recording, seconds]);

  useEffect(() => () => {
    clearInterval(timerRef.current);
    try { recorderRef.current?.stop(); } catch (e) { /* ignore */ }
  }, []);

  const start = async () => {
    setError('');
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError('Voice notes are not supported on this device.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const types = ['audio/webm', 'audio/mp4', 'audio/ogg'];
      const mimeType = types.find(t => window.MediaRecorder.isTypeSupported?.(t));
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        if (blob.size < 800) return;
        setUploading(true);
        try {
          const ext = blob.type.includes('mp4') ? 'm4a' : blob.type.includes('ogg') ? 'ogg' : 'webm';
          const file = new File([blob], `voice-${Date.now()}.${ext}`, { type: blob.type });
          const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
          if (file_uri) onRecorded(file_uri);
        } catch (e) {
          setError('Could not send the voice note. Please try again.');
        } finally {
          setUploading(false);
        }
      };

      recorder.start();
      recorderRef.current = recorder;
      setSeconds(0);
      setRecording(true);
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } catch (e) {
      setError('Microphone access is blocked. Allow it in your browser settings.');
    }
  };

  if (uploading) {
    return (
      <div className="w-10 h-10 flex items-center justify-center shrink-0" title="Sending voice note">
        <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
      </div>
    );
  }

  if (recording) {
    return (
      <button
        onClick={stop}
        className="h-10 px-3 rounded-full bg-red-600 text-white flex items-center gap-2 shrink-0"
        title="Stop and send"
      >
        <Square className="w-4 h-4" />
        <span className="text-xs font-semibold tabular-nums">{seconds}s</span>
      </button>
    );
  }

  return (
    <button
      onClick={start}
      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${error ? 'text-amber-400' : 'text-zinc-300 hover:text-white'} hover:bg-zinc-800 transition-colors`}
      title={error || 'Record a voice note'}
      aria-label="Record a voice note"
    >
      <Mic className="w-5 h-5" />
    </button>
  );
}