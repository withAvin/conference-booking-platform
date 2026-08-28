import axios from 'axios';

// Base URL comes from the environment so the EC2 deployment does not
// need a code change. Set REACT_APP_API_URL in frontend/.env for
// production; it falls back to localhost for development.
const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001',
  headers: { 'Content-Type': 'application/json' },
});

// Attaches the token to every request, so no component has to
// remember to pass the Authorization header.
axiosInstance.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem('cbp_user');
    const token = raw ? JSON.parse(raw).token : null;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {
    // No stored session; the request goes out unauthenticated and the
    // server responds 401.
  }
  return config;
});

export default axiosInstance;
