import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ChatMessage {
    id: number;
    text: string;
    time: string;
    sender: 'me' | 'them';
}

interface Chat {
    id: number;
    name: string;
    lastMessage: string;
    time: string;
    unread: number;
}

interface ChatState {
    chats: Chat[];
    activeChat: Chat | null;
    messages: Record<number, ChatMessage[]>;
}

const initialState: ChatState = {
    chats: [
        {
            id: 1,
            name: "John Doe",
            lastMessage: "Hey, how are you?",
            time: "10:30 AM",
            unread: 2,
        },
        {
            id: 2,
            name: "Jane Smith",
            lastMessage: "Can we meet tomorrow?",
            time: "Yesterday",
            unread: 0,
        },
        {
            id: 3,
            name: "Team Alpha",
            lastMessage: "Meeting at 3 PM",
            time: "Yesterday",
            unread: 5,
        },
        {
            id: 4,
            name: "Mom",
            lastMessage: "Call me when you're free",
            time: "Wednesday",
            unread: 0,
        },
        {
            id: 5,
            name: "Work Group",
            lastMessage: "Project deadline extended",
            time: "Tuesday",
            unread: 0,
        },
    ],
    activeChat: null,
    messages: {
        1: [
            {
                id: 1,
                text: "Hey there!",
                time: "10:30 AM",
                sender: "them",
            },
            {
                id: 2,
                text: "Hi! How's it going?",
                time: "10:31 AM",
                sender: "me",
            },
            {
                id: 3,
                text: "I'm good, thanks! Just working on that project we discussed.",
                time: "10:32 AM",
                sender: "them",
            },
            {
                id: 4,
                text: "That's great! Do you need any help with it?",
                time: "10:33 AM",
                sender: "me",
            },
            {
                id: 5,
                text: "I think I'm good for now, but I'll let you know if I need anything. Thanks for offering!",
                time: "10:35 AM",
                sender: "them",
            },
        ],
    },
};

const chatSlice = createSlice({
    name: 'chat',
    initialState,
    reducers: {
        setActiveChat: (state, action: PayloadAction<number>) => {
            const chat = state.chats.find(c => c.id === action.payload);
            if (chat) {
                state.activeChat = chat;
                // Reset unread count when selecting a chat
                chat.unread = 0;
            }
        },
        sendMessage: (state, action: PayloadAction<{ chatId: number; text: string }>) => {
            const { chatId, text } = action.payload;
            if (!text.trim()) return;

            const now = new Date();
            const timeString = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;

            // Create message
            const newMessage: ChatMessage = {
                id: Date.now(),
                text,
                time: timeString,
                sender: 'me',
            };

            // Add message to chat
            if (!state.messages[chatId]) {
                state.messages[chatId] = [];
            }
            state.messages[chatId].push(newMessage);

            // Update chat lastMessage
            const chatIndex = state.chats.findIndex(c => c.id === chatId);
            if (chatIndex !== -1) {
                state.chats[chatIndex].lastMessage = text;
                state.chats[chatIndex].time = "Just now";
            }
        },
    },
});

export const { setActiveChat, sendMessage } = chatSlice.actions;
export default chatSlice.reducer;
