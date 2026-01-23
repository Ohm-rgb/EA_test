import { useMemo } from 'react';
import { PeriodStat, calculateStabilityScore } from '@/utils/reliabilityMetrics';

interface ReliabilityPanelProps {
    periods: PeriodStat[];
    isLoading?: boolean;
}

export function ReliabilityPanel({ periods, isLoading = false }: ReliabilityPanelProps) {
    const stability = useMemo(() => calculateStabilityScore(periods), [periods]);

    if (isLoading) {
        return (
            <div className="industrial-panel h-48 flex items-center justify-center animate-pulse">
                <span className="text-[var(--text-muted)]">Analyzing Reliability...</span>
            </div>
        );
    }

    if (periods.length === 0) return null;

    // Heatmap config
    // We visualize Win Rate as the primary color driver for now
    const getCellColor = (stat: PeriodStat) => {
        if (stat.tradeCount === 0) return 'bg-[var(--bg-tertiary)] opacity-30';

        // Green scale for Win Rate > 50, Red for < 50
        // Or robust green only for > 55
        if (stat.winRate >= 60) return 'bg-emerald-500/80 hover:bg-emerald-400';
        if (stat.winRate >= 50) return 'bg-emerald-500/40 hover:bg-emerald-500/60';
        if (stat.winRate >= 40) return 'bg-amber-500/60 hover:bg-amber-400';
        return 'bg-rose-500/80 hover:bg-rose-400';
    };

    return (
        <div className="industrial-panel space-y-4">
            {/* Header with Badge */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-lg">🛡️</span>
                    <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide">
                        Reliability Analysis
                    </h3>
                </div>

                {/* Stability Badge */}
                <div className="flex items-center gap-3 bg-[var(--bg-tertiary)] px-3 py-1.5 rounded border border-[var(--glass-border)]">
                    <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium">
                        Stability Assessment
                    </div>
                    <div className="h-4 w-[1px] bg-[var(--glass-border)] mx-1"></div>
                    <div className={`flex items-center gap-1.5 font-bold ${getStabilityColor(stability.score)}`}>
                        <span className="text-lg">{stability.score}</span>
                        <span className="text-xs opacity-80">/100</span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--bg-primary)] border border-current opacity-90 ml-1">
                            {stability.label}
                        </span>
                    </div>
                </div>
            </div>

            {/* Metrics Grid / Heatmap */}
            <div className="space-y-2">
                <div className="flex justify-between items-end px-1">
                    <span className="text-[10px] text-[var(--text-muted)]">Performance Heatmap (Weekly)</span>
                    <div className="flex gap-2 text-[10px] text-[var(--text-muted)]">
                        <span className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-500/80 rounded-sm"></div> Strong</span>
                        <span className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-500/40 rounded-sm"></div> Stable</span>
                        <span className="flex items-center gap-1"><div className="w-2 h-2 bg-amber-500/60 rounded-sm"></div> Weak</span>
                        <span className="flex items-center gap-1"><div className="w-2 h-2 bg-rose-500/80 rounded-sm"></div> Critical</span>
                    </div>
                </div>

                <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 gap-1 max-h-[160px] overflow-y-auto custom-scrollbar p-1">
                    {periods.map((p, idx) => (
                        <div
                            key={idx}
                            className={`
                                aspect-square rounded-sm border border-transparent 
                                flex flex-col items-center justify-center cursor-help group relative
                                transition-all duration-200 hover:scale-110 hover:border-[var(--glass-border)] hover:z-10
                                ${getCellColor(p)}
                            `}
                        >
                            {/* Value display (Win Rate) */}
                            <span className="text-[10px] font-bold text-white shadow-sm drop-shadow-md">
                                {p.winRate >= 100 ? '100' : p.winRate.toFixed(0)}
                            </span>

                            {/* Tiny Trade Count Indicator */}
                            {p.tradeCount > 0 && (
                                <div className="absolute bottom-0.5 right-0.5 w-1 h-1 rounded-full bg-white/60"></div>
                            )}

                            {/* Tooltip */}
                            <div className="absolute bottom-full mb-2 hidden group-hover:block z-50 min-w-[140px] pointer-events-none">
                                <div className="bg-[var(--bg-secondary)] border border-[var(--glass-border)] shadow-xl p-2 rounded text-xs space-y-1">
                                    <div className="font-bold text-[var(--text-primary)] border-b border-[var(--glass-border)] pb-1 mb-1">
                                        {p.periodLabel}
                                    </div>
                                    <div className="flex justify-between gap-4">
                                        <span className="text-[var(--text-muted)]">Trades:</span>
                                        <span className="font-mono">{p.tradeCount}</span>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                        <span className="text-[var(--text-muted)]">Win Rate:</span>
                                        <div className={p.winRate >= 50 ? 'text-emerald-400' : 'text-rose-400'}>
                                            {p.winRate}%
                                        </div>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                        <span className="text-[var(--text-muted)]">Net Profit:</span>
                                        <div className={p.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                            ${p.netProfit.toFixed(0)}
                                        </div>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                        <span className="text-[var(--text-muted)]">Drawdown:</span>
                                        <span className="text-amber-400">-${p.maxDrawdown.toFixed(0)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-between items-center text-[10px] text-[var(--text-muted)] px-1">
                <span>Oldest Period</span>
                <span>Newest Period</span>
            </div>
        </div>
    );
}

function getStabilityColor(score: number): string {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-emerald-200'; // Muted green
    if (score >= 40) return 'text-amber-400';
    return 'text-rose-400';
}
