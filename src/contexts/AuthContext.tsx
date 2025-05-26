import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getUserDetails, verifyOtpApi, logoutApi, updateProfile } from "../api/auth";

interface User {
    _id: string;
    name?: string;
    mobile: string;
    profile?: string;
    about?: string;
    avatarUrl?: string; // Added for profile image URL
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    phoneNumber: string;
    setPhoneNumber: (phone: string) => void;
    verifyOtp: (otp: string) => Promise<{ success: boolean; user?: User; message?: string }>;
    login: (user: User) => void;
    logout: () => void;
    loading: boolean;
    hasSessionId: boolean;
    updateUserProfile: (formData: FormData) => Promise<boolean>; // Added this line
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [phoneNumber, setPhoneNumber] = useState<string>("");
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [hasSessionId, setHasSessionId] = useState<boolean>(false);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                console.log("🔍 Checking authentication status...");

                // Check if sessionId exists (user in OTP flow)
                const sessionId = localStorage.getItem("sessionid");
                setHasSessionId(!!sessionId);

                // Check if user is authenticated via cookies
                const res = await getUserDetails();
                console.log("✅ Auth check response:", res);

                if (res.success && res.user) {
                    setUser(res.user);
                    setIsAuthenticated(true);
                    console.log("✅ User authenticated:", res.user);
                } else {
                    console.log("❌ User not authenticated - invalid response");
                    setIsAuthenticated(false);
                    setUser(null);
                }
            } catch (err: any) {
                console.log("❌ User not authenticated - error:", err);
                setIsAuthenticated(false);
                setUser(null);
            } finally {
                setLoading(false);
                console.log("✅ Auth check completed");
            }
        };

        checkAuth();
    }, []);

    const verifyOtp = async (otp: string): Promise<{ success: boolean; user?: User; message?: string }> => {
        try {
            console.log("🔐 Verifying OTP for phone:", phoneNumber);

            const result = await verifyOtpApi(otp);
            console.log("✅ OTP verification result:", result);

            if (result.success && result.user) {
                setUser(result.user);
                setIsAuthenticated(true);
                setHasSessionId(false);
                console.log("✅ OTP verified, user logged in:", result.user);
                return { success: true, user: result.user };
            }

            console.log("❌ OTP verification failed:", result.message);
            return { success: false, message: result.message };
        } catch (error: any) {
            console.error("❌ OTP verification failed:", error);
            return {
                success: false,
                message: typeof error === 'string' ? error : "OTP verification failed"
            };
        }
    };

    const login = (userData: User) => {
        console.log("👤 Manual login:", userData);
        setUser(userData);
        setIsAuthenticated(true);
        setHasSessionId(false);
    };

    const logout = async () => {
        try {
            console.log("🚪 Logging out...");
            await logoutApi();
            console.log("✅ Logout API called successfully");
        } catch (err) {
            console.error("❌ Logout API error:", err);
        } finally {
            setUser(null);
            setIsAuthenticated(false);
            setHasSessionId(false);
            localStorage.removeItem("sessionid");
            console.log("✅ User logged out locally");
        }
    };

    // Profile update function - now properly included in context
    const updateUserProfile = async (formData: FormData): Promise<boolean> => {
        try {
            if (!user?._id) {
                throw new Error('User ID not found');
            }

            console.log("🔄 Updating user profile...");
            const result = await updateProfile(user._id, formData);

            if (result.success && result.user) {
                // Update user in context with new data
                const updatedUser = {
                    ...user,
                    ...result.user,
                    // Ensure we keep the existing data and add new data
                    avatarUrl: result.user.profile || result.user.avatarUrl || user.avatarUrl
                };

                setUser(updatedUser);
                console.log("✅ Profile updated successfully:", updatedUser);

                // Update localStorage if token exists
                const token = localStorage.getItem('token');
                if (token) {
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                }

                return true;
            }

            console.log("❌ Profile update failed:", result);
            return false;
        } catch (error: any) {
            console.error('❌ Profile update failed:', error);
            throw error;
        }
    };

    // Update hasSessionId when phoneNumber changes
    useEffect(() => {
        const sessionId = localStorage.getItem("sessionid");
        setHasSessionId(!!sessionId);
    }, [phoneNumber]);

    // Loading screen
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-purple-600 to-indigo-600">
                <div className="text-white text-xl">Loading...</div>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated,
            phoneNumber,
            setPhoneNumber,
            verifyOtp,
            login,
            logout,
            loading,
            hasSessionId,
            updateUserProfile // Added this line to make it available in context
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};