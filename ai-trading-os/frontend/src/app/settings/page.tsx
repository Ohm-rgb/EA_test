'use client';

import { useState, useEffect } from 'react';
import { TopBar } from "@/components/layout";
import { GlassCard, Button, Chip, Badge, ProgressBar } from "@/components/ui";
import api, { Settings as SettingsType, AISettings, MT5AccountInfo } from "@/lib/api";

export default function Settings() {
    const [settings, setSettings] = useState<SettingsType | null>(null);
    const [aiSettings, setAISettings] = useState<AISettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [advancedMode, setAdvancedMode] = useState(false);
    const [testingConnection, setTestingConnection] = useState(false);
    const [testingMT5, setTestingMT5] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // MT5 Connection State
    const [mt5Server, setMt5Server] = useState('');
    const [mt5Login, setMt5Login] = useState('');
    const [mt5Password, setMt5Password] = useState('');
    const [mt5Status, setMt5Status] = useState<'idle' | 'connected' | 'error'>('idle');
    const [mt5AccountInfo, setMt5AccountInfo] = useState<MT5AccountInfo | null>(null);

    // Saved MT5 Accounts
    interface SavedMT5Account {
        id: string;
        name: string;
        server: string;
        login: string;
        password: string;
    }
    const [savedMT5Accounts, setSavedMT5Accounts] = useState<SavedMT5Account[]>([]);
    const [selectedAccountId, setSelectedAccountId] = useState<string>('');

    // Load saved accounts and default from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('mt5_accounts');
        const defaultId = localStorage.getItem('mt5_default_account');

        if (saved) {
            try {
                const accounts: SavedMT5Account[] = JSON.parse(saved);
                setSavedMT5Accounts(accounts);

                let activeAccount: SavedMT5Account | undefined;

                // 1. Try to load default account
                if (defaultId) {
                    activeAccount = accounts.find(a => a.id === defaultId);
                }

                // 2. Fallback to first account if default not found
                if (!activeAccount && accounts.length > 0) {
                    activeAccount = accounts[0];
                    localStorage.setItem('mt5_default_account', activeAccount.id);
                }

                // 3. Set state and sync to backend
                if (activeAccount) {
                    setSelectedAccountId(activeAccount.id);
                    setMt5Server(activeAccount.server);
                    setMt5Login(activeAccount.login);
                    setMt5Password(activeAccount.password);

                    // Auto-sync to backend to ensure credentials exist for auto-connect
                    console.log('Auto-syncing MT5 credentials to backend...');
                    api.updateSettings({
                        mt5_server: activeAccount.server,
                        mt5_login: activeAccount.login,
                        mt5_password: activeAccount.password
                    }).then(() => console.log('Auto-sync successful'))
                        .catch(e => console.warn('Auto-sync failed:', e));
                }
            } catch (e) {
                console.error('Failed to parse saved MT5 accounts', e);
            }
        }
    }, []);

    // Save account to localStorage and set as default
    const handleSaveMT5Account = async () => {
        if (!mt5Server || !mt5Login || !mt5Password) {
            setMessage({ type: 'error', text: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
            return;
        }

        const accountName = prompt('ตั้งชื่อบัญชี (เช่น Demo XM, Live IC):', `${mt5Server.split('-')[0]} - ${mt5Login}`);
        if (!accountName) return;

        const newAccount: SavedMT5Account = {
            id: Date.now().toString(),
            name: accountName,
            server: mt5Server,
            login: mt5Login,
            password: mt5Password
        };

        const updated = [...savedMT5Accounts, newAccount];
        setSavedMT5Accounts(updated);
        localStorage.setItem('mt5_accounts', JSON.stringify(updated));

        // Set as default
        setSelectedAccountId(newAccount.id);
        localStorage.setItem('mt5_default_account', newAccount.id);

        // Sync to Backend
        try {
            await api.updateSettings({
                mt5_server: mt5Server,
                mt5_login: mt5Login,
                mt5_password: mt5Password
            });
            setMessage({ type: 'success', text: `บันทึก "${accountName}" เป็นค่าเริ่มต้นและ Sync ไปยัง Server แล้ว` });
        } catch (e) {
            console.error('Failed to sync to backend', e);
            setMessage({ type: 'error', text: `บันทึก Local แล้ว แต่ Sync Server ไม่สำเร็จ` });
        }
    };

    // Delete saved account
    const handleDeleteMT5Account = (accountId: string) => {
        const account = savedMT5Accounts.find(a => a.id === accountId);
        if (!account) return;

        if (!confirm(`ลบบัญชี "${account.name}" หรือไม่?`)) return;

        const updated = savedMT5Accounts.filter(a => a.id !== accountId);
        setSavedMT5Accounts(updated);
        localStorage.setItem('mt5_accounts', JSON.stringify(updated));

        // Clear default if deleted account was default
        if (selectedAccountId === accountId) {
            setSelectedAccountId('');
            setMt5Server('');
            setMt5Login('');
            setMt5Password('');
            localStorage.removeItem('mt5_default_account');
        }
        setMessage({ type: 'success', text: `ลบบัญชี "${account.name}" แล้ว` });
    };

    // Select saved account and set as default
    const handleSelectMT5Account = async (accountId: string) => {
        if (!accountId) {
            setSelectedAccountId('');
            setMt5Server('');
            setMt5Login('');
            setMt5Password('');
            localStorage.removeItem('mt5_default_account');
            return;
        }

        const account = savedMT5Accounts.find(a => a.id === accountId);
        if (account) {
            setSelectedAccountId(accountId);
            setMt5Server(account.server);
            setMt5Login(account.login);
            setMt5Password(account.password);
            setMt5Status('idle');
            setMt5AccountInfo(null);

            // Save as default
            localStorage.setItem('mt5_default_account', accountId);

            // Sync to Backend
            try {
                await api.updateSettings({
                    mt5_server: account.server,
                    mt5_login: account.login,
                    mt5_password: account.password
                });
                setMessage({ type: 'success', text: `เปลี่ยนบัญชีเป็น "${account.name}" และ Sync เรียบร้อย` });
            } catch (e) {
                console.error('Failed to sync to backend', e);
                setMessage({ type: 'error', text: `เปลี่ยน Local แล้ว แต่ Sync Server ไม่สำเร็จ` });
            }
        } else {
            // Case where ID is passed but not found (shouldn't happen with dropdown)
            setSelectedAccountId('');
            setMt5Server('');
            setMt5Login('');
            setMt5Password('');
            localStorage.removeItem('mt5_default_account');
        }
    };

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
                    <div className="text-[var(--color-success)]">Loading settings...</div>
                </div>
            </div>
        );
    }

    if (!settings) {
        return (
            <div className="min-h-screen">
                <TopBar title="System Settings" />
                <div className="p-6 flex justify-center items-center h-[calc(100vh-64px)]">
                    <div className="text-[var(--color-critical)]">Failed to load settings. Is the backend running?</div>
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

            <div className="p-2 fade-in pb-8">
                {/* Message Toast */}
                {message && (
                    <div className={`fixed top-20 right-6 px-4 py-2 rounded-lg z-50 border ${message.type === 'success' ? 'bg-[var(--bg-tertiary)] border-[var(--color-success)] text-[var(--color-success)]' : 'bg-[var(--bg-tertiary)] border-[var(--color-critical)] text-[var(--color-critical)]'
                        }`}>
                        {message.text}
                    </div>
                )}

                {/* Advanced Settings Warning */}
                {advancedMode && (
                    <div className="mb-6 p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--color-warning)] flex items-center gap-3">
                        <span className="text-[var(--color-warning)] text-xl">⚠️</span>
                        <div>
                            <div className="font-medium text-[var(--color-warning)]">Advanced Settings (Beta)</div>
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
                    <div className="flex justify-end mb-1">
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
                        gap: 10,
                        alignItems: "stretch",
                    }}
                >
                    {/* Row 1 Left - Trading Guardrails */}
                    <GlassCard>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-[var(--color-success)] text-xl">🛡️</span>
                            <h3 className="text-lg font-semibold">Trading Guardrails</h3>
                        </div>

                        <div className="space-y-3">
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

                    {/* Row 1 Right - Integrations (MT5) */}
                    <GlassCard>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <span className="text-[var(--color-warning)] text-xl">🔌</span>
                                <h3 className="text-lg font-semibold">MT5 Connection</h3>
                            </div>
                            {mt5Status === 'connected' && (
                                <Badge variant="success">Connected</Badge>
                            )}
                            {mt5Status === 'error' && (
                                <Badge variant="danger">Error</Badge>
                            )}
                            {mt5Status === 'idle' && (
                                <Badge variant="warning">Not Tested</Badge>
                            )}
                        </div>

                        <div className="space-y-3">
                            {/* Saved Accounts Dropdown */}
                            {savedMT5Accounts.length > 0 && (
                                <div>
                                    <label className="block text-xs text-[var(--text-secondary)] mb-1">บัญชีที่บันทึกไว้</label>
                                    <div className="flex gap-2">
                                        <select
                                            className="dropdown flex-1 text-sm"
                                            value={selectedAccountId}
                                            onChange={(e) => handleSelectMT5Account(e.target.value)}
                                        >
                                            <option value="">-- เลือกบัญชี --</option>
                                            {savedMT5Accounts.map(acc => (
                                                <option key={acc.id} value={acc.id}>
                                                    ⭐ {acc.name}
                                                </option>
                                            ))}
                                        </select>
                                        {selectedAccountId && (
                                            <button
                                                onClick={() => handleDeleteMT5Account(selectedAccountId)}
                                                className="px-3 py-2 rounded-lg bg-[var(--color-critical)]/10 text-[var(--color-critical)] hover:bg-[var(--color-critical)]/20 text-sm"
                                                title="ลบบัญชี"
                                            >
                                                🗑️
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs text-[var(--text-secondary)] mb-1">Server</label>
                                <input
                                    type="text"
                                    placeholder="e.g. ICMarkets-Demo"
                                    value={mt5Server}
                                    onChange={(e) => setMt5Server(e.target.value)}
                                    className="input-field w-full text-sm"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-[var(--text-secondary)] mb-1">Login ID</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 12345678"
                                        value={mt5Login}
                                        onChange={(e) => setMt5Login(e.target.value)}
                                        className="input-field w-full text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-[var(--text-secondary)] mb-1">Password</label>
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        value={mt5Password}
                                        onChange={(e) => setMt5Password(e.target.value)}
                                        className="input-field w-full text-sm"
                                    />
                                </div>
                            </div>

                            {/* Account Info Display */}
                            {mt5AccountInfo && (
                                <div className="p-3 rounded-lg bg-[var(--bg-tertiary)] space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[var(--text-secondary)]">Account</span>
                                        <span className="font-medium">{mt5AccountInfo.name}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[var(--text-secondary)]">Balance</span>
                                        <span className="text-[var(--color-success)] font-medium">
                                            {mt5AccountInfo.balance.toLocaleString()} {mt5AccountInfo.currency}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[var(--text-secondary)]">Equity</span>
                                        <span>{mt5AccountInfo.equity.toLocaleString()} {mt5AccountInfo.currency}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[var(--text-secondary)]">Leverage</span>
                                        <span>1:{mt5AccountInfo.leverage}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[var(--text-secondary)]">Broker</span>
                                        <span className="text-xs">{mt5AccountInfo.company}</span>
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                                <Button
                                    variant="primary"
                                    className="flex-1 text-sm"
                                    disabled={testingMT5 || !mt5Server || !mt5Login || !mt5Password}
                                    onClick={async () => {
                                        setTestingMT5(true);
                                        setMessage(null);
                                        try {
                                            const res = await api.testMT5Connection(mt5Server, mt5Login, mt5Password);
                                            if (res.status === 'connected') {
                                                setMt5Status('connected');
                                                setMt5AccountInfo(res.account_info || null);
                                                setMessage({ type: 'success', text: `Connected! Balance: ${res.account_info?.balance?.toLocaleString()} ${res.account_info?.currency}` });
                                            } else {
                                                setMt5Status('error');
                                                setMt5AccountInfo(null);
                                                setMessage({ type: 'error', text: res.message });
                                            }
                                        } catch (e: unknown) {
                                            setMt5Status('error');
                                            setMt5AccountInfo(null);
                                            const errorMessage = e instanceof Error ? e.message : 'Connection failed';
                                            setMessage({ type: 'error', text: errorMessage });
                                        } finally {
                                            setTestingMT5(false);
                                        }
                                    }}
                                >
                                    {testingMT5 ? (
                                        <span className="flex items-center gap-2 justify-center">
                                            <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></span>
                                            Connecting...
                                        </span>
                                    ) : (
                                        "Test Connection"
                                    )}
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="text-sm px-4 border border-[var(--color-accent)]"
                                    disabled={!mt5Server || !mt5Login || !mt5Password}
                                    onClick={handleSaveMT5Account}
                                >
                                    ⭐ บันทึก
                                </Button>
                            </div>
                        </div>
                    </GlassCard>

                    {/* Row 2 Left - AI Engine (Local) */}
                    <GlassCard>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <span className="text-[var(--color-accent)] text-xl">🧠</span>
                                <h3 className="text-lg font-semibold">AI Engine</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                {settings.primary_ai_provider === 'ollama' && <span className="text-xs text-[var(--color-success)]">Primary</span>}
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
                                        className={`text-xs px-2 py-1 rounded border transition-colors ${settings.primary_ai_provider === 'ollama' ? 'border-[var(--color-success)] text-[var(--color-success)] bg-[var(--bg-tertiary)]' : 'border-transparent bg-[var(--bg-input)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
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
                                    <span className={aiSettings?.has_ollama ? 'text-[var(--color-success)]' : 'text-[var(--color-critical)]'}>
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
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <span className="text-[var(--color-info)] text-xl">☁️</span>
                                <h3 className="text-lg font-semibold">External AI (Gemini)</h3>
                                {/* Connection Status Dot */}
                                {aiSettings?.external_ai_status === 'connected' && (
                                    <span className="w-2 h-2 rounded-full bg-[var(--color-success)] animate-pulse" title="Verified" />
                                )}
                                {aiSettings?.external_ai_status === 'error' && (
                                    <span className="w-2 h-2 rounded-full bg-[var(--color-critical)]" title={aiSettings?.external_ai_error || 'Error'} />
                                )}
                                {(!aiSettings?.external_ai_status || aiSettings?.external_ai_status === 'not_tested') && aiSettings?.has_gemini_key && (
                                    <span className="w-2 h-2 rounded-full bg-gray-400" title="Not Tested" />
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {settings.primary_ai_provider === 'gemini' && <span className="text-xs text-[var(--color-success)]">Primary</span>}
                                {aiSettings?.has_gemini_key ? (
                                    aiSettings?.external_ai_status === 'connected' ? (
                                        <Badge variant="success">Verified</Badge>
                                    ) : aiSettings?.external_ai_status === 'error' ? (
                                        <Badge variant="danger">Error</Badge>
                                    ) : (
                                        <Badge variant="info">Configured</Badge>
                                    )
                                ) : (
                                    <Badge variant="warning">Not Configured</Badge>
                                )}
                            </div>
                        </div>

                        {/* Warning if configured but not verified */}
                        {aiSettings?.has_gemini_key && aiSettings?.external_ai_status !== 'connected' && (
                            <div className="text-xs text-[var(--color-warning)] bg-[var(--bg-tertiary)] p-2 rounded mb-2 flex items-center gap-2">
                                <span>⚠️</span>
                                <span>{aiSettings?.external_ai_status === 'error'
                                    ? `Error: ${aiSettings?.external_ai_error || 'Connection failed'}`
                                    : 'API key saved, but not verified yet. Click "Test AI Connection".'}</span>
                            </div>
                        )}

                        <div className="space-y-3">
                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="block text-sm text-[var(--text-secondary)]">Provider</label>
                                    <button
                                        onClick={() => handleUpdate({ primary_ai_provider: 'gemini' })}
                                        className={`text-xs px-2 py-1 rounded border transition-colors ${settings.primary_ai_provider === 'gemini' ? 'border-[var(--color-success)] text-[var(--color-success)] bg-[var(--bg-tertiary)]' : 'border-transparent bg-[var(--bg-input)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
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

                            <Button
                                variant="primary"
                                className="w-full text-sm transition-all"
                                disabled={testingConnection}
                                onClick={async () => {
                                    setTestingConnection(true);
                                    setMessage(null);
                                    try {
                                        const res = await api.testAIConnection();
                                        if (res.gemini.status === 'connected') {
                                            setMessage({ type: 'success', text: 'Gemini Connected Successfully! ✅' });
                                            // Reload settings to update status badge/dot
                                            loadSettings();
                                        } else if (res.gemini.status === 'error') {
                                            setMessage({ type: 'error', text: `Connection Failed: ${res.gemini.message}` });
                                        } else if (res.gemini.status === 'not_configured') {
                                            setMessage({ type: 'error', text: 'Gemini API Key not configured ⚠️' });
                                        }
                                    } catch (e) {
                                        setMessage({ type: 'error', text: 'Network Request Failed ❌' });
                                    } finally {
                                        setTestingConnection(false);
                                    }
                                }}
                            >
                                {testingConnection ? (
                                    <span className="flex items-center gap-2 justify-center">
                                        <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></span>
                                        Testing...
                                    </span>
                                ) : (
                                    "Test AI Connection"
                                )}
                            </Button>
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}
