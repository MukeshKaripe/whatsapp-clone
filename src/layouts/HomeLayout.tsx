import { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useSelector } from "react-redux";
import { RootState } from "@/reduce/store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    MessageCircle,
    Users,
    Phone,
    MoreVertical,
    ArrowLeft,
    Camera,
    Settings,
    User,
    LogOut,
    Archive,
    Star,
    Help
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import SettingsSidebar from "@/components/chat/SettingsSidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import ChatArea from "@/pages/ChatArea";

const HomeLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [showSettings, setShowSettings] = useState(false);
    const [showMobileChat, setShowMobileChat] = useState(false);
    const currentTab = location.pathname.split('/')[1] || 'chats';

    // Get active chat from Redux store
    const { activeChat } = useSelector((state: RootState) => state.chat);

    // Handle mobile chat view
    useEffect(() => {
        if (activeChat && window.innerWidth < 768) {
            setShowMobileChat(true);
        }
    }, [activeChat]);

    const handleTabChange = (tab: string) => {
        navigate(`/${tab}`);
        setShowMobileChat(false);
    };

    const handleBackToChats = () => {
        setShowMobileChat(false);
    };

    const handleProfileClick = () => {
        navigate('/profile-setup');
    };

    const handleMenuAction = (action: string) => {
        switch (action) {
            case 'profile':
                navigate('/profile-setup');
                break;
            case 'settings':
                setShowSettings(true);
                break;
            case 'logout':
                logout();
                break;
            case 'archived':
                // Handle archived chats
                break;
            case 'starred':
                // Handle starred messages
                break;
            default:
                break;
        }
    };

    return (
        <TooltipProvider>
            <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                {/* Header */}
                <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-2 px-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        {showMobileChat && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 md:hidden"
                                        onClick={handleBackToChats}
                                    >
                                        <ArrowLeft size={20} />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Back to chats</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        <div className="font-semibold text-lg text-gray-800 dark:text-gray-200">
                            {showMobileChat && activeChat ? activeChat.name : "WhatsApp"}
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <ThemeToggle />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    <MoreVertical size={20} />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => handleMenuAction('profile')}>
                                    <User className="mr-2 h-4 w-4" />
                                    Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleMenuAction('archived')}>
                                    <Archive className="mr-2 h-4 w-4" />
                                    Archived
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleMenuAction('starred')}>
                                    <Star className="mr-2 h-4 w-4" />
                                    Starred messages
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleMenuAction('settings')}>
                                    <Settings className="mr-2 h-4 w-4" />
                                    Settings
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleMenuAction('logout')}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Log out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar - hidden on mobile when chat is active */}
                    <div className={`w-full md:w-1/3 lg:w-1/4 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col ${showMobileChat ? 'hidden md:flex' : 'flex'
                        }`}>
                        {/* User profile bar */}
                        <div className="p-3 flex justify-between items-center bg-gray-50 dark:bg-gray-900/30 border-b border-gray-200 dark:border-gray-700">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div
                                        className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors"
                                        onClick={handleProfileClick}
                                    >
                                        <div className="relative">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={user?.avatarUrl} />
                                                <AvatarFallback className="bg-green-600 text-white">
                                                    {user?.name ? user.name[0].toUpperCase() : "U"}
                                                </AvatarFallback>
                                            </Avatar>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className="font-medium text-gray-900 dark:text-gray-100 truncate block">
                                                {user?.name || "User"}
                                            </span>
                                            {user?.about && (
                                                <span className="text-sm text-gray-500 dark:text-gray-400 truncate block">
                                                    {user.about}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Click to view profile</p>
                                </TooltipContent>
                            </Tooltip>

                            <div className="flex gap-1">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                        >
                                            <Users size={18} />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>New community</p>
                                    </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                        >
                                            <MessageCircle size={18} />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>New chat</p>
                                    </TooltipContent>
                                </Tooltip>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                        >
                                            <MoreVertical size={18} />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleMenuAction('profile')}>
                                            <User className="mr-2 h-4 w-4" />
                                            Profile
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleMenuAction('archived')}>
                                            <Archive className="mr-2 h-4 w-4" />
                                            Archived
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleMenuAction('settings')}>
                                            <Settings className="mr-2 h-4 w-4" />
                                            Settings
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => handleMenuAction('logout')}>
                                            <LogOut className="mr-2 h-4 w-4" />
                                            Log out
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        {/* Navigation tabs */}
                        <div className="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant={currentTab === 'chats' ? 'default' : 'ghost'}
                                        className={`flex-1 py-3 rounded-none border-b-2 transition-colors ${currentTab === 'chats'
                                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                                            : 'border-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                            }`}
                                        onClick={() => handleTabChange('chats')}
                                    >
                                        <MessageCircle size={18} className="mr-2" />
                                        Chats
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>View all chats</p>
                                </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant={currentTab === 'status' ? 'default' : 'ghost'}
                                        className={`flex-1 py-3 rounded-none border-b-2 transition-colors ${currentTab === 'status'
                                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                                            : 'border-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                            }`}
                                        onClick={() => handleTabChange('status')}
                                    >
                                        <Users size={18} className="mr-2" />
                                        Status
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>View status updates</p>
                                </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant={currentTab === 'calls' ? 'default' : 'ghost'}
                                        className={`flex-1 py-3 rounded-none border-b-2 transition-colors ${currentTab === 'calls'
                                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                                            : 'border-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                            }`}
                                        onClick={() => handleTabChange('calls')}
                                    >
                                        <Phone size={18} className="mr-2" />
                                        Calls
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>View call history</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>

                        {/* Content area - will be rendered by child routes */}
                        <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800">
                            <Outlet context={{ setShowMobileChat }} />
                        </div>
                    </div>

                    {/* Main chat area */}
                    <div className={`flex-1 bg-gray-50 dark:bg-gray-900 ${showMobileChat ? 'flex' : 'hidden md:flex'
                        }`}>
                        {activeChat ? (
                            <ChatArea
                                chat={activeChat}
                                onBack={() => setShowMobileChat(false)}
                                isMobile={showMobileChat}
                            />
                        ) : (
                            <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                                <div className="text-center p-8">
                                    <div className="w-64 h-64 mx-auto mb-8 opacity-20">
                                        <svg viewBox="0 0 303 172" className="w-full h-full">
                                            <path fill="currentColor" d="M229.9 172c-1.5 0-3.1-.4-4.6-1.1l-29.4-14.7c-1.6-.8-2.6-2.4-2.6-4.2v-15.2c0-2.3 1.7-4.4 4.1-4.8l22.4-3.7c1.1-.2 2.2.3 2.8 1.3l3.9 6.5c.4.7 1.2 1.1 2 1.1h21.7c1.9 0 3.5-1.6 3.5-3.5v-21.7c0-1.9-1.6-3.5-3.5-3.5h-21.7c-.8 0-1.6.4-2 1.1l-3.9 6.5c-.6 1-1.7 1.5-2.8 1.3l-22.4-3.7c-2.4-.4-4.1-2.5-4.1-4.8V97.8c0-1.8 1-3.4 2.6-4.2l29.4-14.7c1.5-.7 3.1-1.1 4.6-1.1h73.1c12.7 0 23 10.3 23 23v48.4c0 12.7-10.3 23-23 23H229.9z" />
                                        </svg>
                                    </div>
                                    <h2 className="text-2xl font-light mb-4 text-gray-700 dark:text-gray-300">
                                        WhatsApp Web
                                    </h2>
                                    <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
                                        Send and receive messages without keeping your phone online.<br />
                                        Use WhatsApp on up to 4 linked devices and 1 phone at the same time.
                                    </p>
                                </div>
                            </div>
                        )}
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
        </TooltipProvider>
    );
};

export default HomeLayout;