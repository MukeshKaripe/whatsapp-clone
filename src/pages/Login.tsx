import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

import { Phone, Eye, EyeOff } from "lucide-react";
import { sendOtp } from "@/api/auth";

const Login = () => {
    const navigate = useNavigate();
    const { setPhoneNumber } = useAuth();
    const [phone, setPhone] = useState("");
    const phonePattern = /^[6-9]\d{9}$/;
    const [error, setError] = useState('');
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Only allow numbers
        const value = e.target.value.replace(/\D/g, "");
        setPhone(value);
        if (value === '' || phonePattern.test(value)) {
            setError('');
        } else {
            setError('Enter a valid 10-digit phone number starting with 6-9');
        }
    };
    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!phone) {
            toast.error("Please enter your phone number");
            return;
        }

        console.log("Sending OTP to:", phone);

        try {
            const result = await sendOtp(phone);
            console.log("✅ Full API Response:", result);

            // Set phone number in context
            setPhoneNumber(phone);

            // Show success message with OTP (for development)
            if (result?.success) {
                const message = result?.message || "OTP has been sent to your phone";
                // 🔥 For development - show OTP in toast
                const otpMessage = result?.otp ? `${message} (OTP: ${result.otp})` : message;
                toast.success(otpMessage);
            } else {
                toast.error(result?.message || "Failed to send OTP");
                return; // Don't navigate if not successful
            }

            // Navigate to OTP verification
            console.log("Navigating to OTP verification...");
            navigate("/otp-verification");

        } catch (err: any) {
            console.error("❌ OTP Error:", err);

            // Handle different error types
            let errorMessage = "Failed to send OTP";

            if (typeof err === 'string') {
                errorMessage = err;
            } else if (err?.message) {
                errorMessage = err.message;
            } else if (err?.response?.data?.message) {
                errorMessage = err.response.data.message;
            }

            toast.error(errorMessage);

            // Don't navigate on error
            return;
        }
    };


    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-purple-600 to-indigo-600 p-4 min-w-full">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <h1 className="font-bold text-2xl text-center
                    ">Welcome to Whatsapp Clone</h1>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLoginSubmit} className="space-y-4">
                        <div className="space-y-2 relative mb-5">
                            <div className="flex justify-between">
                                <label className="text-sm text-muted-foreground">Enter your mobile number</label>
                            </div>
                            <Input
                                type="text"
                                placeholder="Phone number"
                                value={phone}
                                onChange={handlePhoneChange}
                                onBlur={error ? () => setError('') : undefined}
                            />
                            {error && <span className="text-red-500 text-[12px] absolute">{error}</span>}
                        </div>

                        <div className="flex gap-4 pt-2">
                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-orange-400 to-pink-500 hover:from-orange-500 hover:to-pink-600"
                            >
                                Login via OTP
                            </Button>
                            {/* <Button
                                type="button"
                                variant="outline"
                                className="w-1/2 text-pink-500 border-pink-500 hover:bg-pink-50"
                                onClick={handleOtpRequest}
                            >
                                Login via OTP
                            </Button> */}
                        </div>
                    </form>

                    {/* <div className="mt-8">
                        <div className="text-center text-sm">
                            Don't have an account?
                            <Button
                                variant="link"
                                className="text-pink-500 p-0 h-auto ml-1"
                                onClick={() => setActiveTab("register")}
                            >
                                Register Now.
                            </Button>
                        </div>
                    </div> */}

                    <div className="mt-8">
                        <div className="relative flex items-center justify-center">
                            <hr className="w-full" />
                            <span className="absolute bg-card px-4 text-muted-foreground text-sm">Social Login Coming Soon</span>
                        </div>

                        <div className="mt-6 space-y-3">
                            <Button variant="outline" className="w-full flex items-center justify-center gap-2 border-blue-500 text-blue-600">
                                <svg width="20" height="20" viewBox="0 0 24 24" className="text-blue-600">
                                    <path
                                        fill="currentColor"
                                        d="M12 2C6.477 2 2 6.477 2 12c0 5.523 4.477 10 10 10s10-4.477 10-10c0-5.523-4.477-10-10-10zm0 1.5a8.5 8.5 0 100 17 8.5 8.5 0 000-17zm-2 4h4a.5.5 0 01.5.5v1a.5.5 0 01-.5.5H10v1h2a2 2 0 012 2v1a2 2 0 01-2 2h-4a.5.5 0 01-.5-.5v-1a.5.5 0 01.5-.5H14v-1h-2a2 2 0 01-2-2v-1a2 2 0 012-2z"
                                    ></path>
                                </svg>
                                Sign in with Facebook
                            </Button>
                            <Button variant="outline" className="w-full flex items-center justify-center gap-2 border-red-500 text-red-600">
                                <svg width="20" height="20" viewBox="0 0 24 24" className="text-red-600">
                                    <path
                                        fill="currentColor"
                                        d="M12 2C6.477 2 2 6.477 2 12c0 5.523 4.477 10 10 10s10-4.477 10-10c0-5.523-4.477-10-10-10zm0 1.5a8.5 8.5 0 100 17 8.5 8.5 0 000-17zm-2 4h4a.5.5 0 01.5.5v1a.5.5 0 01-.5.5H10v1h2a2 2 0 012 2v1a2 2 0 01-2 2h-4a.5.5 0 01-.5-.5v-1a.5.5 0 01.5-.5H14v-1h-2a2 2 0 01-2-2v-1a2 2 0 012-2z"
                                    ></path>
                                </svg>
                                Sign in with Google
                            </Button>
                            <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                                <Phone size={18} />
                                Sign in with Truecaller
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Login;
