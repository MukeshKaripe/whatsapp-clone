
import { FC } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

interface SettingsSidebarProps {
    user: {
        id: string;
        name?: string;
        phone: string;
        avatarUrl?: string;
    } | null;
    onClose: () => void;
    onLogout: () => void;
}

const SettingsSidebar: FC<SettingsSidebarProps> = ({ user, onClose, onLogout }) => {
    return (
        <div className="absolute top-0 right-0 h-full w-4/5 md:w-1/3 lg:w-1/4 bg-background border-l shadow-lg z-10 overflow-y-auto">
            <div className="bg-primary text-primary-foreground p-4 flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-primary-foreground hover:bg-primary/10"
                    onClick={onClose}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                </Button>
                <h2 className="text-xl font-semibold">Settings</h2>
            </div>

            <div className="p-4">
                <div className="flex items-center gap-4 mb-6">
                    <Avatar className="w-16 h-16">
                        <AvatarImage src={user?.avatarUrl} />
                        <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                            {user?.name ? user.name[0].toUpperCase() : "U"}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="font-semibold text-lg">{user?.name || "User"}</div>
                        <div className="text-muted-foreground">{user?.phone || ""}</div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-2 hover:bg-muted rounded-md cursor-pointer">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary/10 text-primary p-2 rounded-full">
                                <Settings size={20} />
                            </div>
                            <div>Account</div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-2 hover:bg-muted rounded-md">
                        <div>Theme</div>
                        <ThemeToggle />
                    </div>

                    <Button
                        variant="destructive"
                        className="w-full"
                        onClick={onLogout}
                    >
                        Log out
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default SettingsSidebar;