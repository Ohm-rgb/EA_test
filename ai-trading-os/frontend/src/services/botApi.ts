import { Bot, BotStatus, BotConfig } from '@/types/botTypes';
import { AuthService } from '@/services/auth'; // Added import

const API_BASE_URL = 'http://localhost:8000/api/v1';

// Helper for Fetch with Interceptor
async function fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers || {});

    // Inject Token
    const token = AuthService.getToken();
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const config = {
        ...options,
        headers
    };

    const response = await fetch(`${API_BASE_URL}${url}`, config);

    // Handle Auth Errors (401 Unauthorized or 403 Forbidden)
    if (response.status === 401 || response.status === 403) {
        AuthService.logout();
        throw new Error(`Authentication Error: ${response.status} ${response.statusText}`);
    }

    if (!response.ok) {
        // Try to get error details from response body
        let errorDetail = response.statusText;
        try {
            const errorBody = await response.json();
            errorDetail = errorBody.detail || errorBody.message || response.statusText;
        } catch {
            // Response body is not JSON, use statusText
        }
        throw new Error(`API Error (${response.status}): ${typeof errorDetail === 'object' ? JSON.stringify(errorDetail) : errorDetail}`);
    }
    return response.json();
}

export const BotApi = {
    // --- Bots ---
    async getBots(): Promise<Bot[]> {
        return fetchJson<Bot[]>('/bots');
    },

    async getBot(id: string): Promise<Bot> {
        return fetchJson<Bot>(`/bots/${id}`);
    },

    async createBot(bot: Bot): Promise<Bot> {
        return fetchJson<Bot>('/bots', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bot)
        });
    },

    async updateBotConfig(botId: string, config: BotConfig): Promise<Bot> {
        return fetchJson<Bot>(`/bots/${botId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
        });
    },

    async activateBot(botId: string, status: BotStatus): Promise<Bot> {
        return fetchJson<Bot>(`/bots/${botId}/activate?status=${status}`, {
            method: 'PUT'
        });
    },

    // --- Indicators ---
    async getIndicators(botId?: string, status?: string): Promise<any[]> {
        const params = new URLSearchParams();
        if (botId) params.append('bot_id', botId);
        if (status) params.append('status', status);
        return fetchJson<any[]>(`/indicators?${params.toString()}`);
    },

    async createIndicator(indicator: any): Promise<any> {
        return fetchJson<any>('/indicators', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(indicator)
        });
    },

    async updateIndicatorStatus(id: string, status: string): Promise<any> {
        return fetchJson<any>(`/indicators/${id}/status?status=${status}`, {
            method: 'PUT'
        });
    },

    async updateIndicatorConfig(id: string, payload: { config: any; context: any }): Promise<any> {
        return fetchJson<any>(`/indicators/${id}/config`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    },

    // --- Rules ---
    async getBotRules(botId: string): Promise<any[]> { // Using any[] for now, should be BotRule[]
        return fetchJson<any[]>(`/rules/${botId}`);
    },

    async replaceBotRules(botId: string, rules: any[]): Promise<any[]> {
        return fetchJson<any[]>('/rules/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                bot_id: botId,
                rules: rules
            })
        });
    },

    // --- Trades (Backtest Context) ---
    async getTrades(options?: {
        status?: string;
        symbol?: string;
        sourceIndicatorId?: string;
        limit?: number;
    }): Promise<any[]> {
        const params = new URLSearchParams();
        if (options?.status) params.append('status', options.status);
        if (options?.symbol) params.append('symbol', options.symbol);
        if (options?.sourceIndicatorId) params.append('source_indicator_id', options.sourceIndicatorId);
        if (options?.limit) params.append('limit', options.limit.toString());
        return fetchJson<any[]>(`/trades?${params.toString()}`);
    },

    // --- Epic 1: Binding & Availability ---
    async getAvailableIndicators(botId: string): Promise<any[]> {
        return fetchJson<any[]>(`/bots/${botId}/available-indicators`);
    },

    async bindIndicator(botId: string, indicatorId: string): Promise<any> {
        return fetchJson<any>(`/bots/${botId}/indicators/${indicatorId}`, {
            method: 'POST'
        });
    },

    async unbindIndicator(botId: string, indicatorId: string): Promise<any> {
        return fetchJson<any>(`/bots/${botId}/indicators/${indicatorId}`, {
            method: 'DELETE'
        });
    },

    async toggleIndicatorBinding(bindingId: string, enabled: boolean): Promise<any> {
        return fetchJson<any>(`/bot-indicators/${bindingId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_enabled: enabled })
        });
    },

    async getActiveIndicators(botId: string): Promise<any[]> {
        return fetchJson<any[]>(`/bots/${botId}/active-indicators`);
    }
};
