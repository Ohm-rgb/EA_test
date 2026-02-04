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

    // Pine Script Parsing (Forces Gemini Cloud)
    async parsePineScript(script: string, debug: boolean = false) {
        return this.request<PineScriptParseResult>(`/api/v1/chat/parse-pinescript?debug=${debug}`, {
            method: 'POST',
            body: JSON.stringify({ script }),
        });
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

    // AI Settings endpoints
    async getAISettings() {
        return this.request<AISettings>('/api/v1/settings/ai');
    }

    async updateAISettings(settings: Partial<AISettings>) {
        return this.request('/api/v1/settings/ai', {
            method: 'PUT',
            body: JSON.stringify(settings),
        });
    }

    async testAIConnection() {
        return this.request<TestAIResponse>('/api/v1/settings/test-ai', {
            method: 'POST'
        });
    }

    async testMT5Connection(server: string, login: string, password: string) {
        return this.request<MT5TestResponse>('/api/v1/settings/test-mt5', {
            method: 'POST',
            body: JSON.stringify({ server, login, password })
        });
    }

    // MT5 Connection Control
    async connectMT5() {
        return this.request<MT5StatusResponse>('/api/v1/settings/mt5/connect', {
            method: 'POST'
        });
    }

    async disconnectMT5() {
        return this.request<MT5StatusResponse>('/api/v1/settings/mt5/disconnect', {
            method: 'POST'
        });
    }

    async getMT5Status() {
        return this.request<MT5StatusResponse>('/api/v1/settings/mt5/status');
    }

    async getMT5Positions() {
        return this.request<MT5PositionsResponse>('/api/v1/portfolio/positions');
    }

    // ============================================
    // EA Control API - Master Bot Alpha
    // ============================================

    async getEAStatus(botId: string = 'master-bot-alpha') {
        return this.request<EAStatusResponse>(`/api/v1/bots/${botId}/control/status`);
    }

    async startTrading(botId: string = 'master-bot-alpha', dailyTarget: number = 100) {
        return this.request<EAStatusResponse>(`/api/v1/bots/${botId}/control/start`, {
            method: 'POST',
            body: JSON.stringify({ daily_target: dailyTarget })
        });
    }

    async stopTrading(botId: string = 'master-bot-alpha', reason: string = 'manual') {
        return this.request<EAStatusResponse>(`/api/v1/bots/${botId}/control/stop?reason=${reason}`, {
            method: 'POST'
        });
    }

    async pauseTrading(botId: string = 'master-bot-alpha') {
        return this.request<EAStatusResponse>(`/api/v1/bots/${botId}/control/pause`, {
            method: 'POST'
        });
    }

    async checkDailyTarget(botId: string = 'master-bot-alpha') {
        return this.request<DailyTargetCheck>(`/api/v1/bots/${botId}/control/check-target`, {
            method: 'POST'
        });
    }

    async setDailyTarget(botId: string = 'master-bot-alpha', targetUsd: number = 100) {
        return this.request(`/api/v1/bots/${botId}/control/set-target`, {
            method: 'POST',
            body: JSON.stringify({ target_usd: targetUsd })
        });
    }

    async generateTradingPlan(botId: string = 'master-bot-alpha', symbol: string = 'XAUUSD', dailyTarget: number = 100) {
        return this.request<TradingPlanResponse>(`/api/v1/bots/${botId}/ai/generate-plan?symbol=${symbol}&daily_target=${dailyTarget}`, {
            method: 'POST'
        });
    }

    async analyzeMarket(botId: string = 'master-bot-alpha', symbol: string = 'XAUUSD') {
        return this.request<MarketAnalysisResponse>(`/api/v1/bots/${botId}/ai/analyze-market?symbol=${symbol}`);
    }

    async getJournalEntries(botId: string = 'master-bot-alpha', limit: number = 20) {
        return this.request<JournalEntry[]>(`/api/v1/bots/${botId}/journal?limit=${limit}`);
    }

    async getDailyTargetSummary(botId: string = 'master-bot-alpha') {
        return this.request<DailySummary>(`/api/v1/bots/${botId}/daily-target`);
    }
}

// Types
export interface TestAIResponse {
    ollama: { status: string; message: string };
    gemini: { status: string; message: string };
}

export interface TradeResponse {
    id: number;
    ticket_number: string | null;
    symbol: string;
    trade_type: string;
    lot_size: number;
    open_price: number;
    close_price: number | null;
    stop_loss: number | null;
    take_profit: number | null;
    profit: number | null;
    status: string;
    opened_at: string;
    closed_at: string | null;
}

