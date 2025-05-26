import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Camera, User, X, ArrowLeft } from "lucide-react";

const ProfileSetup = () => {
    const navigate = useNavigate();
    const { user, updateUserProfile, isAuthenticated } = useAuth();
    const [name, setName] = useState(user?.name || "");
    const [about, setAbout] = useState(user?.about || "");
    const [profileImage, setProfileImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(user?.avatarUrl || user?.profile || null);
    const [loading, setLoading] = useState(false);
    const [nameError, setNameError] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!isAuthenticated || !user) {
            navigate("/login");
        }
    }, [isAuthenticated, user, navigate]);

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setName(value);

        if (value.trim().length < 2 && value.trim().length > 0) {
            setNameError("Name must be at least 2 characters long");
        } else if (value.trim().length > 50) {
            setNameError("Name must be less than 50 characters");
        } else {
            setNameError("");
        }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error("Please select a valid image file");
            return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image size should be less than 5MB");
            return;
        }

        setProfileImage(file);

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            setImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveImage = () => {
        setProfileImage(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSkipImage = () => {
        handleRemoveImage();
        toast.info("You can add a profile picture later from settings");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate name
        if (!name.trim()) {
            setNameError("Name is required");
            return;
        }

        if (name.trim().length < 2) {
            setNameError("Name must be at least 2 characters long");
            return;
        }

        if (nameError) {
            toast.error("Please fix the errors before continuing");
            return;
        }

        setLoading(true);

        try {
            // Prepare form data
            const formData = new FormData();
            formData.append('name', name.trim());
            if (about.trim()) {
                formData.append('about', about.trim());
            }
            if (profileImage) {
                formData.append('images', profileImage);
            }

            console.log("🔄 Submitting profile update...");

            // Log form data for debugging
            for (let [key, value] of formData.entries()) {
                console.log(`${key}:`, value);
            }

            const success = await updateUserProfile(formData);

            if (success) {
                toast.success("Profile updated successfully!");
                // Navigate to home after successful update
                setTimeout(() => {
                    navigate("/");
                }, 1000);
            } else {
                toast.error("Failed to update profile. Please try again.");
            }
        } catch (error: any) {
            console.error("Profile update error:", error);
            const errorMessage = error?.message || error?.response?.data?.message || "Failed to update profile";
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleSkipSetup = () => {
        if (!name.trim()) {
            toast.error("Please enter your name to continue");
            return;
        }

        if (nameError) {
            toast.error("Please fix the errors before continuing");
            return;
        }

        // Submit with just the name
        const formData = new FormData();
        formData.append('name', name.trim());

        setLoading(true);
        updateUserProfile(formData)
            .then((success) => {
                if (success) {
                    toast.info("Basic profile saved. You can complete it later.");
                    navigate("/");
                } else {
                    toast.error("Failed to save profile");
                }
            })
            .catch((error) => {
                console.error("Skip setup error:", error);
                toast.error("Failed to save profile");
            })
            .finally(() => {
                setLoading(false);
            });
    };

    // Don't render if not authenticated
    if (!isAuthenticated || !user) {
        return null;
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-purple-600 to-indigo-600 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(-1)}
                            className="h-8 w-8"
                        >
                            <ArrowLeft size={16} />
                        </Button>
                        <div>
                            <CardTitle className="text-2xl">Set Up Your Profile</CardTitle>
                            <p className="text-muted-foreground text-sm">
                                Let's personalize your account
                            </p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Profile Image Section */}
                        <div className="flex flex-col items-center space-y-4">
                            <div className="relative">
                                {imagePreview ? (
                                    <div className="relative">
                                        <img
                                            src={imagePreview}
                                            alt="Profile preview"
                                            className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleRemoveImage}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                            disabled={loading}
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-4 border-white shadow-lg">
                                        <User size={32} className="text-gray-400" />
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center gap-2"
                                    disabled={loading}
                                >
                                    <Camera size={16} />
                                    {imagePreview ? "Change Photo" : "Add Photo"}
                                </Button>

                                {imagePreview && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleSkipImage}
                                        className="text-muted-foreground"
                                        disabled={loading}
                                    >
                                        Remove
                                    </Button>
                                )}
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageSelect}
                                className="hidden"
                            />
                        </div>

                        {/* Name Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">
                                Your Name *
                            </label>
                            <Input
                                type="text"
                                placeholder="Enter your name"
                                value={name}
                                onChange={handleNameChange}
                                disabled={loading}
                                className={nameError ? "border-red-500 focus:border-red-500" : ""}
                                required
                            />
                            {nameError && (
                                <p className="text-red-500 text-xs">{nameError}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                                This will be displayed on your profile
                            </p>
                        </div>

                        {/* About Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">
                                About (Optional)
                            </label>
                            <Input
                                type="text"
                                placeholder="Tell us about yourself"
                                value={about}
                                onChange={(e) => setAbout(e.target.value)}
                                disabled={loading}
                                maxLength={139}
                            />
                            <p className="text-xs text-muted-foreground text-right">
                                {about.length}/139 characters
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                                disabled={loading || !name.trim() || nameError !== ""}
                            >
                                {loading ? "Setting up..." : "Complete Setup"}
                            </Button>

                            <Button
                                type="button"
                                variant="ghost"
                                className="w-full text-muted-foreground"
                                onClick={handleSkipSetup}
                                disabled={loading || !name.trim() || nameError !== ""}
                            >
                                Skip for now
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default ProfileSetup;