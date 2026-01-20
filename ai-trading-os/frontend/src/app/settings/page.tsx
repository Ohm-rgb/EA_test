'use client';

import { useState, useEffect } from 'react';
import { TopBar } from "@/components/layout";
import { GlassCard, Button, Chip, Badge, ProgressBar } from "@/components/ui";
import api, { Settings as SettingsType } from "@/lib/api";

export default function Settings() {
    const [settings, setSettings] = useState<SettingsType | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [advancedMode, setAdvancedMode] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Fetch settings on load
    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const data = await api.getSettings();
            setSettings(data);
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'Failed to load settings' });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (updates: Partial<SettingsType>) => {
        if (!settings) return;

        // Optimistic update
        setSettings({ ...settings, ...updates });
        setMessage(null);
        setSaving(true);

        try {
            await api.updateSettings(updates);
            setMessage({ type: 'success', text: 'Settings saved' });

            // Clear success message after 3 seconds
            setTimeout(() => setMessage(null), 3000);
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'Failed to save settings' });
            // Revert on error (reload)
            loadSettings();
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen">
                <TopBar title="System Settings" />
                <div className="p-6 flex justify-center items-center h-[calc(100vh-64px)]">
                    <div className="text-emerald-400">Loading settings...</div>
                </div>
            </div>
        );
    }

    if (!settings) {
        return (
            <div className="min-h-screen">
                <TopBar title="System Settings" />
                <div className="p-6 flex justify-center items-center h-[calc(100vh-64px)]">
                    <div className="text-red-400">Failed to load settings. Is the backend running?</div>
                </div>
            </div>
        );
    }

    // Helper to determine risk profile from settings (if it was stored differently)
    // Here assuming risk_profile is stored directly as string
    const riskProfile = settings.risk_profile || 'balanced';

    return (
        <div className="min-h-screen">
            <TopBar title="System Settings" />

            <div className="p-6 fade-in pb-20">
                {/* Message Toast */}
                {message && (
                    <div className={`fixed top-20 right-6 px-4 py-2 rounded-lg z-50 ${message.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                        {message.text}
                    </div>
                )}

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
                                    <Chip active={riskProfile === 'conservative'} onClick={() => handleUpdate({ risk_profile: 'conservative' })}>
                                        🧠 Conservative
                                    </Chip>
                                    <Chip active={riskProfile === 'balanced'} onClick={() => handleUpdate({ risk_profile: 'balanced' })}>
                                        ⚖️ Balanced
                                    </Chip>
                                    <Chip active={riskProfile === 'aggressive'} onClick={() => handleUpdate({ risk_profile: 'aggressive' })}>
                                        🔥 Aggressive
                                    </Chip>
                                </div>
                            </div>

                            {/* Max Drawdown */}
                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-sm text-[var(--text-secondary)]">Max Drawdown</label>
                                    <span className="font-medium">{settings.max_drawdown_percent}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="5"
                                    max="20"
                                    value={settings.max_drawdown_percent}
                                    onChange={(e) => handleUpdate({ max_drawdown_percent: Number(e.target.value) })}
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
                                    <Chip active={settings.news_sensitivity === 'off'} onClick={() => handleUpdate({ news_sensitivity: 'off' })}>
                                        Off
                                    </Chip>
                                    <Chip active={settings.news_sensitivity === 'soft_filter'} onClick={() => handleUpdate({ news_sensitivity: 'soft_filter' })}>
                                        Soft
                                    </Chip>
                                    <Chip active={settings.news_sensitivity === 'hard_lock'} onClick={() => handleUpdate({ news_sensitivity: 'hard_lock' })}>
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
                                            value={settings.mt5_server || 'mt5.broker.com:443'}
                                            onChange={(e) => handleUpdate({ mt5_server: e.target.value })}
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
                                            <label className="block text-xs text-[var(--text-muted)] mb-1">Account Type</label>
                                            <input
                                                type="text"
                                                value={settings.mt5_account_type}
                                                readOnly
                                                className="input-field text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
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
                            <div className="flex items-center gap-2">
                                {settings.primary_ai_provider === 'ollama' && <span className="text-xs text-emerald-400">Primary</span>}
                                <Badge variant="success">Connected</Badge>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="block text-sm text-[var(--text-secondary)]">Local AI (Ollama)</label>
                                    <button
                                        onClick={() => handleUpdate({ primary_ai_provider: 'ollama' })}
                                        className={`text-xs px-2 py-1 rounded ${settings.primary_ai_provider === 'ollama' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 hover:bg-white/10'}`}
                                    >
                                        Set as Primary
                                    </button>
                                </div>
                                <select
                                    className="dropdown w-full"
                                    value={settings.local_ai_model}
                                    onChange={(e) => handleUpdate({ local_ai_model: e.target.value })}
                                >
                                    <option value="llama3.2:3b">llama3.2:3b</option>
                                    <option value="llama3.2:8b">llama3.2:8b</option>
                                    <option value="mistral:7b">mistral:7b</option>
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
                            <div className="flex items-center gap-2">
                                {settings.primary_ai_provider === 'gemini' && <span className="text-xs text-emerald-400">Primary</span>}
                                {settings.gemini_api_key ? (
                                    <Badge variant="info">Configured</Badge>
                                ) : (
                                    <Badge variant="warning">Not Configured</Badge>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="block text-sm text-[var(--text-secondary)]">Provider</label>
                                    <button
                                        onClick={() => handleUpdate({ primary_ai_provider: 'gemini' })}
                                        className={`text-xs px-2 py-1 rounded ${settings.primary_ai_provider === 'gemini' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 hover:bg-white/10'}`}
                                    >
                                        Set as Primary
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-[var(--text-secondary)] mb-2">API Key</label>
                                <input
                                    type="password"
                                    value={settings.gemini_api_key || ''}
                                    placeholder="Enter Gemini API Key"
                                    onChange={(e) => handleUpdate({ gemini_api_key: e.target.value })}
                                    className="input-field"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-[var(--text-secondary)] mb-2">Model</label>
                                <select
                                    className="dropdown w-full"
                                    value={settings.external_ai_model}
                                    onChange={(e) => handleUpdate({ external_ai_model: e.target.value })}
                                >
                                    <option value="gemini-3-flash">gemini-3-flash (Latest)</option>
                                    <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                                    <option value="gemini-2.5-flash-lite">gemini-2.5-flash-lite</option>
                                </select>
                            </div>

                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-[var(--text-secondary)]">Token Usage</span>
                                    <span>0 / {settings.monthly_token_limit.toLocaleString()}</span>
                                </div>
                                <ProgressBar value={0} max={settings.monthly_token_limit} />
                            </div>

                            <div className="text-right text-sm text-[var(--text-muted)]">
                                Limit: {settings.monthly_token_limit.toLocaleString()}
                            </div>
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}
