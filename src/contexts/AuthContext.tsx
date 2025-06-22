import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from "react";
import { verifyOtpApi, logoutApi, updateProfile, updateUserName } from "../api/auth";

interface User {
    _id: string;
    name?: string;
    mobile: string;
    profile?: string;
    about?: string;
    avatarUrl?: string;
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
    updateUserProfile: (formData: FormData) => Promise<boolean>;
    updateUserNameApi: (name: string, about?: string) => Promise<boolean>;
    checkAuthStatus: () => Promise<boolean>;
    isRecentlyAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(() => {
        const savedUser = localStorage.getItem("user");
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const [phoneNumber, setPhoneNumber] = useState<string>("");
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
        return !!localStorage.getItem("user");
    });
    const [loading, setLoading] = useState<boolean>(false);
    const [isRecentlyAuthenticated, setIsRecentlyAuthenticated] = useState<boolean>(false);
    const [hasSessionId, setHasSessionId] = useState<boolean>(() => {
        return !!localStorage.getItem("sessionid");
    });

    // Use refs to prevent duplicate API calls
    const authCheckInProgress = useRef(false);
    const authCheckCompleted = useRef(false);

    // Memoized auth check function to prevent recreation
    const checkAuthStatus = useCallback(async (): Promise<boolean> => {
        // Prevent duplicate calls
        if (authCheckInProgress.current) {
            console.log("🔍 Auth check already in progress, skipping...");
            return isAuthenticated;
        }

        // If we've already checked and user is recently authenticated, skip
        if (authCheckCompleted.current && (isRecentlyAuthenticated || isAuthenticated)) {
            console.log("✅ Auth already verified, skipping check");
            return isAuthenticated;
        }

        try {
            authCheckInProgress.current = true;
            setLoading(true);
            console.log("🔍 Checking authentication status via cookie...");

            // Make a simple API call that requires authentication
            // Using getAllUsers endpoint as a way to verify auth
            const response = await fetch('/api/user/', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            console.log("📋 Auth check response status:", response.status);

            if (response.ok) {
                console.log("✅ Cookie authentication valid");

                const storedUser = localStorage.getItem("user");
                if (storedUser && !user) {
                    const userData = JSON.parse(storedUser);
                    setUser(userData);
                    setIsAuthenticated(true);
                    console.log("✅ Using stored user data:", userData);
                }

                authCheckCompleted.current = true;
                return true;
            } else {
                console.log("❌ Cookie authentication failed, status:", response.status);
                setIsAuthenticated(false);
                setUser(null);
                localStorage.removeItem("user");
                authCheckCompleted.current = true;
                return false;
            }
        } catch (err: any) {
            console.log("❌ Auth check failed with error:", err.message);

            if (!isRecentlyAuthenticated) {
                setIsAuthenticated(false);
                setUser(null);
                localStorage.removeItem("user");
            }
            authCheckCompleted.current = true;
            return false;
        } finally {
            authCheckInProgress.current = false;
            setLoading(false);
            console.log("✅ Auth check completed");
        }
    }, [isAuthenticated, isRecentlyAuthenticated, user]);

    // Initial auth check on mount
    useEffect(() => {
        const initialAuthCheck = async () => {
            // Only check if we have stored user data but haven't verified yet
            const storedUser = localStorage.getItem("user");
            if (storedUser && !authCheckCompleted.current && !isRecentlyAuthenticated) {
                console.log("🔍 Initial auth check on mount...");
                await checkAuthStatus();
            } else if (!storedUser) {
                authCheckCompleted.current = true;
            }
        };

        initialAuthCheck();
    }, []); // Run only once on mount

    const verifyOtp = async (otp: string): Promise<{ success: boolean; user?: User; message?: string }> => {
        try {
            setLoading(true);
            console.log("🔐 Verifying OTP for phone:", phoneNumber);

            const result = await verifyOtpApi(otp);
            console.log("✅ OTP verification result:", result);

            if (result.success && result.user) {
                setUser(result.user);
                setIsAuthenticated(true);
                setHasSessionId(false);
                setIsRecentlyAuthenticated(true);
                authCheckCompleted.current = true; // Mark as completed

                localStorage.removeItem("sessionid");
                localStorage.setItem("user", JSON.stringify(result.user));

                console.log("✅ OTP verified, user logged in:", result.user);

                // Clear the recently authenticated flag after 10 seconds
                setTimeout(() => {
                    setIsRecentlyAuthenticated(false);
                }, 10000);

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
        } finally {
            setLoading(false);
        }
    };

    const login = (userData: User) => {
        console.log("👤 Manual login:", userData);
        setUser(userData);
        setIsAuthenticated(true);
        setHasSessionId(false);
        setIsRecentlyAuthenticated(true);
        authCheckCompleted.current = true; // Mark as completed
        localStorage.removeItem("sessionid");
        localStorage.setItem("user", JSON.stringify(userData));

        setTimeout(() => {
            setIsRecentlyAuthenticated(false);
        }, 10000);
    };

    const logout = async () => {
        try {
            setLoading(true);
            console.log("🚪 Logging out...");

            await logoutApi();
            console.log("✅ Logout API called successfully");
        } catch (err) {
            console.error("❌ Logout API error:", err);
        } finally {
            // Reset all state
            setUser(null);
            setIsAuthenticated(false);
            setHasSessionId(false);
            setIsRecentlyAuthenticated(false);
            authCheckInProgress.current = false;
            authCheckCompleted.current = false;

            localStorage.removeItem("sessionid");
            localStorage.removeItem("user");
            localStorage.removeItem("token");
            setLoading(false);
            console.log("✅ User logged out locally");
        }
    };

    const updateUserProfile = async (formData: FormData): Promise<boolean> => {
        try {
            if (!user?._id) {
                throw new Error('User ID not found');
            }

            setLoading(true);
            console.log("🔄 Updating user profile...");
            const result = await updateProfile(user._id, formData);

            if (result.success && result.user) {
                const updatedUser = {
                    ...user,
                    ...result.user,
                    avatarUrl: result.user.profile || result.user.avatarUrl || user.avatarUrl
                };

                setUser(updatedUser);
                console.log("✅ Profile updated successfully:", updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
                return true;
            }

            console.log("❌ Profile update failed:", result);
            return false;
        } catch (error: any) {
            console.error('❌ Profile update failed:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const updateUserNameApi = async (name: string, about?: string): Promise<boolean> => {
        try {
            if (!user?._id) {
                throw new Error('User ID not found');
            }

            setLoading(true);
            console.log("🔄 Updating user name and about...");
            const result = await updateUserName(user._id, name, about);

            if (result.success && result.user) {
                const updatedUser = {
                    ...user,
                    ...result.user,
                };

                setUser(updatedUser);
                console.log("✅ User name updated successfully:", updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
                return true;
            }

            console.log("❌ User name update failed:", result);
            return false;
        } catch (error: any) {
            console.error('❌ User name update failed:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Update hasSessionId when phoneNumber changes
    useEffect(() => {
        const sessionId = localStorage.getItem("sessionid");
        setHasSessionId(!!sessionId);
    }, [phoneNumber]);

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
            updateUserProfile,
            checkAuthStatus,
            updateUserNameApi,
            isRecentlyAuthenticated
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