import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import Login from "./pages/Login";
import OtpVerification from "./pages/OtpVerification";
import ProfileSetup from "./pages/ProfileSetup";
import HomeLayout from "./layouts/HomeLayout";
import ChatsTab from "./pages/ChatsTab";
import StatusTab from "./pages/StatusTab";
import CallsTab from "./pages/CallsTab";
import ProtectedRoute from "./contexts/ProtectedRoutes";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Toaster richColors position="top-center" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/otp-verification" element={<OtpVerification />} />
          <Route path="/profile-setup" element={<ProfileSetup />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomeLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="chats" replace />} />
            <Route path="chats" element={<ChatsTab />} />
            <Route path="status" element={<StatusTab />} />
            <Route path="calls" element={<CallsTab />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        {/* <ThemeShowcase /> */}
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
