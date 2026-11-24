import { useState, useEffect } from 'react';
import { Chat, Message } from '../../types/chat';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { ImagePreviewModal } from './ImagePreviewModal';
import { GroupInfoDrawer } from './GroupInfoDrawer';
import { useWebRTC } from '../../context/WebRTCContext';

interface ChatWindowProps {
  chat: Chat;
  messages: Message[];
  currentUserId: string;
  isTyping?: boolean;
  onBack: () => void;
  onSendMessage: (text: string, replyToId?: string) => void;
  onSendImage: (
    file: File,
    previewUrl: string,
    caption?: string,
    replyToId?: string
  ) => Promise<void> | void;
  onSendAudio?: (
    audioBlob: Blob,
    durationSeconds: number,
    replyToId?: string
  ) => Promise<void> | void;
  onDeleteMessage: (messageId: string) => void;
  onTypingChange?: (isTyping: boolean) => void;
}

export const ChatWindow = ({
  chat,
  messages,
  currentUserId,
  isTyping = false,
  onBack,
  onSendMessage,
  onSendImage,
  onSendAudio,
  onDeleteMessage,
  onTypingChange,
}: ChatWindowProps) => {
  const [stagedImage, setStagedImage] = useState<{
    file: File;
    previewUrl: string;
  } | null>(null);

  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  // In-Chat Search state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  // Group Info Drawer state
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);

  // Reset staged image, reply, search, and group drawer state automatically whenever active chat changes
  useEffect(() => {
    setReplyingTo(null);
    setIsSearchOpen(false);
    setSearchQuery('');
    setCurrentMatchIndex(0);
    setIsGroupInfoOpen(false);
    if (stagedImage) {
      URL.revokeObjectURL(stagedImage.previewUrl);
      setStagedImage(null);
    }
  }, [chat.id]);

  // Revoke object URL on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (stagedImage) {
        URL.revokeObjectURL(stagedImage.previewUrl);
      }
    };
  }, [stagedImage]);

  // Compute matching message IDs for active search (case-insensitive, non-deleted text/caption)
  const trimmedQuery = searchQuery.trim().toLowerCase();
  const matchingMessageIds = trimmedQuery
    ? messages
        .filter(
          (m) =>
            !m.isDeleted &&
            m.content &&
            m.content.toLowerCase().includes(trimmedQuery)
        )
        .map((m) => m.id)
    : [];

  const activeMatchId =
    matchingMessageIds.length > 0
      ? matchingMessageIds[currentMatchIndex % matchingMessageIds.length]
      : undefined;

  const handleNextMatch = () => {
    if (matchingMessageIds.length === 0) return;
    setCurrentMatchIndex((prev) => (prev + 1) % matchingMessageIds.length);
  };

  const handlePrevMatch = () => {
    if (matchingMessageIds.length === 0) return;
    setCurrentMatchIndex((prev) =>
      prev === 0 ? matchingMessageIds.length - 1 : prev - 1
    );
  };

  const handleToggleSearch = () => {
    setIsSearchOpen((prev) => {
      const next = !prev;
      if (!next) {
        setSearchQuery('');
        setCurrentMatchIndex(0);
      }
      return next;
    });
  };

  const handleCloseSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery('');
    setCurrentMatchIndex(0);
  };

  const handleSelectImage = (file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setStagedImage({ file, previewUrl });
  };

  const handleCancelImage = () => {
    if (stagedImage) {
      URL.revokeObjectURL(stagedImage.previewUrl);
      setStagedImage(null);
    }
  };

  const handleConfirmSendImage = (caption: string) => {
    if (stagedImage) {
      onSendImage(
        stagedImage.file,
        stagedImage.previewUrl,
        caption,
        replyingTo?.id
      );
      setStagedImage(null);
      setReplyingTo(null);
    }
  };

  const { startCall } = useWebRTC();

  const handleAudioCall = () => {
    if (chat.isGroup) {
      alert('Group audio calls are not supported yet.');
      return;
    }
    if (chat.otherUser) {
      startCall(chat.otherUser, 'audio');
    }
  };

  const handleVideoCall = () => {
    if (chat.isGroup) {
      alert('Group video calls are not supported yet.');
      return;
    }
    if (chat.otherUser) {
      startCall(chat.otherUser, 'video');
    }
  };

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-wa-bg transition-colors duration-150">
      {/* WhatsApp Header with Integrated Toggleable Search Bar */}
      <ChatHeader
        chat={chat}
        isTyping={isTyping}
        isSearchOpen={isSearchOpen}
        searchQuery={searchQuery}
        totalMatches={matchingMessageIds.length}
        currentMatchIndex={currentMatchIndex}
        onSearchChange={(q) => {
          setSearchQuery(q);
          setCurrentMatchIndex(0);
        }}
        onNextMatch={handleNextMatch}
        onPrevMatch={handlePrevMatch}
        onToggleSearch={handleToggleSearch}
        onCloseSearch={handleCloseSearch}
        onBack={onBack}
        onAudioCall={handleAudioCall}
        onVideoCall={handleVideoCall}
        onOpenGroupInfo={() => setIsGroupInfoOpen((prev) => !prev)}
      />

      <MessageList
        messages={messages}
        currentUserId={currentUserId}
        isGroup={chat.isGroup}
        contactName={chat.name}
        searchQuery={searchQuery}
        activeMatchId={activeMatchId}
        onReply={(msg) => setReplyingTo(msg)}
        onDelete={onDeleteMessage}
      />

      <MessageInput
        onSendMessage={onSendMessage}
        onSelectImage={handleSelectImage}
        onSendAudio={onSendAudio}
        replyingTo={replyingTo}
        replyContactName={chat.name}
        currentUserId={currentUserId}
        onCancelReply={() => setReplyingTo(null)}
        onTypingChange={onTypingChange}
      />

      {/* Image Preview Overlay Modal */}
      {stagedImage && (
        <ImagePreviewModal
          previewUrl={stagedImage.previewUrl}
          fileName={stagedImage.file.name}
          onClose={handleCancelImage}
          onSend={handleConfirmSendImage}
        />
      )}

      {/* Group Info Drawer */}
      {isGroupInfoOpen && chat.isGroup && (
        <GroupInfoDrawer
          chat={chat}
          currentUserId={currentUserId}
          onClose={() => setIsGroupInfoOpen(false)}
        />
      )}
    </div>
  );
};
