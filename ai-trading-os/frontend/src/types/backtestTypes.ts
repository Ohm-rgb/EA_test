/**
 * Backtesting & Indicator Management Types
 * Post-conversion control layer - decision console, not reporting page
 * 
 * @important BacktestResult is bound to (bot_id + strategy_snapshot_hash)
 * @important No live execution from this page - configuration & binding only
 */

// ============================================================================
// INDICATOR STATUS STATE MACHINE
// ============================================================================

/**
 * Indicator lifecycle status with explicit transition rules:
 * 
 * draft    → ready     (has testResult)
 * ready    → active    (EXPLICIT user action only - NO auto jump)
 * active   → disabled  (EXPLICIT user action only)
 * disabled → ready     (re-test required)
 * 
 * @important NEVER auto-jump from ready → active
 */
export type IndicatorStatus = 'draft' | 'ready' | 'active' | 'paused' | 'archived' | 'disabled';

/**
 * Valid status transitions - enforced by state machine
 */
export const VALID_STATUS_TRANSITIONS: Record<IndicatorStatus, IndicatorStatus[]> = {
    draft: ['ready', 'archived'],           // Can be archived if abandoned
    ready: ['active', 'archived'],          // Can be activated or archived
    active: ['paused', 'disabled', 'archived'], // Can be paused (kill switch) or disabled/archived
    paused: ['active', 'archived'],         // Can resume or archive
    disabled: ['ready', 'archived'],        // Requires re-test or archive
    archived: ['draft'],                    // Restore to draft for re-evaluation
};

/**
 * Check if a status transition is valid
 */
export function canTransitionStatus(
    from: IndicatorStatus,
    to: IndicatorStatus,
    hasTestResult: boolean
): boolean {
    if (!VALID_STATUS_TRANSITIONS[from].includes(to)) {
        return false;
    }

    // Special rules
    if (from === 'draft' && to === 'ready') {
        return hasTestResult; // Must have test result to become ready
    }

    if (from === 'disabled' && to === 'ready') {
        return hasTestResult; // Re-test required
    }

    return true;
}

// ============================================================================
// SUB-SIGNAL CONFIGURATION
// ============================================================================

export interface SubSignalConfig {
    id: string;
    name: string;                   // e.g., "BOS Bullish", "CHoCH Bearish"
    indicatorType: string;          // e.g., "Structure", "FVG"
    isEnabled: boolean;
    parameters: Record<string, number | string | boolean>;
}

// ============================================================================
// MANAGED INDICATOR
// ============================================================================

export type IndicatorSourceType = 'pine_script' | 'manual' | 'ai_generated';

export interface TestResult {
    testedAt: Date;
    winRate: number;
    profitFactor: number;
    totalTrades: number;
    passed: boolean;
}

/**
 * Managed Indicator - post-conversion state
 * Represents an indicator that has been parsed/converted and needs user review
 */
export interface ManagedIndicator {
    id: string;
    name: string;                       // Display name
    sourceType: IndicatorSourceType;
    status: IndicatorStatus;

    // Strategy package linkage
    packageId?: string;                 // Link to parent strategy package

    // Bot binding (logical only - NO execution from this page)
    boundBotIds: string[];              // Bot IDs this indicator is bound to

    // Sub-signals configuration
    subSignals: SubSignalConfig[];
    enabledSubSignalCount: number;      // Derived: count of enabled sub-signals

    // Config version tracking (for cache validation)
    configHash?: string;                 // SHA256 hash of current config

    // Test result (required for draft → ready transition)
    testResult?: TestResult;

    // Metadata
    createdAt: Date;
    updatedAt: Date;
}

// ============================================================================
// TRADE DATA
// ============================================================================

export interface Trade {
    id: number;
    ticket_number?: string;
    symbol: string;
    trade_type: 'buy' | 'sell';
    lot_size: number;
    open_price: number;
    close_price?: number;
    stop_loss?: number;
    take_profit?: number;
    profit?: number;
    status: 'open' | 'closed' | 'cancelled';
    source_indicator_id?: string;
    opened_at: string; // ISO string from API
    closed_at?: string; // ISO string from API
}

// ============================================================================
// BACKTEST RESULT
// ============================================================================

export interface EquityPoint {
    timestamp: Date;
    equity: number;
    drawdown: number;
}

