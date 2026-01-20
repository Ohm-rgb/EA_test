'use client';

import { useState, useEffect, useCallback } from 'react';
import { TopBar } from "@/components/layout";
import { KPICard, GlassCard, Button, Badge } from "@/components/ui";

// Types
interface Bot {
    id: number;
    name: string;
    personality: string;
    primary_timeframe: string;
    bot_state: string;
    is_active: boolean;
}

interface BotStatus {
    id: number;
    name: string;
    bot_state: string;
    is_active: boolean;
}

const API_BASE = 'http://localhost:8000/api/v1';

// Debounce helper to prevent double-clicks
function useDebounce() {
    const [pending, setPending] = useState<Record<number, boolean>>({});

    const isDebounced = (botId: number) => pending[botId] === true;

    const startDebounce = (botId: number) => {
        setPending(prev => ({ ...prev, [botId]: true }));
        setTimeout(() => {
            setPending(prev => ({ ...prev, [botId]: false }));
        }, 1000); // 1 second debounce
    };

    return { isDebounced, startDebounce };
}

export default function ControlCenter() {
    const [bots, setBots] = useState<Bot[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<Record<number, string>>({});
    const { isDebounced, startDebounce } = useDebounce();

    // Fetch bots from API
    const fetchBots = useCallback(async () => {
        try {
            const token = localStorage.getItem('token') || 'dev-token';
            const response = await fetch(`${API_BASE}/bots/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to fetch bots');

            const data = await response.json();
            setBots(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load bots');
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial fetch and polling
    useEffect(() => {
        fetchBots();

        // Poll every 5 seconds for status updates
        const interval = setInterval(async () => {
            try {
                const token = localStorage.getItem('token') || 'dev-token';
                const response = await fetch(`${API_BASE}/bots/status`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const statusData: BotStatus[] = await response.json();
                    setBots(prev => prev.map(bot => {
                        const status = statusData.find(s => s.id === bot.id);
                        return status ? { ...bot, bot_state: status.bot_state, is_active: status.is_active } : bot;
                    }));
                }
            } catch {
                // Silent fail on polling
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [fetchBots]);

    // Bot control action
    const controlBot = async (botId: number, action: 'start' | 'stop' | 'pause') => {
        if (isDebounced(botId)) return;

        startDebounce(botId);
        setActionLoading(prev => ({ ...prev, [botId]: action }));

        try {
            const token = localStorage.getItem('token') || 'dev-token';
            const response = await fetch(`${API_BASE}/bots/${botId}/${action}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || `Failed to ${action} bot`);
            }

            const result = await response.json();

            // Update local state
            setBots(prev => prev.map(bot =>
                bot.id === botId
                    ? { ...bot, bot_state: result.bot_state, is_active: result.bot_state === 'running' }
                    : bot
            ));
        } catch (err) {
            setError(err instanceof Error ? err.message : `Failed to ${action} bot`);
            setTimeout(() => setError(null), 3000);
        } finally {
            setActionLoading(prev => ({ ...prev, [botId]: '' }));
        }
    };

    // Emergency stop all
    const emergencyStop = async () => {
        if (!confirm('Are you sure you want to stop ALL bots?')) return;

        try {
            const token = localStorage.getItem('token') || 'dev-token';
            const response = await fetch(`${API_BASE}/bots/emergency-stop`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Emergency stop failed');

            // Refresh bot list
            fetchBots();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Emergency stop failed');
        }
    };

    // Get badge variant for bot state
    const getStateVariant = (state: string): 'success' | 'warning' | 'danger' | 'info' => {
        switch (state) {
            case 'running': return 'success';
            case 'paused': return 'warning';
            case 'stopped': return 'danger';
            default: return 'info';
        }
    };

    // Get available actions for current state
    const getAvailableActions = (state: string): ('start' | 'stop' | 'pause')[] => {
        switch (state) {
            case 'stopped': return ['start'];
            case 'running': return ['pause', 'stop'];
            case 'paused': return ['start', 'stop'];
            default: return [];
        }
    };

    return (
        <div className="min-h-screen">
            <TopBar title="Control Center" showKillSwitch onKillSwitch={emergencyStop} />

            <div className="p-6 fade-in">
                {/* Error Banner */}
                {error && (
                    <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400">
                        {error}
                    </div>
                )}

                {/* KPI Grid */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                    <KPICard label="Total Bots" value={bots.length} />
                    <KPICard
                        label="Running"
                        value={bots.filter(b => b.bot_state === 'running').length}
                        trend="up"
                    />
                    <KPICard
                        label="Paused"
                        value={bots.filter(b => b.bot_state === 'paused').length}
                        trend="neutral"
                    />
                    <KPICard
                        label="Stopped"
                        value={bots.filter(b => b.bot_state === 'stopped').length}
                        trend="down"
                    />
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-3 gap-6">
                    {/* Quick Actions */}
                    <GlassCard className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                        <div className="space-y-3">
                            <Button
                                className="w-full"
                                onClick={() => bots.filter(b => b.bot_state === 'stopped').forEach(b => controlBot(b.id, 'start'))}
                            >
                                ▶ Start All Stopped
                            </Button>
                            <Button
                                className="w-full"
                                variant="ghost"
                                onClick={() => bots.filter(b => b.bot_state === 'running').forEach(b => controlBot(b.id, 'pause'))}
                            >
                                ⏸ Pause All Running
                            </Button>
                            <Button
                                className="w-full"
                                variant="danger"
                                onClick={emergencyStop}
                            >
                                ⏹ Emergency Stop
                            </Button>
                        </div>
                    </GlassCard>

                    {/* Active Bots */}
                    <GlassCard className="p-6 col-span-2">
                        <h3 className="text-lg font-semibold mb-4">Bot Control Panel</h3>

                        {loading ? (
                            <div className="text-center py-8 text-[var(--text-secondary)]">
                                Loading bots...
                            </div>
                        ) : bots.length === 0 ? (
                            <div className="text-center py-8 text-[var(--text-secondary)]">
                                No bots configured. Create one in Bot Studio.
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                {bots.map(bot => (
                                    <div
                                        key={bot.id}
                                        className="flex items-center justify-between p-4 rounded-xl bg-white/5"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${bot.bot_state === 'running'
                                                    ? 'bg-gradient-to-br from-emerald-500 to-teal-500'
                                                    : bot.bot_state === 'paused'
                                                        ? 'bg-gradient-to-br from-amber-500 to-orange-500'
                                                        : 'bg-gradient-to-br from-gray-500 to-gray-600'
                                                }`}>
                                                🤖
                                            </div>
                                            <div>
                                                <div className="font-medium">{bot.name}</div>
                                                <div className="text-sm text-[var(--text-secondary)]">
                                                    {bot.personality} • {bot.primary_timeframe}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <Badge variant={getStateVariant(bot.bot_state)}>
                                                {bot.bot_state.toUpperCase()}
                                            </Badge>

                                            <div className="flex gap-2">
                                                {getAvailableActions(bot.bot_state).map(action => (
                                                    <button
                                                        key={action}
                                                        onClick={() => controlBot(bot.id, action)}
                                                        disabled={!!actionLoading[bot.id] || isDebounced(bot.id)}
                                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                                                            ${actionLoading[bot.id] === action ? 'opacity-50' : ''}
                                                            ${action === 'start' ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : ''}
                                                            ${action === 'pause' ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' : ''}
                                                            ${action === 'stop' ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : ''}
                                                        `}
                                                    >
                                                        {actionLoading[bot.id] === action ? '...' : action.charAt(0).toUpperCase() + action.slice(1)}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <Button className="w-full mt-4" variant="ghost">
                            + Add New Bot
                        </Button>
                    </GlassCard>
                </div>

                {/* Quick Stats */}
                <div className="mt-6 grid grid-cols-4 gap-4">
                    <GlassCard className="p-4" hover>
                        <div className="text-sm text-[var(--text-secondary)]">Active Bots</div>
                        <div className="text-2xl font-bold mt-1 text-emerald-400">
                            {bots.filter(b => b.bot_state === 'running').length}
                        </div>
                    </GlassCard>
                    <GlassCard className="p-4" hover>
                        <div className="text-sm text-[var(--text-secondary)]">Paused Bots</div>
                        <div className="text-2xl font-bold mt-1 text-amber-400">
                            {bots.filter(b => b.bot_state === 'paused').length}
                        </div>
                    </GlassCard>
                    <GlassCard className="p-4" hover>
                        <div className="text-sm text-[var(--text-secondary)]">Stopped Bots</div>
                        <div className="text-2xl font-bold mt-1 text-red-400">
                            {bots.filter(b => b.bot_state === 'stopped').length}
                        </div>
                    </GlassCard>
                    <GlassCard className="p-4" hover>
                        <div className="text-sm text-[var(--text-secondary)]">Last Refresh</div>
                        <div className="text-2xl font-bold mt-1">
                            {new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}
