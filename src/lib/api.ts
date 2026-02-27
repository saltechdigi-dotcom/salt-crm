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
        const originalRequest: any = error.config || {};

        // Permitir que algumas requisições pulem o fluxo de refresh (ex.: getMe)
        if (originalRequest.skipAuthRefresh) {
            return Promise.reject(error);
        }

        // If 401 and not already retrying
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            const refreshToken = localStorage.getItem('salt_refresh_token');
            if (!refreshToken) {
                handleLogout();
                return Promise.reject(error);
            }

            // Use the stored user type to call the CORRECT refresh endpoint — no guessing
            const userType = localStorage.getItem('salt_user_type');
            const refreshPath = userType === 'superadmin' ? '/auth/superadmin/refresh' : '/auth/refresh';

            try {
                const { data } = await axios.post(`${API_BASE_URL}${refreshPath}`, { refresh_token: refreshToken });

                localStorage.setItem('salt_token', data.access_token);
                localStorage.setItem('salt_refresh_token', data.refresh_token);

                originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
                return api(originalRequest);
            } catch (refreshError) {
                handleLogout();
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

function handleLogout() {
    localStorage.removeItem('salt_token');
    localStorage.removeItem('salt_refresh_token');
    localStorage.removeItem('salt_session');
    localStorage.removeItem('salt_user_type');
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
