'use client';

import { TradeDistribution } from '@/types/backtestTypes';

interface TradeDistributionChartProps {
    title: string;
    data: TradeDistribution[];
    colorScheme?: 'purple' | 'cyan';
    sourceLabel?: string;  // Shows which indicator(s) the data is from
}

/**
 * Horizontal bar chart for trade distribution
 * Filters by active indicators in Indicator Control
 */
export function TradeDistributionChart({
    title,
    data,
    colorScheme = 'purple',
    sourceLabel
}: TradeDistributionChartProps) {
    const maxCount = Math.max(...data.map(d => d.count), 1);

    const getBarColor = (winRate: number) => {
        if (colorScheme === 'cyan') {
            return winRate >= 60
                ? 'bg-cyan-400'
                : winRate >= 50
                    ? 'bg-cyan-500'
                    : 'bg-cyan-600';
        }
        return winRate >= 60
            ? 'bg-purple-400'
            : winRate >= 50
                ? 'bg-purple-500'
                : 'bg-purple-600';
    };

    return (
        <div className="industrial-panel-sm">
            {/* Header with Source Label */}
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
                    {title}
                </h4>
                {sourceLabel && (
                    <span className="text-[9px] text-[var(--color-accent)] bg-[var(--color-accent)]/10 px-2 py-0.5 rounded">
                        {sourceLabel}
                    </span>
                )}
            </div>

            {/* Bars */}
            <div className="space-y-2">
                {data.map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                        {/* Label */}
                        <span className="w-12 text-[10px] text-[var(--text-muted)] shrink-0">
                            {item.label}
                        </span>

                        {/* Bar */}
                        <div className="flex-1 h-4 bg-[var(--bg-tertiary)] rounded overflow-hidden">
                            <div
                                className={`h-full rounded transition-all duration-500 ${getBarColor(item.winRate)}`}
                                style={{ width: `${(item.count / maxCount) * 100}%` }}
                            />
                        </div>

                        {/* Count */}
                        <span className="w-8 text-right text-xs text-[var(--text-primary)]">
                            {item.count}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
