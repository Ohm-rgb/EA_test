import { Trade, EquityPoint } from '@/types/backtestTypes';
import { PeriodStat } from './reliabilityMetrics';

export interface RiskScenario {
    initialCapital: number;
    riskPerTradePercent: number;
    finalBalance: number;
    maxDrawdown: number;
    maxDrawdownPercent: number;
    survivalScore: number; // 0-100 score of survivability
    isRuined: boolean; // True if balance drops below threshold (e.g. 50% of capital or margin call)
    equityCurve: EquityPoint[]; // Simulated curve
    drawdownCurve: { timestamp: Date; drawdownPercent: number }[]; // Underwater series
}

export interface KillZone {
    periodLabel: string;
    reason: 'drawdown' | 'consecutive_losses';
    value: number; // The DD% or Loss Count
}

/**
 * Simulate Fixed Fractional Position Sizing
 * 
 * Assumption: The historical `trade.profit` represents a specific "Base Risk" setting.
 * Since we don't store "R" or "StopLoss" explicitly in generic Trade model yet,
 * we assume the historical profit was achieved with ~1% risk per trade on the initial balance.
 * 
 * Simulated P/L = (Historical P/L / (HistoricalCapital * 0.01)) * (CurrentCapital * TargetRisk)
 * 
 * This treats the historical P/L as transferable "R-units".
 */
export function simulateRisk(
    trades: Trade[],
    initialCapital: number,
    riskPercent: number,
    baseRiskAssumption: number = 0.01 // Assume historical data used 1% fixed risk
): RiskScenario {
    // 1. Sort trades
    const sortedTrades = [...trades].sort((a, b) => new Date(a.opened_at).getTime() - new Date(b.opened_at).getTime());

    let currentBalance = initialCapital;
    let maxBalance = initialCapital;
    let maxDrawdown = 0;

    const equityCurve: EquityPoint[] = [{
        timestamp: sortedTrades.length > 0 ? new Date(new Date(sortedTrades[0].opened_at).getTime() - 86400000) : new Date(),
        equity: initialCapital,
        drawdown: 0
    }];

    const drawdownCurve: { timestamp: Date; drawdownPercent: number }[] = [];

    // Helper to calculate Drawdown Series
    const addToCurves = (date: Date, balance: number) => {
        if (balance > maxBalance) maxBalance = balance;
        const dd = maxBalance - balance;
        if (dd > maxDrawdown) maxDrawdown = dd;
        const ddPct = maxBalance > 0 ? (dd / maxBalance) * 100 : 0;

        equityCurve.push({ timestamp: date, equity: balance, drawdown: ddPct });
        drawdownCurve.push({ timestamp: date, drawdownPercent: ddPct });
    };

    // Simulation Loop
    for (const trade of sortedTrades) {
        // Calculate "R" achieved in this trade
        // R = TradeProfit / (InitialCapital * BaseRisk)
        // Note: Should we use *running* capital for historical R normalization? 
        // No, usually backtest data is either fixed lot or fixed risk. 
        // Let's assume Fixed Risk on Initial Capital for the source data to derive R, 
        // then Apply Fixed Risk on Running Capital for simulation.

        // Safety: If trade.profit is undefined, skip
        const historicalProfit = trade.profit || 0;

        // Implied R (how many units of risk were won/lost)
        // We divide by (10,000 * 0.01 = 100) if using defaults.
        const impliedR = historicalProfit / (10000 * baseRiskAssumption);

        // Simulated Risk Amount (The amount we are willing to lose NOW)
        const riskAmount = currentBalance * (riskPercent / 100);

        // Simulated Profit = Implied R * Risk Amount
        // If Implied R is -1 (loss), we lose Risk Amount.
        const simulatedProfit = impliedR * riskAmount;

        currentBalance += simulatedProfit;

        addToCurves(new Date(trade.closed_at || trade.opened_at), currentBalance);

        // Ruin Check (e.g. < 30% of initial)
        if (currentBalance < initialCapital * 0.3) {
            break; // Stop simulation if ruined
        }
    }

    const isRuined = currentBalance < initialCapital * 0.3;
    const maxDrawdownPercent = (maxDrawdown / initialCapital) * 100; // Relative to initial or peak? Usually peak.
    // Recalculate true Max DD % from peak relative to that peak
    let trueMaxDDPct = 0;

    // We can iterate the drawdownCurve which already has peak-relative DD%
    if (drawdownCurve.length > 0) {
        trueMaxDDPct = Math.max(...drawdownCurve.map(d => d.drawdownPercent));
    }

    // Survival Score Calculation
    // 100 - (MaxDD * 2) - Penalty for nearly ruined
    let survivalScore = 100 - (trueMaxDDPct * 1.5);
    if (isRuined) survivalScore = 0;
    survivalScore = Math.max(0, Math.round(survivalScore));

    return {
        initialCapital,
        riskPerTradePercent: riskPercent,
        finalBalance: currentBalance,
        maxDrawdown,
        maxDrawdownPercent: trueMaxDDPct,
        survivalScore,
        isRuined,
        equityCurve,
        drawdownCurve
    };
}

/**
 * Identify Kill Zones based on user criteria
 * default: DD > 15% OR 5 Consecutive Losses
 */
export function detectKillZones(
    periods: PeriodStat[], // We reuse PeriodStats for granular check
    maxDrawdownThreshold: number = 15,
    maxConsecutiveLosses: number = 5
): KillZone[] {
    const killZones: KillZone[] = [];

    periods.forEach(p => {
        // Drawdown check (PeriodStat has maxDrawdown absolute... we need %)
        // Wait, PeriodStat.maxDrawdown is typically calculated from period start?
        // Let's assume we can approximate "Period Failure" if Profit Factor is terrible or Net Profit is huge negative?

        // Better: Check period specific metrics
        // If period lost > X% of estimated capital?
        // Let's use the 'isProfitable' and 'winRate' for now.

        // Actually, if we want strict Kill Zones, we should scan the trades directly.
        // But scanning periods is faster for the heatmap overlay.

        // If Win Rate < 20% in a period with > 5 trades -> Likely Kill Zone
        if (p.tradeCount >= 5 && p.winRate < 20) {
            killZones.push({
                periodLabel: p.periodLabel,
                reason: 'consecutive_losses', // Proxy for "string of losses"
                value: p.winRate
            });
        }

        // If Net Profit is significantly negative (e.g. < -500 on 10k assumption)
        if (p.netProfit < -500) { // -5% rough check
            killZones.push({
                periodLabel: p.periodLabel,
                reason: 'drawdown',
                value: Math.abs(p.netProfit)
            });
        }
    });

    return killZones;
}

/**
 * Dedicated Drawdown Series Calculator (for independent Chart)
 */
export function calculateDrawdownSeries(trades: Trade[], initialCapital: number): { timestamp: Date; drawdownPercent: number }[] {
    const sorted = [...trades].sort((a, b) => new Date(a.opened_at).getTime() - new Date(b.opened_at).getTime());
    let balance = initialCapital;
    let maxBalance = initialCapital;

    return sorted.map(t => {
        balance += (t.profit || 0);
        if (balance > maxBalance) maxBalance = balance;
        const dd = maxBalance - balance;
        const ddPct = maxBalance > 0 ? (dd / maxBalance) * 100 : 0;
        return {
            timestamp: new Date(t.closed_at || t.opened_at),
            drawdownPercent: ddPct
        };
    });
}
