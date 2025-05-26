import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const OtpVerification = () => {
    const navigate = useNavigate();
    const { phoneNumber, verifyOtp, resendOtp } = useAuth();
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Redirect to login if no phone number
    if (!phoneNumber) {
        navigate("/login");
        return null;
    }

    // Timer effect for resend button
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [resendTimer]);

    const handleOtpChange = (index: number, value: string) => {
        // Only allow single digit
        if (value.length > 1) return;

        // Only allow numbers
        if (value !== "" && !/^\d$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto focus next input
        if (value !== "" && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        // Handle backspace
        if (e.key === "Backspace") {
            if (otp[index] === "" && index > 0) {
                // If current input is empty, go to previous input
                inputRefs.current[index - 1]?.focus();
            } else {
                // Clear current input
                const newOtp = [...otp];
                newOtp[index] = "";
                setOtp(newOtp);
            }
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasteData = e.clipboardData.getData("text");
        const digits = pasteData.replace(/\D/g, "").slice(0, 6);

        if (digits.length === 6) {
            const newOtp = digits.split("");
            setOtp(newOtp);
            inputRefs.current[5]?.focus();
        }
    };

    const handleOtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const otpString = otp.join("");
        if (otpString.length !== 6) {
            toast.error("Please enter a valid 6-digit OTP");
            return;
        }

        setLoading(true);
        console.log("🔐 Verifying OTP:", otpString);

        try {
            const result = await verifyOtp(otpString);
            console.log("✅ OTP verification result:", result);

            if (result.success) {
                toast.success("OTP verified successfully!");

                // Check if user has name/profile - if not, go to profile setup
                if (!result.user?.name) {
                    console.log("➡️ User needs profile setup");
                    navigate("/profile-setup");
                } else {
                    console.log("➡️ User has profile, going to home");
                    navigate("/");
                }
            } else {
                toast.error("Invalid OTP. Please try again.");
                // Clear OTP inputs on failure
                setOtp(["", "", "", "", "", ""]);
                inputRefs.current[0]?.focus();
            }
        } catch (error: any) {
            console.error("❌ OTP verification error:", error);
            toast.error(error?.message || "OTP verification failed");
            // Clear OTP inputs on error
            setOtp(["", "", "", "", "", ""]);
            inputRefs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (resendTimer > 0) return;

        setResendLoading(true);

        try {
            const success = await resendOtp();

            if (success) {
                toast.success("OTP resent successfully!");
                setResendTimer(10); // 10 second cooldown
                // Clear current OTP
                setOtp(["", "", "", "", "", ""]);
                inputRefs.current[0]?.focus();
            } else {
                toast.error("Failed to resend OTP. Please try again.");
            }
        } catch (error) {
            toast.error("Failed to resend OTP. Please try again.");
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-purple-600 to-indigo-600 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl text-center">Verify OTP</CardTitle>
                    <p className="text-center text-muted-foreground">
                        Enter the 6-digit code sent to {phoneNumber}
                    </p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleOtpSubmit} className="space-y-6">
                        {/* OTP Input Boxes */}
                        <div className="flex justify-center gap-2">
                            {otp.map((digit, index) => (
                                <Input
                                    key={index}
                                    ref={(el) => (inputRefs.current[index] = el)}
                                    type="text"
                                    inputMode="numeric"
                                    value={digit}
                                    onChange={(e) => handleOtpChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    onPaste={handlePaste}
                                    className="w-12 h-12 text-center text-lg font-semibold border-2"
                                    maxLength={1}
                                    disabled={loading}
                                    autoFocus={index === 0}
                                />
                            ))}
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                            disabled={loading || otp.join("").length !== 6}
                        >
                            {loading ? "Verifying..." : "Verify OTP"}
                        </Button>

                        {/* Resend OTP Button */}
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground mb-2">
                                Didn't receive the code?
                            </p>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleResendOtp}
                                disabled={resendLoading || resendTimer > 0 || loading}
                                className="text-green-600 border-green-500 hover:bg-green-50"
                            >
                                {resendLoading ? "Resending..." :
                                    resendTimer > 0 ? `Resend OTP (${resendTimer}s)` :
                                        "Resend OTP"}
                            </Button>
                        </div>

                        <Button
                            type="button"
                            variant="ghost"
                            className="w-full"
                            onClick={() => navigate("/login")}
                            disabled={loading}
                        >
                            Back to Login
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default OtpVerification;