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

// Helper: determine if a backend role is super-admin
function isSuperAdminRole(role: string): boolean {
    return role === 'master' || role === 'super_admin';
}

// Helper: get the stored user type ('superadmin' | 'tenant' | null)
export function getSaltUserType(): 'superadmin' | 'tenant' | null {
    return localStorage.getItem('salt_user_type') as any;
}

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

        // Clean stale tokens
        localStorage.removeItem('salt_token');
        localStorage.removeItem('salt_refresh_token');
        localStorage.removeItem('salt_user_type');

        const processLogin = (data: any) => {
            const user = data.user;
            const userType = isSuperAdminRole(user.role) ? 'superadmin' : 'tenant';
            const frontendRole = roleMap[user.role] || (isSuperAdminRole(user.role) ? 'SUPER_ADMIN_MASTER' : 'TENANT_VENDEDOR');

            // Store tokens
            localStorage.setItem('salt_token', data.access_token);
            localStorage.setItem('salt_refresh_token', data.refresh_token);
            // Store user type so getMe() and interceptor know which endpoints to use
            localStorage.setItem('salt_user_type', userType);

            // Connect socket
            socketClient.connect(data.access_token);

            // Store session for useUserRole hook
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

            const redirectTo = userType === 'superadmin' ? '/super-admin' : '/home';
            return { redirectTo };
        };

        // Try tenant login first
        try {
            const res = await api.post('/auth/login', { email, password }, { skipAuthRefresh: true } as any);
            if (res.data?.user) {
                return processLogin(res.data);
            }
        } catch {
            // Tenant login failed — try super-admin below
        }

        // Try super-admin login
        try {
            const res = await api.post('/auth/superadmin/login', { email, password }, { skipAuthRefresh: true } as any);
            if (res.data?.user) {
                return processLogin(res.data);
            }
        } catch {
            // Both failed
        }

        // Both failed — clean up and throw
        localStorage.removeItem('salt_token');
        localStorage.removeItem('salt_refresh_token');
        localStorage.removeItem('salt_session');
        localStorage.removeItem('salt_user_type');
        socketClient.disconnect();

        const message = 'Erro ao fazer login. Verifique suas credenciais.';
        set({ isLoading: false, isAuthenticated: false, user: null, error: message });
        throw new Error(message);
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
            localStorage.removeItem('salt_user_type');
            socketClient.disconnect();
            set({ user: null, isAuthenticated: false });
        }
    },

    getMe: async () => {
        const token = localStorage.getItem('salt_token');

        if (!token) {
            set({ user: null, isAuthenticated: false });
            return;
        }

        // ALWAYS use /auth/me — the backend uses this for ALL user types (tenant + super-admin)
        // The /auth/superadmin/me endpoint does NOT exist (returns 404)
        try {
            const { data } = await api.get('/auth/me', { skipAuthRefresh: true } as any);

            const frontendRole = roleMap[data.role] || (data.role === 'master' ? 'SUPER_ADMIN_MASTER' : 'TENANT_VENDEDOR');
            const userType = isSuperAdminRole(data.role) ? 'superadmin' : 'tenant';

            localStorage.setItem('salt_user_type', userType);
            localStorage.setItem('salt_session', JSON.stringify({
                email: data.email,
                loggedIn: true,
                role: frontendRole,
                name: data.name,
            }));

            socketClient.connect(token);
            set({ user: data, isAuthenticated: true });
        } catch {
            // /auth/me failed — check if we have a valid session from login (don't nuke it immediately)
            const existingSession = localStorage.getItem('salt_session');
            if (existingSession) {
                // Keep the session from login — user just logged in, token might just need a refresh
                try {
                    const session = JSON.parse(existingSession);
                    if (session.loggedIn) {
                        set({ isAuthenticated: true });
                        return;
                    }
                } catch {
                    // Invalid session JSON
                }
            }

            // No valid session — clear everything
            set({ user: null, isAuthenticated: false });
            localStorage.removeItem('salt_token');
            localStorage.removeItem('salt_refresh_token');
            localStorage.removeItem('salt_session');
            localStorage.removeItem('salt_user_type');
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