export interface TradeDistribution {
    label: string;                      // e.g., "Monday", "09:00"
    count: number;
    winRate: number;
    sourceIndicatorId?: string;         // Which indicator generated these trades
}

/**
 * Per-indicator distribution data
 * Trade distribution filtered by source indicator
 */
export interface IndicatorDistributionData {
    indicatorId: string;
    indicatorName: string;
    dayOfWeekDistribution: TradeDistribution[];
    hourOfDayDistribution: TradeDistribution[];
}

/**
 * Backtest Result - bound to specific bot + strategy snapshot
 * 
 * @important This result is for a SPECIFIC combination:
 * - botId: which bot configuration
 * - strategySnapshotHash: SHA256 of strategy state at test time
 * 
 * If indicator settings change, a new backtest is required.
 */
export interface BacktestResult {
    id: string;

    // Binding to specific bot + strategy state
    botId: string;
    botName: string;
    strategySnapshotHash: string;       // Prevents showing stale results

    // Test metadata
    testedAt: Date;
    testPeriod: {
        start: Date;
        end: Date;
    };

    // Core metrics
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;                    // Percentage (0-100)

    // Profitability
    netProfit: number;
    grossProfit: number;
    grossLoss: number;
    profitFactor: number;               // grossProfit / grossLoss

    // Risk metrics
    maxDrawdown: number;                // Percentage (0-100)
    maxDrawdownValue: number;           // Absolute value
    sharpeRatio: number;
    sortinoRatio: number;

    // Time-series data
    equityCurve: EquityPoint[];

    // Distribution data (for horizontal bar charts)
    dayOfWeekDistribution: TradeDistribution[];
    hourOfDayDistribution: TradeDistribution[];
}

// ============================================================================
// DASHBOARD STATE
// ============================================================================

/**
 * Dashboard state for Industrial Backtesting & Indicator Management
 */
export interface IndustrialDashboardState {
    // Current backtest result (if any)
    backtestResult: BacktestResult | null;

    // Managed indicators (post-conversion)
    managedIndicators: ManagedIndicator[];

    // UI state
    isLoading: boolean;
    selectedIndicatorId: string | null;
}

// ============================================================================
// MOCK DATA GENERATORS (Phase 1)
// ============================================================================

/**
 * Generate mock equity curve data
 */
export function generateMockEquityCurve(days: number = 90): EquityPoint[] {
    const points: EquityPoint[] = [];
    let equity = 10000;
    const now = new Date();

    for (let i = days; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);

        // Random walk with slight upward bias
        const change = (Math.random() - 0.45) * 200;
        equity = Math.max(8000, equity + change);

        const peak = Math.max(...points.map(p => p.equity), equity);
        const drawdown = ((peak - equity) / peak) * 100;

        points.push({
            timestamp: date,
            equity: Math.round(equity * 100) / 100,
            drawdown: Math.round(drawdown * 100) / 100
        });
    }

    return points;
}

/**
 * Generate mock trade distribution per indicator
 */
export function generateMockDayDistribution(indicatorId?: string): TradeDistribution[] {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    return days.map(day => ({
        label: day,
        count: Math.floor(Math.random() * 30) + 10,
        winRate: Math.round((Math.random() * 30 + 50) * 10) / 10,
        sourceIndicatorId: indicatorId
    }));
}

export function generateMockHourDistribution(indicatorId?: string): TradeDistribution[] {
    const hours = ['00-04', '04-08', '08-12', '12-16', '16-20', '20-24'];
    return hours.map(hour => ({
        label: hour,
        count: Math.floor(Math.random() * 40) + 10,
        winRate: Math.round((Math.random() * 30 + 50) * 10) / 10,
        sourceIndicatorId: indicatorId
    }));
}

/**
 * Generate distribution data for all indicators
 */
export function generateIndicatorDistributions(indicators: { id: string; name: string }[]): IndicatorDistributionData[] {
    return indicators.map(ind => ({
        indicatorId: ind.id,
        indicatorName: ind.name,
        dayOfWeekDistribution: generateMockDayDistribution(ind.id),
        hourOfDayDistribution: generateMockHourDistribution(ind.id)
    }));
}

/**
 * Generate mock backtest result
 */
