import React, { useMemo } from 'react';
import { GlassCard } from '@/components/ui';
import { ControlRoomHeader } from '@/components/dashboard/ControlRoomHeader';
import { MetricGauge } from '@/components/dashboard/MetricGauge';
import { TrendChart } from '@/components/dashboard/TrendChart';
import { StrategySettings } from '@/components/bot-studio/StrategySettings';

interface DashboardOverviewProps {
    activeBotName?: string;
    botStatus?: 'running' | 'paused' | 'stopped' | 'draft';
    winRate?: number;
    netProfit?: number;
    totalTrades?: number;
    activeIndicators?: Array<{ id: string; type: string; source: string; }>;
    settings?: any; // New Prop
    onSettingsChange?: (newSettings: any) => void;
}

export function DashboardOverview({
    activeBotName = "Unknown Bot",
    botStatus = 'stopped',
    winRate = 0,
    netProfit = 0,
    totalTrades = 0,
    activeIndicators = [],
    settings,
    onSettingsChange
}: DashboardOverviewProps) {

    // --- View Mode State (Monitor vs Configure) ---
    const [viewMode, setViewMode] = React.useState<'monitor' | 'configure'>('monitor');

    // --- Metrics Calculation (Mock OEE Logic) ---
    const metrics = useMemo(() => {
        // Availability: Mocked based on status
        let availability = 0;
        if (botStatus === 'running') availability = 100;
        else if (botStatus === 'paused') availability = 85;

        // Quality: Direct Win Rate
        const quality = winRate;

        // Efficiency: Mocked 'Profit Factor / Speed' equivalent
        // In a real app, this would be computed from trade latency or slippage
        const efficiency = totalTrades > 0 ? 98 : 0;

        // OEE = Average of the three (Simplified)
        const oee = Math.round((availability + quality + efficiency) / 3);

        return { availability, quality, efficiency, oee };
    }, [botStatus, winRate, totalTrades]);

    return (
        <div className="h-full p-4 md:p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6">

            {/* Header Zone: Situtational Awareness */}
            <ControlRoomHeader
                title={`${activeBotName} - ${viewMode === 'monitor' ? 'OVERVIEW' : 'CONFIGURATION'}`}
                systemStatus={botStatus === 'running' ? 'online' : (botStatus === 'paused' ? 'maintenance' : 'offline')}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
            />

            {/* MODE: MONITOR (Original Overview) */}
            {viewMode === 'monitor' && (
                <div className="flex flex-col gap-6 animate-in fade-in duration-300">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[300px]">

                        {/* Left: Strategy Health (KPIs) */}
                        <div className="lg:col-span-8">
                            <GlassCard className="h-full p-6 bg-slate-900/50">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest border-l-4 border-emerald-500 pl-3">
                                        Strategy Health (OEE)
                                    </h2>
                                    <span className="text-xs text-slate-500 font-mono">LIVE MONITORING</span>
                                </div>

                                <div className="flex flex-wrap items-center justify-around gap-8">
                                    {/* Primary OEE Gauge */}
                                    <div className="scale-110">
                                        <MetricGauge
                                            label="Overall Health"
                                            value={metrics.oee}
                                            size="lg"
                                            subtext="Combined Score"
                                        />
                                    </div>

                                    {/* Breakdown */}
                                    <div className="flex gap-6 md:gap-12">
                                        <MetricGauge
                                            label="Availability"
                                            value={metrics.availability}
                                            size="sm"
                                            thresholds={settings ? { warn: settings.availabilityWarn, danger: settings.availabilityDanger } : undefined}
                                            color="#38bdf8" // Sky Blue
                                            subtext="Uptime"
                                        />
                                        <MetricGauge
                                            label="Quality"
                                            value={metrics.quality}
                                            size="sm"
                                            thresholds={settings ? { warn: settings.qualityWarn, danger: settings.qualityDanger } : undefined}
                                            color="#a78bfa" // Violet
                                            subtext="Win Rate"
                                        />
                                        <MetricGauge
                                            label="Efficiency"
                                            value={metrics.efficiency}
                                            size="sm"
                                            thresholds={settings ? { warn: settings.efficiencyWarn, danger: settings.efficiencyDanger } : undefined}
                                            color="#f472b6" // Pink
                                            subtext="Process"
                                        />
                                    </div>
                                </div>

                                {/* KPI Summary Footer */}
                                <div className="mt-8 pt-6 border-t border-slate-700/50 grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <div className="text-[10px] text-slate-500 uppercase">Target</div>
                                        <div className="text-emerald-400 font-mono text-lg">XAUUSD</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-slate-500 uppercase">Latency</div>
                                        <div className="text-white font-mono text-lg">12ms</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-slate-500 uppercase">Uptime</div>
                                        <div className="text-white font-mono text-lg">99.9%</div>
                                    </div>
                                </div>
                            </GlassCard>
                        </div>

                        {/* Right: Rolling Trend */}
                        <div className="lg:col-span-4">
                            <GlassCard className="h-full p-6 bg-slate-900/50">
                                <TrendChart title="Performance Trend (12 Mo)" />
                            </GlassCard>
                        </div>
                    </div>

                    {/* Bottom Row: Process Data & Financials */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                        {/* Financial Data (Left) */}
                        <div className="lg:col-span-4">
                            {/* Check if we should show financials based on settings */}
                            {(!settings || settings.showFinancials) && (
                                <GlassCard className="p-6 h-full flex flex-col justify-center">
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6 border-l-4 border-amber-500 pl-3">
                                        Financial Output
                                    </h3>
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-end border-b border-slate-700/50 pb-2">
                                            <span className="text-slate-400 text-sm">Net Profit</span>
                                            <span className={`font-mono text-3xl font-bold ${netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                ${netProfit.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-end border-b border-slate-700/50 pb-2">
                                            <span className="text-slate-400 text-sm">Total Trades</span>
                                            <span className="font-mono text-xl text-white">{totalTrades}</span>
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <span className="text-slate-400 text-sm">Profit Factor</span>
                                            <span className="font-mono text-xl text-cyan-400">{(activeIndicators.length > 0 ? 1.5 + (winRate / 100) : 0).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </GlassCard>
                            )}
                            {/* Placeholder if financials hidden */}
                            {settings && !settings.showFinancials && (
                                <GlassCard className="p-6 h-full flex items-center justify-center opacity-50">
                                    <div className="text-center">
                                        <span className="text-2xl mb-2 block">🔒</span>
                                        <span className="text-xs text-slate-500 uppercase tracking-widest">Financial Data Hidden</span>
                                    </div>
                                </GlassCard>
                            )}
                        </div>

                        {/* Active Logic (Right - Control Room Panel) */}
                        <div className="lg:col-span-8">
                            <GlassCard className="h-full p-6 bg-[#0f172a]/80">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-l-4 border-blue-500 pl-3">
                                        Active Logic Modules
                                    </h3>
                                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase border border-blue-500/20">
                                        {activeIndicators.length} Modules Online
                                    </span>
                                </div>

                                {activeIndicators.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {activeIndicators.map((ind, idx) => (
                                            <div key={idx} className="p-3 bg-slate-800/50 border border-slate-700 hover:border-blue-500/50 transition-colors group">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                                                    <span className="text-xs font-bold text-slate-300 group-hover:text-blue-400 transition-colors uppercase">
                                                        {ind.type}
                                                    </span>
                                                </div>
                                                <div className="text-[10px] text-slate-500 font-mono truncate">
                                                    Source: {ind.source}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="h-32 flex flex-col items-center justify-center text-slate-600 border border-dashed border-slate-700 bg-slate-800/20">
                                        <span className="text-2xl mb-2 opacity-50">🛑</span>
                                        <span className="text-xs uppercase tracking-widest">System Idle</span>
                                    </div>
                                )}
                            </GlassCard>
                        </div>
                    </div>
                </div>
            )}

            {/* MODE: CONFIGURE (Settings) */}
            {viewMode === 'configure' && (
                <div className="flex-1 animate-in slide-in-from-right-4 duration-300">
                    <StrategySettings
                        initialSettings={settings}
                        onSave={(newSettings) => {
                            if (onSettingsChange) onSettingsChange(newSettings);
                            alert("Configuration Saved");
                        }}
                    />
                </div>
            )}
        </div>
    );
}
