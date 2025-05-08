import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_APP_API_URL;

// export const sendOtp = async (mobile: string): Promise<any> => {
//     try {
//         const response = await axios.post(`${API_BASE_URL}/api/users/sendotp`, { mobile });
//         // console.log("API response in sendOtp:", response.data);
//         return response.data;
//     } catch (error: any) {
//         console.error("OTP error:", error?.response?.data);
//         throw error?.response?.data?.message || "OTP sending failed";
//     }
// };
export const sendOtp = async (mobile: string): Promise<any> => {
    try {
        const response = await axios.post(`${API_BASE_URL}/api/users/sendotp`, { mobile });
        console.log(response.data.sessionid, 'response.data.sessionid', response.headers['sessionid']);

        // Store session ID in localStorage
        localStorage.setItem("sessionid", response.headers['sessionid']);

        return response.data;
    } catch (error: any) {
        console.error("OTP error:", error?.response?.data);
        throw error?.response?.data?.message || "OTP sending failed";
    }
};
export const verifyOtp = async (otp: string) => {
    try {
        const sessionId = localStorage.getItem("sessionid");
        if (!sessionId) {
            throw new Error("Session ID is missing. Please request a new OTP.");
        }

        const otpArray = otp.split('');
        console.log(otpArray, 'otpArray');

        const response = await axios.post(
            `${API_BASE_URL}/api/users/verifyotp`,
            { otp: otpArray },
            {
                headers: {
                    sessionid: sessionId,
                },
            }
        );

        return {
            success: true,
            user: response.data.user,
            isNewUser: response.data.user?.isNewUser || false,
        };
    } catch (error: any) {
        console.error("OTP verification failed:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.message || "OTP verification failed",
        };
    }
};

