import axiosInstance from "./url.service"

export const sendOtp = async(email, phoneNumber, countryCode)=>{
try {
    const response = axiosInstance.post('/auth/send-otp',{email, phoneNumber, countryCode});
    return response.data
} catch (error) {
    throw error.response ? error.response.data : error.message
}
}

export const verifyOtp = async(email, phoneNumber, countryCode, otp)=>{
try {
    const response = axiosInstance.post('/auth/verify-otp',{email, phoneNumber, countryCode,otp});
    return response.data
} catch (error) {
    throw error.response ? error.response.data : error.message
}
}

export const updateUserFile = async(updateData)=>{
try {
    const response = axiosInstance.patch('/authProfile/update',updateData);
    return response.data
} catch (error) {
    throw error.response ? error.response.data : error.message
}
}