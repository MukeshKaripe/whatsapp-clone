import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { User } from '../types/chat';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

export type CallType = 'audio' | 'video';
export type CallState = 'idle' | 'outgoing' | 'incoming' | 'connected';

interface IncomingCallPayload {
  fromUserId: string;
  fromUser: User;
  offer: RTCSessionDescriptionInit;
  callType: CallType;
}

interface WebRTCContextType {
  callState: CallState;
  callType: CallType | null;
  remoteUser: User | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isCameraOff: boolean;
  callDuration: number;
  errorMessage: string | null;
  startCall: (targetUser: User, type: CallType) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleCamera: () => void;
}

const WebRTCContext = createContext<WebRTCContextType | undefined>(undefined);

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    {
      urls: [
        'turn:openrelay.metered.ca:80',
        'turn:openrelay.metered.ca:443',
        'turn:openrelay.metered.ca:443?transport=tcp',
      ],
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
  ],
  iceCandidatePoolSize: 10,
};

// Simple Web Audio API ringtone generator so no external audio files are required
class RingtoneGenerator {
  private audioCtx: AudioContext | null = null;
  private intervalId: number | null = null;

  startRinging(isIncoming: boolean) {
    this.stop();
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;
      this.audioCtx = new AudioCtxClass();

      const playTone = () => {
        if (!this.audioCtx || this.audioCtx.state === 'closed') return;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(isIncoming ? 520 : 440, this.audioCtx.currentTime);
        if (isIncoming) {
          osc.frequency.exponentialRampToValueAtTime(660, this.audioCtx.currentTime + 0.35);
        }

        gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + (isIncoming ? 0.7 : 1.2));

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start();
        osc.stop(this.audioCtx.currentTime + (isIncoming ? 0.7 : 1.2));
      };

      playTone();
      this.intervalId = window.setInterval(playTone, isIncoming ? 1500 : 3000);
    } catch (e) {
      console.warn('[WebRTC] Ringtone audio context error:', e);
    }
  }

  stop() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch {}
      this.audioCtx = null;
    }
  }
}

const ringtone = new RingtoneGenerator();

