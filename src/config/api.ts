const isDev = import.meta.env.DEV;
const envUrl = (import.meta.env.VITE_API_URL || '').trim();
const fallbackUrl = 'https://ventascomunicacion.onrender.com';

const invalidHosts = ['ventas-comu.vercel.app'];

let normalizedUrl = envUrl;
try {
	if (envUrl) {
		const host = new URL(envUrl).hostname;
		if (invalidHosts.includes(host)) {
			normalizedUrl = '';
		}
	}
} catch {
	normalizedUrl = '';
}

export const API_BASE_URL = isDev 
  ? `http://${window.location.hostname}:5000` 
  : (normalizedUrl || fallbackUrl);
