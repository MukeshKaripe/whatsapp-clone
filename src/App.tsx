// import { Toaster } from "@/components/ui/toaster";
// import { Toaster as Sonner } from "@/components/ui/sonner";
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
// import { ThemeProvider } from "@/components/theme-provider";
import './App.css';

import { Button } from "@/components/ui/button"
import { Toaster, toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import Login from "./pages/Login";
import OtpVerification from "./pages/OtpVerification";
import ProfileSetup from "./pages/ProfileSetup";
import HomeLayout from "./layouts/HomeLayout";
import ChatsTab from "./pages/ChatsTab";
import StatusTab from "./pages/StatusTab";
import CallsTab from "./pages/CallsTab";


const queryClient = new QueryClient();

// Protected route component to prevent direct URL access
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <Toaster />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/otp-verification" element={<OtpVerification />} />
        <Route path="/profile-setup" element={<ProfileSetup />} />

        {/* Home routes with child routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomeLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/chats" replace />} />
          <Route path="chats" element={<ChatsTab />} />
          <Route path="status" element={<StatusTab />} />
          <Route path="calls" element={<CallsTab />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

    </AuthProvider>
  </QueryClientProvider>
);

export default App;