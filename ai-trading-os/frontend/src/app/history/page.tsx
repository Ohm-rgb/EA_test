"use client";

import { MetricCard } from "@/components/analytics/MetricCard";
import { SessionHeatmap } from "@/components/analytics/SessionHeatmap";
import { PerformanceBarChart, AssetAllocationChart } from "@/components/analytics/AnalyticsCharts";
import { useState, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import { CHART_THEME } from "@/config/ChartTheme";

// --- Mock Data Generator ---
const generateData = (theme: 'light' | 'dark') => {
    const colors = CHART_THEME[theme];

    return {
        kpi: {
            profit: {
                value: "$12,450.00",
                trend: 12.5,
                data: Array.from({ length: 20 }, (_, i) => ({ value: 1000 + Math.random() * 500 + i * 100 })),
                color: colors.profit
            },
            holdingTime: {
                value: "4h 12m",
                trend: -5.2,
                trendLabel: "Faster than last week",
                data: Array.from({ length: 20 }, () => ({ value: 200 + Math.random() * 100 })),
                color: theme === 'light' ? '#7A88C9' : '#3b82f6' // Muted Blue vs Bright Blue
            },
            winRate: {
                value: "68.5%",
                trend: 2.1,
                data: Array.from({ length: 20 }, () => ({ value: 60 + Math.random() * 10 })),
                color: theme === 'light' ? '#AFAED6' : '#fbbf24' // Soft Purple vs Gold
            }
        },
        heatmap: Array.from({ length: 7 * 24 }, (_, i) => {
            const day = Math.floor(i / 24);
            const hour = i % 24;
            let baseValue = (hour > 8 && hour < 17) ? Math.random() * 100 : Math.random() * 20;
            if (day > 4) baseValue *= 0.1;
            return {
                day,
                hour,
                value: Math.floor(baseValue * (Math.random() > 0.3 ? 1 : -0.5))
            };
        }),
        assets: [
            { name: 'XAUUSD', value: 65, color: theme === 'light' ? '#AFAED6' : '#8b5cf6' },
            { name: 'EURUSD', value: 20, color: theme === 'light' ? '#F4A4A4' : '#3b82f6' },
            { name: 'BTCUSD', value: 15, color: theme === 'light' ? '#90E0EF' : '#10b981' },
        ],
        performance: [
            { name: 'Longs', value: 8500 },
            { name: 'Shorts', value: 3950 },
            { name: 'Scalp', value: 4200 },
            { name: 'Swing', value: -1200 },
        ]
    };
};

export default function HistoryPage() {
    const { theme } = useTheme();
    const [period, setPeriod] = useState<'W' | 'M' | 'Q'>('W');
    const [data, setData] = useState<ReturnType<typeof generateData> | null>(null);

    useEffect(() => {
        setData(generateData(theme));
    }, [theme]);

    if (!data) return null;

    // Dynamic semantic classes
    // Note: Instead of passing CSS overrides, we rely on globals.css variables mapping.
    // e.g. bg-[var(--bg-secondary)] handles 'bg-[#F9F9FC]' in light and 'bg-[#1a1a1a]' in dark.

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] p-8 text-[var(--text-primary)] relative overflow-hidden font-sans transition-colors duration-500">
            {/* Ambient Background */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
                <div className={`absolute top-[-20%] right-[-20%] w-[800px] h-[800px] rounded-full blur-[150px] transition-colors duration-700 ${theme === 'light' ? 'bg-[#C7C5E5]/20' : 'bg-violet-600/10'
                    }`} />
                <div className={`absolute bottom-[0%] left-[-10%] w-[600px] h-[600px] rounded-full blur-[120px] transition-colors duration-700 ${theme === 'light' ? 'bg-[#B8B6D9]/20' : 'bg-fuchsia-600/10'
                    }`} />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto space-y-8">

                {/* Header - Structural Container */}
                <div className="bg-[var(--bg-structure)] backdrop-blur-sm rounded-2xl p-6 border border-[var(--glass-border)] shadow-sm flex justify-between items-end transition-colors duration-300">
                    <div>
                        <h1 className="text-3xl font-bold text-[var(--text-primary)]">
                            Analytics Dashboard
                        </h1>
                        <p className="text-[var(--text-secondary)] mt-1">Performance insights & trading behavior analysis</p>
                    </div>

                    <div className="flex bg-[var(--bg-tertiary)] rounded-lg p-1 border border-[var(--glass-border)] shadow-sm">
                        {(['W', 'M', 'Q'] as const).map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-300 ${period === p
                                    ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)] shadow-md border border-[var(--glass-border)]'
                                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)]'
                                    }`}
                            >
                                {p === 'W' ? 'Week' : p === 'M' ? 'Month' : 'Quarter'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <MetricCard
                        label="Net Profit"
                        value={data.kpi.profit.value}
                        trend={data.kpi.profit.trend}
                        data={data.kpi.profit.data}
                        color={data.kpi.profit.color}
                        // Use semantic container class
                        className="bg-[var(--bg-secondary)] border border-[var(--glass-border)] rounded-2xl p-5 shadow-sm transition-all duration-300 backdrop-blur-md"
                        valueColor="text-[var(--text-primary)]"
                        labelColor="text-[var(--text-secondary)]"
                    />
                    <MetricCard
                        label="Avg Holding Time"
                        value={data.kpi.holdingTime.value}
                        trend={data.kpi.holdingTime.trend}
                        trendLabel={data.kpi.holdingTime.trendLabel}
                        data={data.kpi.holdingTime.data}
                        color={data.kpi.holdingTime.color}
                        className="bg-[var(--bg-secondary)] border border-[var(--glass-border)] rounded-2xl p-5 shadow-sm transition-all duration-300 backdrop-blur-md"
                        valueColor="text-[var(--text-primary)]"
                        labelColor="text-[var(--text-secondary)]"
                    />
                    <MetricCard
                        label="Win Rate"
                        value={data.kpi.winRate.value}
                        trend={data.kpi.winRate.trend}
                        data={data.kpi.winRate.data}
                        color={data.kpi.winRate.color}
                        className="bg-[var(--bg-secondary)] border border-[var(--glass-border)] rounded-2xl p-5 shadow-sm transition-all duration-300 backdrop-blur-md"
                        valueColor="text-[var(--text-primary)]"
                        labelColor="text-[var(--text-secondary)]"
                    />
                </div>

                {/* Middle Section: Heatmap & Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Heatmap takes 2/3 width */}
                    <div className="lg:col-span-2">
                        <SessionHeatmap
                            data={data.heatmap}
                            theme={theme}
                        />
                    </div>

                    {/* Performance Bar Chart takes 1/3 width */}
                    <div className="lg:col-span-1">
                        <PerformanceBarChart
                            title="Performance Logic"
                            data={data.performance}
                            theme={theme}
                        />
                    </div>
                </div>

                {/* Bottom Section: Asset Allocation */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <AssetAllocationChart data={data.assets} theme={theme} />
                    <div className="bg-[var(--bg-secondary)] border border-[var(--glass-border)] rounded-2xl p-6 shadow-sm flex items-center justify-center text-[var(--text-muted)] italic">
                        <p>Additional Metric / Goal tracking placeholder</p>
                    </div>
                </div>

            </div>
        </div>
    );
}