export function generateMockBacktestResult(botId: string, botName: string): BacktestResult {
    const equityCurve = generateMockEquityCurve(90);
    const finalEquity = equityCurve[equityCurve.length - 1].equity;
    const netProfit = finalEquity - 10000;

    return {
        id: `bt_${Date.now().toString(36)}`,
        botId,
        botName,
        strategySnapshotHash: `sha256_${Math.random().toString(36).substring(2, 10)}`,
        testedAt: new Date(),
        testPeriod: {
            start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
            end: new Date()
        },
        totalTrades: 156,
        winningTrades: 105,
        losingTrades: 51,
        winRate: 67.3,
        netProfit: Math.round(netProfit * 100) / 100,
        grossProfit: 4250.00,
        grossLoss: 1985.00,
        profitFactor: 2.14,
        maxDrawdown: 8.2,
        maxDrawdownValue: 820.00,
        sharpeRatio: 1.87,
        sortinoRatio: 2.31,
        equityCurve,
        dayOfWeekDistribution: generateMockDayDistribution(),
        hourOfDayDistribution: [
            { label: '00-04', count: 12, winRate: 58.3 },
            { label: '04-08', count: 28, winRate: 64.3 },
            { label: '08-12', count: 45, winRate: 71.1 },
            { label: '12-16', count: 38, winRate: 68.4 },
            { label: '16-20', count: 22, winRate: 63.6 },
            { label: '20-24', count: 11, winRate: 54.5 },
        ]
    };
}

/**
 * Generate mock managed indicators
 */
export function generateMockManagedIndicators(): ManagedIndicator[] {
    return [
        {
            id: 'ind_smc_001',
            name: 'Smart Money Concepts',
            sourceType: 'pine_script',
            status: 'ready',
            packageId: 'pkg_smc',
            boundBotIds: ['bot_alpha'],
            subSignals: [
                { id: 'ss_1', name: 'BOS Bullish', indicatorType: 'Structure', isEnabled: true, parameters: {} },
                { id: 'ss_2', name: 'BOS Bearish', indicatorType: 'Structure', isEnabled: true, parameters: {} },
                { id: 'ss_3', name: 'CHoCH Bullish', indicatorType: 'Structure', isEnabled: true, parameters: {} },
                { id: 'ss_4', name: 'CHoCH Bearish', indicatorType: 'Structure', isEnabled: false, parameters: {} },
                { id: 'ss_5', name: 'FVG Bullish', indicatorType: 'FVG', isEnabled: true, parameters: {} },
                { id: 'ss_6', name: 'FVG Bearish', indicatorType: 'FVG', isEnabled: true, parameters: {} },
                { id: 'ss_7', name: 'Order Block', indicatorType: 'OB', isEnabled: true, parameters: {} },
                { id: 'ss_8', name: 'Breaker Block', indicatorType: 'BB', isEnabled: false, parameters: {} },
            ],
            enabledSubSignalCount: 6,
            testResult: { testedAt: new Date(), winRate: 67.3, profitFactor: 2.14, totalTrades: 156, passed: true },
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            updatedAt: new Date()
        },
        {
            id: 'ind_rsi_002',
            name: 'RSI Divergence',
            sourceType: 'manual',
            status: 'active',
            boundBotIds: ['bot_beta'],
            subSignals: [
                { id: 'ss_r1', name: 'Bullish Divergence', indicatorType: 'RSI', isEnabled: true, parameters: { period: 14 } },
                { id: 'ss_r2', name: 'Bearish Divergence', indicatorType: 'RSI', isEnabled: true, parameters: { period: 14 } },
            ],
            enabledSubSignalCount: 2,
            testResult: { testedAt: new Date(), winRate: 58.9, profitFactor: 1.65, totalTrades: 89, passed: true },
            createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
            updatedAt: new Date()
        },
        {
            id: 'ind_struct_003',
            name: 'Structure Break',
            sourceType: 'ai_generated',
            status: 'draft',
            boundBotIds: [],
            subSignals: [
                { id: 'ss_s1', name: 'Higher High Break', indicatorType: 'Structure', isEnabled: false, parameters: {} },
                { id: 'ss_s2', name: 'Lower Low Break', indicatorType: 'Structure', isEnabled: false, parameters: {} },
                { id: 'ss_s3', name: 'Range Breakout', indicatorType: 'Structure', isEnabled: false, parameters: {} },
                { id: 'ss_s4', name: 'Retest Confirm', indicatorType: 'Structure', isEnabled: false, parameters: {} },
            ],
            enabledSubSignalCount: 0,
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            updatedAt: new Date()
        }
    ];
}
