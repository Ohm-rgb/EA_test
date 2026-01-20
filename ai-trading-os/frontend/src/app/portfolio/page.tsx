'use client';

import { TopBar } from "@/components/layout";
import { GlassCard, Badge, ProgressBar } from "@/components/ui";
import { usePortfolio } from "@/hooks";
import { format } from "date-fns";

export default function Portfolio() {
    const {
        overview,
        equityCurve,
        botPerformance,
        recentTrades,
        loading,
        error
    } = usePortfolio();

    if (loading) {
        return (
            <div className="min-h-screen">
                <TopBar title="Portfolio & Health" />
                <div className="p-6 flex items-center justify-center h-[calc(100vh-64px)]">
                    <div className="text-emerald-400">Loading portfolio data...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen">
                <TopBar title="Portfolio & Health" />
                <div className="p-6 flex items-center justify-center h-[calc(100vh-64px)]">
                    <div className="text-red-400">Error: {error}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <TopBar title="Portfolio & Health" />

            <div className="p-6 fade-in">
                {/* Tabs */}
                <div className="flex items-center gap-4 mb-6">
                    <button className="px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 font-medium">
                        Overview
                    </button>
                    <button className="px-4 py-2 rounded-lg text-[var(--text-secondary)] hover:bg-white/5 transition-colors">
                        Bot Performance
                    </button>
                    <button className="px-4 py-2 rounded-lg text-[var(--text-secondary)] hover:bg-white/5 transition-colors">
                        System Health
                    </button>
                    <div className="flex-1" />
                    <Badge variant="warning">🔒 Read-only</Badge>
                </div>

                <div className="grid grid-cols-3 gap-6">
                    {/* Equity Curve */}
                    <div className="col-span-2">
                        <GlassCard className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">Equity Curve (30 Days)</h3>
                                <span className="text-2xl font-bold text-emerald-400">
                                    ${overview?.equity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>

                            {/* Chart Visualization */}
                            <div className="h-64 relative bg-gradient-to-b from-emerald-500/10 to-transparent rounded-xl overflow-hidden flex items-end">
                                {/* Simple SVG Chart based on equityCurve data */}
                                <svg className="w-full h-full" viewBox={`0 0 ${equityCurve.length * 10} 100`} preserveAspectRatio="none">
                                    <defs>
                                        <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                                            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                                        </linearGradient>
                                    </defs>

                                    {/* Generate path from data */}
                                    {(() => {
                                        if (equityCurve.length === 0) return null;

                                        const min = Math.min(...equityCurve.map(p => p.equity));
                                        const max = Math.max(...equityCurve.map(p => p.equity));
                                        const range = max - min || 1;

                                        const points = equityCurve.map((p, i) => {
                                            const x = i * 10;
                                            const y = 100 - ((p.equity - min) / range) * 80 - 10; // 10px padding
                                            return `${x},${y}`;
                                        }).join(" L ");

                                        const pathD = `M ${points}`;
                                        const areaD = `M ${points} V 100 H 0 Z`;

                                        return (
                                            <>
                                                <path
                                                    d={areaD}
                                                    fill="url(#lineGradient)"
                                                />
                                                <path
                                                    d={pathD}
                                                    fill="none"
                                                    stroke="#10b981"
                                                    strokeWidth="2"
                                                />
                                            </>
                                        );
                                    })()}
                                </svg>

                                {/* Labels */}
                                <div className="absolute left-2 top-2 text-xs text-[var(--text-secondary)]">Max</div>
                                <div className="absolute left-2 bottom-2 text-xs text-[var(--text-secondary)]">Min</div>
                            </div>
                        </GlassCard>
                    </div>

                    {/* Recent Trades */}
                    <GlassCard className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Recent Trades</h3>

                        <div className="space-y-3">
                            {recentTrades.length === 0 ? (
                                <div className="text-center text-[var(--text-muted)] py-4">No recent trades</div>
                            ) : (
                                recentTrades.map((trade, i) => (
                                    <div key={i} className="flex items-center justify-between py-2 border-b border-[var(--glass-border)] last:border-0">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${trade.trade_type?.toUpperCase() === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                                                }`}>
                                                {trade.trade_type?.toUpperCase() || 'N/A'}
                                            </div>
                                            <div>
                                                <div className="font-medium">{trade.symbol}</div>
                                                <div className="text-xs text-[var(--text-muted)]">
                                                    {new Date(trade.opened_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>
                                        <span className={(trade.profit || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                                            {(trade.profit || 0) >= 0 ? '+' : ''}{(trade.profit || 0).toFixed(2)}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </GlassCard>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-6 mt-6">
                    <GlassCard className="p-6">
                        <div className="text-sm text-[var(--text-secondary)] mb-1">Total P/L</div>
                        <div className={`text-3xl font-bold ${(overview?.total_pnl || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
                            }`}>
                            {(overview?.total_pnl || 0) >= 0 ? '+' : ''}
                            ${(overview?.total_pnl || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-emerald-400">↑</span>
                            <ProgressBar value={Math.min(100, Math.max(0, (overview?.daily_pnl_percent || 0) * 10))} />
                        </div>
                    </GlassCard>

                    <GlassCard className="p-6">
                        <div className="text-sm text-[var(--text-secondary)] mb-1">Daily P/L</div>
                        <div className={`text-3xl font-bold ${(overview?.daily_pnl || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
                            }`}>
                            {(overview?.daily_pnl || 0) >= 0 ? '+' : ''}
                            ${(overview?.daily_pnl || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <span className={(overview?.daily_pnl_percent || 0) >= 0 ? 'text-emerald-400' : 'text-amber-400'}>
                                {(overview?.daily_pnl_percent || 0)}%
                            </span>
                            <span className="text-xs text-[var(--text-muted)]">Today</span>
                        </div>
                    </GlassCard>

                    <GlassCard className="p-6">
                        <div className="text-sm text-[var(--text-secondary)] mb-1">Win Rate (Global)</div>
                        <div className="text-3xl font-bold">
                            {botPerformance.length > 0
                                ? Math.round(botPerformance.reduce((acc, bot) => acc + bot.win_rate, 0) / botPerformance.length)
                                : 0
                            }%
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-emerald-400">🏆</span>
                            <span className="text-xs text-[var(--text-muted)]">Across {botPerformance.length} bots</span>
                        </div>
                    </GlassCard>
                </div>

                {/* Bot Performance Table */}
                <GlassCard className="p-6 mt-6">
                    <h3 className="text-lg font-semibold mb-4">Bot Performance</h3>

                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-sm text-[var(--text-secondary)]">
                                <th className="pb-3">Bot</th>
                                <th className="pb-3">Trades</th>
                                <th className="pb-3">Win Rate</th>
                                <th className="pb-3">Profit</th>
                                <th className="pb-3">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {botPerformance.map((bot, i) => (
                                <tr key={i} className="border-t border-[var(--glass-border)]">
                                    <td className="py-3 font-medium">{bot.bot_name}</td>
                                    <td className="py-3">{bot.total_trades}</td>
                                    <td className="py-3">{bot.win_rate}%</td>
                                    <td className={`py-3 ${bot.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        ${bot.profit.toFixed(2)}
                                    </td>
                                    <td className="py-3">
                                        <Badge variant={bot.is_active ? 'success' : 'warning'}>
                                            {bot.is_active ? 'running' : 'stopped'}
                                        </Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </GlassCard>

                {/* Exposure / Usage (Modified from Error Timeline) */}
                <GlassCard className="p-4 mt-6">
                    <div className="flex items-center justify-between">
                        <h4 className="font-medium">Market Exposure</h4>
                        <span className="text-sm text-emerald-400">
                            {exposure.length} Active Positions
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                        {exposure.map((exp, i) => (
                            <Badge key={i} variant={exp.direction === 'long' ? 'success' : 'destructive'}>
                                {exp.symbol} {exp.lots}
                            </Badge>
                        ))}
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}
