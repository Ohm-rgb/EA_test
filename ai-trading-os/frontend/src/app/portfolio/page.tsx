'use client';

import { TopBar } from "@/components/layout";
import { GlassCard, Badge, ProgressBar } from "@/components/ui";

const recentTrades = [
    { symbol: 'AAPL', type: 'BUY', profit: 150.20, time: '10:45 AM' },
    { symbol: 'TSLA', type: 'SELL', profit: 85.50, time: '10:45 AM' },
    { symbol: 'BTC', type: 'BUY', profit: 320.10, time: '09:30 AM' },
    { symbol: 'EUR/USD', type: 'SELL', profit: -45.00, time: '09:30 AM' },
    { symbol: 'GOOG', type: 'BUY', profit: 210.30, time: '08:15 AM' },
];

const botPerformance = [
    { name: 'AlphaBot', trades: 45, winRate: 72, profit: 1250.50, status: 'running' },
    { name: 'DeltaGrid', trades: 28, winRate: 65, profit: 450.20, status: 'paused' },
    { name: 'ScalpMaster', trades: 120, winRate: 80, profit: 890.00, status: 'running' },
];

export default function Portfolio() {
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
                                <h3 className="text-lg font-semibold">Equity Curve (YTD)</h3>
                                <span className="text-2xl font-bold text-emerald-400">$145,230.00</span>
                            </div>

                            {/* Placeholder Chart */}
                            <div className="h-64 relative bg-gradient-to-b from-emerald-500/10 to-transparent rounded-xl overflow-hidden">
                                <svg className="w-full h-full" viewBox="0 0 400 150">
                                    <defs>
                                        <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                                            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                                        </linearGradient>
                                    </defs>
                                    <path
                                        d="M 0 120 Q 50 100 100 90 T 200 70 T 300 50 T 400 30"
                                        fill="none"
                                        stroke="#10b981"
                                        strokeWidth="2"
                                    />
                                    <path
                                        d="M 0 120 Q 50 100 100 90 T 200 70 T 300 50 T 400 30 V 150 H 0 Z"
                                        fill="url(#lineGradient)"
                                    />
                                </svg>

                                {/* Y-axis labels */}
                                <div className="absolute left-2 top-2 text-xs text-[var(--text-secondary)]">$150k</div>
                                <div className="absolute left-2 bottom-2 text-xs text-[var(--text-secondary)]">$100k</div>
                            </div>
                        </GlassCard>
                    </div>

                    {/* Recent Trades */}
                    <GlassCard className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Recent Trades</h3>

                        <div className="space-y-3">
                            {recentTrades.map((trade, i) => (
                                <div key={i} className="flex items-center justify-between py-2 border-b border-[var(--glass-border)] last:border-0">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${trade.type === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                                            }`}>
                                            {trade.type}
                                        </div>
                                        <div>
                                            <div className="font-medium">{trade.symbol}</div>
                                            <div className="text-xs text-[var(--text-muted)]">{trade.time}</div>
                                        </div>
                                    </div>
                                    <span className={trade.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                                        {trade.profit >= 0 ? '+' : ''}{trade.profit.toFixed(2)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-6 mt-6">
                    <GlassCard className="p-6">
                        <div className="text-sm text-[var(--text-secondary)] mb-1">Total P/L</div>
                        <div className="text-3xl font-bold text-emerald-400">+$1,245.50</div>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-emerald-400">↑</span>
                            <ProgressBar value={75} />
                        </div>
                    </GlassCard>

                    <GlassCard className="p-6">
                        <div className="text-sm text-[var(--text-secondary)] mb-1">Drawdown</div>
                        <div className="text-3xl font-bold text-amber-400">-4.2%</div>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-amber-400">⚠</span>
                            <span className="text-xs text-[var(--text-muted)]">Max allowed: 10%</span>
                        </div>
                    </GlassCard>

                    <GlassCard className="p-6">
                        <div className="text-sm text-[var(--text-secondary)] mb-1">Win Rate</div>
                        <div className="text-3xl font-bold">68%</div>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-emerald-400">🏆</span>
                            <span className="text-xs text-[var(--text-muted)]">Above target (60%)</span>
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
                                    <td className="py-3 font-medium">{bot.name}</td>
                                    <td className="py-3">{bot.trades}</td>
                                    <td className="py-3">{bot.winRate}%</td>
                                    <td className={`py-3 ${bot.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        ${bot.profit.toFixed(2)}
                                    </td>
                                    <td className="py-3">
                                        <Badge variant={bot.status === 'running' ? 'success' : 'warning'}>
                                            {bot.status}
                                        </Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </GlassCard>

                {/* Error Timeline */}
                <GlassCard className="p-4 mt-6">
                    <div className="flex items-center justify-between">
                        <h4 className="font-medium">Error Timeline</h4>
                        <span className="text-sm text-amber-400">Status: Stable with warnings</span>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                        <div className="flex-1 h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden relative">
                            <div className="absolute left-[30%] w-2 h-2 rounded-full bg-amber-400" title="Warning" />
                            <div className="absolute left-[75%] w-2 h-2 rounded-full bg-emerald-400" title="Info" />
                        </div>
                    </div>
                    <div className="flex justify-between text-xs text-[var(--text-muted)] mt-1">
                        <span>10:00</span>
                        <span>11:00</span>
                        <span>12:00</span>
                        <span>13:00</span>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}
