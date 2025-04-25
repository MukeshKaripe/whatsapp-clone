import { createContext, useContext, useState, ReactNode, useEffect } from "react";

// Define types for the user object
interface User {
    id: string;
    name?: string;
    phone: string;
    avatarUrl?: string;
    isNewUser?: boolean;
}

// Define the context type
interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    phoneNumber: string;
    setPhoneNumber: (phone: string) => void;
    verifyOtp: (otp: string) => Promise<{ success: boolean; isNewUser: boolean }>;
    setupProfile: (name: string, avatarUrl: string) => Promise<void>;
    login: (user: User) => void;
    logout: () => void;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Props for the AuthProvider component
interface AuthProviderProps {
    children: ReactNode;
}

// AuthProvider component
export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<User | null>(null);
    const [phoneNumber, setPhoneNumber] = useState<string>("");
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

    // Check if user is already logged in (from localStorage)
    useEffect(() => {
        const storedUser = localStorage.getItem("whatsapp-user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
            setIsAuthenticated(true);
        }
    }, []);

    // Mock OTP verification function
    const verifyOtp = async (otp: string): Promise<{ success: boolean; isNewUser: boolean }> => {
        // In a real app, this would call an API
        return new Promise((resolve) => {
            setTimeout(() => {
                // Mock success response
                if (otp.length === 6) {
                    // Check if user exists in our system
                    const isNewUser = !localStorage.getItem(`user-${phoneNumber}`);
                    resolve({ success: true, isNewUser });
                } else {
                    resolve({ success: false, isNewUser: false });
                }
            }, 1000);
        });
    };

    // Mock profile setup function
    const setupProfile = async (name: string, avatarUrl: string): Promise<void> => {
        // In a real app, this would call an API
        return new Promise((resolve) => {
            setTimeout(() => {
                const newUser: User = {
                    id: "user-" + Date.now(),
                    name,
                    phone: phoneNumber,
                    avatarUrl,
                    isNewUser: false
                };

                // Store user data
                localStorage.setItem(`user-${phoneNumber}`, JSON.stringify(newUser));
                setUser(newUser);
                setIsAuthenticated(true);
                localStorage.setItem("whatsapp-user", JSON.stringify(newUser));

                resolve();
            }, 1000);
        });
    };

    // Login function
    const login = (userData: User) => {
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem("whatsapp-user", JSON.stringify(userData));
    };

    // Logout function
    const logout = () => {
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem("whatsapp-user");
    };

    // Context value
    const value: AuthContextType = {
        user,
        isAuthenticated,
        phoneNumber,
        setPhoneNumber,
        verifyOtp,
        setupProfile,
        login,
        logout
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook to use the auth context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
