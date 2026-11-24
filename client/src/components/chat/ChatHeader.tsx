import { useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Phone,
  Video,
  Search,
  MoreVertical,
  X,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { Chat } from '../../types/chat';

interface ChatHeaderProps {
  chat: Chat;
  isTyping?: boolean;
  isSearchOpen?: boolean;
  searchQuery?: string;
  totalMatches?: number;
  currentMatchIndex?: number;
  onSearchChange?: (query: string) => void;
  onNextMatch?: () => void;
  onPrevMatch?: () => void;
  onToggleSearch?: () => void;
  onCloseSearch?: () => void;
  onBack?: () => void;
  onAudioCall?: () => void;
  onVideoCall?: () => void;
  onMenu?: () => void;
  onOpenGroupInfo?: () => void;
}

export const ChatHeader = ({
  chat,
  isTyping = false,
  isSearchOpen = false,
  searchQuery = '',
  totalMatches = 0,
  currentMatchIndex = 0,
  onSearchChange,
  onNextMatch,
  onPrevMatch,
  onToggleSearch,
  onCloseSearch,
  onBack,
  onAudioCall,
  onVideoCall,
  onMenu,
  onOpenGroupInfo,
}: ChatHeaderProps) => {
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Automatically focus input when search mode is activated
  useEffect(() => {
    if (isSearchOpen) {
      searchInputRef.current?.focus();
    }
  }, [isSearchOpen]);

  const getStatusSubtitle = () => {
    if (chat.isGroup) {
      if (chat.participants && chat.participants.length > 0) {
        return chat.participants.map((p) => p.name).join(', ');
      }
      return 'click here for group info';
    }
    if (chat.isOnline) {
      return 'online';
    }
    if (chat.lastSeen) {
      return `last seen ${chat.lastSeen}`;
    }
    return 'offline';
  };

  // 1. In-Chat Search Bar View directly inside the header
  if (isSearchOpen) {
    return (
      <header className="flex h-[60px] items-center justify-between border-b border-wa-border bg-wa-panel px-3 py-2 text-wa-primary select-none md:px-4 transition-colors duration-150 animate-in fade-in duration-150">
        {/* Left: Close Search / Back Arrow */}
        <button
          type="button"
          onClick={onCloseSearch}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-wa-secondary transition-colors hover:bg-wa-hover hover:text-wa-primary focus:outline-none mr-2"
          title="Close search (Esc)"
          aria-label="Close search"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        {/* Center: Search input */}
        <div className="flex flex-1 items-center gap-2 rounded-lg bg-wa-input px-3 py-1.5 mr-2 shadow-sm">
          <Search className="h-4 w-4 text-wa-secondary flex-shrink-0" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.shiftKey ? onPrevMatch?.() : onNextMatch?.();
              } else if (e.key === 'Escape') {
                e.preventDefault();
                onCloseSearch?.();
              }
            }}
            placeholder="Search messages in this chat..."
            className="w-full bg-transparent text-sm text-wa-primary placeholder-wa-secondary focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                onSearchChange?.('');
                searchInputRef.current?.focus();
              }}
              className="text-wa-secondary hover:text-wa-primary focus:outline-none"
              title="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Right: Matches counter + Navigation arrows + Close */}
        <div className="flex items-center gap-1 text-xs text-wa-secondary">
          {searchQuery.trim() && (
            <span className="font-medium mr-1.5 text-[12px] text-wa-secondary select-none whitespace-nowrap">
              {totalMatches > 0
                ? `${currentMatchIndex + 1} of ${totalMatches}`
                : 'No matches'}
            </span>
          )}

          <button
            type="button"
            disabled={totalMatches <= 1}
            onClick={onPrevMatch}
            className="flex h-8 w-8 items-center justify-center rounded-full text-wa-secondary hover:bg-wa-hover hover:text-wa-primary disabled:opacity-30 disabled:pointer-events-none transition-colors focus:outline-none"
            title="Previous match (Shift + Enter)"
            aria-label="Previous match"
          >
            <ChevronUp className="h-4 w-4" />
          </button>

          <button
            type="button"
            disabled={totalMatches <= 1}
            onClick={onNextMatch}
            className="flex h-8 w-8 items-center justify-center rounded-full text-wa-secondary hover:bg-wa-hover hover:text-wa-primary disabled:opacity-30 disabled:pointer-events-none transition-colors focus:outline-none"
            title="Next match (Enter)"
            aria-label="Next match"
          >
            <ChevronDown className="h-4 w-4" />
          </button>

          <div className="mx-1 h-5 w-[1px] bg-wa-border hidden sm:block" />

          <button
            type="button"
            onClick={onCloseSearch}
            className="flex h-8 w-8 items-center justify-center rounded-full text-wa-secondary hover:bg-wa-hover hover:text-wa-primary transition-colors focus:outline-none"
            title="Close search (Esc)"
            aria-label="Close search"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>
    );
  }

  // 2. Standard Chat Header View
  return (
    <header className="flex h-[60px] items-center justify-between border-b border-wa-border bg-wa-panel px-3 py-2 select-none md:px-4 transition-colors duration-150">
      {/* Left: Back button (mobile) + Contact info */}
      <div className="flex items-center gap-2 overflow-hidden md:gap-3">
        {/* Mobile Back Button */}
        <button
          type="button"
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-full text-wa-secondary hover:bg-wa-hover hover:text-wa-primary md:hidden focus:outline-none"
          title="Back to chats"
          aria-label="Back to chats"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        {/* Contact Avatar */}
        <div
          onClick={chat.isGroup ? onOpenGroupInfo : undefined}
          className="relative h-10 w-10 flex-shrink-0 cursor-pointer overflow-hidden rounded-full transition-opacity hover:opacity-90"
        >
          <img
            src={chat.avatar}
            alt={chat.name}
            className="h-full w-full object-cover"
          />
        </div>

        {/* Contact Name & Live Status or Typing */}
        <div
          onClick={chat.isGroup ? onOpenGroupInfo : undefined}
          className="flex flex-col overflow-hidden cursor-pointer"
        >
          <span className="truncate text-[16px] font-normal text-wa-primary">
            {chat.name}
          </span>
          {isTyping ? (
            <span className="truncate text-xs font-semibold text-wa-green animate-pulse">
              typing...
            </span>
          ) : (
            <span className="truncate text-xs text-wa-secondary">
              {getStatusSubtitle()}
            </span>
          )}
        </div>
      </div>

      {/* Right: Actions (Video, Call, Search, Menu) */}
      <div className="flex items-center gap-1 text-wa-secondary">
        <button
          type="button"
          onClick={onVideoCall}
          className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-wa-hover hover:text-wa-primary focus:outline-none"
          title="Video call"
          aria-label="Video call"
        >
          <Video className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={onAudioCall}
          className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-wa-hover hover:text-wa-primary focus:outline-none"
          title="Voice call"
          aria-label="Voice call"
        >
          <Phone className="h-4 w-4" />
        </button>

        <div className="mx-1 h-5 w-[1px] bg-wa-border" />

        <button
          type="button"
          onClick={onToggleSearch}
          className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-wa-hover hover:text-wa-primary focus:outline-none"
          title="Search in chat"
          aria-label="Search in chat"
        >
          <Search className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={onMenu}
          className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-wa-hover hover:text-wa-primary focus:outline-none"
          title="Menu"
          aria-label="Menu"
        >
          <MoreVertical className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
};
