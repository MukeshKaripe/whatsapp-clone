import { useEffect, useRef, useState } from 'react';
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { useWebRTC } from '../../context/WebRTCContext';

export const CallModal = () => {
  const {
    callState,
    callType,
    remoteUser,
    localStream,
    remoteStream,
    isMuted,
    isCameraOff,
    callDuration,
    errorMessage,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleCamera,
  } = useWebRTC();

  const [isMinimized, setIsMinimized] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  // Bind local stream to local video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch(() => {});
    }
  }, [localStream, callState, callType]);

  // Bind remote stream to remote video element and audio element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream && callType === 'video') {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch(() => {});
    }
    if (remoteAudioRef.current && remoteStream) {
      if (callType === 'audio') {
        remoteAudioRef.current.srcObject = remoteStream;
        remoteAudioRef.current.play().catch(() => {});
      } else {
        remoteAudioRef.current.srcObject = null;
      }
    }
  }, [remoteStream, callState, callType]);

  if (callState === 'idle' && !errorMessage) {
    return null;
  }

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const contactAvatar =
    remoteUser?.avatar ||
    remoteUser?.avatarUrl ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';

  // 1. Incoming Call Prompt Banner/Modal
  if (callState === 'incoming') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="w-full max-w-sm rounded-2xl bg-wa-surface border border-wa-border p-6 shadow-2xl flex flex-col items-center text-center">
          {/* Caller Avatar with pulsing green ring */}
          <div className="relative mb-4">
            <div className="absolute inset-0 rounded-full bg-wa-green/30 animate-ping" />
            <img
              src={contactAvatar}
              alt={remoteUser?.name || 'Caller'}
              className="relative h-24 w-24 rounded-full object-cover shadow-lg border-2 border-wa-green"
            />
          </div>

          <h3 className="text-xl font-semibold text-wa-primary">
            {remoteUser?.name || 'Incoming Call'}
          </h3>
          <p className="text-sm text-wa-green font-medium mt-1 flex items-center gap-1.5">
            {callType === 'video' ? (
              <Video className="h-4 w-4" />
            ) : (
              <Phone className="h-4 w-4" />
            )}
            <span>Incoming WhatsApp {callType === 'video' ? 'Video' : 'Voice'} Call</span>
          </p>

          {/* Action Buttons: Decline (Red) and Accept (Green) */}
          <div className="flex items-center gap-10 mt-8">
            {/* Decline */}
            <div className="flex flex-col items-center gap-1.5">
              <button
                type="button"
                onClick={rejectCall}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition-transform hover:scale-110 active:scale-95 focus:outline-none"
                title="Decline"
                aria-label="Decline"
              >
                <PhoneOff className="h-6 w-6 stroke-[2.2]" />
              </button>
              <span className="text-xs text-wa-secondary">Decline</span>
            </div>

            {/* Accept */}
            <div className="flex flex-col items-center gap-1.5">
              <button
                type="button"
                onClick={acceptCall}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-wa-green text-white shadow-lg transition-transform hover:scale-110 active:scale-95 focus:outline-none animate-bounce"
                title="Accept"
                aria-label="Accept"
              >
                {callType === 'video' ? (
                  <Video className="h-6 w-6 stroke-[2.2]" />
                ) : (
                  <Phone className="h-6 w-6 stroke-[2.2]" />
                )}
              </button>
              <span className="text-xs text-wa-green font-medium">Accept</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Minimized Active Call Widget in Corner
  if (isMinimized && callState === 'connected') {
    return (
      <>
        <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl bg-wa-surface border border-wa-border p-3 shadow-2xl animate-in slide-in-from-bottom-4">
          <img
            src={contactAvatar}
            alt={remoteUser?.name || 'Contact'}
            className="h-10 w-10 rounded-full object-cover"
          />
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-wa-primary">
              {remoteUser?.name}
            </span>
            <span className="text-[11px] text-wa-green font-medium">
              {formatDuration(callDuration)}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsMinimized(false)}
            className="ml-2 flex h-8 w-8 items-center justify-center rounded-full hover:bg-wa-hover text-wa-secondary"
            title="Maximize"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={endCall}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white"
            title="End Call"
          >
            <PhoneOff className="h-4 w-4" />
          </button>
        </div>
      </>
    );
  }

  // 3. Outgoing Calling or Active Connected Call Screen
  return (
    <>
      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-6 animate-in fade-in duration-200">
      <div className="relative flex h-full max-h-[720px] w-full max-w-[960px] flex-col overflow-hidden rounded-2xl bg-[#111b21] text-white shadow-2xl border border-white/10">
        {/* Top Header: Contact Name, Duration, Minimize Button */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/70 to-transparent">
          <div className="flex items-center gap-3">
            <img
              src={contactAvatar}
              alt={remoteUser?.name || 'Contact'}
              className="h-9 w-9 rounded-full object-cover border border-white/20"
            />
            <div className="flex flex-col">
              <span className="text-sm font-semibold leading-tight">
                {remoteUser?.name}
              </span>
              <span className="text-xs text-wa-green font-medium">
                {callState === 'outgoing'
                  ? errorMessage || 'Calling...'
                  : formatDuration(callDuration)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsMinimized(true)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white/80 transition-colors"
            title="Minimize"
          >
            <Minimize2 className="h-4 w-4" />
          </button>
        </div>

        {/* Center Content: Video Views or Audio Calling Avatars */}
        <div className="relative flex-1 flex items-center justify-center overflow-hidden">
          {callType === 'video' ? (
            <>
              {/* Remote Video Stream (Main View) */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="h-full w-full object-cover bg-black"
              />

              {/* Remote Video Placeholder when video is not connected or streaming yet */}
              {(!remoteStream || callState === 'outgoing') && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#111b21] z-10">
                  <div className="relative mb-4">
                    {callState === 'outgoing' && (
                      <div className="absolute inset-0 rounded-full bg-wa-green/20 animate-ping" />
                    )}
                    <img
                      src={contactAvatar}
                      alt={remoteUser?.name || 'Contact'}
                      className="relative h-28 w-28 rounded-full object-cover border-2 border-white/20 shadow-xl"
                    />
                  </div>
                  <h3 className="text-lg font-medium">{remoteUser?.name}</h3>
                  <p className="text-sm text-wa-green mt-1">
                    {errorMessage || (callState === 'outgoing' ? 'Ringing...' : 'Connecting video...')}
                  </p>
                </div>
              )}

              {/* Local Video Stream (Picture-in-Picture in Corner) */}
              <div className="absolute bottom-20 right-4 z-20 h-36 w-24 sm:h-44 sm:w-32 overflow-hidden rounded-xl border-2 border-white/20 bg-black shadow-2xl">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`h-full w-full object-cover ${isCameraOff ? 'hidden' : ''}`}
                />
                {isCameraOff && (
                  <div className="flex h-full w-full flex-col items-center justify-center bg-[#202c33] text-white/60">
                    <VideoOff className="h-6 w-6 mb-1" />
                    <span className="text-[10px]">Camera off</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Voice Audio Call View */
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-6">
                {callState === 'outgoing' && (
                  <div className="absolute -inset-3 rounded-full bg-wa-green/20 animate-pulse" />
                )}
                {callState === 'connected' && (
                  <div className="absolute -inset-2 rounded-full border border-wa-green/50 animate-ping [animation-duration:2.5s]" />
                )}
                <img
                  src={contactAvatar}
                  alt={remoteUser?.name || 'Contact'}
                  className="relative h-32 w-32 rounded-full object-cover border-4 border-white/10 shadow-2xl"
                />
              </div>

              <h3 className="text-2xl font-semibold">{remoteUser?.name}</h3>
              <p className="text-sm text-wa-green font-medium mt-1">
                {callState === 'outgoing'
                  ? errorMessage || 'Calling...'
                  : `Voice Call · ${formatDuration(callDuration)}`}
              </p>
            </div>
          )}
        </div>

        {/* Bottom Floating Control Bar */}
        <div className="relative z-20 flex items-center justify-center gap-6 p-4 bg-gradient-to-t from-black/80 to-transparent">
          {/* Mute / Unmute Microphone */}
          <button
            type="button"
            onClick={toggleMute}
            className={`flex h-12 w-12 items-center justify-center rounded-full transition-transform hover:scale-105 active:scale-95 focus:outline-none ${
              isMuted
                ? 'bg-red-500/80 text-white'
                : 'bg-white/15 hover:bg-white/25 text-white'
            }`}
            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>

          {/* Toggle Camera (Only in Video Mode) */}
          {callType === 'video' && (
            <button
              type="button"
              onClick={toggleCamera}
              className={`flex h-12 w-12 items-center justify-center rounded-full transition-transform hover:scale-105 active:scale-95 focus:outline-none ${
                isCameraOff
                  ? 'bg-red-500/80 text-white'
                  : 'bg-white/15 hover:bg-white/25 text-white'
              }`}
              title={isCameraOff ? 'Turn camera on' : 'Turn camera off'}
            >
              {isCameraOff ? (
                <VideoOff className="h-5 w-5" />
              ) : (
                <Video className="h-5 w-5" />
              )}
            </button>
          )}

          {/* End Call Button */}
          <button
            type="button"
            onClick={endCall}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-xl transition-transform hover:scale-110 active:scale-95 focus:outline-none"
            title="End call"
          >
            <PhoneOff className="h-6 w-6 stroke-[2.2]" />
          </button>
        </div>
      </div>
    </div>
    </>
  );
};