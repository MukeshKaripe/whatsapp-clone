import { useEffect, useRef } from 'react';
import { Lock } from 'lucide-react';
import { Message } from '../../types/chat';
import { MessageItem } from './MessageItem';
import { DateSeparator } from './DateSeparator';

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  isGroup?: boolean;
  contactName?: string;
  searchQuery?: string;
  activeMatchId?: string;
  onReply?: (message: Message) => void;
  onDelete?: (messageId: string) => void;
}

export const MessageList = ({
  messages,
  currentUserId,
  isGroup = false,
  contactName,
  searchQuery,
  activeMatchId,
  onReply,
  onDelete,
}: MessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom whenever messages change
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    // Immediate scroll on initial load, smooth thereafter
    scrollToBottom('auto');
  }, []);

  useEffect(() => {
    // Only auto-scroll to bottom if not actively searching
    if (!searchQuery) {
      scrollToBottom('smooth');
    }
  }, [messages, searchQuery]);

  // Smoothly scroll to the active search result
  useEffect(() => {
    if (activeMatchId) {
      const el = document.getElementById(`message-${activeMatchId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeMatchId]);

  return (
    <div className="whatsapp-chat-bg relative flex-1 overflow-y-auto px-4 py-3 md:px-12 transition-colors duration-150">
      {/* End-to-End Encryption Security Notice Banner */}
      <div className="my-3 flex justify-center select-none">
        <div className="flex max-w-[500px] items-center gap-1.5 rounded-lg bg-[#ffeecd] text-[#54656f] dark:bg-[#182229] dark:text-[#ffd279] px-3.5 py-1.5 text-center text-[12.5px] leading-relaxed shadow-sm border border-[#f0e2bd] dark:border-transparent">
          <Lock className="h-3.5 w-3.5 flex-shrink-0" />
          <span>
            Messages are end-to-end encrypted. No one outside of this chat can read them.
          </span>
        </div>
      </div>

      {/* Render Messages with Date Separators */}
      {messages.map((message, index) => {
        const isOutgoing = message.senderId === currentUserId;
        const prevMessage = index > 0 ? messages[index - 1] : null;

        // Show date separator if this is the first message or date changed
        const showDateSeparator = Boolean(
          !prevMessage || (message.date && message.date !== prevMessage.date)
        );

        // Show tail only if the previous message was from a different sender or after a date separator
        const isFirstInSequence = Boolean(
          !prevMessage ||
          prevMessage.senderId !== message.senderId ||
          showDateSeparator
        );

        // Resolve replied-to message if replyToId exists
        const repliedMessage =
          (message.replyTo as any) ||
          (message.replyToId
            ? messages.find((m) => m.id === message.replyToId) || null
            : null);

        return (
          <div key={message.id}>
            {showDateSeparator && message.date && (
              <DateSeparator date={message.date} />
            )}
            <MessageItem
              message={message}
              isOutgoing={isOutgoing}
              isGroup={isGroup}
              showTail={isFirstInSequence}
              repliedMessage={repliedMessage}
              contactName={contactName}
              currentUserId={currentUserId}
              searchQuery={searchQuery}
              isActiveMatch={message.id === activeMatchId}
              onReply={onReply}
              onDelete={onDelete}
            />
          </div>
        );
      })}

      {/* Invisible anchor for auto-scrolling */}
      <div ref={messagesEndRef} />
    </div>
  );
};
