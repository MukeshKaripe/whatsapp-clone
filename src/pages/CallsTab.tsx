import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Plus, PhoneOutgoing, PhoneIncoming, PhoneMissed } from "lucide-react";

const CallsTab = () => {
    // Mock call data
    const calls = [
        { id: 1, name: "John Doe", time: "3:30 PM", type: "outgoing", missed: false },
        { id: 2, name: "Jane Smith", time: "Yesterday", type: "incoming", missed: false },
        { id: 3, name: "Team Alpha", time: "Wednesday", type: "outgoing", missed: true },
        { id: 4, name: "Mom", time: "Monday", type: "incoming", missed: false },
    ];

    const getCallIcon = (type: string, missed: boolean) => {
        if (missed) return <PhoneMissed className="text-red-500 h-4 w-4" />;
        if (type === "outgoing") return <PhoneOutgoing className="text-primary h-4 w-4" />;
        return <PhoneIncoming className="text-primary h-4 w-4" />;
    };

    return (
        <div className="p-4">
            <div className="mb-4">
                <Button variant="outline" className="w-full justify-start gap-2">
                    <Plus className="h-4 w-4" /> Create call link
                </Button>
            </div>

            <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Recent</h3>
                <div className="space-y-2">
                    {calls.map((call) => (
                        <div key={call.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md cursor-pointer">
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarFallback className="bg-primary text-primary-foreground">
                                        {call.name[0]}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className={`font-medium ${call.missed ? 'text-red-500' : ''}`}>{call.name}</div>
                                    <div className="flex items-center text-xs text-muted-foreground">
                                        {getCallIcon(call.type, call.missed)}
                                        <span className="ml-1">{call.time}</span>
                                    </div>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" className="text-primary hover:text-primary/90 hover:bg-primary/10">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                </svg>
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CallsTab;