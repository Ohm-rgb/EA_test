'use client';

import { useState, useEffect } from 'react';
import { TopBar } from "@/components/layout";
import { GlassCard, Button, Chip, Badge, ProgressBar } from "@/components/ui";
import api, { Settings as SettingsType, AISettings } from "@/lib/api";

export default function Settings() {
    const [settings, setSettings] = useState<SettingsType | null>(null);
    const [aiSettings, setAISettings] = useState<AISettings | null>(null);
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
            const [settingsData, aiData] = await Promise.all([
                api.getSettings(),
                api.getAISettings()
            ]);
            setSettings(settingsData);
            setAISettings(aiData);
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

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1.2fr 1fr",
                        gap: 32,
                        alignItems: "stretch",
                    }}
                >
                    {/* Row 1 Left - Trading Guardrails */}
                    <GlassCard>
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

                    {/* Row 1 Right - Integrations */}
                    <GlassCard>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <span className="text-orange-400 text-xl">🔌</span>
                                <h3 className="text-lg font-semibold">Integrations</h3>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-sm font-medium">MT5 Connection</label>
                                    <Badge variant="success">Connected</Badge>
                                </div>
                                <label className="block text-xs text-[var(--text-secondary)] mb-1">Server Address</label>
                                <div className="input-field mb-2 bg-black/20 text-sm">
                                    {settings.mt5_server || 'Not set'}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-[var(--text-secondary)] mb-1">Login ID</label>
                                    <div className="input-field bg-black/20 text-sm">123456789</div>
                                </div>
                                <div>
                                    <label className="block text-xs text-[var(--text-secondary)] mb-1">Account Type</label>
                                    <div className="input-field bg-black/20 text-sm">{settings.mt5_account_type}</div>
                                </div>
                            </div>

                            <Button variant="ghost" className="w-full text-sm">
                                Test Connection
                            </Button>
                        </div>
                    </GlassCard>

                    {/* Row 2 Left - AI Engine (Local) */}
                    <GlassCard>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <span className="text-purple-400 text-xl">🧠</span>
                                <h3 className="text-lg font-semibold">AI Engine</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                {settings.primary_ai_provider === 'ollama' && <span className="text-xs text-emerald-400">Primary</span>}
                                {aiSettings?.has_ollama ? (
                                    <Badge variant="success">Connected</Badge>
                                ) : (
                                    <Badge variant="danger">Disconnected</Badge>
                                )}
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
                                    {aiSettings?.available_local_models?.map(model => (
                                        <option key={model} value={model}>
                                            {model}{model === aiSettings.default_local_model ? ' (Default)' : ''}
                                        </option>
                                    )) || (
                                            <option value={settings.local_ai_model}>{settings.local_ai_model}</option>
                                        )}
                                </select>
                            </div>

                            <div className="p-3 rounded-lg bg-[var(--bg-tertiary)]">
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-[var(--text-secondary)]">Status</span>
                                    <span className={aiSettings?.has_ollama ? 'text-emerald-400' : 'text-red-400'}>
                                        {aiSettings?.has_ollama ? '● Running' : '○ Not Running'}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-[var(--text-secondary)]">Available Models</span>
                                    <span>{aiSettings?.available_local_models?.length || 0}</span>
                                </div>
                            </div>
                        </div>
                    </GlassCard>

                    {/* Row 2 Right - External AI (Gemini) */}
                    <GlassCard>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <span className="text-blue-400 text-xl">☁️</span>
                                <h3 className="text-lg font-semibold">External AI (Gemini)</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                {settings.primary_ai_provider === 'gemini' && <span className="text-xs text-emerald-400">Primary</span>}
                                {aiSettings?.has_gemini_key ? (
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
                                    placeholder={aiSettings?.has_gemini_key ? '••••••••••••••••' : 'Enter Gemini API Key'}
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
                                    {aiSettings?.available_gemini_models?.map(model => (
                                        <option key={model} value={model}>
                                            {model}{model === aiSettings.default_gemini_model ? ' (Default)' : ''}
                                        </option>
                                    )) || (
                                            <option value={settings.external_ai_model}>{settings.external_ai_model}</option>
                                        )}
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
