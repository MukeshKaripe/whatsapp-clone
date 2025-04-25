import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

import { Phone, Eye, EyeOff } from "lucide-react";

const Login = () => {
    const navigate = useNavigate();
    const { setPhoneNumber } = useAuth();
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [activeTab, setActiveTab] = useState("login");

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Only allow numbers
        const value = e.target.value.replace(/\D/g, "");
        setPhone(value);
    };

    const handleLoginSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!phone) {
            toast.error("Please enter your phone number or email");
            return;
        }

        // Store phone in context for OTP verification
        setPhoneNumber(phone);
        toast.success("OTP has been sent to your phone");
        navigate("/otp-verification");
    };

    const handleOtpRequest = () => {
        if (!phone) {
            toast.error("Please enter your phone number");
            return;
        }

        // Store phone in context for OTP verification
        setPhoneNumber(phone);

        toast.success("OTP has been sent to your phone");

        navigate("/otp-verification");
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-purple-600 to-indigo-600 p-4 min-w-full">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <Tabs defaultValue="login" onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="login">LOGIN</TabsTrigger>
                            <TabsTrigger value="register">REGISTER</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLoginSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm text-muted-foreground">Enter your mobile number or email id</label>
                            <Input
                                type="text"
                                placeholder="Phone or Email"
                                value={phone}
                                onChange={handlePhoneChange}
                            />
                        </div>

                        {activeTab === "login" && (
                            <div className="space-y-2 relative">
                                <div className="flex justify-between">
                                    <label className="text-sm text-muted-foreground">Enter your password</label>
                                </div>
                                <div className="relative">
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                <div className="text-right">
                                    <Button
                                        variant="link"
                                        className="text-pink-500 p-0 h-auto"
                                    >
                                        Forgot Password?
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-4 pt-2">
                            <Button
                                type="submit"
                                className="w-1/2 bg-gradient-to-r from-orange-400 to-pink-500 hover:from-orange-500 hover:to-pink-600"
                            >
                                Login
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="w-1/2 text-pink-500 border-pink-500 hover:bg-pink-50"
                                onClick={handleOtpRequest}
                            >
                                Login via OTP
                            </Button>
                        </div>
                    </form>

                    <div className="mt-8">
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
                    </div>

                    <div className="mt-8">
                        <div className="relative flex items-center justify-center">
                            <hr className="w-full" />
                            <span className="absolute bg-card px-4 text-muted-foreground text-sm">Social Login</span>
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