export interface MT5Position {
    ticket: number;
    symbol: string;
    type: string;
    volume: number;
    price_open: number;
    price_current: number;
    profit: number;
    sl: number;
    tp: number;
    time: number;
    comment: string;
}

export interface MT5PositionsResponse {
    connected: boolean;
    positions: MT5Position[];
    total_positions: number;
}

export interface MT5AccountInfo {
    server: string;
    login: number;
    balance: number;
    equity: number;
    margin_free: number;
    currency: string;
    leverage: number;
    name: string;
    company: string;
}

export interface MT5TestResponse {
    status: 'connected' | 'error' | 'disconnected' | 'not_installed';
    message: string;
    account_info?: MT5AccountInfo;
    error_code?: number;
}
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

export interface PineScriptParseResult {
    schemaVersion: string;
    status: 'success' | 'partial' | 'failed';
    warning?: string;
    indicators: Array<{
        id: string;
        type: string;
        period: number;
        source: string;
    }>;
    rules: Array<{
        id: number;
        indicator: string;
        operator: string;
        value: number;
        action: string;
        isEnabled: boolean;
    }>;
    raw_ai_response?: string;
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
    // Boolean flags - API keys are NEVER returned
    has_gemini_key?: boolean;
    has_openai_key?: boolean;
    gemini_api_key?: string | null;  // For input only
    openai_api_key?: string | null;  // For input only
    monthly_token_limit: number;
    // MT5
    mt5_server: string | null;
    mt5_account_type: string;
    mt5_login?: string | null;  // Optional, not always returned
    mt5_password?: string | null; // Optional, input only
}

export interface AISettings {
    primary_ai_provider: string;
    local_ai_model: string;
    external_ai_provider: string;
    external_ai_model: string;
    has_gemini_key: boolean;
    has_openai_key: boolean;
    has_ollama: boolean;
    monthly_token_limit: number;
    // Connection state
    external_ai_status?: string;  // not_tested, connected, error
    external_ai_last_checked?: string | null;  // ISO datetime string
    external_ai_error?: string | null;
    // Available models from backend
    default_local_model: string;
    available_local_models: string[];
    default_gemini_model: string;
    available_gemini_models: string[];
}

export interface SystemHealth {
    status: string;
    database: string;
    ai_local: string;
    ai_external: string;
    mt5_connection: string;
}

// EA Control Types
export interface EAStatusResponse {
    status: 'stopped' | 'running' | 'paused' | 'target_reached' | 'error';
    daily_profit: number;
    daily_target: number;
    target_reached: boolean;
    total_trades: number;
    open_positions: number;
    message_th: string;
}

export interface DailyTargetCheck {
    current_profit_usd: number;
    target_profit_usd: number;
    progress_percent: number;
    target_reached: boolean;
    auto_stopped: boolean;
    is_running: boolean;
    message_th: string;
}

export interface DailySummary {
    date: string;
    target_profit_usd: number;
    current_profit_usd: number;
    progress_percent: number;
    target_reached: boolean;
    auto_stopped: boolean;
    total_trades: number;
    winning_trades: number;
    win_rate: number;
}

export interface IndicatorRecommendation {
    name: string;
    type: string;
    params: Record<string, unknown>;
    reason_th: string;
    confidence: number;
}

export interface TradingPlanResponse {
    plan_name: string;
    indicators: IndicatorRecommendation[];
    entry_rules_th: string[];
    exit_rules_th: string[];
    risk_per_trade: number;
    daily_target_usd: number;
    summary_th: string;
}

export interface MarketAnalysisResponse {
    condition: 'trending_up' | 'trending_down' | 'ranging' | 'volatile' | 'quiet';
    trend_strength: number;
    volatility: number;
    suggested_style: 'scalping' | 'day_trading' | 'swing' | 'position';
    summary_th: string;
}

export interface JournalEntry {
    id: number;
    bot_id: string;
    entry_type: string;
    title: string;
    ai_summary_th: string | null;
    profit_usd: number;
    created_at: string | null;
}

export interface MT5StatusResponse {
    status: 'connected' | 'disconnected' | 'error' | 'not_installed';
    message: string;
    connected?: boolean;
    available?: boolean;
    account_info?: {
        server: string;
        login: number;
        balance: number;
        equity: number;
        currency: string;
    } | null;
}

// Singleton instance
export const api = new ApiClient();
export default api;

