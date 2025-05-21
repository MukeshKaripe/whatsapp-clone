import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "./AuthContext";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const context = useContext(AuthContext);

    if (!context) {
        return <Navigate to="/login" replace />;
    }

    const { isAuthenticated, loading } = context;

    if (loading) {
        return <div>Loading...</div>; // Replace with spinner component if available
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
