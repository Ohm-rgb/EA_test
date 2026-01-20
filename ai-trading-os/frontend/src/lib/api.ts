/**
 * API Client for AI Trading OS
 * Base API layer for frontend-to-backend communication
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ApiError {
    detail: string;
    status: number;
}

class ApiClient {
    private baseUrl: string;
    private token: string | null = 'mock-token'; // DEV: Use mock token for development

    constructor(baseUrl: string = API_BASE_URL) {
        this.baseUrl = baseUrl;
    }

    setToken(token: string) {
        this.token = token;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (this.token) {
            (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
        }

        const response = await fetch(url, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const error: ApiError = {
                detail: await response.text(),
                status: response.status,
            };
            throw error;
        }

        return response.json();
    }

    // Portfolio endpoints
    async getPortfolioOverview() {
        return this.request<PortfolioOverview>('/api/v1/portfolio/overview');
    }

    async getEquityCurve(days: number = 30) {
        return this.request<EquityPoint[]>(`/api/v1/portfolio/equity-curve?days=${days}`);
    }

    async getBotPerformance() {
        return this.request<BotPerformance[]>('/api/v1/portfolio/performance');
    }

    async getCurrentExposure() {
        return this.request<ExposureInfo[]>('/api/v1/portfolio/exposure');
    }

    // Chat endpoints
    async sendChatMessage(content: string, contextPage?: string) {
        return this.request<ChatResponse>('/api/v1/chat/', {
            method: 'POST',
            body: JSON.stringify({ content, context_page: contextPage }),
        });
    }

    async getChatSessions(limit: number = 10) {
        return this.request<SessionHistory[]>(`/api/v1/chat/sessions?limit=${limit}`);
    }

    async getSessionMessages(sessionId: number) {
        return this.request<ChatMessage[]>(`/api/v1/chat/sessions/${sessionId}/messages`);
    }

    async getTokenUsage() {
        return this.request<TokenUsage>('/api/v1/chat/usage');
    }

    // Bot endpoints
    async getBots() {
        return this.request<BotProfile[]>('/api/v1/bots/');
    }

    async getBot(id: number) {
        return this.request<BotProfile>(`/api/v1/bots/${id}`);
    }

    // Trade endpoints
    async getTrades(limit: number = 5) {
        return this.request<TradeResponse[]>(`/api/v1/trades/?limit=${limit}`);
    }

    // Settings endpoints
    async getSettings() {
        return this.request<Settings>('/api/v1/settings/');
    }

    async updateSettings(settings: Partial<Settings>) {
        return this.request<Settings>('/api/v1/settings/', {
            method: 'PUT',
            body: JSON.stringify(settings),
        });
    }

    // Health endpoints
    async getSystemHealth() {
        return this.request<SystemHealth>('/api/v1/health/');
    }
}

// Types
export interface PortfolioOverview {
    balance: number;
    equity: number;
    margin_used: number;
    free_margin: number;
    daily_pnl: number;
    daily_pnl_percent: number;
    total_pnl: number;
}

export interface EquityPoint {
    timestamp: string;
    equity: number;
}

export interface BotPerformance {
    bot_id: number;
    bot_name: string;
    total_trades: number;
    win_rate: number;
    profit: number;
    roi: number;
    is_active: boolean;
}

export interface ExposureInfo {
    symbol: string;
    direction: string;
    lots: number;
    current_pnl: number;
}

export interface ChatMessage {
    role: string;
    content: string;
    tokens_used?: number;
    model_used?: string;
    created_at?: string;
}

export interface ChatResponse {
    message: string;
    role: string;
    tokens_used: number;
    model_used: string;
}

export interface SessionHistory {
    id: number;
    context_page: string | null;
    started_at: string;
    message_count: number;
}

export interface TokenUsage {
    today: number;
    this_month: number;
    monthly_limit: number;
    remaining: number;
}

export interface BotProfile {
    id: number;
    name: string;
    strategy_type: string;
    is_active: boolean;
    risk_level: string;
    symbols: string[];
}

export interface TradeResponse {
    id: number;
    ticket_number: string | null;
    symbol: string;
    trade_type: string;
    lot_size: number;
    open_price: number;
    close_price: number | null;
    profit: number | null;
    status: string;
    opened_at: string;
    closed_at: string | null;
}

export interface Settings {
    id: number;
    // Guardrails
    risk_profile: string;
    max_drawdown_percent: number;
    daily_loss_limit: number | null;
    news_sensitivity: string;
    // AI
    primary_ai_provider: string;
    local_ai_model: string;
    external_ai_provider: string;
    external_ai_model: string;
    gemini_api_key: string | null;
    openai_api_key: string | null;
    monthly_token_limit: number;
    // MT5
    mt5_server: string | null;
    mt5_account_type: string;
}

export interface SystemHealth {
    status: string;
    database: string;
    ai_local: string;
    ai_external: string;
    mt5_connection: string;
}

// Singleton instance
export const api = new ApiClient();
export default api;
