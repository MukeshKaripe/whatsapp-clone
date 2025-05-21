import { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageCircle, Users, Phone, MoreVertical, Moon, Sun } from "lucide-react";
import SettingsSidebar from "@/components/chat/SettingsSidebar";

// Alternative direct theme implementation
const HomeLayoutAlt = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [showSettings, setShowSettings] = useState(false);
    const currentTab = location.pathname.split('/')[1] || 'chats';
    const [isDark, setIsDark] = useState(() => {
        if (typeof window !== 'undefined') {
            const storedTheme = localStorage.getItem('whatsapp-theme');
            if (storedTheme) return storedTheme === 'dark';
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return false;
    });

    useEffect(() => {
        if (!user) {
            navigate("/login");
        }
    }, [user, navigate]);

    useEffect(() => {
        const root = document.documentElement;
        if (isDark) {
            root.classList.add('dark');
            localStorage.setItem('whatsapp-theme', 'dark');
        } else {
            root.classList.remove('dark');
            localStorage.setItem('whatsapp-theme', 'light');
        }
    }, [isDark]);

    const handleTabChange = (tab: string) => {
        navigate(`/${tab}`);
    };

    const toggleTheme = () => {
        setIsDark(prev => !prev);
    };

    return (
        <div className={`h-screen flex flex-col ${isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
            <div className={`${isDark ? 'bg-green-800' : 'bg-green-600'} py-2 px-4 flex justify-between items-center`}>
                <div className="font-bold text-lg text-white">WhatsApp Clone</div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        className="text-white hover:bg-white/10 p-2"
                        onClick={toggleTheme}
                    >
                        {isDark ? <Sun size={20} /> : <Moon size={20} />}
                    </Button>
                    <Button
                        variant="ghost"
                        className="text-white hover:bg-white/10 p-2"
                        onClick={() => setShowSettings(!showSettings)}
                    >
                        <MoreVertical size={20} />
                    </Button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <div className={`w-full md:w-1/3 lg:w-1/4 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'} border-r flex flex-col`}>
                    {/* User profile bar */}
                    <div className={`p-3 flex justify-between items-center ${isDark ? 'bg-gray-700/50' : 'bg-gray-200/50'}`}>
                        <div className="flex items-center gap-2">
                            <Avatar>
                                <AvatarImage src={user?.avatarUrl} />
                                <AvatarFallback className={`${isDark ? 'bg-green-700' : 'bg-green-600'} text-white`}>
                                    {user?.name ? user.name[0].toUpperCase() : "U"}
                                </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{user?.name || "User"}</span>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <Users size={20} />
                            </Button>
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <MessageCircle size={20} />
                            </Button>
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <MoreVertical size={20} />
                            </Button>
                        </div>
                    </div>

                    {/* Navigation tabs */}
                    <div className={`flex justify-between ${isDark ? 'bg-gray-700/50' : 'bg-gray-200/50'} p-0`}>
                        <Button
                            variant={currentTab === 'chats' ? 'default' : 'ghost'}
                            className="flex-1 py-3 rounded-none"
                            onClick={() => handleTabChange('chats')}
                        >
                            <MessageCircle size={18} className="mr-1" />
                            Chats
                        </Button>
                        <Button
                            variant={currentTab === 'status' ? 'default' : 'ghost'}
                            className="flex-1 py-3 rounded-none"
                            onClick={() => handleTabChange('status')}
                        >
                            <Users size={18} className="mr-1" />
                            Status
                        </Button>
                        <Button
                            variant={currentTab === 'calls' ? 'default' : 'ghost'}
                            className="flex-1 py-3 rounded-none"
                            onClick={() => handleTabChange('calls')}
                        >
                            <Phone size={18} className="mr-1" />
                            Calls
                        </Button>
                    </div>

                    {/* Content area - will be rendered by child routes */}
                    <div className="flex-1 overflow-y-auto">
                        <Outlet />
                    </div>
                </div>

                {/* Main chat or content area - add this as a placeholder */}
                <div className={`hidden md:flex md:flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'} items-center justify-center`}>
                    <div className="text-center p-8">
                        <h2 className="text-2xl font-bold mb-2">Welcome to WhatsApp Clone</h2>
                        <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>Select a chat to start messaging</p>
                    </div>
                </div>

                {/* Settings sidebar */}
                {showSettings && (
                    <SettingsSidebar
                        user={user}
                        onClose={() => setShowSettings(false)}
                        onLogout={logout}
                    />
                )}
            </div>
        </div>
    );
};

export default HomeLayoutAlt;