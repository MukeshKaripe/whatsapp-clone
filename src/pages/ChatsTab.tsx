import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useOutletContext } from "react-router-dom";
import { RootState } from "@/reduce/store";
import {
    setActiveConnection,
    initializeSocket,
    createConnectionThunk,
    markMessagesAsSeen
} from "@/reduce/store/chatSlice";
import { useAuth } from "../contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Archive, MessageCircle, Users } from "lucide-react";

interface OutletContext {
    setShowMobileChat: (show: boolean) => void;
}

const ChatsTab = () => {
    const dispatch = useDispatch();
    const { user } = useAuth();
    const { connections, activeConnection, loading, error, isConnected } = useSelector((state: RootState) => state.chat);
    const [searchQuery, setSearchQuery] = useState(user?.about || '');
    const outletContext = useOutletContext<OutletContext>();

    // Initialize socket connection when component mounts
    useEffect(() => {
        if (user && !isConnected) {
            dispatch(initializeSocket(user) as any);
        }
    }, [user, isConnected, dispatch]);

    const handleSelectConnection = (room_id: string) => {
        dispatch(setActiveConnection(room_id));
        // Mark messages as seen
        dispatch(markMessagesAsSeen(room_id));

        // On mobile, show the chat area
        if (window.innerWidth < 768 && outletContext?.setShowMobileChat) {
            outletContext.setShowMobileChat(true);
        }
    };

    const handleCreateNewChat = () => {
        // You can implement a modal or navigation to create new chat
        console.log("Create new chat");
    };

    const filteredConnections = connections.filter(connection =>
        connection.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        connection.lastMessage?.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (connection.about && connection.about.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const formatTime = (timestamp?: string) => {
        if (!timestamp) return "";

        const messageDate = new Date(timestamp);
        const now = new Date();
        const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);

        if (diffInHours < 1) {
            return "Just now";
        } else if (diffInHours < 24) {
            return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffInHours < 48) {
            return "Yesterday";
        } else if (diffInHours < 168) { // 7 days
            return messageDate.toLocaleDateString([], { weekday: 'short' });
        } else {
            return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    };

    const getDisplayName = (connection: any) => {
        if (connection.conn_type === 'group') {
            return connection.conn_name || connection.display_name;
        }
        return connection.display_name;
    };

    const getLastMessage = (connection: any) => {
        if (!connection.lastMessage) return "No messages yet";

        const msg = connection.lastMessage;
        if (msg.msgType === 'text') {
            return msg.message;
        } else if (msg.msgType === 'image') {
            return "📷 Image";
        } else if (msg.msgType === 'audio') {
            return "🎵 Audio";
        } else if (msg.msgType === 'file') {
            return "📎 File";
        }
        return msg.message;
    };

    if (loading) {
        return (
            <div className="flex flex-col h-full">
                <div className="p-3 bg-background border-b border-border">
                    <div className="flex gap-2 mb-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                            <Input
                                placeholder="Search or start new chat"
                                className="pl-10 bg-muted/50 border-0"
                                disabled
                            />
                        </div>
                        <Button variant="ghost" size="icon" className="rounded-full" disabled>
                            <Plus size={20} />
                        </Button>
                    </div>
                </div>
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                        <p className="text-muted-foreground">Loading chats...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col h-full">
                <div className="p-3 bg-background border-b border-border">
                    <div className="flex gap-2 mb-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                            <Input
                                placeholder="Search or start new chat"
                                className="pl-10 bg-muted/50 border-0"
                                disabled
                            />
                        </div>
                        <Button variant="ghost" size="icon" className="rounded-full" disabled>
                            <Plus size={20} />
                        </Button>
                    </div>
                </div>
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center p-8">
                        <p className="text-red-500 mb-2">Error loading chats</p>
                        <p className="text-sm text-muted-foreground mb-4">{error}</p>
                        <Button onClick={() => dispatch(initializeSocket(user) as any)}>
                            Retry
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

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
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full"
                        onClick={handleCreateNewChat}
                    >
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

            {/* Connection status indicator */}
            {!isConnected && (
                <div className="px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        🔄 Connecting to chat server...
                    </p>
                </div>
            )}

            {/* Connections list */}
            <div className="flex-1 overflow-y-auto">
                {filteredConnections.length > 0 ? (
                    filteredConnections.map((connection) => (
                        <div
                            key={connection.room_id}
                            className={`flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors ${activeConnection?.room_id === connection.room_id ? 'bg-muted/70' : ''
                                }`}
                            onClick={() => handleSelectConnection(connection.room_id)}
                        >
                            <div className="relative">
                                <Avatar className="w-12 h-12">
                                    {connection.profile ? (
                                        <AvatarImage src={connection.profile} alt={getDisplayName(connection)} />
                                    ) : (
                                        <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                                            {connection.conn_type === 'group' ? (
                                                <Users size={20} />
                                            ) : (
                                                getDisplayName(connection)[0]?.toUpperCase()
                                            )}
                                        </AvatarFallback>
                                    )}
                                </Avatar>
                                {connection.conn_type === 'onetoone' && connection.online_status && (
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-medium truncate text-foreground">
                                        {getDisplayName(connection)}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {formatTime(connection.lastMessage?.date)}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                                        {getLastMessage(connection)}
                                    </p>
                                    <div className="flex items-center gap-1">
                                        {connection.unreadCount > 0 && (
                                            <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-1 min-w-[20px] text-center font-medium">
                                                {connection.unreadCount > 99 ? '99+' : connection.unreadCount}
                                            </span>
                                        )}
                                        {connection.conn_type === 'group' && (
                                            <Users size={12} className="text-muted-foreground" />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center h-full p-8">
                        <MessageCircle size={64} className="text-muted-foreground/50 mb-4" />
                        <h3 className="font-medium text-lg mb-2">
                            {searchQuery ? "No chats found" : "No conversations yet"}
                        </h3>
                        <p className="text-muted-foreground text-center">
                            {searchQuery ? "Try a different search term" : "Start a new conversation"}
                        </p>
                        <Button className="mt-4" onClick={handleCreateNewChat}>
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