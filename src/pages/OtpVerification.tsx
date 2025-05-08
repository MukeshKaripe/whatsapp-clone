import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { verifyOtp } from "@/api/auth";

const OtpVerification = () => {
    const navigate = useNavigate();
    const { phoneNumber, login } = useAuth();
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [timer, setTimer] = useState(30);
    const [isVerifying, setIsVerifying] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Redirect to login if no phone number
    useEffect(() => {
        if (!phoneNumber) {
            navigate("/login");

        }
    }, [phoneNumber, navigate]);

    // Timer countdown
    useEffect(() => {
        if (timer > 0) {
            const interval = setInterval(() => {
                setTimer(prevTimer => prevTimer - 1);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [timer]);

    const handleOtpChange = (index: number, value: string) => {
        // Only accept digits
        if (!/^[0-9]*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input or blur on last
        if (value !== "" && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        // Handle backspace
        if (e.key === "Backspace" && otp[index] === "" && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerifyOtp = async () => {
        const sessionId = localStorage.getItem("sessionid");
        const otpValue = otp.join("");
        if (otpValue.length !== 6) {
            toast.error("Please enter a valid 6-digit OTP");
            return;
        }
        setIsVerifying(true);

        try {
            const result = await verifyOtp(otpValue);


            if (result.success && result.user.refreshToken) {
                // Store the refresh token in local storage or context

                localStorage.setItem("refreshToken", result.user.refreshToken);
                toast.success("OTP verified successfully");

                // Create a user object
                const user = {
                    id: "temp-id",
                    phone: phoneNumber,
                    isNewUser: result.isNewUser,
                };

                // Login the user
                login(user);

                // Redirect based on whether user is new or existing
                if (result.isNewUser) {
                    navigate("/profile-setup");
                } else {
                    navigate("/");
                }
            } else {
                toast.error("Invalid OTP. Please try again");
            }
        } catch (error) {
            console.error(error);
            toast.error("Something went wrong. Please try again");
        } finally {
            setIsVerifying(false);
        }
    };

    const handleResendOtp = () => {
        if (timer > 0) return;

        setTimer(30);
        toast.success("A new OTP has been sent to your phone");

    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-purple-600 to-indigo-600 p-4 min-w-full">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">OTP Verification</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        <div className="text-center space-y-2">
                            <p className="text-sm text-muted-foreground">
                                We've sent a verification code to
                            </p>
                            <p className="font-medium">{phoneNumber}</p>
                        </div>

                        <div className="flex justify-center gap-2">
                            {otp.map((digit, index) => (
                                <Input
                                    key={index}
                                    type="text"
                                    maxLength={1}
                                    value={digit}
                                    ref={(el) => (inputRefs.current[index] = el)}
                                    onChange={(e) => handleOtpChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    className="w-12 h-12 text-center text-xl"
                                />
                            ))}
                        </div>

                        <Button
                            onClick={handleVerifyOtp}
                            disabled={isVerifying || otp.join("").length !== 6}
                            className="w-full bg-gradient-to-r from-green-400 to-teal-500 hover:from-green-500 hover:to-teal-600"
                        >
                            {isVerifying ? "Verifying..." : "Verify OTP"}
                        </Button>

                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">
                                Didn't receive the code?{" "}
                                <Button
                                    variant="link"
                                    disabled={timer > 0}
                                    onClick={handleResendOtp}
                                    className={timer > 0 ? "text-muted-foreground" : "text-blue-600"}
                                >
                                    {timer > 0 ? `Resend in ${timer}s` : "Resend"}
                                </Button>
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default OtpVerification;
