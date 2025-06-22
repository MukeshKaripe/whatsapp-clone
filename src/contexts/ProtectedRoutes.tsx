
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
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                flexDirection: 'column',
                gap: '20px',
                // backgroundColor: '#f5f5f5'
            }}>
                {/* <div style={{
                    width: '50px',
                    height: '50px',
                    border: '5px solid #e3e3e3',
                    borderTop: '5px solid #25D366',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }} /> */}
                {/* <p style={{
                    color: '#555',
                    fontSize: '16px',
                    margin: 0
                }}>Verifying authentication...</p> */}
                <style>
                    {`
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `}
                </style>
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