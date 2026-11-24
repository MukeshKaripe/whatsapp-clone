import { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from 'react';
import { Smile, Paperclip, Mic, Send, X, Trash2, Loader2 } from 'lucide-react';
import EmojiPicker, { Theme, EmojiClickData } from 'emoji-picker-react';
import { useTheme } from '../../context/ThemeContext';
import { Message } from '../../types/chat';

interface MessageInputProps {
  onSendMessage: (text: string, replyToId?: string) => void;
  onSelectImage: (file: File) => void;
  onSendAudio?: (
    audioBlob: Blob,
    durationSeconds: number,
    replyToId?: string
  ) => Promise<void> | void;
  replyingTo?: Message | null;
  replyContactName?: string;
  currentUserId?: string;
  onCancelReply?: () => void;
  onTypingChange?: (isTyping: boolean) => void;
}

export const MessageInput = ({
  onSendMessage,
  onSelectImage,
  onSendAudio,
  replyingTo,
  replyContactName = 'Contact',
  currentUserId,
  onCancelReply,
  onTypingChange,
}: MessageInputProps) => {
  const [inputText, setInputText] = useState('');
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [isSendingAudio, setIsSendingAudio] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isCancelledRef = useRef<boolean>(false);
  const { theme } = useTheme();

  // Focus input on mount or when replying to a message
  useEffect(() => {
    inputRef.current?.focus();
  }, [replyingTo]);

  // Clean up timers and audio streams on unmount
  useEffect(() => {
    return () => {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setIsEmojiPickerOpen(false);
      }
    };

    if (isEmojiPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEmojiPickerOpen]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);

    if (onTypingChange) {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      } else if (val.trim().length > 0) {
        onTypingChange(true);
      }

      typingTimerRef.current = setTimeout(() => {
        onTypingChange(false);
        typingTimerRef.current = null;
      }, 2500);
    }
  };

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;

    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
      onTypingChange?.(false);
    }

    onSendMessage(trimmed, replyingTo?.id);
    setInputText('');
    setIsEmojiPickerOpen(false);
    onCancelReply?.();
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else if (e.key === 'Escape') {
      if (isEmojiPickerOpen) {
        setIsEmojiPickerOpen(false);
      } else if (replyingTo) {
        onCancelReply?.();
      }
    }
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setInputText((prev) => prev + emojiData.emoji);
    inputRef.current?.focus();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSelectImage(file);
    }
    e.target.value = '';
  };

  const startRecording = async () => {
    setRecordingError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setRecordingError('Voice recording is not supported on this browser.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Prefer WebM opus or mp4/ogg fallback
      let options: MediaRecorderOptions | undefined;
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        options = { mimeType: 'audio/webm;codecs=opus' };
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        options = { mimeType: 'audio/webm' };
      } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
        options = { mimeType: 'audio/ogg;codecs=opus' };
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        options = { mimeType: 'audio/mp4' };
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      isCancelledRef.current = false;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop audio tracks immediately
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
        }

        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }

        // If discarded or cancelled, do not proceed with upload
        if (isCancelledRef.current) {
          setIsRecording(false);
          setRecordingSeconds(0);
          setIsSendingAudio(false);
          return;
        }

        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

        if (audioBlob.size > 0 && onSendAudio) {
          setIsSendingAudio(true);
          try {
            await onSendAudio(audioBlob, recordingSeconds, replyingTo?.id);
            onCancelReply?.();
          } catch (err) {
            console.error('Failed to send voice note:', err);
          } finally {
            setIsSendingAudio(false);
            setIsRecording(false);
            setRecordingSeconds(0);
          }
        } else {
          setIsRecording(false);
          setRecordingSeconds(0);
        }
      };

      // Collect data every 250ms
      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone access error:', err);
      setRecordingError('Microphone permission denied or not available.');
      setTimeout(() => setRecordingError(null), 4000);
    }
  };

  const cancelRecording = () => {
    isCancelledRef.current = true;
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== 'inactive'
    ) {
      mediaRecorderRef.current.stop();
    } else {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      setIsRecording(false);
      setRecordingSeconds(0);
    }
  };

  const finishAndSendRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== 'inactive'
    ) {
      isCancelledRef.current = false;
      mediaRecorderRef.current.stop();
    }
  };

  const formatRecordingTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const hasText = inputText.trim().length > 0;

  return (
    <div className="relative flex flex-col select-none">
      {/* WhatsApp Quoted Reply Preview Banner */}
      {replyingTo && (
        <div className="flex items-center justify-between border-t border-b border-wa-border bg-wa-panel px-4 py-2 transition-colors duration-150 animate-in slide-in-from-bottom-2">
          <div className="flex flex-1 items-center gap-3 overflow-hidden border-l-[3.5px] border-wa-green pl-3">
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-semibold text-wa-green">
                {replyingTo.senderId === currentUserId ? 'You' : replyContactName}
              </span>
              <span className="truncate text-xs text-wa-secondary">
                {replyingTo.messageType === 'IMAGE' ? '📷 Photo' : replyingTo.content}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="flex h-7 w-7 items-center justify-center rounded-full text-wa-secondary transition-colors hover:bg-wa-hover hover:text-wa-primary focus:outline-none"
            title="Cancel reply"
            aria-label="Cancel reply"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Recording Error Alert Banner */}
      {recordingError && (
        <div className="border-t border-wa-border bg-red-500/10 px-4 py-1.5 text-center text-xs text-red-500">
          {recordingError}
        </div>
      )}

      {/* Main Footer: Toggle between Standard Input Bar and Recording Bar */}
      {isRecording ? (
        <footer className="relative flex h-[62px] items-center justify-between border-t border-wa-border bg-wa-panel px-4 py-2 transition-colors duration-150 animate-in fade-in duration-150">
          {/* Left: Cancel / Trash Recording Button */}
          <button
            type="button"
            onClick={cancelRecording}
            disabled={isSendingAudio}
            className="flex h-10 w-10 items-center justify-center rounded-full text-wa-secondary transition-colors hover:bg-red-500/10 hover:text-red-500 focus:outline-none"
            title="Discard voice note"
            aria-label="Discard voice note"
          >
            <Trash2 className="h-5 w-5" />
          </button>

          {/* Center: Pulsing Red Recording Indicator & Duration Timer & Waveform animation */}
          <div className="flex flex-1 items-center justify-center gap-3">
            <span className="h-3 w-3 rounded-full bg-red-500 animate-pulse shadow-sm" />
            <span className="text-sm font-medium tabular-nums text-wa-primary min-w-[36px]">
              {formatRecordingTime(recordingSeconds)}
            </span>

            {/* Soundwave animation bars */}
            <div className="flex items-center gap-[3px] h-4">
              <span className="w-1 h-3 bg-red-500/70 rounded-full animate-bounce [animation-delay:0.1s]" />
              <span className="w-1 h-5 bg-red-500 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-1 h-2 bg-red-500/60 rounded-full animate-bounce [animation-delay:0.3s]" />
              <span className="w-1 h-4 bg-red-500/90 rounded-full animate-bounce [animation-delay:0.15s]" />
              <span className="w-1 h-3 bg-red-500/70 rounded-full animate-bounce [animation-delay:0.25s]" />
            </div>
          </div>

          {/* Right: Send Audio Button (or Spinner while uploading) */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={finishAndSendRecording}
              disabled={isSendingAudio}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-wa-green text-white shadow-md transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 focus:outline-none"
              title="Send voice note"
              aria-label="Send voice note"
            >
              {isSendingAudio ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5 fill-current ml-0.5" />
              )}
            </button>
          </div>
        </footer>
      ) : (
        <footer className="relative flex h-[62px] items-center gap-2 border-t border-wa-border bg-wa-panel px-4 py-2 transition-colors duration-150">
          {/* Hidden File Input for Image Attachment */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Floating Emoji Picker Popover */}
          {isEmojiPickerOpen && (
            <div
              ref={emojiPickerRef}
              className="absolute bottom-[68px] left-3 z-50 overflow-hidden rounded-xl border border-wa-border shadow-2xl animate-in fade-in zoom-in-95 duration-150"
            >
              <EmojiPicker
                theme={theme === 'dark' ? Theme.DARK : Theme.LIGHT}
                onEmojiClick={handleEmojiClick}
                lazyLoadEmojis
                previewConfig={{ showPreview: false }}
                width={340}
                height={380}
                searchPlaceHolder="Search emojis..."
              />
            </div>
          )}

          {/* Left: Emoji & Attachment icons */}
          <div className="flex items-center gap-1 text-wa-secondary">
            <button
              type="button"
              onClick={() => setIsEmojiPickerOpen((prev) => !prev)}
              className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors focus:outline-none ${
                isEmojiPickerOpen
                  ? 'bg-wa-hover text-wa-green'
                  : 'hover:bg-wa-hover hover:text-wa-primary'
              }`}
              title={isEmojiPickerOpen ? 'Close emojis' : 'Emojis'}
              aria-label="Emojis"
            >
              {isEmojiPickerOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Smile className="h-6 w-6" />
              )}
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-wa-hover hover:text-wa-primary focus:outline-none"
              title="Attach image"
              aria-label="Attach image"
            >
              <Paperclip className="h-5 w-5" />
            </button>
          </div>

          {/* Center: Text Input */}
          <div className="flex-1">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message"
              className="w-full rounded-lg bg-wa-input px-4 py-2.5 text-sm text-wa-primary placeholder-wa-secondary focus:outline-none shadow-sm"
            />
          </div>

          {/* Right: Dynamic Microphone or Send Button */}
          <div className="flex items-center text-wa-secondary">
            {hasText ? (
              <button
                type="button"
                onClick={handleSend}
                className="flex h-10 w-10 items-center justify-center rounded-full text-wa-green transition-colors hover:bg-wa-hover focus:outline-none"
                title="Send message"
                aria-label="Send message"
              >
                <Send className="h-5 w-5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={startRecording}
                className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-wa-hover hover:text-wa-primary focus:outline-none"
                title="Voice note"
                aria-label="Voice note"
              >
                <Mic className="h-5 w-5" />
              </button>
            )}
          </div>
        </footer>
      )}
    </div>
  );
};
