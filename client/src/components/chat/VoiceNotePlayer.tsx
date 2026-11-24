import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Mic } from 'lucide-react';
import { StatusTick } from '../common/StatusTick';
import { MessageStatus } from '../../types/chat';

interface VoiceNotePlayerProps {
  audioUrl: string;
  isOutgoing: boolean;
  timestamp: string;
  status: MessageStatus;
  avatarUrl?: string;
  fallbackDuration?: string;
}

// Generate a deterministic visual waveform bar pattern (28 bars)
const WAVEFORM_BAR_HEIGHTS = [
  35, 55, 75, 45, 90, 60, 40, 80, 100, 70, 50, 85, 65, 45, 95, 75, 55, 80, 60,
  40, 70, 90, 50, 85, 65, 45, 60, 40,
];

export const VoiceNotePlayer = ({
  audioUrl,
  isOutgoing,
  timestamp,
  status,
  avatarUrl,
  fallbackDuration = '0:00',
}: VoiceNotePlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<1 | 1.5 | 2>(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  // Parse fallback duration if audio duration is not loaded yet (e.g. "Voice message (0:08)")
  const parseFallbackSeconds = (): number => {
    const match = fallbackDuration.match(/(\d+):(\d+)/);
    if (match) {
      return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
    }
    return 0;
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      } else {
        // Fallback for some webm audio streams where duration is Infinity initially
        setDuration(parseFallbackSeconds());
      }
    };

    const handleDurationChange = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (
        (!Number.isFinite(duration) || duration === 0) &&
        Number.isFinite(audio.duration)
      ) {
        setDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [audioUrl, duration]);

  // Toggle playback rate (1x -> 1.5x -> 2x -> 1x)
  const togglePlaybackRate = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextRate: 1 | 1.5 | 2 =
      playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch((err) => {
        console.error('Audio playback error:', err);
      });
    }
  };

  // Seek on click along the progress waveform
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const progressBar = progressBarRef.current;
    const audio = audioRef.current;
    if (!progressBar || !audio) return;

    const effectiveDuration = duration > 0 ? duration : parseFallbackSeconds();
    if (effectiveDuration <= 0) return;

    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const seekTime = percentage * effectiveDuration;

    audio.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const formatTime = (secs: number): string => {
    if (!Number.isFinite(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const effectiveDuration = duration > 0 ? duration : parseFallbackSeconds();
  const progressRatio =
    effectiveDuration > 0 ? Math.min(1, currentTime / effectiveDuration) : 0;
  const activeBarsCount = Math.round(progressRatio * WAVEFORM_BAR_HEIGHTS.length);

  return (
    <div className="flex w-full min-w-[240px] max-w-[320px] flex-col p-2 select-none">
      {/* Hidden HTML5 Audio Element */}
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Main Player Row */}
      <div className="flex items-center gap-3">
        {/* Play / Pause Circular Button */}
        <button
          type="button"
          onClick={togglePlay}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-wa-green text-white shadow-md transition-transform hover:scale-105 active:scale-95 focus:outline-none"
          title={isPlaying ? 'Pause' : 'Play voice note'}
          aria-label={isPlaying ? 'Pause' : 'Play voice note'}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5 fill-current" />
          ) : (
            <Play className="h-5 w-5 fill-current ml-0.5" />
          )}
        </button>

        {/* Center: Waveform & Scrubber */}
        <div className="flex flex-1 flex-col justify-center">
          {/* Interactive Waveform Bar Container */}
          <div
            ref={progressBarRef}
            onClick={handleSeek}
            className="flex h-7 items-center gap-[2.5px] cursor-pointer py-1 group"
            title="Click or drag to seek"
          >
            {WAVEFORM_BAR_HEIGHTS.map((heightPercent, index) => {
              const isActive = index < activeBarsCount;
              return (
                <div
                  key={index}
                  className="flex-1 rounded-full transition-colors duration-100"
                  style={{
                    height: `${Math.max(20, heightPercent)}%`,
                    backgroundColor: isActive
                      ? '#00a884'
                      : isOutgoing
                      ? 'rgba(0, 0, 0, 0.25)'
                      : 'rgba(128, 128, 128, 0.35)',
                  }}
                />
              );
            })}
          </div>

          {/* Sub-row: Duration Counter & Playback Speed */}
          <div className="flex items-center justify-between text-[11px] text-wa-secondary mt-0.5">
            <span>
              {isPlaying
                ? formatTime(currentTime)
                : formatTime(effectiveDuration || currentTime)}
            </span>

            {/* Playback Speed Toggle Pill */}
            {isPlaying && (
              <button
                type="button"
                onClick={togglePlaybackRate}
                className="rounded-full bg-black/10 dark:bg-white/10 px-1.5 py-0.2 text-[10px] font-semibold text-wa-primary hover:bg-wa-green hover:text-white transition-colors"
                title="Change playback speed"
              >
                {playbackRate}x
              </button>
            )}
          </div>
        </div>

        {/* Right: Sender Avatar with Mic Badge */}
        <div className="relative h-10 w-10 flex-shrink-0">
          <img
            src={
              avatarUrl ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
            }
            alt="Sender"
            className="h-full w-full rounded-full object-cover shadow-sm"
          />
          <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-wa-green text-white shadow">
            <Mic className="h-2.5 w-2.5" />
          </span>
        </div>
      </div>

      {/* Bottom Row: Timestamp & Status Tick */}
      <div className="mt-1 flex items-center justify-end gap-1 select-none pr-1">
        <span className="text-[11px] text-wa-secondary">{timestamp}</span>
        {isOutgoing && <StatusTick status={status} className="h-3.5 w-3.5" />}
      </div>
    </div>
  );
};