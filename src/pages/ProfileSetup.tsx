import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Camera, User, X, ArrowLeft, AlertCircle } from "lucide-react";

const ProfileSetup = () => {
    const navigate = useNavigate();
    const { user, updateUserProfile, isAuthenticated, hasSessionId, clearSessionId } = useAuth();
    const [name, setName] = useState(user?.name || "");
    const [about, setAbout] = useState(user?.about || "");
    const [profileImage, setProfileImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(user?.avatarUrl || user?.profile || null);
    const [loading, setLoading] = useState(false);
    const [nameError, setNameError] = useState("");
    const [submitError, setSubmitError] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ✅ Enhanced redirect logic - don't redirect if user has sessionId (in auth flow)
    useEffect(() => {
        // If user is not authenticated AND doesn't have sessionId, redirect to login
        if (!isAuthenticated && !hasSessionId) {
            console.log("❌ No authentication or sessionId - redirecting to login");
            navigate("/login");
            return;
        }

        // If user is authenticated but doesn't have sessionId and has name, redirect to home
        if (isAuthenticated && !hasSessionId && user?.name) {
            console.log("✅ User fully authenticated with name - redirecting to home");
            navigate("/");
            return;
        }

        console.log("✅ User in profile setup flow:", { isAuthenticated, hasSessionId, hasName: !!user?.name });
    }, [isAuthenticated, hasSessionId, user?.name, navigate]);

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setName(value);
        setSubmitError("");

        if (value.trim().length < 2 && value.trim().length > 0) {
            setNameError("Name must be at least 2 characters long");
        } else if (value.trim().length > 50) {
            setNameError("Name must be less than 50 characters");
        } else {
            setNameError("");
        }
    };

    const handleAboutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAbout(e.target.value);
        setSubmitError("");
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setSubmitError("");

        if (!file.type.startsWith('image/')) {
            toast.error("Please select a valid image file");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image size should be less than 5MB");
            return;
        }

        setProfileImage(file);

        const reader = new FileReader();
        reader.onload = (e) => {
            setImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveImage = () => {
        setProfileImage(null);
        setImagePreview(user?.avatarUrl || user?.profile || null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        setSubmitError("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError("");

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
            const formData = new FormData();
            formData.append('name', name.trim());

            if (about.trim()) {
                formData.append('about', about.trim());
            }

            if (profileImage) {
                formData.append('images', profileImage);
            }

            console.log("🔄 Submitting profile update...");

            const success = await updateUserProfile(formData);

            if (success) {
                toast.success("Profile updated successfully!");

                // ✅ Small delay to show success message, then navigate
                setTimeout(() => {
                    navigate("/", { replace: true });
                }, 1500);
            } else {
                setSubmitError("Failed to update profile. Please try again.");
                toast.error("Failed to update profile. Please try again.");
            }
        } catch (error: any) {
            console.error("Profile update error:", error);

            let errorMessage = "Failed to update profile";
            if (error?.message) {
                errorMessage = error.message;
            } else if (error?.response?.data?.message) {
                errorMessage = error.response.data.message;
            }

            setSubmitError(errorMessage);
            toast.error(errorMessage);

            if (errorMessage.includes('upload') || errorMessage.includes('image')) {
                toast.error("Try uploading a smaller image or a different format (JPG, PNG)");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSkipSetup = async () => {
        if (!name.trim()) {
            toast.error("Please enter your name to continue");
            return;
        }

        if (nameError) {
            toast.error("Please fix the errors before continuing");
            return;
        }

        setLoading(true);
        setSubmitError("");

        try {
            const formData = new FormData();
            formData.append('name', name.trim());

            const success = await updateUserProfile(formData);
            if (success) {
                toast.info("Basic profile saved. You can complete it later from settings.");
                setTimeout(() => {
                    navigate("/", { replace: true });
                }, 1000);
            } else {
                setSubmitError("Failed to save profile");
                toast.error("Failed to save profile");
            }
        } catch (error: any) {
            console.error("Skip setup error:", error);
            const errorMessage = error?.message || "Failed to save profile";
            setSubmitError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // ✅ Show loading if still determining auth state
    if (!isAuthenticated && !hasSessionId) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-purple-600 to-indigo-600">
                <div className="text-white text-xl">Redirecting...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-purple-600 to-indigo-600 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                                // ✅ Only go back to login if no sessionId, otherwise go to OTP
                                if (hasSessionId) {
                                    navigate("/otp-verification");
                                } else {
                                    navigate("/login");
                                }
                            }}
                            className="h-8 w-8"
                            disabled={loading}
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
                        {submitError && (
                            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                                <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                                <p className="text-red-700 text-sm">{submitError}</p>
                            </div>
                        )}

                        <div className="flex flex-col items-center space-y-4">
                            <div className="relative">
                                {imagePreview ? (
                                    <div className="relative">
                                        <img
                                            src={imagePreview}
                                            alt="Profile preview"
                                            className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                                            onError={(e) => {
                                                console.error('Image preview error:', e);
                                                setImagePreview(null);
                                            }}
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

                                {profileImage && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleRemoveImage}
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
                                maxLength={50}
                            />
                            {nameError && (
                                <p className="text-red-500 text-xs">{nameError}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                                This will be displayed on your profile
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">
                                About (Optional)
                            </label>
                            <Input
                                type="text"
                                placeholder="Tell us about yourself"
                                value={about}
                                onChange={handleAboutChange}
                                disabled={loading}
                                maxLength={139}
                            />
                            <p className="text-xs text-muted-foreground text-right">
                                {about.length}/139 characters
                            </p>
                        </div>

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
                                {loading ? "Saving..." : "Skip for now"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default ProfileSetup;