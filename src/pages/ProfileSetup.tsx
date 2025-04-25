import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Camera } from "lucide-react";

const ProfileSetup = () => {
    const navigate = useNavigate();
    const { user, setupProfile } = useAuth();
    const [name, setName] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Redirect if not a new user
    if (user && !user.isNewUser) {
        navigate("/");
    }

    const handleProfileSetup = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            toast.error("Please enter your name");
            return;
        }

        setIsLoading(true);

        try {
            // Update user profile
            await setupProfile(name, avatarUrl);

            toast.success("Profile setup complete!");

            // Redirect to home
            navigate("/");
        } catch (error) {
            console.error(error);
            toast.error("Something went wrong. Please try again");
        } finally {
            setIsLoading(false);
        }
    };

    // Mock function to handle file upload
    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // In a real app, this would upload to a server
            // For now, we'll create a local URL
            const url = URL.createObjectURL(file);
            setAvatarUrl(url);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-green-500 to-teal-500 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Set Up Your Profile</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleProfileSetup} className="space-y-6">
                        <div className="flex justify-center">
                            <div className="relative">
                                <Avatar className="w-24 h-24">
                                    <AvatarImage src={avatarUrl} />
                                    <AvatarFallback className="bg-muted text-muted-foreground text-lg">
                                        {name ? name.charAt(0).toUpperCase() : "?"}
                                    </AvatarFallback>
                                </Avatar>
                                <label
                                    htmlFor="avatar-upload"
                                    className="absolute -bottom-2 -right-2 bg-primary hover:bg-primary/90 text-primary-foreground p-2 rounded-full cursor-pointer"
                                >
                                    <Camera size={16} />
                                    <input
                                        id="avatar-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleAvatarChange}
                                    />
                                </label>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-muted-foreground">Enter your name</label>
                            <Input
                                type="text"
                                placeholder="Your name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                This will be displayed on your profile
                            </p>
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading || !name.trim()}
                            className="w-full bg-primary hover:bg-primary/90"
                        >
                            {isLoading ? "Setting up..." : "Continue"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default ProfileSetup;