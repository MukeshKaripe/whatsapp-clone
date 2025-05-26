import { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageCircle, Users, Phone, MoreVertical } from "lucide-react";
import SettingsSidebar from "@/components/chat/SettingsSidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { ThemeDebugger } from "../layouts/ThemeDebugger";
import { getUserDetails } from "@/api/auth";

const HomeLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [showSettings, setShowSettings] = useState(false);
    const currentTab = location.pathname.split('/')[1] || 'chats';

    // useEffect(() => {
    //     getUserDetails()
    //     if (!user) {
    //         navigate("/login");
    //     }
    // }, [user, navigate]);

    const handleTabChange = (tab: string) => {
        navigate(`/${tab}`);
    };

    return (
        <div className="h-screen flex flex-col bg-background text-foreground">
            <div className="bg-primary text-primary-foreground py-2 px-4 flex justify-between items-center">
                <div className="font-bold text-lg">WhatsApp Clone</div>
                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <Button
                        variant="ghost"
                        className="text-primary-foreground hover:bg-primary/10 p-2"
                        onClick={() => setShowSettings(!showSettings)}
                    >
                        <MoreVertical size={20} />
                    </Button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <div className="w-full md:w-1/3 lg:w-1/4 bg-background border-r border-border flex flex-col">
                    {/* User profile bar */}
                    <div className="p-3 flex justify-between items-center bg-muted/30">
                        <div className="flex items-center gap-2">
                            <Avatar>
                                <AvatarImage src={user?.avatarUrl} />
                                <AvatarFallback className="bg-primary text-primary-foreground">
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
                    <div className="flex justify-between bg-muted/30 p-0">
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
                <div className="hidden md:flex md:flex-1 bg-background items-center justify-center">
                    <div className="text-center p-8">
                        <h2 className="text-2xl font-bold mb-2">Welcome to WhatsApp Clone</h2>
                        <p className="text-muted-foreground">Select a chat to start messaging</p>
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

export default HomeLayout;