'use client';

import { useState } from 'react';
import { TopBar } from "@/components/layout";
import { GlassCard, Button, Chip, Badge, ProgressBar } from "@/components/ui";

export default function Settings() {
    const [riskProfile, setRiskProfile] = useState<'conservative' | 'balanced' | 'aggressive'>('balanced');
    const [maxDrawdown, setMaxDrawdown] = useState(10);
    const [newsSensitivity, setNewsSensitivity] = useState<'off' | 'soft' | 'hard'>('soft');
    const [advancedMode, setAdvancedMode] = useState(false);

    return (
        <div className="min-h-screen">
            <TopBar title="System Settings" />

            <div className="p-6 fade-in">
                {/* Advanced Settings Warning */}
                {advancedMode && (
                    <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3">
                        <span className="text-amber-400 text-xl">⚠️</span>
                        <div>
                            <div className="font-medium text-amber-400">Advanced Settings (Beta)</div>
                            <div className="text-sm text-[var(--text-secondary)]">Improper configuration may impact system stability.</div>
                        </div>
                        <div className="flex-1" />
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-[var(--text-secondary)]">Advanced Settings</span>
                            <button
                                onClick={() => setAdvancedMode(!advancedMode)}
                                className={`toggle ${advancedMode ? 'active' : ''}`}
                            />
                        </div>
                    </div>
                )}

                {!advancedMode && (
                    <div className="flex justify-end mb-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-[var(--text-secondary)]">Advanced Settings</span>
                            <button
                                onClick={() => setAdvancedMode(!advancedMode)}
                                className={`toggle ${advancedMode ? 'active' : ''}`}
                            />
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-6">
                    {/* Zone A - Trading Guardrails */}
                    <GlassCard className="p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <span className="text-emerald-400 text-xl">🛡️</span>
                            <h3 className="text-lg font-semibold">Trading Guardrails</h3>
                        </div>

                        <div className="space-y-6">
                            {/* Risk Profile */}
                            <div>
                                <label className="block text-sm text-[var(--text-secondary)] mb-2">Risk Profile</label>
                                <div className="flex gap-2">
                                    <Chip active={riskProfile === 'conservative'} onClick={() => setRiskProfile('conservative')}>
                                        🧠 Conservative
                                    </Chip>
                                    <Chip active={riskProfile === 'balanced'} onClick={() => setRiskProfile('balanced')}>
                                        ⚖️ Balanced
                                    </Chip>
                                    <Chip active={riskProfile === 'aggressive'} onClick={() => setRiskProfile('aggressive')}>
                                        🔥 Aggressive
                                    </Chip>
                                </div>
                            </div>

                            {/* Max Drawdown */}
                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-sm text-[var(--text-secondary)]">Max Drawdown</label>
                                    <span className="font-medium">{maxDrawdown}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="5"
                                    max="20"
                                    value={maxDrawdown}
                                    onChange={(e) => setMaxDrawdown(Number(e.target.value))}
                                    className="w-full"
                                />
                                <div className="flex justify-between text-xs text-[var(--text-muted)] mt-1">
                                    <span>0-5%</span>
                                    <span>5-15%</span>
                                    <span>15-20%</span>
                                </div>
                            </div>

                            {/* News Sensitivity */}
                            <div>
                                <label className="block text-sm text-[var(--text-secondary)] mb-2">News Sensitivity</label>
                                <div className="flex gap-2">
                                    <Chip active={newsSensitivity === 'off'} onClick={() => setNewsSensitivity('off')}>
                                        Off
                                    </Chip>
                                    <Chip active={newsSensitivity === 'soft'} onClick={() => setNewsSensitivity('soft')}>
                                        Soft
                                    </Chip>
                                    <Chip active={newsSensitivity === 'hard'} onClick={() => setNewsSensitivity('hard')}>
                                        Hard
                                    </Chip>
                                </div>
                                <p className="text-xs text-[var(--text-muted)] mt-2">
                                    Soft: Delays execution during high-impact events
                                </p>
                            </div>
                        </div>
                    </GlassCard>

                    {/* Zone B - Integrations */}
                    <GlassCard className="p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <span className="text-blue-400 text-xl">🔌</span>
                            <h3 className="text-lg font-semibold">Integrations</h3>
                        </div>

                        <div className="space-y-6">
                            {/* MT5 Connection */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <span className="font-medium">MT5 Connection</span>
                                    <Badge variant="success">Connected</Badge>
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs text-[var(--text-muted)] mb-1">Server Address</label>
                                        <input
                                            type="text"
                                            value="mt5.broker.com:443"
                                            readOnly
                                            className="input-field text-sm"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs text-[var(--text-muted)] mb-1">Login ID</label>
                                            <input
                                                type="text"
                                                value="123456789"
                                                readOnly
                                                className="input-field text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-[var(--text-muted)] mb-1">Password</label>
                                            <input
                                                type="password"
                                                value="********"
                                                readOnly
                                                className="input-field text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Broker API */}
                            <div className="flex items-center justify-between py-3 border-t border-[var(--glass-border)]">
                                <span className="font-medium">Broker API</span>
                                <Badge variant="success">Active - Rate Limit OK</Badge>
                            </div>

                            <Button variant="ghost" className="w-full">
                                Test Connection
                            </Button>
                        </div>
                    </GlassCard>

                    {/* Zone C - AI Engine (Local) */}
                    <GlassCard className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <span className="text-purple-400 text-xl">🧠</span>
                                <h3 className="text-lg font-semibold">AI Engine</h3>
                            </div>
                            <Badge variant="success">Connected</Badge>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-[var(--text-secondary)] mb-2">Local AI (Ollama)</label>
                                <select className="dropdown w-full">
                                    <option>llama3.2:8b</option>
                                    <option>llama3.2:70b</option>
                                    <option>mistral:7b</option>
                                </select>
                            </div>

                            <div className="p-3 rounded-lg bg-[var(--bg-tertiary)]">
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-[var(--text-secondary)]">Status</span>
                                    <span className="text-emerald-400">● Running</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-[var(--text-secondary)]">Latency</span>
                                    <span>~120ms</span>
                                </div>
                            </div>

                            <Button variant="ghost" className="w-full">
                                Test Connection
                            </Button>
                        </div>
                    </GlassCard>

                    {/* Zone C - AI Engine (External) */}
                    <GlassCard className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <span className="text-blue-400 text-xl">☁️</span>
                                <h3 className="text-lg font-semibold">External AI (Gemini)</h3>
                            </div>
                            <Badge variant="info">Running - Low Latency</Badge>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-[var(--text-secondary)] mb-2">API Key</label>
                                <input
                                    type="password"
                                    value="********************************"
                                    className="input-field"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-[var(--text-secondary)] mb-2">Model</label>
                                <select className="dropdown w-full">
                                    <option>gemini-1.5-flash</option>
                                    <option>gemini-1.5-pro</option>
                                    <option>gemini-2.0-flash</option>
                                </select>
                            </div>

                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-[var(--text-secondary)]">Token Usage</span>
                                    <span>45,000 / 100,000</span>
                                </div>
                                <ProgressBar value={45000} max={100000} />
                            </div>

                            <div className="text-right text-sm text-[var(--text-muted)]">
                                Cost estimate: ~$2.50
                            </div>
                        </div>
                    </GlassCard>
                </div>

                {/* Audit Log */}
                <GlassCard className="p-6 mt-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold">Audit Log Preview</h3>
                        <button className="text-sm text-emerald-400 hover:underline">View All</button>
                    </div>

                    <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-3 py-2 border-b border-[var(--glass-border)]">
                            <span className="text-[var(--text-muted)]">14:32 PM</span>
                            <span>User 'Admin' updated Risk Profile to 'Balanced'</span>
                        </div>
                        <div className="flex items-center gap-3 py-2 border-b border-[var(--glass-border)]">
                            <span className="text-[var(--text-muted)]">14:30 PM</span>
                            <span>System performed automatic backup</span>
                        </div>
                        <div className="flex items-center gap-3 py-2">
                            <span className="text-[var(--text-muted)]">12:15 PM</span>
                            <span>API Key for Gemini updated by User 'Dev1'</span>
                        </div>
                    </div>

                    <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-sm">
                        <span className="text-amber-400">⚠️ Changes require confirmation before taking effect. Ensure settings are reviewed.</span>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}
