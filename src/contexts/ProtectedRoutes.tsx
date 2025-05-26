import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "./AuthContext";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const context = useContext(AuthContext);

    if (!context) {
        console.log("❌ No AuthContext found, redirecting to login");
        return <Navigate to="/login" replace />;
    }

    const { isAuthenticated, loading } = context;

    // Show loading while checking authentication
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-purple-600 to-indigo-600">
                <div className="text-white text-xl">Checking authentication...</div>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        console.log("❌ User not authenticated, redirecting to login");
        return <Navigate to="/login" replace />;
    }

    console.log("✅ User authenticated, rendering protected content");
    return <>{children}</>;
};

export default ProtectedRoute;