import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useOutletContext } from "react-router-dom";
import { RootState } from "@/reduce/store";
import { setActiveChat } from "@/reduce/store/chatSlice";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Archive, MessageCircle } from "lucide-react";

interface OutletContext {
    setShowMobileChat: (show: boolean) => void;
}

const ChatsTab = () => {
    const dispatch = useDispatch();
    const { chats, activeChat } = useSelector((state: RootState) => state.chat);
    const [searchQuery, setSearchQuery] = useState("");
    const outletContext = useOutletContext<OutletContext>();

    const handleSelectChat = (chatId: number) => {
        dispatch(setActiveChat(chatId));
        // On mobile, show the chat area
        if (window.innerWidth < 768 && outletContext?.setShowMobileChat) {
            outletContext.setShowMobileChat(true);
        }
    };

    const filteredChats = chats.filter(chat =>
        chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatTime = (time: string) => {
        // If it's just a time like "10:30 AM", return as is
        if (time.includes('AM') || time.includes('PM')) {
            return time;
        }
        // If it's a day like "Yesterday", return as is
        if (time === 'Yesterday' || time === 'Today') {
            return time;
        }
        // For other formats, you might want to format them
        return time;
    };

    return (
        <div className="flex flex-col h-full">
            {/* Search and actions */}
            <div className="p-3 bg-background border-b border-border">
                <div className="flex gap-2 mb-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                        <Input
                            placeholder="Search or start new chat"
                            className="pl-10 bg-muted/50 border-0"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <Plus size={20} />
                    </Button>
                </div>

                {/* Quick actions */}
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="flex items-center gap-2">
                        <Archive size={16} />
                        Archived
                    </Button>
                </div>
            </div>

            {/* Chats list */}
            <div className="flex-1 overflow-y-auto">
                {filteredChats.length > 0 ? (
                    filteredChats.map((chat) => (
                        <div
                            key={chat.id}
                            className={`flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors ${activeChat?.id === chat.id ? 'bg-muted/70' : ''
                                }`}
                            onClick={() => handleSelectChat(chat.id)}
                        >
                            <div className="relative">
                                <Avatar className="w-12 h-12">
                                    <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                                        {chat.name[0]}
                                    </AvatarFallback>
                                </Avatar>
                                {chat.isOnline && (
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-medium truncate text-foreground">
                                        {chat.name}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {formatTime(chat.time)}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                                        {chat.lastMessage}
                                    </p>
                                    <div className="flex items-center gap-1">
                                        {chat.unread > 0 && (
                                            <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-1 min-w-[20px] text-center font-medium">
                                                {chat.unread > 99 ? '99+' : chat.unread}
                                            </span>
                                        )}
                                        {chat.isPinned && (
                                            <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center h-full p-8">
                        <MessageCircle size={64} className="text-muted-foreground/50 mb-4" />
                        <h3 className="font-medium text-lg mb-2">No chats found</h3>
                        <p className="text-muted-foreground text-center">
                            {searchQuery ? "Try a different search term" : "Start a new conversation"}
                        </p>
                        <Button className="mt-4" onClick={() => setSearchQuery("")}>
                            <Plus size={16} className="mr-2" />
                            New Chat
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatsTab;