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

export const checkUserAuth = async()=>{
try {
    const response = axiosInstance.get('/auth/check-auth');
    if(response.data.status ==='success'){
        return {isAuthenticated:true, user:response?.data?.data}
    }else if(response.data.status === 'error'){
        return {isAuthenticated:false}
    }
} catch (error) {
    throw error.response ? error.response.data : error.message
}
}

export const logoutUser = async()=>{
try {
    const response = axiosInstance.get('/auth/logout');
    return response.data
} catch (error) {
    throw error.response ? error.response.data : error.message
}
}


export const getAllUsers = async()=>{
try {
    const response = axiosInstance.get('/auth/get-allUser');
    return response.data
} catch (error) {
    throw error.response ? error.response.data : error.message
}
}
