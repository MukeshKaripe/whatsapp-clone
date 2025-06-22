import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useEffect, useState } from "react";

import Login from "../pages/Login";
import OtpVerification from "../pages/OtpVerification";
import ProfileSetup from "../pages/ProfileSetup";
import HomeLayout from "../layouts/HomeLayout";
import ChatsTab from "../pages/ChatsTab";
import StatusTab from "../pages/StatusTab";
import CallsTab from "../pages/CallsTab";

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

    if (isAuthenticated) {
        console.log("✅ User authenticated, redirecting to home from OTP");
        return <Navigate to="/" replace />;
    }

    if (!hasSessionId || !phoneNumber) {
        console.log("❌ No session ID or phone number, redirecting to login");
        return <Navigate to="/login" replace />;
    }

    console.log("🔐 Showing OTP verification page");
    return <OtpVerification />;
};

// Simplified Root Route - Remove duplicate auth checks
const RootRoute = () => {
    const { isAuthenticated, hasSessionId, loading } = useAuth();

    // Show loading while checking auth
    if (loading) {
        return <AuthLoader />;
    }

    console.log("🏠 Root route - Auth state:", {
        isAuthenticated,
        hasSessionId,
    });

    // If not authenticated
    if (!isAuthenticated) {
        if (hasSessionId) {
            console.log("📋 Not authenticated but has session, redirecting to OTP");
            return <Navigate to="/otp-verification" replace />;
        }
        console.log("🔐 Not authenticated, redirecting to login");
        return <Navigate to="/login" replace />;
    }

    // If authenticated, show home layout with nested routes
    console.log("✅ Authenticated, showing home");
    return <HomeLayout />;
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