import { Chat } from '../../types/chat';
import { ChatListItem } from './ChatListItem';

interface ChatListProps {
  chats: Chat[];
  selectedChatId: string | null;
  onSelectChat: (chat: Chat) => void;
  currentUserId: string;
}

export const ChatList = ({
  chats,
  selectedChatId,
  onSelectChat,
  currentUserId,
}: ChatListProps) => {
  if (chats.length === 0) {
    return (
      <div className="flex h-40 flex-col items-center justify-center p-6 text-center text-wa-secondary">
        <p className="text-sm">No chats or contacts found</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-wa-surface transition-colors duration-150">
      {chats.map((chat) => (
        <ChatListItem
          key={chat.id}
          chat={chat}
          isSelected={chat.id === selectedChatId}
          onSelect={onSelectChat}
          currentUserId={currentUserId}
        />
      ))}
    </div>
  );
};
