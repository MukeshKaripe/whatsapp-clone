import { useContext, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "./AuthContext";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const context = useContext(AuthContext);
    const [authChecked, setAuthChecked] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    if (!context) {
        console.log("❌ No AuthContext found, redirecting to login");
        return <Navigate to="/login" replace />;
    }

    const { isAuthenticated, loading, checkAuthStatus, hasSessionId, isRecentlyAuthenticated } = context;

    useEffect(() => {
        const verifyAuth = async () => {
            try {
                console.log("🔍 ProtectedRoute: Starting auth verification...");
                console.log("Current state:", {
                    isAuthenticated,
                    hasSessionId,
                    loading,
                    isRecentlyAuthenticated
                });

                // Skip auth check if user was recently authenticated (just logged in via OTP)
                if (isRecentlyAuthenticated && isAuthenticated) {
                    console.log("✅ User recently authenticated via OTP, skipping backend verification");
                    setAuthChecked(true);
                    setIsInitialLoad(false);
                    return;
                }

                const storedUser = localStorage.getItem("user");

                // If we have stored user data and haven't verified cookie auth yet
                if (storedUser && !authChecked && !loading && !isRecentlyAuthenticated) {
                    console.log("📋 Found stored user, verifying cookie authentication...");
                    const isValid = await checkAuthStatus();

                    if (!isValid) {
                        console.log("❌ Cookie authentication failed, clearing stored data...");
                        localStorage.removeItem("user");
                    } else {
                        console.log("✅ Cookie authentication valid, user remains authenticated");
                    }
                    setAuthChecked(true);
                }
                // If authenticated but haven't verified cookie yet
                else if (isAuthenticated && !authChecked && !loading && !isRecentlyAuthenticated) {
                    console.log("🔍 User appears authenticated, verifying cookie...");
                    const isValid = await checkAuthStatus();

                    if (!isValid) {
                        console.log("❌ Cookie verification failed for authenticated user");
                    } else {
                        console.log("✅ Cookie verification successful");
                    }
                    setAuthChecked(true);
                }
                // If no authentication indicators, mark as checked
                else if (!isAuthenticated && !storedUser && !hasSessionId) {
                    console.log("📋 No authentication indicators found, marking as checked");
                    setAuthChecked(true);
                }
                // If we have sessionId but not authenticated, let the auth flow handle it
                else if (!isAuthenticated && hasSessionId) {
                    console.log("📋 Has session ID but not authenticated, letting auth flow handle");
                    setAuthChecked(true);
                }

                setIsInitialLoad(false);
            } catch (error) {
                console.error("❌ Auth verification error:", error);
                setAuthChecked(true);
                setIsInitialLoad(false);
            }
        };

        // Only run verification if we haven't checked yet
        if (!authChecked && !loading) {
            verifyAuth();
        } else if (authChecked) {
            setIsInitialLoad(false);
        }
    }, [isAuthenticated, hasSessionId, authChecked, checkAuthStatus, loading, isRecentlyAuthenticated]);

    // Show loading while checking authentication or during initial load
    if (loading || isInitialLoad || (!authChecked && !isRecentlyAuthenticated)) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                flexDirection: 'column',
                gap: '20px',
                backgroundColor: '#f5f5f5'
            }}>
                <div style={{
                    width: '50px',
                    height: '50px',
                    border: '5px solid #e3e3e3',
                    borderTop: '5px solid #25D366',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }} />
                <p style={{
                    color: '#555',
                    fontSize: '16px',
                    margin: 0
                }}>Verifying authentication...</p>
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

    // Redirect to login if not authenticated and auth check is complete
    if (!isAuthenticated && authChecked) {
        console.log("❌ User not authenticated after auth check, redirecting to login");
        return <Navigate to="/login" replace />;
    }

    console.log("✅ User authenticated, rendering protected content");
    return <>{children}</>;
};

export default ProtectedRoute;