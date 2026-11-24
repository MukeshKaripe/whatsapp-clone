import { Pin, Camera, Mic } from 'lucide-react';
import { Chat } from '../../types/chat';
import { StatusTick } from '../common/StatusTick';

interface ChatListItemProps {
  chat: Chat;
  isSelected: boolean;
  onSelect: (chat: Chat) => void;
  currentUserId: string;
}

export const ChatListItem = ({
  chat,
  isSelected,
  onSelect,
  currentUserId,
}: ChatListItemProps) => {
  const isOutgoing = chat.lastMessage?.senderId === currentUserId;
  const hasUnread = chat.unreadCount > 0;
  const isImage = chat.lastMessage?.type === 'IMAGE';
  const isAudio = chat.lastMessage?.type === 'AUDIO';
  const senderPrefix =
    chat.isGroup && !isOutgoing && chat.lastMessage?.senderName
      ? `${chat.lastMessage.senderName}: `
      : '';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(chat)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onSelect(chat);
        }
      }}
      className={`group relative flex h-[72px] w-full cursor-pointer items-center px-3 transition-colors duration-150 focus:outline-none ${
        isSelected
          ? 'bg-wa-active'
          : 'bg-wa-surface hover:bg-wa-hover'
      }`}
    >
      {/* Contact Avatar */}
      <div className="relative mr-3 h-12 w-12 flex-shrink-0">
        <img
          src={chat.avatar}
          alt={chat.name}
          className="h-full w-full rounded-full object-cover"
        />
        {chat.isOnline && !chat.isGroup && (
          <span
            className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-wa-surface bg-wa-green"
            title="Online"
          />
        )}
      </div>

      {/* Chat Details Container */}
      <div className="flex h-full flex-1 flex-col justify-center border-b border-wa-border/60 pr-1">
        {/* Row 1: Name and Timestamp */}
        <div className="flex items-center justify-between">
          <span className="truncate text-[16px] font-normal text-wa-primary">
            {chat.name}
          </span>
          <span
            className={`text-xs ${
              hasUnread ? 'font-medium text-wa-green' : 'text-wa-secondary'
            }`}
          >
            {chat.lastMessage?.timestamp || ''}
          </span>
        </div>

        {/* Row 2: Message Preview & Badges */}
        <div className="mt-1 flex items-center justify-between">
          <div className="flex items-center gap-1 overflow-hidden pr-2 text-[14px] text-wa-secondary">
            {isOutgoing && chat.lastMessage && (
              <StatusTick status={chat.lastMessage.status} className="h-4 w-4 flex-shrink-0" />
            )}
            {isImage && (
              <Camera className="h-3.5 w-3.5 flex-shrink-0 text-wa-secondary mr-0.5" />
            )}
            {isAudio && (
              <Mic className="h-3.5 w-3.5 flex-shrink-0 text-wa-green mr-0.5" />
            )}
            <span className="truncate">
              {senderPrefix}
              {chat.lastMessage?.content ||
                (isImage ? 'Photo' : isAudio ? 'Voice message' : 'No messages yet')}
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {chat.isPinned && (
              <Pin className="h-3.5 w-3.5 rotate-45 text-wa-secondary" />
            )}
            {hasUnread && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-wa-green px-1.5 text-[11px] font-semibold text-white">
                {chat.unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
