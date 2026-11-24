import { useState, useMemo, ReactNode } from 'react';
import { User, Chat } from '../../types/chat';
import { SidebarHeader } from '../sidebar/SidebarHeader';
import { SearchBar } from '../sidebar/SearchBar';
import { ChatList } from '../sidebar/ChatList';

interface MainLayoutProps {
  currentUser: User;
  chats: Chat[];
  selectedChat: Chat | null;
  onSelectChat: (chat: Chat) => void;
  onNewChat?: () => void;
  onNewGroup?: () => void;
  onOpenProfile?: () => void;
  sidebarDrawer?: ReactNode;
  children: ReactNode;
}

export const MainLayout = ({
  currentUser,
  chats,
  selectedChat,
  onSelectChat,
  onNewChat,
  onNewGroup,
  onOpenProfile,
  sidebarDrawer,
  children,
}: MainLayoutProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);

  // Filter chats based on search query and unread toggle
  const filteredChats = useMemo(() => {
    return chats.filter((chat) => {
      const matchesSearch =
        chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (chat.lastMessage?.content &&
          chat.lastMessage.content.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesUnread = filterUnreadOnly ? chat.unreadCount > 0 : true;

      return matchesSearch && matchesUnread;
    });
  }, [chats, searchQuery, filterUnreadOnly]);

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-wa-bg text-wa-primary transition-colors duration-150">
      {/* 
        Left Column: Sidebar (Chat List & Search)
        Responsive behavior:
        - On mobile (default): Full width when no chat is selected; hidden if a chat is selected.
        - On tablet/desktop (md+): Fixed width (380px - 440px) alongside the chat window.
      */}
      <aside
        className={`relative flex h-full flex-col border-r border-wa-border bg-wa-surface transition-all duration-150 overflow-hidden ${
          selectedChat ? 'hidden md:flex md:w-[380px] lg:w-[440px]' : 'flex w-full md:w-[380px] lg:w-[440px]'
        }`}
      >
        <SidebarHeader
          user={currentUser}
          onNewChat={onNewChat}
          onNewGroup={onNewGroup}
          onOpenProfile={onOpenProfile}
        />

        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filterUnreadOnly={filterUnreadOnly}
          onToggleUnreadFilter={() => setFilterUnreadOnly((prev) => !prev)}
        />

        <ChatList
          chats={filteredChats}
          selectedChatId={selectedChat?.id || null}
          onSelectChat={onSelectChat}
          currentUserId={currentUser.id}
        />

        {/* Slide-over Drawers (NewChatModal, ProfileDrawer) */}
        {sidebarDrawer}
      </aside>

      {/* 
        Right Column: Main Chat Window or Empty State
        Responsive behavior:
        - On mobile (default): Full width when a chat is selected; hidden if no chat is selected.
        - On tablet/desktop (md+): Always visible, fills remaining space (flex-1).
      */}
      <main
        className={`relative flex h-full flex-1 flex-col overflow-hidden bg-wa-bg ${
          selectedChat ? 'flex w-full' : 'hidden md:flex'
        }`}
      >
        {children}
      </main>
    </div>
  );
};
