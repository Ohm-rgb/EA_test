import React from 'react';
import { useBotStore } from '@/stores/botStore';
import { Network, Activity, Shield, Zap, TrendingUp, GitMerge } from 'lucide-react';
import { GlassCard } from "@/components/ui";

export function VisualLogicCanvas() {
    const { indicatorPool, ruleSets, contextConfig, riskConfig } = useBotStore();

    return (
        <div className="w-full h-full p-6 flex flex-col gap-6 overflow-hidden relative">
            {/* Background Decor */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900/50 via-slate-900 to-slate-950 -z-10" />
            <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] mask-gradient" />

            {/* Header Status */}
            <div className="flex items-center justify-between text-slate-400">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                        <Network className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-200">Logic Flow Visualization</h2>
                        <p className="text-xs opacity-70 flex items-center gap-2">
                            {contextConfig.symbol || 'NO SYMBOL'}
                            <span className="w-1 h-1 bg-slate-600 rounded-full" />
                            {contextConfig.timeframe || '--'}
                        </p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] uppercase tracking-wider font-bold">Risk Model</span>
                        <span className="text-sm font-mono text-emerald-400">{riskConfig.riskPerTrade}% / {riskConfig.stopLoss}p</span>
                    </div>
                </div>
            </div>

            {/* Main Canvas Area */}
            <div className="flex-1 min-h-0 flex items-center justify-center relative">

                {/* Center Logic Hub */}
                <div className="relative group">
                    <div className="absolute -inset-4 bg-blue-600/20 rounded-full blur-xl group-hover:bg-blue-600/30 transition-all opacity-50" />
                    <div className="w-32 h-32 rounded-full border-4 border-slate-700 bg-slate-900 flex items-center justify-center relative z-10 shadow-2xl">
                        <div className="text-center">
                            <Zap className="w-8 h-8 text-yellow-400 mx-auto mb-1" />
                            <div className="text-xs font-bold text-slate-300">EXECUTION</div>
                            <div className="text-[10px] text-slate-500">ENGINE</div>
                        </div>
                    </div>

                    {/* Connecting Lines (CSS-only for now, can use SVG later) */}

                </div>

                {/* Left: Indicator Nodes */}
                <div className="absolute left-10 top-1/2 -translate-y-1/2 flex flex-col gap-4">
                    {indicatorPool.length === 0 && (
                        <div className="text-slate-600 text-sm font-mono border border-dashed border-slate-700 p-4 rounded bg-slate-800/20">
                            No Inputs (Indicators)
                        </div>
                    )}
                    {indicatorPool.map((ind, i) => (
                        <GlassCard key={ind.id} className="p-3 w-48 border-l-4 border-l-blue-500 flex items-center gap-3 bg-slate-800/80 hover:scale-105 transition-transform cursor-default">
                            <Activity className="w-4 h-4 text-slate-400" />
                            <div>
                                <div className="text-xs font-bold text-white">{ind.name}</div>
                                <div className="text-[10px] text-slate-500 font-mono">ID: {ind.indicatorId}</div>
                            </div>
                            {/* Connector Dot */}
                            <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-3 h-3 bg-slate-600 rounded-full border-2 border-slate-900" />
                        </GlassCard>
                    ))}
                </div>

                {/* Right: Logic Rules */}
                <div className="absolute right-10 top-1/2 -translate-y-1/2 flex flex-col gap-8 w-64">
                    {/* Buy Rules */}
                    <div className="relative">
                        <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-4 h-0.5 bg-emerald-900/50" />
                        <GlassCard className="p-4 border-emerald-500/30 bg-emerald-900/10">
                            <h4 className="text-xs font-bold text-emerald-400 uppercase mb-2 flex items-center gap-2">
                                <TrendingUp className="w-3 h-3" /> Buy Logic
                            </h4>
                            <div className="space-y-2">
                                {ruleSets.buy.length === 0 ? (
                                    <div className="text-[10px] text-slate-500 italic">No rules defined</div>
                                ) : (
                                    ruleSets.buy.map(r => (
                                        <div key={r.id} className="text-[10px] bg-slate-900/50 p-1.5 rounded border border-emerald-900/30 font-mono text-slate-300">
                                            {/* Simplified Visualization */}
                                            <span className="text-blue-300">Op_L</span> {r.operator} <span className="text-amber-300">Op_R</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </GlassCard>
                    </div>

                    {/* Sell Rules */}
                    <div className="relative">
                        <GlassCard className="p-4 border-rose-500/30 bg-rose-900/10">
                            <h4 className="text-xs font-bold text-rose-400 uppercase mb-2 flex items-center gap-2">
                                <TrendingUp className="w-3 h-3 rotate-180" /> Sell Logic
                            </h4>
                            <div className="space-y-2">
                                {ruleSets.sell.length === 0 ? (
                                    <div className="text-[10px] text-slate-500 italic">No rules defined</div>
                                ) : (
                                    ruleSets.sell.map(r => (
                                        <div key={r.id} className="text-[10px] bg-slate-900/50 p-1.5 rounded border border-rose-900/30 font-mono text-slate-300">
                                            <span className="text-blue-300">Op_L</span> {r.operator} <span className="text-amber-300">Op_R</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </GlassCard>
                    </div>
                </div>

            </div>

            {/* Legend / Info */}
            <div className="flex gap-6 justify-center text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Indicator Source</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /> Execution Node</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Buy Signal</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> Sell Signal</span>
            </div>
        </div>
    );
}
