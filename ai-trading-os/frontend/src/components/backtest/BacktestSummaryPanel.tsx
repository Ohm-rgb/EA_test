'use client';

import { BacktestResult } from '@/types/backtestTypes';

interface BacktestSummaryPanelProps {
    result: BacktestResult;
}

/**
 * Dense KPI metrics table - Industrial style
 * Inspired by reference dashboard "Top 5 types" section
 */
export function BacktestSummaryPanel({ result }: BacktestSummaryPanelProps) {
    const metrics = [
        {
            label: 'Total Trades',
            value: result.totalTrades,
            format: 'number',
            status: result.totalTrades >= 100 ? 'good' : result.totalTrades >= 50 ? 'neutral' : 'warning'
        },
        {
            label: 'Win Rate',
            value: result.winRate,
            format: 'percent',
            status: result.winRate >= 60 ? 'good' : result.winRate >= 50 ? 'neutral' : 'bad'
        },
        {
            label: 'Profit Factor',
            value: result.profitFactor,
            format: 'decimal',
            status: result.profitFactor >= 2 ? 'good' : result.profitFactor >= 1.5 ? 'neutral' : 'bad'
        },
        {
            label: 'Max Drawdown',
            value: result.maxDrawdown,
            format: 'percent',
            status: result.maxDrawdown <= 10 ? 'good' : result.maxDrawdown <= 20 ? 'warning' : 'bad'
        },
        {
            label: 'Sharpe Ratio',
            value: result.sharpeRatio,
            format: 'decimal',
            status: result.sharpeRatio >= 2 ? 'good' : result.sharpeRatio >= 1 ? 'neutral' : 'bad'
        },
        {
            label: 'Net Profit',
            value: result.netProfit,
            format: 'currency',
            status: result.netProfit > 0 ? 'good' : 'bad'
        }
    ];

    const formatValue = (value: number, format: string) => {
        switch (format) {
            case 'percent':
                return `${value.toFixed(1)}%`;
            case 'decimal':
                return value.toFixed(2);
            case 'currency':
                return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
            default:
                return value.toString();
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'good':
                return 'var(--color-success)';
            case 'warning':
                return 'var(--color-warning)';
            case 'bad':
                return 'var(--color-critical)';
            default:
                return 'var(--text-secondary)';
        }
    };

    return (
        <div className="industrial-panel">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <span className="text-lg">📊</span>
                    <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide">
                        Backtest Summary
                    </h3>
                </div>
                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                    <span>Bot: {result.botName}</span>
                    <span className="opacity-50">|</span>
                    <span>Tested: {result.testedAt.toLocaleDateString()}</span>
                </div>
            </div>

            {/* Dense Metrics Table */}
            <div className="grid grid-cols-6 gap-1">
                {/* Header Row */}
                {metrics.map((metric) => (
                    <div
                        key={metric.label}
                        className="px-3 py-2 bg-[var(--bg-tertiary)] border-b border-[var(--glass-border)] text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider"
                    >
                        {metric.label}
                    </div>
                ))}

                {/* Value Row */}
                {metrics.map((metric) => (
                    <div
                        key={`${metric.label}-value`}
                        className="px-3 py-3 bg-[var(--bg-secondary)] flex items-center gap-2"
                    >
                        {/* Status Dot */}
                        <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: getStatusColor(metric.status) }}
                        />
                        {/* Value */}
                        <span
                            className="text-sm font-bold"
                            style={{ color: getStatusColor(metric.status) }}
                        >
                            {formatValue(metric.value, metric.format)}
                        </span>
                    </div>
                ))}
            </div>

            {/* Progress Bar - Overall Performance */}
            <div className="mt-4">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                        Performance Score
                    </span>
                    <span className="text-sm font-bold text-[var(--color-success)]">
                        {Math.round((result.winRate * 0.4 + result.profitFactor * 20 + (100 - result.maxDrawdown) * 0.4))}%
                    </span>
                </div>
                <div className="h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                            width: `${Math.min(100, result.winRate * 0.4 + result.profitFactor * 20 + (100 - result.maxDrawdown) * 0.4)}%`,
                            background: 'linear-gradient(90deg, var(--color-success), var(--color-accent))'
                        }}
                    />
                </div>
            </div>

            {/* Snapshot Hash Warning */}
            <div className="mt-3 flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
                <span>🔒</span>
                <span className="opacity-70">
                    Result bound to snapshot: {result.strategySnapshotHash.substring(0, 16)}...
                </span>
            </div>
        </div>
    );
}
