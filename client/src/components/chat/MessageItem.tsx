import { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  Reply,
  Copy,
  Trash2,
  Check,
  CircleSlash,
} from 'lucide-react';
import { Message } from '../../types/chat';
import { StatusTick } from '../common/StatusTick';
import { VoiceNotePlayer } from './VoiceNotePlayer';

interface MessageItemProps {
  message: Message;
  isOutgoing: boolean;
  isGroup?: boolean;
  showTail?: boolean;
  repliedMessage?: Message | null;
  contactName?: string;
  currentUserId: string;
  searchQuery?: string;
  isActiveMatch?: boolean;
  onReply?: (message: Message) => void;
  onDelete?: (messageId: string) => void;
}

// Consistent sender colors for WhatsApp group messages
const getSenderColor = (senderId: string) => {
  const colors = [
    '#e542a3',
    '#00a884',
    '#1f7aec',
    '#ff7a00',
    '#8b5cf6',
    '#eab308',
    '#06b6d4',
  ];
  let hash = 0;
  for (let i = 0; i < senderId.length; i++) {
    hash = senderId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

// Helper to highlight search query inside message content
const renderHighlightedContent = (
  text: string,
  query?: string,
  isActiveMatch?: boolean
) => {
  if (!query || !query.trim()) {
    return text;
  }
  const trimmed = query.trim();
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  if (parts.length <= 1) return text;

  return parts.map((part, i) =>
    part.toLowerCase() === trimmed.toLowerCase() ? (
      <mark
        key={i}
        className={`rounded-sm px-0.5 font-medium transition-colors ${
          isActiveMatch
            ? 'bg-[#25d366] text-white dark:bg-[#25d366] dark:text-black font-semibold'
            : 'bg-amber-300 text-black dark:bg-amber-400 dark:text-black'
        }`}
      >
        {part}
      </mark>
    ) : (
      part
    )
  );
};

export const MessageItem = ({
  message,
  isOutgoing,
  isGroup = false,
  showTail = true,
  repliedMessage,
  contactName = 'Contact',
  currentUserId,
  searchQuery,
  isActiveMatch = false,
  onReply,
  onDelete,
}: MessageItemProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content || '');
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // Fallback
    }
    setIsMenuOpen(false);
  };

  const handleReply = () => {
    onReply?.(message);
    setIsMenuOpen(false);
  };

  const handleDelete = () => {
    onDelete?.(message.id);
    setIsMenuOpen(false);
  };

  const isImage = message.messageType === 'IMAGE' && Boolean(message.fileUrl);
  const isAudio = message.messageType === 'AUDIO' && Boolean(message.fileUrl);
  const hasCaption = Boolean(
    message.content &&
      message.content.trim().length > 0 &&
      !message.content.startsWith('Voice message')
  );

  // 1. Render Deleted Message state
  if (message.isDeleted) {
    return (
      <div
        className={`relative mb-1.5 flex w-full flex-col ${
          isOutgoing ? 'items-end' : 'items-start'
        }`}
      >
        <div
          className={`relative max-w-[85%] rounded-lg p-2 text-sm shadow-wa-bubble sm:max-w-[70%] md:max-w-[65%] ${
            isOutgoing
              ? 'rounded-tr-none bg-wa-outgoing text-wa-primary'
              : 'rounded-tl-none bg-wa-incoming text-wa-primary'
          }`}
        >
          <div className="flex items-center gap-1.5 text-wa-secondary italic text-sm select-none">
            <CircleSlash className="h-4 w-4 stroke-[1.5] flex-shrink-0" />
            <span className="text-[13px]">This message was deleted</span>
            <span className="ml-3 text-[11px] not-italic">{message.timestamp}</span>
          </div>
        </div>
      </div>
    );
  }

  // 2. Normal Active Message state
  return (
    <div
      id={`message-${message.id}`}
      className={`group relative mb-1.5 flex w-full flex-col transition-all duration-200 ${
        isOutgoing ? 'items-end' : 'items-start'
      }`}
    >
      <div
        className={`relative max-w-[85%] rounded-lg p-1 text-sm shadow-wa-bubble transition-all sm:max-w-[70%] md:max-w-[65%] ${
          isOutgoing
            ? 'rounded-tr-none bg-wa-outgoing text-wa-primary'
            : 'rounded-tl-none bg-wa-incoming text-wa-primary'
        } ${
          isActiveMatch
            ? 'ring-2 ring-wa-green shadow-md ring-offset-2 dark:ring-offset-wa-bg animate-pulse'
            : ''
        }`}
      >
        {/* SVG Bubble Tail matching bubble background in both Light & Dark modes */}
        {showTail && (
          isOutgoing ? (
            <span className="absolute -right-2 top-0 block text-wa-outgoing" aria-hidden="true">
              <svg viewBox="0 0 8 13" height="13" width="8" className="fill-current">
                <path d="M5.188 0H0v11.193l6.467-8.625C7.526 1.156 6.958 0 5.188 0z" />
              </svg>
            </span>
          ) : (
            <span className="absolute -left-2 top-0 block text-wa-incoming" aria-hidden="true">
              <svg viewBox="0 0 8 13" height="13" width="8" className="fill-current">
                <path d="M1.533 0 8 8.625V0H2.812C1.042 0 .474 1.156 1.533 0z" />
              </svg>
            </span>
          )
        )}

        {/* Hover Chevron Trigger */}
        <div className="absolute top-1 right-1 z-20" ref={menuRef}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen((prev) => !prev);
            }}
            className="flex h-5 w-5 items-center justify-center rounded-full bg-black/20 text-wa-secondary opacity-0 transition-opacity hover:text-wa-primary group-hover:opacity-100 focus:outline-none"
            title="Message options"
            aria-label="Message options"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>

          {/* Action Dropdown Menu */}
          {isMenuOpen && (
            <div className="absolute right-0 top-6 z-40 w-32 overflow-hidden rounded-lg border border-wa-border bg-wa-dropdown py-1 shadow-wa-dropdown animate-in fade-in zoom-in-95 duration-100">
              <button
                type="button"
                onClick={handleReply}
                className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-xs text-wa-primary transition-colors hover:bg-wa-hover focus:outline-none"
              >
                <Reply className="h-3.5 w-3.5 text-wa-secondary" />
                <span>Reply</span>
              </button>

              <button
                type="button"
                onClick={handleCopy}
                className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-xs text-wa-primary transition-colors hover:bg-wa-hover focus:outline-none"
              >
                {isCopied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-wa-green" />
                    <span className="text-wa-green font-medium">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-wa-secondary" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              <div className="my-1 border-t border-wa-border/50" />

              <button
                type="button"
                onClick={handleDelete}
                className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-xs text-red-500 transition-colors hover:bg-wa-hover focus:outline-none"
              >
                <Trash2 className="h-3.5 w-3.5 text-red-500" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>

        {/* Sender Name in Group Chat */}
        {isGroup && !isOutgoing && (
          <div
            className="px-2 pt-1 pb-0.5 text-[12.5px] font-semibold select-none leading-tight"
            style={{ color: getSenderColor(message.senderId) }}
          >
            {message.senderName || contactName}
          </div>
        )}

        {/* Quoted Reply Card (if message is replying to another message) */}
        {repliedMessage && (
          <div className="mx-1 mt-1 mb-1.5 rounded-md bg-black/10 dark:bg-black/25 border-l-[3.5px] border-wa-green p-1.5 text-xs select-none">
            <span className="font-semibold text-wa-green block text-[11.5px]">
              {repliedMessage.senderId === currentUserId ? 'You' : (repliedMessage as any).senderName || contactName}
            </span>
            <p className="truncate text-wa-secondary text-[12px] mt-0.5 max-w-[260px]">
              {repliedMessage.messageType === 'IMAGE'
                ? '📷 Photo'
                : repliedMessage.content}
            </p>
          </div>
        )}

        {/* Image Attachment (if messageType is IMAGE) */}
        {isImage && (
          <div className="relative overflow-hidden rounded-md">
            <img
              src={message.fileUrl}
              alt={message.content || 'Photo'}
              className="max-h-72 w-auto max-w-full rounded-md object-cover select-none cursor-pointer hover:opacity-95 transition-opacity"
            />
            {/* If there is NO caption, display timestamp directly as an overlay on the image */}
            {!hasCaption && (
              <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1 rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-white/90 backdrop-blur-sm select-none">
                <span>{message.timestamp}</span>
                {isOutgoing && (
                  <StatusTick status={message.status} className="h-3.5 w-3.5 text-white" />
                )}
              </div>
            )}
          </div>
        )}

        {/* Voice Note Attachment (if messageType is AUDIO) */}
        {isAudio && (
          <VoiceNotePlayer
            audioUrl={message.fileUrl!}
            isOutgoing={isOutgoing}
            timestamp={message.timestamp}
            status={message.status}
            fallbackDuration={message.content}
          />
        )}

        {/* Text Message or Caption */}
        {!isAudio && (!isImage || hasCaption) && (
          <div className={`flex flex-wrap items-end gap-x-2 gap-y-0.5 ${isImage ? 'px-2 pt-1.5 pb-0.5' : 'px-2 py-0.5'}`}>
            <p className="break-words text-[14.2px] leading-[19px] whitespace-pre-wrap select-text pr-4">
              {renderHighlightedContent(message.content, searchQuery, isActiveMatch)}
            </p>

            {/* Timestamp & Status Tick at bottom right */}
            <div className="ml-auto flex items-center gap-1 self-end pt-1 select-none">
              <span className="text-[11px] text-wa-secondary">
                {message.timestamp}
              </span>
              {isOutgoing && (
                <StatusTick status={message.status} className="h-3.5 w-3.5" />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
