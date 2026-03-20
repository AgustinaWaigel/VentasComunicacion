const envUrl = (import.meta.env.VITE_API_URL || '').trim();

export const API_BASE_URL = envUrl || 'https://ventasiam-api.onrender.com';
