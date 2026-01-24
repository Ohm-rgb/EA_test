import { Trade, BacktestResult, TradeDistribution, EquityPoint } from '@/types/backtestTypes';

/**
 * Calculate backtest metrics from a list of trades
 */
export function calculateBacktestMetrics(
    trades: Trade[],
    botId: string,
    botName: string,
    snapshotHash: string,
    initialBalance: number = 10000
): BacktestResult {
    // Sort trades by open time
    const sortedTrades = [...trades].sort((a, b) =>
        new Date(a.opened_at).getTime() - new Date(b.opened_at).getTime()
    );

    let currentEquity = initialBalance;
    const equityCurve: EquityPoint[] = [];
    let maxEquity = initialBalance;
    let maxDrawdownValue = 0;
    let maxDrawdownPercent = 0;

    let totalProfit = 0;
    let winningTrades = 0;
    let grossProfit = 0;
    let grossLoss = 0;

    // Initial point
    equityCurve.push({
        timestamp: sortedTrades.length > 0 ? new Date(sortedTrades[0].opened_at) : new Date(),
        equity: initialBalance,
        drawdown: 0
    });

    sortedTrades.forEach(trade => {
        const profit = trade.profit || 0;
        currentEquity += profit;
        totalProfit += profit;

        if (profit > 0) {
            winningTrades++;
            grossProfit += profit;
        } else {
            grossLoss += Math.abs(profit);
        }

        // Drawdown Calc
        if (currentEquity > maxEquity) {
            maxEquity = currentEquity;
        }

        if (maxEquity > 0) {
            const drawdownValue = maxEquity - currentEquity;
            maxDrawdownPercent = Math.max(maxDrawdownPercent, (drawdownValue / maxEquity) * 100);
            maxDrawdownValue = Math.max(maxDrawdownValue, drawdownValue);
        }

        equityCurve.push({
            timestamp: new Date(trade.closed_at || trade.opened_at),
            equity: Number(currentEquity.toFixed(2)),
            drawdown: Number(maxDrawdownPercent.toFixed(2))
        });
    });

    const totalTrades = sortedTrades.length;
    const losingTrades = totalTrades - winningTrades;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0; // 999 as infinite
    const netProfit = currentEquity - initialBalance;

    // Simplified Sharpe (assuming 0 risk free rate, daily returns approximated by trade returns)
    // This is not scientifically accurate but enough for visual approximation
    const returns = sortedTrades.map(t => (t.profit || 0));
    const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
    const stdDev = returns.length > 0 ? Math.sqrt(returns.map(x => Math.pow(x - avgReturn, 2)).reduce((a, b) => a + b, 0) / returns.length) : 0;
    const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0; // Annualized assuming daily trades? Rough approx.

    // Distributions
    const dayDistribution = calculateDayDistribution(sortedTrades);
    const hourDistribution = calculateHourDistribution(sortedTrades);

    const startTime = sortedTrades.length > 0 ? new Date(sortedTrades[0].opened_at) : new Date();
    const endTime = sortedTrades.length > 0 ? new Date(sortedTrades[sortedTrades.length - 1].opened_at) : new Date();

    return {
        id: `real_${botId}_${Date.now()}`,
        botId,
        botName,
        strategySnapshotHash: snapshotHash,
        testedAt: new Date(),
        testPeriod: { start: startTime, end: endTime },
        totalTrades,
        winningTrades,
        losingTrades,
        winRate: Number(winRate.toFixed(1)),
        netProfit: Number(netProfit.toFixed(2)),
        grossProfit: Number(grossProfit.toFixed(2)),
        grossLoss: Number(grossLoss.toFixed(2)),
        profitFactor: Number(profitFactor.toFixed(2)),
        maxDrawdown: Number(maxDrawdownPercent.toFixed(1)),
        maxDrawdownValue: Number(maxDrawdownValue.toFixed(2)),
        sharpeRatio: Number(sharpeRatio.toFixed(2)),
        sortinoRatio: 0, // Not implemented yet
        equityCurve,
        dayOfWeekDistribution: dayDistribution,
        hourOfDayDistribution: hourDistribution
    };
}

function calculateDayDistribution(trades: Trade[]): TradeDistribution[] {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const buckets: Record<string, { total: number, wins: number }> = {};

    days.forEach(d => buckets[d] = { total: 0, wins: 0 });

    trades.forEach(t => {
        const date = new Date(t.opened_at);
        const dayName = days[date.getDay()];
        if (buckets[dayName]) {
            buckets[dayName].total++;
            if ((t.profit || 0) > 0) buckets[dayName].wins++;
        }
    });

    // Filter out weekends if 0 trades (Industrial standard: trading days)
    const validDays = days.filter(d => d !== 'Sun' && d !== 'Sat'); // Forex usually Mon-Fri

    return validDays.map(day => {
        const data = buckets[day];
        return {
            label: day,
            count: data.total,
            winRate: data.total > 0 ? Number(((data.wins / data.total) * 100).toFixed(1)) : 0,
            sourceIndicatorId: undefined // Aggregate
        };
    });
}

function calculateHourDistribution(trades: Trade[]): TradeDistribution[] {
    // 4-hour blocks: 00-04, 04-08, ...
    const blocks = ['00-04', '04-08', '08-12', '12-16', '16-20', '20-24'];
    const buckets: Record<string, { total: number, wins: number }> = {};
    blocks.forEach(b => buckets[b] = { total: 0, wins: 0 });

    trades.forEach(t => {
        const date = new Date(t.opened_at);
        const hour = date.getHours();
        const blockIndex = Math.floor(hour / 4);
        const blockLabel = blocks[blockIndex];

        if (buckets[blockLabel]) {
            buckets[blockLabel].total++;
            if ((t.profit || 0) > 0) buckets[blockLabel].wins++;
        }
    });

    return blocks.map(block => {
        const data = buckets[block];
        return {
            label: block,
            count: data.total,
            winRate: data.total > 0 ? Number(((data.wins / data.total) * 100).toFixed(1)) : 0,
            sourceIndicatorId: undefined
        };
    });
}
