import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

import Login from "../pages/Login";
import OtpVerification from "../pages/OtpVerification";
import ProfileSetup from "../pages/ProfileSetup";
import HomeLayout from "../layouts/HomeLayout";
import ChatsTab from "../pages/ChatsTab";
import StatusTab from "../pages/StatusTab";
import CallsTab from "../pages/CallsTab";
import ProtectedRoute from "../contexts/ProtectedRoutes";

// Smart Login Route - handles login page logic
const LoginRoute = () => {
    const { isAuthenticated, hasSessionId, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-purple-600 to-indigo-600">
                <div className="text-white text-xl">Loading...</div>
            </div>
        );
    }

    // If already authenticated, redirect to home (home will handle profile check)
    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    // If has session ID (OTP pending), redirect to OTP
    if (hasSessionId) {
        return <Navigate to="/otp-verification" replace />;
    }

    // Show login page
    return <Login />;
};

// Smart OTP Route - handles OTP verification logic
const OtpRoute = () => {
    const { isAuthenticated, hasSessionId, phoneNumber, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-purple-600 to-indigo-600">
                <div className="text-white text-xl">Loading...</div>
            </div>
        );
    }

    // If already authenticated, redirect to home
    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    // If no session ID or phone number, redirect to login
    if (!hasSessionId || !phoneNumber) {
        return <Navigate to="/login" replace />;
    }

    // Show OTP verification
    return <OtpVerification />;
};

// Protected Profile Setup Route - MUST be authenticated to access
const ProfileRoute = () => {
    const { isAuthenticated, user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-purple-600 to-indigo-600">
                <div className="text-white text-xl">Loading...</div>
            </div>
        );
    }

    // If not authenticated, redirect to login
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // If user profile is already complete (has name), redirect to home
    if (user && user.name && user.name.trim()) {
        return <Navigate to="/" replace />;
    }

    // Show profile setup (wrapped in ProtectedRoute for safety)
    return (
        <ProtectedRoute>
            <ProfileSetup />
        </ProtectedRoute>
    );
};

// Root Route - handles initial navigation with proper profile check
const RootRoute = () => {
    const { isAuthenticated, hasSessionId, user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-purple-600 to-indigo-600">
                <div className="text-white text-xl">Loading...</div>
            </div>
        );
    }

    // If not authenticated
    if (!isAuthenticated) {
        // If has session ID, go to OTP
        if (hasSessionId) {
            return <Navigate to="/otp-verification" replace />;
        }
        // Otherwise go to login
        return <Navigate to="/login" replace />;
    }

    // If authenticated but profile incomplete (no name or empty name)
    if (user && (!user.name || !user.name.trim())) {
        return <Navigate to="/profile-setup" replace />;
    }

    // If authenticated and profile complete, show home
    return (
        <ProtectedRoute>
            <HomeLayout />
        </ProtectedRoute>
    );
};

const AppRoutes = () => {
    return (
        <Routes>
            {/* Smart routing for login */}
            <Route path="/login" element={<LoginRoute />} />

            {/* Smart routing for OTP */}
            <Route path="/otp-verification" element={<OtpRoute />} />

            {/* Protected profile setup route */}
            <Route path="/profile-setup" element={<ProfileRoute />} />

            {/* Protected home routes */}
            <Route path="/" element={<RootRoute />}>
                <Route index element={<Navigate to="chats" replace />} />
                <Route path="chats" element={<ChatsTab />} />
                <Route path="status" element={<StatusTab />} />
                <Route path="calls" element={<CallsTab />} />
            </Route>

            {/* Catch all - redirect to root (which handles smart routing) */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

export default AppRoutes;