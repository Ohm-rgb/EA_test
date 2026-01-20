'use client';

import { useState } from 'react';
import { TopBar } from "@/components/layout";
import { GlassCard, Button, Badge } from "@/components/ui";

interface TimelineEvent {
    id: number;
    time: string;
    action: 'BUY' | 'SELL' | 'HOLD';
    confidence: number;
    price: number;
    reason: string;
}

const mockTimeline: TimelineEvent[] = [
    { id: 1, time: '09:00 AM', action: 'BUY', confidence: 95, price: 150.25, reason: 'RSI crossed below 30' },
    { id: 2, time: '09:15 AM', action: 'HOLD', confidence: 98, price: 151.00, reason: 'Market stabilizing' },
    { id: 3, time: '09:45 AM', action: 'SELL', confidence: 92, price: 155.80, reason: 'Target reached' },
    { id: 4, time: '10:15 AM', action: 'BUY', confidence: 90, price: 156.10, reason: 'Trend confirmation' },
];

export default function SimulationSandbox() {
    const [selectedBot, setSelectedBot] = useState('AlphaBot');
    const [scenario, setScenario] = useState('trending');
    const [isRunning, setIsRunning] = useState(false);

    const scenarios = [
        { value: 'trending', label: 'Trending Market', icon: '📈' },
        { value: 'ranging', label: 'Ranging Market', icon: '↔️' },
        { value: 'volatile', label: 'High Volatility', icon: '🌊' },
        { value: 'news', label: 'News Event', icon: '📰' },
    ];

    return (
        <div className="min-h-screen">
            <TopBar title="Simulation Sandbox" />

            <div className="p-6 fade-in">
                {/* Top Controls */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        {/* Bot Selector */}
                        <div>
                            <label className="block text-sm text-[var(--text-secondary)] mb-1">Bot</label>
                            <select
                                value={selectedBot}
                                onChange={(e) => setSelectedBot(e.target.value)}
                                className="dropdown"
                            >
                                <option value="AlphaBot">AlphaBot</option>
                                <option value="DeltaGrid">DeltaGrid</option>
                                <option value="ScalpMaster">ScalpMaster</option>
                            </select>
                        </div>

                        {/* Scenario Selector */}
                        <div>
                            <label className="block text-sm text-[var(--text-secondary)] mb-1">Scenario</label>
                            <select
                                value={scenario}
                                onChange={(e) => setScenario(e.target.value)}
                                className="dropdown"
                            >
                                {scenarios.map(s => (
                                    <option key={s.value} value={s.value}>{s.icon} {s.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Safe Zone Badge */}
                    <div className="safe-zone-badge">
                        ✓ Safe Zone - No Real Money
                    </div>
                </div>

                {/* Behavior Timeline */}
                <GlassCard className="p-6 mb-6">
                    <h3 className="text-lg font-semibold mb-4">Behavior Timeline</h3>

                    <div className="relative">
                        {/* Timeline track */}
                        <div className="absolute top-4 left-0 right-0 h-1 bg-[var(--bg-tertiary)] rounded-full" />

                        {/* Timeline events */}
                        <div className="flex justify-between relative">
                            {mockTimeline.map((event, index) => (
                                <div key={event.id} className="flex flex-col items-center">
                                    {/* Event marker */}
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold z-10 ${event.action === 'BUY' ? 'bg-emerald-500' :
                                            event.action === 'SELL' ? 'bg-red-500' :
                                                'bg-amber-500'
                                        }`}>
                                        {event.action === 'BUY' ? '↑' : event.action === 'SELL' ? '↓' : '⏸'}
                                    </div>

                                    {/* Event details */}
                                    <div className="mt-3 text-center">
                                        <div className="text-sm font-medium">{event.action}</div>
                                        <div className="text-xs text-[var(--text-secondary)]">{event.confidence}% Confidence</div>
                                        <div className="text-xs text-[var(--text-muted)] mt-1">{event.time}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </GlassCard>

                <div className="grid grid-cols-3 gap-6">
                    {/* Comparison Panel */}
                    <div className="col-span-2">
                        <GlassCard className="p-6">
                            <h3 className="text-lg font-semibold mb-4">Designed vs Actual Behavior</h3>

                            <div className="grid grid-cols-2 gap-6">
                                {/* Designed */}
                                <div className="p-4 rounded-xl bg-[var(--bg-tertiary)]">
                                    <h4 className="text-sm font-medium text-purple-400 mb-3">📐 Designed Behavior</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-[var(--text-secondary)]">Planned Buy @</span>
                                            <span>150.00</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-[var(--text-secondary)]">Planned Hold:</span>
                                            <span>Wait for momentum</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-[var(--text-secondary)]">Planned Sell @</span>
                                            <span>156.00</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actual */}
                                <div className="p-4 rounded-xl bg-[var(--bg-tertiary)]">
                                    <h4 className="text-sm font-medium text-emerald-400 mb-3">🎯 Actual Behavior</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-[var(--text-secondary)]">Actual Buy @</span>
                                            <span className="text-emerald-400">150.25 ✓</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-[var(--text-secondary)]">Actual Hold:</span>
                                            <span className="text-emerald-400">Correct ✓</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-[var(--text-secondary)]">Actual Sell @</span>
                                            <span className="text-amber-400">155.80 ⚠️</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Deviation Summary */}
                            <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                                <span className="text-amber-400 text-sm">
                                    ⚠️ Minor deviation: Bot exited 0.20 points early (Premature exit)
                                </span>
                            </div>
                        </GlassCard>
                    </div>

                    {/* AI Coach */}
                    <div>
                        <GlassCard className="p-6 border-purple-500/30">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl">
                                    🧠
                                </div>
                                <div>
                                    <h3 className="font-semibold">AI Coach</h3>
                                    <Badge variant="info">Analyzing...</Badge>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] mb-4">
                                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                                    Bot เข้าเทรดเร็วเกินไปในช่วง Sideway ลองปรับ <span className="text-purple-400">Confirmation Level</span> ขึ้นเพื่อลดสัญญาณหลอก
                                </p>
                            </div>

                            <div className="space-y-2">
                                <button className="w-full py-2 px-4 rounded-lg bg-purple-500/20 text-purple-400 text-sm hover:bg-purple-500/30 transition-colors">
                                    Reduce frequency
                                </button>
                                <button className="w-full py-2 px-4 rounded-lg bg-purple-500/20 text-purple-400 text-sm hover:bg-purple-500/30 transition-colors">
                                    Add filter
                                </button>
                                <button className="w-full py-2 px-4 rounded-lg bg-purple-500/20 text-purple-400 text-sm hover:bg-purple-500/30 transition-colors">
                                    Optimize Confirmation
                                </button>
                            </div>
                        </GlassCard>
                    </div>
                </div>

                {/* Bottom Stats */}
                <div className="mt-6 flex items-center justify-between">
                    <Button
                        onClick={() => setIsRunning(!isRunning)}
                        className={isRunning ? 'bg-amber-500' : ''}
                    >
                        {isRunning ? '⏸ Pause Simulation' : '▶ Run Simulation'}
                    </Button>

                    <div className="flex items-center gap-8">
                        <div className="text-center">
                            <div className="text-xs text-[var(--text-secondary)]">Profit</div>
                            <div className="text-lg font-bold text-emerald-400">+$450.20 (3.5%)</div>
                        </div>
                        <div className="text-center">
                            <div className="text-xs text-[var(--text-secondary)]">Win Rate</div>
                            <div className="text-lg font-bold">75%</div>
                        </div>
                        <div className="text-center">
                            <div className="text-xs text-[var(--text-secondary)]">Drawdown</div>
                            <div className="text-lg font-bold text-amber-400">1.2%</div>
                        </div>
                        <div className="text-center">
                            <div className="text-xs text-[var(--text-secondary)]">Trades</div>
                            <div className="text-lg font-bold">4</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
