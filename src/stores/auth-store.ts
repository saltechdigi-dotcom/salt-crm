import { create } from 'zustand';
import api from '@/lib/api';
import { socketClient } from '@/lib/socket';

// Map backend roles to frontend role names
const roleMap: Record<string, string> = {
    master: 'SUPER_ADMIN_MASTER',
    admin: 'TENANT_ADMIN',
    manager: 'TENANT_GERENTE',
    agent: 'TENANT_VENDEDOR',
    super_admin: 'SUPER_ADMIN_MASTER',
};

interface AuthUser {
    id: string;
    name: string;
    email: string;
    role: string;
    tenantId: string;
    avatarUrl?: string;
}

interface AuthState {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;

    login: (email: string, password: string) => Promise<{ redirectTo: string }>;
    logout: () => Promise<void>;
    getMe: () => Promise<void>;
    clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    isAuthenticated: !!localStorage.getItem('salt_token'),
    isLoading: false,
    error: null,

    login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
            // 1) tenta login padrão
            let res = await api.post('/auth/login', { email, password });
            let data = res.data;

            // fallback automático: se não veio user ou se o backend não reconhece, tenta superadmin
            if (!data?.user) {
                res = await api.post('/auth/superadmin/login', { email, password });
                data = res.data;
            }

            // Store tokens (API returns snake_case)
            localStorage.setItem('salt_token', data.access_token);
            localStorage.setItem('salt_refresh_token', data.refresh_token);

            // Connect to real-time socket
            socketClient.connect(data.access_token);

            const user = data.user;
            const frontendRole = roleMap[user.role] || (user.role === 'master' ? 'SUPER_ADMIN_MASTER' : 'TENANT_VENDEDOR');

            // Store session for backward compatibility with useUserRole
            localStorage.setItem('salt_session', JSON.stringify({
                email: user.email,
                loggedIn: true,
                role: frontendRole,
                name: user.name,
            }));

            set({
                user,
                isAuthenticated: true,
                isLoading: false,
                error: null,
            });

            // Determine redirect based on role
            const redirectTo = (user.role === 'master' || user.role === 'super_admin') ? '/super-admin' : '/home';
            return { redirectTo };

        } catch (error: any) {
            const message = error?.response?.data?.message || 'Erro ao fazer login. Verifique suas credenciais.';
            set({ isLoading: false, error: message });
            throw new Error(message);
        }
    },

    logout: async () => {
        try {
            await api.post('/auth/logout');
        } catch {
            // Ignore logout errors
        } finally {
            localStorage.removeItem('salt_token');
            localStorage.removeItem('salt_refresh_token');
            localStorage.removeItem('salt_session');
            socketClient.disconnect();
            set({ user: null, isAuthenticated: false });
        }
    },

    getMe: async () => {
        try {
            const { data } = await api.get('/auth/me');

            const frontendRole = roleMap[data.role] || (data.role === 'master' ? 'SUPER_ADMIN_MASTER' : 'TENANT_VENDEDOR');

            // Keep session in sync
            localStorage.setItem('salt_session', JSON.stringify({
                email: data.email,
                loggedIn: true,
                role: frontendRole,
                name: data.name,
            }));

            const token = localStorage.getItem('salt_token');
            if (token) {
                socketClient.connect(token);
            }

            set({ user: data, isAuthenticated: true });
        } catch {
            set({ user: null, isAuthenticated: false });
            localStorage.removeItem('salt_token');
            localStorage.removeItem('salt_refresh_token');
            localStorage.removeItem('salt_session');
            socketClient.disconnect();
        }
    },

    clearError: () => set({ error: null }),
}));

// Auto-connect socket on application boot if a session token already exists
const initialToken = localStorage.getItem('salt_token');
if (initialToken) {
    socketClient.connect(initialToken);
}
