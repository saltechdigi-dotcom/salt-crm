import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - add JWT token
api.interceptors.request.use(
    (config) => {
        const url = config.url || '';
        // Não envia Authorization em rotas públicas de auth
        const isAuthRoute = url.includes('/auth/login') || url.includes('/auth/superadmin/login') || url.includes('/auth/refresh') || url.includes('/auth/superadmin/refresh');
        if (!isAuthRoute) {
            const token = localStorage.getItem('salt_token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If 401 and not already retrying
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            const refreshToken = localStorage.getItem('salt_refresh_token');
            if (!refreshToken) {
                // No refresh token, force logout
                handleLogout();
                return Promise.reject(error);
            }

            const tryRefresh = async (path: string) => {
                return axios.post(`${API_BASE_URL}${path}`, { refresh_token: refreshToken });
            };

            try {
                // Primeiro tenta refresh padrão (tenant)
                const { data } = await tryRefresh('/auth/refresh');

                // Store new tokens (API returns snake_case)
                localStorage.setItem('salt_token', data.access_token);
                localStorage.setItem('salt_refresh_token', data.refresh_token);

                // Retry original request with new token
                originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
                return api(originalRequest);
            } catch (refreshError) {
                try {
                    // Fallback para superadmin
                    const { data } = await tryRefresh('/auth/superadmin/refresh');
                    localStorage.setItem('salt_token', data.access_token);
                    localStorage.setItem('salt_refresh_token', data.refresh_token);
                    originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
                    return api(originalRequest);
                } catch (refreshSuperError) {
                    handleLogout();
                    return Promise.reject(refreshSuperError);
                }
            }
        }

        return Promise.reject(error);
    }
);

function handleLogout() {
    localStorage.removeItem('salt_token');
    localStorage.removeItem('salt_refresh_token');
    localStorage.removeItem('salt_session');
    window.location.href = '/login';
}

// WhatsApp API
export const whatsappApi = {
    getAll: () => api.get('/whatsapp'),
    create: (name: string, phone?: string) => api.post('/whatsapp/instance', { name, phone }),
    connect: (id: string) => api.get(`/whatsapp/${id}/connect`),
    deleteInstance: (id: string) => api.delete(`/whatsapp/${id}`),
};

export default api;



