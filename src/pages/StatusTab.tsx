import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const StatusTab = () => {
    const { user } = useAuth();

    return (
        <div className="p-4">
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="relative">
                        <Avatar className="w-12 h-12 border-2 border-primary">
                            <AvatarFallback className="bg-primary text-primary-foreground">
                                {user?.name ? user.name[0].toUpperCase() : "U"}
                            </AvatarFallback>
                        </Avatar>
                        <Button
                            variant="default"
                            size="icon"
                            className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary hover:bg-primary/90 text-white"
                        >
                            <Plus size={14} />
                        </Button>
                    </div>
                    <div>
                        <div className="font-medium">My Status</div>
                        <div className="text-xs text-muted-foreground">Tap to add status update</div>
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Recent updates</h3>
                <div className="space-y-3">
                    {/* Example status updates */}
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-md cursor-pointer">
                            <Avatar className="w-12 h-12 border-2 border-primary">
                                <AvatarFallback className="bg-primary text-primary-foreground">
                                    {String.fromCharCode(64 + i)}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="font-medium">Contact {i}</div>
                                <div className="text-xs text-muted-foreground">{i * 10} minutes ago</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default StatusTab;