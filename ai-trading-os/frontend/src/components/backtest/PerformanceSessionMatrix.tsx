'use client';

import { useMemo } from 'react';
import { Trade } from '@/types/backtestTypes';

interface PerformanceSessionMatrixProps {
    trades: Trade[];
    timezone?: string;
}

export function PerformanceSessionMatrix({ trades, timezone = 'UTC' }: PerformanceSessionMatrixProps) {
    // Mock Session Data Derivation
    // In real app, would group trades by hour and session
    const sessions = [
        { name: 'Asian Session', range: '00:00 - 08:00', winRate: 65, profit: 120, status: 'good' },
        { name: 'London Session', range: '08:00 - 16:00', winRate: 45, profit: -80, status: 'bad' },
        { name: 'NY Session', range: '16:00 - 24:00', winRate: 58, profit: 340, status: 'neutral' },
    ];

    const hourlyPerformance = useMemo(() => {
        // Mock 24h heatmap data
        return Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            score: Math.random() * 100 // 0-100 performance score
        }));
    }, []);

    const getHeatmapColor = (score: number) => {
        if (score >= 80) return 'bg-emerald-500';
        if (score >= 60) return 'bg-emerald-500/60';
        if (score >= 40) return 'bg-amber-500/60';
        return 'bg-rose-500/60';
    };

    return (
        <div className="industrial-panel space-y-6 border-l-4 border-l-blue-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-xl">🕰️</span>
                    <div>
                        <h3 className="text-base font-bold text-[var(--text-primary)] uppercase tracking-wide">
                            Performance Matrix
                        </h3>
                        <p className="text-[10px] text-[var(--text-muted)]">
                            Session & Timezone Analysis
                        </p>
                    </div>
                </div>
                <div className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-tertiary)] px-2 py-1 rounded">
                    Zone: {timezone}
                </div>
            </div>

            {/* Session Cards */}
            <div className="grid grid-cols-3 gap-3">
                {sessions.map(session => (
                    <div
                        key={session.name}
                        className={`p-3 rounded-lg border ${session.status === 'good' ? 'bg-emerald-500/5 border-emerald-500/20' :
                                session.status === 'bad' ? 'bg-rose-500/5 border-rose-500/20' :
                                    'bg-amber-500/5 border-amber-500/20'
                            }`}
                    >
                        <div className="text-[10px] text-[var(--text-muted)] font-medium mb-1">{session.name}</div>
                        <div className="text-xs text-[var(--text-secondary)] mb-2">{session.range}</div>
                        <div className="flex justify-between items-end">
                            <span className={`text-lg font-bold ${session.status === 'good' ? 'text-emerald-400' :
                                    session.status === 'bad' ? 'text-rose-400' :
                                        'text-amber-400'
                                }`}>
                                {session.winRate}%
                            </span>
                            <span className={`text-xs font-mono opacity-80 ${session.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {session.profit > 0 ? '+' : ''}{session.profit}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Hourly Heatmap */}
            <div className="space-y-2">
                <div className="flex justify-between text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                    <span>00:00</span>
                    <span>12:00</span>
                    <span>23:00</span>
                </div>
                <div className="flex gap-1 h-8">
                    {hourlyPerformance.map(h => (
                        <div
                            key={h.hour}
                            className={`flex-1 rounded-sm ${getHeatmapColor(h.score)} hover:opacity-100 opacity-80 transition-opacity cursor-help`}
                            title={`Hour ${h.hour}:00 - Score: ${Math.round(h.score)}`}
                        />
                    ))}
                </div>
                <div className="text-[10px] text-[var(--text-muted)] text-center italic">
                    * Interactive: Hover to see hourly "Golden Zones"
                </div>
            </div>
        </div>
    );
}