export const WebRTCProvider = ({ children }: { children: ReactNode }) => {
  const { user: currentUser } = useAuth();
  const { socket } = useSocket();

  const [callState, setCallState] = useState<CallState>('idle');
  const [callType, setCallType] = useState<CallType | null>(null);
  const [remoteUser, setRemoteUser] = useState<User | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const queuedCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const incomingOfferRef = useRef<IncomingCallPayload | null>(null);
  const durationTimerRef = useRef<number | null>(null);
  const remoteUserIdRef = useRef<string | null>(null);
  const activePartnerIdRef = useRef<string | null>(null);

  // Sync ref with local stream
  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  // Sync ref with remote stream
  useEffect(() => {
    remoteStreamRef.current = remoteStream;
  }, [remoteStream]);

  // Teardown and reset all WebRTC resources
  const cleanupCall = useCallback(() => {
    ringtone.stop();

    if (durationTimerRef.current !== null) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      localStreamRef.current = null;
    }

    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      remoteStreamRef.current = null;
    }

    if (pcRef.current) {
      pcRef.current.onicecandidate = null;
      pcRef.current.ontrack = null;
      pcRef.current.oniceconnectionstatechange = null;
      pcRef.current.close();
      pcRef.current = null;
    }

    queuedCandidatesRef.current = [];
    incomingOfferRef.current = null;
    activePartnerIdRef.current = null;
    remoteUserIdRef.current = null;

    setCallState('idle');
    setCallType(null);
    setRemoteUser(null);
    setLocalStream(null);
    setRemoteStream(null);
    setIsMuted(false);
    setIsCameraOff(false);
    setCallDuration(0);
  }, []);

  // Call duration counter when connected
  useEffect(() => {
    if (callState === 'connected') {
      ringtone.stop();
      setCallDuration(0);
      durationTimerRef.current = window.setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (durationTimerRef.current !== null) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
    }
  }, [callState]);

  // Socket WebRTC Signaling Handlers
  useEffect(() => {
    if (!socket || !currentUser) return;

    // 1. Incoming Call Offer
    const handleIncomingCall = (payload: IncomingCallPayload) => {
      // If already in a call, auto-reject
      if (callState !== 'idle' || pcRef.current) {
        socket.emit('reject-call', { toUserId: payload.fromUserId });
        return;
      }

      console.log(`[WebRTC] Incoming ${payload.callType} call from ${payload.fromUser.name}`);
      const peerId = payload.fromUserId || payload.fromUser?.id;
      incomingOfferRef.current = payload;
      activePartnerIdRef.current = peerId;
      remoteUserIdRef.current = peerId;
      setRemoteUser(payload.fromUser);
      setCallType(payload.callType);
      setCallState('incoming');
      setErrorMessage(null);

      ringtone.startRinging(true);
    };

    // 2. Outgoing Call Answered
    const handleCallAnswered = async ({
      fromUserId,
      answer,
    }: {
      fromUserId: string;
      answer: RTCSessionDescriptionInit;
    }) => {
      console.log(`[WebRTC] Call answered by ${fromUserId}`);
      const pc = pcRef.current;
      if (!pc) return;

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));

        // Flush any queued ICE candidates that arrived before the answer
        if (queuedCandidatesRef.current.length > 0) {
          console.log(`[WebRTC] Caller flushing ${queuedCandidatesRef.current.length} queued ICE candidates`);
          for (const candidate of queuedCandidatesRef.current) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
              console.warn('[WebRTC] Error adding queued candidate:', e);
            }
          }
          queuedCandidatesRef.current = [];
        }

        setCallState('connected');
      } catch (err) {
        console.error('[WebRTC] Error setting remote description for answer:', err);
        cleanupCall();
      }
    };

    // 3. ICE Candidate Relay
    const handleIceCandidate = async ({
      candidate,
    }: {
      fromUserId: string;
      candidate: RTCIceCandidateInit;
    }) => {
      if (!candidate) return;

      const pc = pcRef.current;
      if (pc && pc.remoteDescription && pc.remoteDescription.type) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
          console.log('[WebRTC] Successfully added received ICE candidate directly');
        } catch (e) {
          console.warn('[WebRTC] Error adding received ICE candidate:', e);
        }
      } else {
        console.log(`[WebRTC] Buffering early ICE candidate (pc: ${!!pc}, remoteDesc: ${!!pc?.remoteDescription?.type})`);
        queuedCandidatesRef.current.push(candidate);
      }
    };

    // 4. Call Rejected
    const handleCallRejected = () => {
      console.log('[WebRTC] Call was rejected');
      setErrorMessage('Call declined');
      setTimeout(() => {
        setErrorMessage(null);
        cleanupCall();
      }, 1500);
    };

    // 5. Call Ended
    const handleCallEnded = () => {
      console.log('[WebRTC] Call ended by remote peer');
      cleanupCall();
    };

    // 6. Target User Unavailable / Offline
    const handleCallUnavailable = ({ reason }: { toUserId: string; reason: string }) => {
      console.log(`[WebRTC] Target user is unavailable: ${reason}`);
      setErrorMessage('User is currently offline');
      setTimeout(() => {
        setErrorMessage(null);
        cleanupCall();
      }, 2000);
    };

    socket.on('incoming-call', handleIncomingCall);
    socket.on('call-answered', handleCallAnswered);
    socket.on('ice-candidate', handleIceCandidate);
    socket.on('call-rejected', handleCallRejected);
    socket.on('call-ended', handleCallEnded);
    socket.on('call-unavailable', handleCallUnavailable);

    return () => {
      socket.off('incoming-call', handleIncomingCall);
      socket.off('call-answered', handleCallAnswered);
      socket.off('ice-candidate', handleIceCandidate);
      socket.off('call-rejected', handleCallRejected);
      socket.off('call-ended', handleCallEnded);
      socket.off('call-unavailable', handleCallUnavailable);
    };
  }, [socket, currentUser?.id, callState, cleanupCall]);

  // Start an Outgoing Call
  const startCall = async (targetUser: User, type: CallType) => {
    if (!socket || !currentUser) return;
    if (callState !== 'idle') return;

    setErrorMessage(null);
    setRemoteUser(targetUser);
    setCallType(type);
    setCallState('outgoing');
    activePartnerIdRef.current = targetUser.id;
    remoteUserIdRef.current = targetUser.id;
    queuedCandidatesRef.current = [];

    ringtone.startRinging(false);

    try {
      // 1. Acquire Local Audio / Video Media Stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video' ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
      });

      setLocalStream(stream);
      localStreamRef.current = stream;

      // 2. Initialize RTCPeerConnection
      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;

      // Add local tracks to peer connection
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Handle remote incoming tracks
      pc.ontrack = (event) => {
        console.log('[WebRTC] Received remote stream track:', event.track.kind);
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
          remoteStreamRef.current = event.streams[0];
        }
      };

      // Relay local ICE candidates to recipient
      pc.onicecandidate = (event) => {
        const toUserId = remoteUserIdRef.current || targetUser.id;
        if (event.candidate && toUserId) {
          console.log('[WebRTC] Emitting local ICE candidate to', toUserId);
          const candidateData = event.candidate.toJSON ? event.candidate.toJSON() : event.candidate;
          socket.emit('ice-candidate', {
            toUserId,
            candidate: candidateData,
          });
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log('[WebRTC] ICE Connection State:', pc.iceConnectionState);
        if (
          pc.iceConnectionState === 'disconnected' ||
          pc.iceConnectionState === 'failed' ||
          pc.iceConnectionState === 'closed'
        ) {
          cleanupCall();
        }
      };

      // 3. Create and set Local SDP Offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // 4. Relay offer to remote user via Socket.IO
      socket.emit('call-user', {
        toUserId: targetUser.id,
        fromUser: currentUser,
        offer,
        callType: type,
      });
    } catch (err: any) {
      console.error('[WebRTC] Error starting call:', err);
      setErrorMessage(
        err.name === 'NotAllowedError'
          ? 'Permission to access microphone/camera was denied'
          : 'Could not access media devices'
      );
      setTimeout(() => {
        setErrorMessage(null);
        cleanupCall();
      }, 3000);
    }
  };

  // Accept an Incoming Call
  const acceptCall = async () => {
    if (!socket || !currentUser || !incomingOfferRef.current) return;
    const { fromUserId, offer, callType: type } = incomingOfferRef.current;
    const peerId = fromUserId || remoteUserIdRef.current || incomingOfferRef.current?.fromUser?.id;
    remoteUserIdRef.current = peerId;
    activePartnerIdRef.current = peerId;

    ringtone.stop();
    setErrorMessage(null);

    try {
      // 1. Acquire Local Audio / Video Media Stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video' ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
      });

      setLocalStream(stream);
      localStreamRef.current = stream;

      // 2. Initialize RTCPeerConnection
      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;

      // Add local tracks to peer connection
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Handle remote incoming tracks
      pc.ontrack = (event) => {
        console.log('[WebRTC] Received remote stream track:', event.track.kind);
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
          remoteStreamRef.current = event.streams[0];
        }
      };

      // Relay local ICE candidates to caller
      pc.onicecandidate = (event) => {
        const toUserId = remoteUserIdRef.current || peerId;
        if (event.candidate && toUserId) {
          console.log('[WebRTC] Emitting local ICE candidate to', toUserId);
          const candidateData = event.candidate.toJSON ? event.candidate.toJSON() : event.candidate;
          socket.emit('ice-candidate', {
            toUserId,
            candidate: candidateData,
          });
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log('[WebRTC] ICE Connection State:', pc.iceConnectionState);
        if (
          pc.iceConnectionState === 'disconnected' ||
          pc.iceConnectionState === 'failed' ||
          pc.iceConnectionState === 'closed'
        ) {
          cleanupCall();
        }
      };

      // 3. Set Remote SDP Offer
      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      // Flush queued ICE candidates
      if (queuedCandidatesRef.current.length > 0) {
        console.log(`[WebRTC] Callee flushing ${queuedCandidatesRef.current.length} queued ICE candidates`);
        for (const candidate of queuedCandidatesRef.current) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.warn('[WebRTC] Error adding queued candidate:', e);
          }
        }
        queuedCandidatesRef.current = [];
      }

      // 4. Create and set Local SDP Answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // 5. Emit answer-call to caller
      socket.emit('answer-call', {
        toUserId: peerId,
        answer,
      });

      setCallState('connected');
    } catch (err: any) {
      console.error('[WebRTC] Error accepting call:', err);
      setErrorMessage(
        err.name === 'NotAllowedError'
          ? 'Permission to access microphone/camera was denied'
          : 'Failed to connect call'
      );
      setTimeout(() => {
        setErrorMessage(null);
        cleanupCall();
      }, 3000);
    }
  };

  // Reject Incoming Call
  const rejectCall = () => {
    const toUserId = remoteUserIdRef.current || activePartnerIdRef.current;
    if (socket && toUserId) {
      socket.emit('reject-call', { toUserId });
    }
    cleanupCall();
  };

  // End Active Call
  const endCall = () => {
    const toUserId = remoteUserIdRef.current || activePartnerIdRef.current;
    if (socket && toUserId) {
      socket.emit('end-call', { toUserId });
    }
    cleanupCall();
  };

  // Toggle Microphone Mute
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted((prev) => !prev);
    }
  };

  // Toggle Camera
  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsCameraOff((prev) => !prev);
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      cleanupCall();
    };
  }, [cleanupCall]);

  return (
    <WebRTCContext.Provider
      value={{
        callState,
        callType,
        remoteUser,
        localStream,
        remoteStream,
        isMuted,
        isCameraOff,
        callDuration,
        errorMessage,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleCamera,
      }}
    >
      {children}
    </WebRTCContext.Provider>
  );
};

export const useWebRTC = (): WebRTCContextType => {
  const context = useContext(WebRTCContext);
  if (!context) {
    throw new Error('useWebRTC must be used within a WebRTCProvider');
  }
  return context;
};