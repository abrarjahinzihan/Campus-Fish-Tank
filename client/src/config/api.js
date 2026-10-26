// Centralized API and WebSocket backend configuration
const rawBackendUrl =
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000';

// Strip any trailing slashes to prevent malformed endpoints like 'https://site.com//api'
export const BACKEND_URL = rawBackendUrl.replace(/\/+$/, '');
export const API_BASE = `${BACKEND_URL}/api`;
export const SOCKET_URL = BACKEND_URL;
