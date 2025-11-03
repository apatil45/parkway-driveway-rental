import axios from 'axios';

// API client for Vercel serverless functions or external API origin
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add auth token to requests
// No auth header; httpOnly cookies carry auth
api.interceptors.request.use((config) => config);

// Handle responses
api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export default api;
