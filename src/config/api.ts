const envUrl = (import.meta.env.VITE_API_URL || '').trim();
const fallbackUrl = 'https://ventasiam-api.onrender.com';

// Si por error VITE_API_URL apunta al frontend, forzar backend real.
const invalidHosts = ['ventascomunicacion.onrender.com'];

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

export const API_BASE_URL = normalizedUrl || fallbackUrl;
