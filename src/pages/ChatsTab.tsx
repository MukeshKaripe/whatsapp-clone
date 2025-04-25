import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/reduce/store";
import { setActiveChat, sendMessage } from "@/reduce/store/chatSlice";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MoreVertical, Smile, Paperclip, Mic } from "lucide-react";

const ChatsTab = () => {
    const dispatch = useDispatch();
    const { chats, activeChat, messages } = useSelector((state: RootState) => state.chat);
    const [searchQuery, setSearchQuery] = useState("");
    const [messageInput, setMessageInput] = useState("");

    const handleSelectChat = (chatId: number) => {
        dispatch(setActiveChat(chatId));
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageInput.trim() || !activeChat) return;

        dispatch(sendMessage({
            chatId: activeChat.id,
            text: messageInput
        }));

        setMessageInput("");
    };

    const filteredChats = chats.filter(chat =>
        chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex h-full">
            {/* Chats list */}
            <div className="flex-1 flex flex-col">
                {/* Search */}
                <div className="p-2 bg-muted/50">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                        <Input
                            placeholder="Search or start new chat"
                            className="pl-10 bg-background"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Chats list */}
                <div className="flex-1 overflow-y-auto">
                    {filteredChats.map((chat) => (
                        <div
                            key={chat.id}
                            className={`flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer ${activeChat?.id === chat.id ? 'bg-muted/50' : ''}`}
                            onClick={() => handleSelectChat(chat.id)}
                        >
                            <Avatar>
                                <AvatarFallback className="bg-primary text-primary-foreground">
                                    {chat.name[0]}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium truncate">{chat.name}</span>
                                    <span className="text-xs text-muted-foreground">{chat.time}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
                                    {chat.unread > 0 && (
                                        <span className="bg-primary text-primary-foreground text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                                            {chat.unread}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat area */}
            <div className="hidden md:flex flex-[2] flex-col bg-[#e5ded8]">
                {activeChat ? (
                    <>
                        {/* Chat header */}
                        <div className="bg-muted p-3 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarFallback className="bg-primary text-primary-foreground">
                                        {activeChat.name[0]}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-medium">{activeChat.name}</div>
                                    <div className="text-xs text-muted-foreground">last seen today at 12:45 PM</div>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <Button variant="ghost" size="icon" className="rounded-full">
                                    <Search size={20} />
                                </Button>
                                <Button variant="ghost" size="icon" className="rounded-full">
                                    <MoreVertical size={20} />
                                </Button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {messages[activeChat.id]?.map((message) => (
                                <div
                                    key={message.id}
                                    className={`max-w-[70%] my-2 p-2 rounded-lg ${message.sender === "me"
                                        ? "ml-auto bg-green-100 rounded-tr-none"
                                        : "mr-auto bg-white rounded-tl-none"
                                        }`}
                                >
                                    <div className="text-sm">{message.text}</div>
                                    <div className="text-right mt-1">
                                        <span className="text-xs text-muted-foreground">{message.time}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Message input */}
                        <div className="bg-muted p-3">
                            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" type="button" className="text-muted-foreground">
                                    <Smile size={24} />
                                </Button>
                                <Button variant="ghost" size="icon" type="button" className="text-muted-foreground">
                                    <Paperclip size={24} />
                                </Button>
                                <Input
                                    placeholder="Type a message"
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    className="flex-1 py-2 px-4 rounded-full bg-background"
                                />
                                <Button variant="ghost" size="icon" type="button" className="text-muted-foreground">
                                    <Mic size={24} />
                                </Button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center bg-muted">
                        <div className="text-center p-6">
                            <p className="text-xl text-foreground mb-2">Select a chat to start messaging</p>
                            <p className="text-muted-foreground">or start a new conversation</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatsTab;