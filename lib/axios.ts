// import axios from "axios";

// export const api = axios.create({
//   baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5050",
//   withCredentials: false,
// });

// api.interceptors.request.use((config) => {
//   if (typeof window !== "undefined") {
//     const token = localStorage.getItem("token");
//     if (token) config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

// api.interceptors.response.use(
//   (r) => r,
//   (err) => {
//     if (err?.response?.status === 401 && typeof window !== "undefined") {
//       localStorage.removeItem("token");
//       localStorage.removeItem("user");
//       window.location.href = "/login";
//     }
//     return Promise.reject(err);
//   }
// );

import axios from 'axios';

// 1. Create the Axios instance
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5050',
});

// 2. Add the interceptor that attaches the token to every request
api.interceptors.request.use(
  (config) => {
    // Check if window is defined (to prevent SSR errors)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token'); // Read from the 'token' key
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);