import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useEffect, useState } from "react";

import Login from "../pages/Login";
import OtpVerification from "../pages/OtpVerification";
import ProfileSetup from "../pages/ProfileSetup";
import HomeLayout from "../layouts/HomeLayout";
import ChatsTab from "../pages/ChatsTab";
import StatusTab from "../pages/StatusTab";
import CallsTab from "../pages/CallsTab";
import ProtectedRoute from "../contexts/ProtectedRoutes";

// Loading component for auth checks
const AuthLoader = () => (
    <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-muted-foreground">Loading...</p>
        </div>
    </div>
);

// Simple Login Route
const LoginRoute = () => {
    const { isAuthenticated, hasSessionId, loading } = useAuth();

    if (loading) return <AuthLoader />;

    // If already authenticated, redirect to home
    if (isAuthenticated) {
        console.log("✅ User authenticated, redirecting to home from login");
        return <Navigate to="/" replace />;
    }

    // If has session ID (OTP pending), redirect to OTP
    if (hasSessionId) {
        console.log("📋 Session ID found, redirecting to OTP verification");
        return <Navigate to="/otp-verification" replace />;
    }

    // Show login page
    console.log("🔐 Showing login page");
    return <Login />;
};

// Simple OTP Route
const OtpRoute = () => {
    const { isAuthenticated, hasSessionId, phoneNumber, loading } = useAuth();

    if (loading) return <AuthLoader />;

    // If already authenticated, redirect to home
    if (isAuthenticated) {
        console.log("✅ User authenticated, redirecting to home from OTP");
        return <Navigate to="/" replace />;
    }

    // If no session ID or phone number, redirect to login
    if (!hasSessionId || !phoneNumber) {
        console.log("❌ No session ID or phone number, redirecting to login");
        return <Navigate to="/login" replace />;
    }

    // Show OTP verification
    console.log("🔐 Showing OTP verification page");
    return <OtpVerification />;
};

// Profile Setup Route with better auth check
// const ProfileRoute = () => {
//     const { isAuthenticated, user, loading, checkAuthStatus } = useAuth();
//     const [authChecked, setAuthChecked] = useState(false);

//     useEffect(() => {
//         const verifyAuth = async () => {
//             if (!authChecked && !loading) {
//                 try {
//                     await checkAuthStatus();
//                 } catch (error) {
//                     console.error("Auth check failed:", error);
//                 } finally {
//                     setAuthChecked(true);
//                 }
//             }
//         };
//         verifyAuth();
//     }, [checkAuthStatus, authChecked, loading]);

//     if (loading || !authChecked) return <AuthLoader />;

//     // If not authenticated, redirect to login
//     if (!isAuthenticated) {
//         console.log("❌ Not authenticated, redirecting to login from profile setup");
//         return <Navigate to="/login" replace />;
//     }

//     // If user profile is complete, redirect to home
//     if (user && user.name && user.name.trim()) {
//         console.log("✅ Profile complete, redirecting to home");
//         return <Navigate to="/" replace />;
//     }

//     // Show profile setup
//     console.log("📝 Showing profile setup page");
//     return <ProfileSetup />;
// };

// Root Route with enhanced auth verification
const RootRoute = () => {
    const { isAuthenticated, hasSessionId, user, loading, checkAuthStatus } = useAuth();
    const [authChecked, setAuthChecked] = useState(false);

    useEffect(() => {
        const verifyAuth = async () => {
            if (!authChecked && !loading) {
                try {
                    console.log("🔍 Verifying authentication status...");
                    await checkAuthStatus();
                } catch (error) {
                    console.error("Auth verification failed:", error);
                } finally {
                    setAuthChecked(true);
                }
            }
        };
        verifyAuth();
    }, [checkAuthStatus, authChecked, loading]);

    // Show loading while checking auth
    if (loading || !authChecked) {
        return <AuthLoader />;
    }

    console.log("🏠 Root route - Auth state:", {
        isAuthenticated,
        hasSessionId,
        hasUser: !!user,
        userName: user?.name,
        authChecked
    });

    // If not authenticated
    if (!isAuthenticated) {
        // If has session ID, go to OTP
        if (hasSessionId) {
            console.log("📋 Not authenticated but has session, redirecting to OTP");
            return <Navigate to="/otp-verification" replace />;
        }
        // Otherwise go to login
        console.log("🔐 Not authenticated, redirecting to login");
        return <Navigate to="/login" replace />;
    }

    // If authenticated but profile incomplete
    if (!user || !user.name || !user.name.trim()) {
        console.log("📝 Authenticated but profile incomplete, redirecting to profile setup");
        return <Navigate to="/profile-setup" replace />;
    }

    // If authenticated and profile complete, show home
    console.log("✅ Authenticated with complete profile, showing home");
    return (
        <ProtectedRoute>
            <HomeLayout />
        </ProtectedRoute>
    );
};

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/login" element={<LoginRoute />} />
            <Route path="/otp-verification" element={<OtpRoute />} />

            <Route path="/" element={<RootRoute />}>
                <Route path="/profile-setup" element={<ProfileSetup />} />
                <Route index element={<Navigate to="chats" replace />} />
                <Route path="chats" element={<ChatsTab />} />
                <Route path="status" element={<StatusTab />} />
                <Route path="calls" element={<CallsTab />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

export default AppRoutes;