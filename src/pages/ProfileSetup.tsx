import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, User, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const ProfileSetup: React.FC = () => {
    const { user, updateUserProfile, updateUserNameApi, loading } = useAuth();


    const navigate = useNavigate();

    const [name, setName] = useState(user?.name || '');
    const [about, setAbout] = useState(user?.about || '');
    const [profileImage, setProfileImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>(user?.profile || user?.avatarUrl || '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                toast.error('Please select a valid image file');
                return;
            }

            // Validate file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image size should be less than 5MB');
                return;
            }

            setProfileImage(file);

            // Create preview URL
            const reader = new FileReader();
            reader.onload = (event) => {
                setPreviewUrl(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            toast.error('Name is required');
            return;
        }

        setIsSubmitting(true);

        try {
            let success = false;

            // First, update name and about using UpdateUser API
            if (name !== user?.name || about !== user?.about) {
                const nameSuccess = await updateUserNameApi(name, about);
                if (!nameSuccess) {
                    toast.error('Failed to update name');
                    return;
                }
                success = true;
            }

            // Then, update profile image if selected
            if (profileImage) {
                const formData = new FormData();
                formData.append('images', profileImage);

                const imageSuccess = await updateUserProfile(formData);
                if (!imageSuccess) {
                    toast.error('Failed to update profile image');
                    return;
                }
                success = true;
            }

            // If no changes were made but name exists, still proceed
            if (!success && name.trim()) {
                success = true;
            }

            if (success) {
                toast.success('Profile updated successfully!');
                navigate('/');
            } else {
                toast.error('No changes to update');
            }
        } catch (error: any) {
            console.error('Profile setup error:', error);
            toast.error(error.message || 'Failed to update profile');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
            <div className="w-full max-w-md space-y-6">
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold text-foreground">Profile Setup</h1>
                    <p className="text-muted-foreground">
                        Complete your profile to get started
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Profile Picture Section */}
                    <div className="flex flex-col items-center space-y-4">
                        <div className="relative">
                            <Avatar className="w-24 h-24">
                                <AvatarImage src={previewUrl} alt="Profile" />
                                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                                    {name ? name[0].toUpperCase() : <User size={32} />}
                                </AvatarFallback>
                            </Avatar>

                            <label
                                htmlFor="profile-image"
                                className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors"
                            >
                                <Camera size={16} />
                            </label>

                            <input
                                id="profile-image"
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden"
                            />
                        </div>

                        <p className="text-sm text-muted-foreground text-center">
                            Tap to change profile picture
                        </p>
                    </div>

                    {/* Name Field */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Name *</Label>
                        <Input
                            id="name"
                            type="text"
                            placeholder="Enter your name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full"
                            required
                        />
                    </div>

                    {/* About Field */}
                    <div className="space-y-2">
                        <Label htmlFor="about">About (Optional)</Label>
                        <Input
                            id="about"
                            type="text"
                            placeholder="Hey there! I am using WhatsApp Clone"
                            value={about}
                            onChange={(e) => setAbout(e.target.value)}
                            className="w-full"
                            maxLength={139}
                        />
                        <p className="text-xs text-muted-foreground">
                            {about.length}/139 characters
                        </p>
                    </div>

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isSubmitting || loading || !name.trim()}
                    >
                        {isSubmitting || loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Setting up profile...
                            </>
                        ) : (
                            <>
                                Complete Setup
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                        )}
                    </Button>
                </form>

                {/* Note about name requirement */}
                <p className="text-xs text-muted-foreground text-center">
                    * Name is required to complete your profile setup
                </p>
            </div>
        </div>
    );
};

export default ProfileSetup;