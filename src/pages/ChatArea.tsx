import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/reduce/store";
import { sendMessage } from "@/reduce/store/chatSlice";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MoreVertical, Smile, Paperclip, Mic, Send } from "lucide-react";

interface ChatAreaProps {
    chat: any;
    onBack?: () => void;
    isMobile?: boolean;
}

const ChatArea = ({ chat, onBack, isMobile = false }: ChatAreaProps) => {
    const dispatch = useDispatch();
    const { messages } = useSelector((state: RootState) => state.chat);
    const [messageInput, setMessageInput] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages[chat.id]]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageInput.trim()) return;

        dispatch(sendMessage({
            chatId: chat.id,
            text: messageInput
        }));

        setMessageInput("");
    };

    const formatTime = (timestamp?: string) => {
        if (!timestamp) return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 w-full">
            {/* Chat header */}
            <div className="bg-background border-b border-border p-3 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Avatar>
                        <AvatarFallback className="bg-primary text-primary-foreground">
                            {chat.name[0]}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="font-medium">{chat.name}</div>
                        <div className="text-xs text-muted-foreground">
                            {chat.isOnline ? "online" : "last seen today at 12:45 PM"}
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <Search size={20} />
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <MoreVertical size={20} />
                    </Button>
                </div>
            </div>

            {/* Messages container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {messages[chat.id]?.length ? (
                    messages[chat.id].map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.sender === "me" ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`max-w-[70%] p-3 rounded-lg shadow-sm ${message.sender === "me"
                                    ? "bg-green-500 text-white rounded-br-none"
                                    : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-bl-none"
                                    }`}
                            >
                                <div className="text-sm leading-relaxed">{message.text}</div>
                                <div className={`text-xs mt-1 flex justify-end items-center gap-1 ${message.sender === "me" ? "text-green-100" : "text-muted-foreground"
                                    }`}>
                                    <span>{formatTime(message.timestamp)}</span>
                                    {message.sender === "me" && (
                                        <div className="flex">
                                            <div className="w-1 h-1 bg-current rounded-full"></div>
                                            <div className="w-1 h-1 bg-current rounded-full ml-0.5"></div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center p-8">
                            <p className="text-muted-foreground">No messages yet</p>
                            <p className="text-sm text-muted-foreground">Start a conversation with {chat.name}</p>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            <div className="bg-background border-t border-border p-3">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        className="text-muted-foreground hover:text-foreground"
                    >
                        <Smile size={24} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        className="text-muted-foreground hover:text-foreground"
                    >
                        <Paperclip size={24} />
                    </Button>
                    <div className="flex-1 relative">
                        <Input
                            placeholder="Type a message"
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            className="pr-12 py-2 px-4 rounded-full bg-background border border-border focus:border-primary"
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage(e);
                                }
                            }}
                        />
                        {messageInput.trim() ? (
                            <Button
                                type="submit"
                                size="icon"
                                className="absolute right-1 top-1/2 transform -translate-y-1/2 rounded-full w-8 h-8"
                            >
                                <Send size={16} />
                            </Button>
                        ) : (
                            <Button
                                variant="ghost"
                                size="icon"
                                type="button"
                                className="absolute right-1 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground rounded-full w-8 h-8"
                            >
                                <Mic size={16} />
                            </Button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChatArea;