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
        console.log(response.headers['sessionid']);

        // Store session ID in localStorage
        localStorage.setItem("sessionid", response.headers['sessionid']);

        return response.data;
    } catch (error: any) {
        console.error("OTP error:", error?.response?.data);
        throw error?.response?.data?.message || "OTP sending failed";
    }
};
// export const verifyOtp = async (otp: string) => {
//     try {
//         const sessionId = localStorage.getItem("sessionid");
//         if (!sessionId) {
//             throw new Error("Session ID is missing. Please request a new OTP.");
//         }

//         const otpArray = otp.split('');
//         console.log(otpArray, 'otpArray');

//         const response = await axios.post(
//             `${API_BASE_URL}/api/users/verifyotp`,
//             { otp: otpArray },
//             {
//                 headers: {
//                     sessionid: sessionId,
//                 },
//                 withCredentials: true,
//             },

//         );

//         return {
//             success: true,
//             user: response.data.user,
//             isNewUser: response.data.user?.isNewUser || false,
//         };
//     } catch (error: any) {
//         console.error("OTP verification failed:", error.response?.data || error.message);
//         return {
//             success: false,
//             message: error.response?.data?.message || "OTP verification failed",
//         };
//     }
// };
export const verifyOtpApi = async (otp: string) => {
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
                withCredentials: true,
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
export const getUserDetails = async () => {
    try {

        const response = await axios.get(`${API_BASE_URL}/api/users/`, {
            withCredentials: true,
        });
        console.log(response.data, 'response');

        return {
            success: true,
            user: response.data.user,
        };
    } catch (error: any) {
        console.error("User fetch failed:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.message || "Fetching user failed",
        };
    }
};
export const logoutApi = async (): Promise<any> => {
    try {
        const response = await axios.post(`${API_BASE_URL}/api/users/logout`);
        return response.data;
    } catch (error: any) {
        console.error("Logout error:", error?.response?.data);
        throw error?.response?.data || error?.message || "Logout failed";
    }
};

// Corrected API to use cookies instead of Bearer token
export const updateProfile = async (userId: string, formData: FormData) => {
    try {
        console.log('🔄 Updating profile for user:', userId);

        const response = await fetch(`${API_BASE_URL}/api/users/updateprofile/${userId}`, {
            method: 'PUT',
            credentials: 'include', // This sends cookies automatically
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to update profile');
        }

        console.log('✅ Profile updated:', data);
        return {
            success: true,
            user: data,
            message: 'Profile updated successfully'
        };

    } catch (error: any) {
        // console.error('❌ Profile update error:', error);
        throw new Error(error.message || 'Failed to update profile');
    }
};
// updateUserName
export const updateUserName = async (userId: string, name: string, about?: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/users/updateuser/${userId}`, {
            method: 'PUT',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: name.trim(),
                about: about?.trim() || ''
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to update user info');
        }

        console.log('✅ User info updated:', data);
        return {
            success: true,
            user: data,
            message: 'User info updated successfully'
        };

    } catch (error: any) {
        console.error('❌ User info update error:', error);
        throw new Error(error.message || 'Failed to update user info');
    }
};