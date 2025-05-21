import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getUserDetails } from "../api/auth"; // Adjust path accordingly

interface User {
    id: string;
    name?: string;
    phone: string;
    avatarUrl?: string;
    isNewUser?: boolean;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    phoneNumber: string;
    setPhoneNumber: (phone: string) => void;
    verifyOtp: (otp: string) => Promise<{ success: boolean; isNewUser: boolean }>;
    setupProfile: (name: string, avatarUrl: string) => Promise<void>;
    login: (user: User) => void;
    logout: () => void;
    loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<User | null>(null);
    const [phoneNumber, setPhoneNumber] = useState<string>("");
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const initAuth = async () => {
            try {
                const storedUser = localStorage.getItem("refreshToken");
                if (storedUser) {
                    const parsedUser = JSON.parse(storedUser);
                    setUser(parsedUser);
                    setIsAuthenticated(true);
                } else {
                    const res = await getUserDetails(); // fallback API
                    if (res.success && res.user) {
                        setUser(res.user);
                        setIsAuthenticated(true);
                        localStorage.setItem("whatsapp-user", JSON.stringify(res.user));
                    }
                }
            } catch (err) {
                console.error("Auth check failed:", err);
            } finally {
                setLoading(false);
            }
        };

        initAuth();
    }, []);

    const verifyOtp = async (otp: string): Promise<{ success: boolean; isNewUser: boolean }> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const isNewUser = !localStorage.getItem(`user-${phoneNumber}`);
                resolve({ success: otp.length === 6, isNewUser });
            }, 1000);
        });
    };

    const setupProfile = async (name: string, avatarUrl: string): Promise<void> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const newUser: User = {
                    id: "user-" + Date.now(),
                    name,
                    phone: phoneNumber,
                    avatarUrl,
                    isNewUser: false
                };

                localStorage.setItem(`user-${phoneNumber}`, JSON.stringify(newUser));
                setUser(newUser);
                setIsAuthenticated(true);
                resolve();
            }, 1000);
        });
    };

    const login = (userData: User) => {
        setUser(userData);
        setIsAuthenticated(true);
    };

    const logout = () => {
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem("refreshToken"); // optional: also call logout API
    };

    const value: AuthContextType = {
        user,
        isAuthenticated,
        phoneNumber,
        setPhoneNumber,
        verifyOtp,
        setupProfile,
        login,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
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
