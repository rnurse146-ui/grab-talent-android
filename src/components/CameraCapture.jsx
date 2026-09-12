import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, RefreshCw, Camera, Video, Check } from 'lucide-react';

// In-app camera capture — triggers the native Camera/Microphone permission prompt.
// mode="video" records a clip via MediaRecorder; mode="photo" grabs a single frame.
export default function CameraCapture({ open, mode = 'video', onClose, onCapture }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const capturedBlobRef = useRef(null);
  const [facing, setFacing] = useState('user');
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);
  const [recording, setRecording] = useState(false);
  const [capturedUrl, setCapturedUrl] = useState(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setReady(false);
  }, []);

  const startStream = useCallback(async () => {
    setError(null);
    setCapturedUrl(null);
    capturedBlobRef.current = null;
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Your browser does not support in-app camera capture. Please upload a file instead.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing },
        audio: mode === 'video',
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setReady(true);
    } catch (e) {
      setError("Camera access is blocked. Allow Camera (and Microphone) for this app in your phone's settings, then try again.");
    }
  }, [facing, mode]);

  useEffect(() => {
    if (open) startStream();
    return () => {
      stopStream();
      if (recorderRef.current?.state === 'recording') { try { recorderRef.current.stop(); } catch {} }
    };
  }, [open, startStream, stopStream]);

  // Auto-stop long recordings to keep uploads small and fast
  useEffect(() => {
    if (!recording) return;
    const t = setTimeout(() => { try { recorderRef.current?.stop(); } catch {} setRecording(false); }, 60000);
    return () => clearTimeout(t);
  }, [recording]);

  const startRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const candidates = ['video/mp4', 'video/webm;codecs=vp8,opus', 'video/webm'];
    const mimeType = candidates.find(t => window.MediaRecorder?.isTypeSupported?.(t));
    try {
      recorderRef.current = new MediaRecorder(streamRef.current, mimeType ? { mimeType } : undefined);
    } catch {
      recorderRef.current = new MediaRecorder(streamRef.current);
    }
    const rec = recorderRef.current;
    rec.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
    rec.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'video/webm' });
      capturedBlobRef.current = blob;
      setCapturedUrl(URL.createObjectURL(blob));
      stopStream();
    };
    rec.start();
    setRecording(true);
  };

  const stopRecording = () => { try { recorderRef.current?.stop(); } catch {} setRecording(false); };

  const takePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 960;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      capturedBlobRef.current = blob;
      setCapturedUrl(URL.createObjectURL(blob));
      stopStream();
    }, 'image/jpeg', 0.9);
  };

  const confirmCapture = () => {
    const blob = capturedBlobRef.current;
    if (!blob) return;
    const ext = blob.type.startsWith('video') ? (blob.type.includes('mp4') ? 'mp4' : 'webm') : 'jpg';
    onCapture(new File([blob], `camera-${Date.now()}.${ext}`, { type: blob.type }));
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col">
      <div className="flex items-center justify-between p-4 safe-top">
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white"><X className="w-5 h-5" /></button>
        <p className="text-white font-semibold text-sm">
          {capturedUrl ? (mode === 'video' ? 'Your video' : 'Your photo') : (mode === 'video' ? 'Record a video' : 'Take a photo')}
        </p>
        <button onClick={() => setFacing(f => f === 'user' ? 'environment' : 'user')} disabled={!!capturedUrl || !ready} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white disabled:opacity-40"><RefreshCw className="w-5 h-5" /></button>
      </div>

      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {error ? (
          <div className="px-8 text-center text-zinc-300 text-sm">{error}</div>
        ) : capturedUrl ? (
          mode === 'video'
            ? <video src={capturedUrl} controls autoPlay loop className="max-h-full max-w-full" />
            : <img src={capturedUrl} alt="Captured" className="max-h-full max-w-full object-contain" />
        ) : (
          <video ref={videoRef} playsInline muted autoPlay className="w-full h-full object-cover" />
        )}
        {!error && !capturedUrl && !ready && <p className="absolute text-zinc-400 text-sm">Starting camera…</p>}
      </div>

      <div className="p-6 pb-10 safe-bottom flex items-center justify-center gap-4">
        {error ? (
          <button onClick={onClose} className="px-6 py-3 rounded-full bg-white/10 text-white text-sm font-medium">Close</button>
        ) : capturedUrl ? (
          <>
            <button onClick={startStream} className="px-6 py-3 rounded-full bg-white/10 text-white text-sm font-medium">Retake</button>
            <button onClick={confirmCapture} className="px-8 py-3 rounded-full bg-gradient-to-r from-orange-600 to-purple-600 text-white text-sm font-semibold flex items-center gap-2"><Check className="w-4 h-4" />Use</button>
          </>
        ) : mode === 'video' ? (
          <button onClick={recording ? stopRecording : startRecording} disabled={!ready} className={`w-20 h-20 rounded-full flex items-center justify-center disabled:opacity-40 transition-all ${recording ? 'bg-red-600 animate-pulse' : 'bg-red-500'}`}>
            {recording ? <span className="w-8 h-8 bg-white rounded-sm" /> : <Video className="w-8 h-8 text-white" />}
          </button>
        ) : (
          <button onClick={takePhoto} disabled={!ready} className="w-20 h-20 rounded-full bg-white flex items-center justify-center disabled:opacity-40"><Camera className="w-8 h-8 text-black" /></button>
        )}
      </div>
    </div>
  );
}