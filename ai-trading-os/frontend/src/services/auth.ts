const API_BASE_URL = 'http://localhost:8000/api/v1';

export interface User {
    username: string;
    token: string;
}

export const AuthService = {
    login: async (username: string, password: string): Promise<User> => {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            throw new Error('Login failed');
        }

        const data = await response.json();
        const user = { username: data.username, token: data.access_token };
        localStorage.setItem('user', JSON.stringify(user));
        return user;
    },

    logout: () => {
        localStorage.removeItem('user');
        window.location.href = '/login';
    },

    getCurrentUser: (): User | null => {
        if (typeof window === 'undefined') return null; // SSR safety
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    getToken: (): string | null => {
        const user = AuthService.getCurrentUser();
        return user?.token || null;
    },

    isAuthenticated: (): boolean => {
        return !!AuthService.getToken();
    }
};
