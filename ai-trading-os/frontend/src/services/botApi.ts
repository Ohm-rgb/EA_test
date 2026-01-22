import { Bot, BotStatus, BotConfig } from '@/types/botTypes';

const API_BASE_URL = 'http://localhost:8000/api/v1';

// Helper for Fetch
async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${url}`, options);
    if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
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

    async updateIndicatorConfig(id: string, config: any): Promise<any> {
        return fetchJson<any>(`/indicators/${id}/config`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
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
    }
};
