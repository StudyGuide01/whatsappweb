// // Base URL
// import axios from "axios";
// const apiUrl = `${process.env.REACT_APP_API_URL}/api`;

// //create instance

// const axiosInstance = axios.create({
//     baseURL:apiUrl,
//     withCredentials:true
// })

// export default axiosInstance;

import axios from "axios";

// Vite me import.meta.env use hota hai
const apiUrl = `${import.meta.env.VITE_API_URL}/api`;

const axiosInstance = axios.create({
    baseURL: apiUrl,
    withCredentials: true
});

export default axiosInstance;