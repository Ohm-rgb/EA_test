import { Trade } from '@/types/backtestTypes';

export interface PeriodStat {
    periodLabel: string;      // e.g., "2023-W45" or "2023-Nov"
    startDate: Date;
    endDate: Date;
    tradeCount: number;
    winRate: number;
    profitFactor: number;
    netProfit: number;
    maxDrawdown: number;      // Max drawdown within this period
    expectancy: number;       // Average profit per trade
    isProfitable: boolean;
}

export type SliceGranularity = 'week' | 'month';

/**
 * Slice trades into periods (Weekly or Monthly)
 * Assumes trades are already sorted by time (or sorts them).
 */
export function sliceTradesByPeriod(
    trades: Trade[],
    granularity: SliceGranularity,
    initialBalance: number = 10000 // For relative drawdown calc within period? Or simplified absolute?
): PeriodStat[] {
    if (trades.length === 0) return [];

    // Safety guard
    if (trades.length > 10000) {
        console.warn("Large dataset (>10k trades) detected in sliceTradesByPeriod. Performance may degrade.");
    }

    // Sort to be sure
    const sortedTrades = [...trades].sort((a, b) =>
        new Date(a.opened_at).getTime() - new Date(b.opened_at).getTime()
    );

    const periods: PeriodStat[] = [];
    let currentPeriodLabel = '';
    let currentTrades: Trade[] = [];

    // Helper to get label
    const getLabel = (date: Date): string => {
        if (granularity === 'month') {
            return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        } else {
            // ISO Week approximation
            const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
            const dayNum = d.getUTCDay() || 7;
            d.setUTCDate(d.getUTCDate() + 4 - dayNum);
            const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
            const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
            return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
        }
    };

    sortedTrades.forEach(trade => {
        const date = new Date(trade.opened_at);
        const label = getLabel(date);

        if (label !== currentPeriodLabel) {
            if (currentTrades.length > 0) {
                periods.push(calculatePeriodStat(currentTrades, currentPeriodLabel, initialBalance));
            }
            currentPeriodLabel = label;
            currentTrades = [];
        }
        currentTrades.push(trade);
    });

    // Push last period
    if (currentTrades.length > 0) {
        periods.push(calculatePeriodStat(currentTrades, currentPeriodLabel, initialBalance));
    }

    return periods;
}

function calculatePeriodStat(trades: Trade[], label: string, initialBalance: number): PeriodStat {
    if (trades.length === 0) {
        return {
            periodLabel: label,
            startDate: new Date(),
            endDate: new Date(),
            tradeCount: 0,
            winRate: 0,
            profitFactor: 0,
            netProfit: 0,
            maxDrawdown: 0,
            expectancy: 0,
            isProfitable: false
        };
    }

    const startDate = new Date(trades[0].opened_at);
    const endDate = new Date(trades[trades.length - 1].opened_at);

    let wins = 0;
    let grossProfit = 0;
    let grossLoss = 0;
    let netProfit = 0;

    // Intra-period drawdown calculation
    // We treat the period start as "reset" equity or carry over?
    // For reliability analysis, usually we want to see "drawdown from period peak".
    // We'll calculate drawdown based on cumulative profit within the period.
    let runningProfit = 0;
    let maxRunningProfit = 0;
    let maxDrawdown = 0;

    trades.forEach(t => {
        const p = t.profit || 0;
        netProfit += p;
        runningProfit += p;

        if (p > 0) {
            wins++;
            grossProfit += p;
        } else {
            grossLoss += Math.abs(p);
        }

        // Drawdown logic
        if (runningProfit > maxRunningProfit) {
            maxRunningProfit = runningProfit;
        }
        const dd = maxRunningProfit - runningProfit;
        if (dd > maxDrawdown) {
            maxDrawdown = dd;
        }
    });

    const tradeCount = trades.length;
    const winRate = tradeCount > 0 ? (wins / tradeCount) * 100 : 0;
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? 999 : 0);
    const expectancy = tradeCount > 0 ? netProfit / tradeCount : 0;

    return {
        periodLabel: label,
        startDate,
        endDate,
        tradeCount,
        winRate: Number(winRate.toFixed(1)),
        profitFactor: Number(profitFactor.toFixed(2)),
        netProfit: Number(netProfit.toFixed(2)),
        maxDrawdown: Number(maxDrawdown.toFixed(2)), // Absolute value
        expectancy: Number(expectancy.toFixed(2)),
        isProfitable: netProfit > 0
    };
}

/**
 * Calculate Stability Score based on variance of key metrics across periods
 * Score 0-100 (100 = implementation of perfection)
 */
export function calculateStabilityScore(periods: PeriodStat[]): { score: number; label: string } {
    if (periods.length < 3) return { score: 0, label: 'Insufficient Data' };

    // 1. Consistency of Profitable Periods
    const profitablePeriods = periods.filter(p => p.isProfitable).length;
    const profitConsistency = (profitablePeriods / periods.length) * 100;

    // 2. Win Rate Volatility
    // Calculate Standard Deviation of Win Rate
    const avgWinRate = periods.reduce((sum, p) => sum + p.winRate, 0) / periods.length;
    const variance = periods.reduce((sum, p) => sum + Math.pow(p.winRate - avgWinRate, 2), 0) / periods.length;
    const stdDev = Math.sqrt(variance);

    // Penalty: High StdDev reduces score. 
    // If StdDev is 0 (perfect), penalty is 0. If StdDev is 20% (wild), penalty is high.
    // Let's say acceptable StdDev is 5-10%.
    const volatilityPenalty = Math.min(stdDev * 2, 40); // Max 40 point penalty

    // 3. Drawdown Impact
    // Check if any single period had catastrophic drawdown (e.g. > 20% of initial balance?)
    // Hard without balance context. Let's use avg drawdown vs avg profit.

    // Simplify: Base score on Profit Consistency - Volatility
    let score = profitConsistency - volatilityPenalty;

    // Cap
    score = Math.max(0, Math.min(100, score));

    let label = 'Unstable';
    if (score >= 80) label = 'Robust';
    else if (score >= 60) label = 'Stable';
    else if (score >= 40) label = 'Moderate';

    return { score: Math.round(score), label };
}
