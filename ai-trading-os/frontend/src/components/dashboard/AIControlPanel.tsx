'use client';

import { useState, useEffect } from 'react';
import { api, EAStatusResponse, DailySummary, TradingPlanResponse, JournalEntry } from '@/lib/api';
import './AIControlPanel.css';

interface AIControlPanelProps {
    botId?: string;
}

export function AIControlPanel({ botId = 'master-bot-alpha' }: AIControlPanelProps) {
    const [status, setStatus] = useState<EAStatusResponse | null>(null);
    const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
    const [tradingPlan, setTradingPlan] = useState<TradingPlanResponse | null>(null);
    const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'control' | 'plan' | 'journal'>('control');

    // Fetch status on mount and every 5 seconds
    useEffect(() => {
        fetchStatus();
        fetchDailySummary();

        const interval = setInterval(() => {
            fetchStatus();
            fetchDailySummary();
        }, 5000);

        return () => clearInterval(interval);
    }, [botId]);

    const fetchStatus = async () => {
        try {
            const data = await api.getEAStatus(botId);
            setStatus(data);
        } catch (e) {
            console.error('Failed to fetch EA status:', e);
        }
    };

    const fetchDailySummary = async () => {
        try {
            const data = await api.getDailyTargetSummary(botId);
            setDailySummary(data);
        } catch (e) {
            console.error('Failed to fetch daily summary:', e);
        }
    };

    const fetchJournal = async () => {
        try {
            const data = await api.getJournalEntries(botId, 10);
            setJournalEntries(data);
        } catch (e) {
            console.error('Failed to fetch journal:', e);
        }
    };

    const handleStart = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await api.startTrading(botId, dailySummary?.target_profit_usd || 100);
            setStatus(result);
        } catch (e) {
            setError('ไม่สามารถเริ่มเทรดได้');
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleStop = async () => {
        setLoading(true);
        try {
            const result = await api.stopTrading(botId);
            setStatus(result);
        } catch (e) {
            setError('ไม่สามารถหยุดเทรดได้');
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleGeneratePlan = async () => {
        setLoading(true);
        setError(null);
        try {
            const plan = await api.generateTradingPlan(botId);
            setTradingPlan(plan);
            setActiveTab('plan');
        } catch (e) {
            setError('ไม่สามารถสร้างแผนได้');
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = () => {
        if (!status) return 'var(--color-text-secondary)';
        switch (status.status) {
            case 'running': return 'var(--color-success)';
            case 'target_reached': return 'var(--color-gold)';
            case 'paused': return 'var(--color-warning)';
            case 'error': return 'var(--color-critical)';
            default: return 'var(--color-text-secondary)';
        }
    };

    const getStatusIcon = () => {
        if (!status) return '⏳';
        switch (status.status) {
            case 'running': return '🟢';
            case 'target_reached': return '🎯';
            case 'paused': return '⏸️';
            case 'stopped': return '⏹️';
            case 'error': return '❌';
            default: return '⏳';
        }
    };

    return (
        <div className="ai-control-panel">
            {/* Header */}
            <div className="panel-header">
                <h3>🤖 Master Bot Alpha</h3>
                <span className="status-badge" style={{ color: getStatusColor() }}>
                    {getStatusIcon()} {status?.status || 'loading...'}
                </span>
            </div>

            {/* Tab Navigation */}
            <div className="tab-nav">
                <button
                    className={`tab-btn ${activeTab === 'control' ? 'active' : ''}`}
                    onClick={() => setActiveTab('control')}
                >
                    ⚙️ Control
                </button>
                <button
                    className={`tab-btn ${activeTab === 'plan' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('plan'); if (!tradingPlan) handleGeneratePlan(); }}
                >
                    📋 AI Plan
                </button>
                <button
                    className={`tab-btn ${activeTab === 'journal' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('journal'); fetchJournal(); }}
                >
                    📝 Journal
                </button>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
                {activeTab === 'control' && (
                    <ControlTab
                        status={status}
                        dailySummary={dailySummary}
                        loading={loading}
                        error={error}
                        onStart={handleStart}
                        onStop={handleStop}
                        onGeneratePlan={handleGeneratePlan}
                    />
                )}

                {activeTab === 'plan' && (
                    <PlanTab plan={tradingPlan} loading={loading} />
                )}

                {activeTab === 'journal' && (
                    <JournalTab entries={journalEntries} />
                )}
            </div>
        </div>
    );
}

// Control Tab
function ControlTab({
    status,
    dailySummary,
    loading,
    error,
    onStart,
    onStop,
    onGeneratePlan
}: {
    status: EAStatusResponse | null;
    dailySummary: DailySummary | null;
    loading: boolean;
    error: string | null;
    onStart: () => void;
    onStop: () => void;
    onGeneratePlan: () => void;
}) {
    const progress = dailySummary?.progress_percent || 0;
    const targetReached = dailySummary?.target_reached || false;

    return (
        <div className="control-tab">
            {/* Daily Target Progress */}
            <div className="target-section">
                <div className="target-header">
                    <span className="target-label">🎯 เป้าหมายวันนี้</span>
                    <span className="target-value">
                        ${dailySummary?.current_profit_usd?.toFixed(2) || '0.00'} / ${dailySummary?.target_profit_usd || 100}
                    </span>
                </div>

                <div className="progress-bar-container">
                    <div
                        className={`progress-bar ${targetReached ? 'reached' : ''}`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                </div>

                <div className="progress-info">
                    <span>{progress.toFixed(1)}%</span>
                    {targetReached && <span className="reached-badge">✅ ถึงเป้าหมายแล้ว!</span>}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-item">
                    <span className="stat-label">เทรดวันนี้</span>
                    <span className="stat-value">{dailySummary?.total_trades || 0}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">ชนะ</span>
                    <span className="stat-value text-success">{dailySummary?.winning_trades || 0}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Win Rate</span>
                    <span className="stat-value">{dailySummary?.win_rate?.toFixed(1) || 0}%</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Positions</span>
                    <span className="stat-value">{status?.open_positions || 0}</span>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="error-message">
                    ⚠️ {error}
                </div>
            )}

            {/* Control Buttons */}
            <div className="control-buttons">
                {status?.status === 'running' ? (
                    <button
                        className="btn btn-stop"
                        onClick={onStop}
                        disabled={loading}
                    >
                        ⏹️ หยุดเทรด
                    </button>
                ) : (
                    <button
                        className="btn btn-start"
                        onClick={onStart}
                        disabled={loading || targetReached}
                    >
                        ▶️ เริ่มเทรด
                    </button>
                )}

                <button
                    className="btn btn-plan"
                    onClick={onGeneratePlan}
                    disabled={loading}
                >
                    🤖 AI วางแผน
                </button>
            </div>

            {/* Message from Bot */}
            {status?.message_th && (
                <div className="bot-message">
                    💬 {status.message_th}
                </div>
            )}
        </div>
    );
}

// Plan Tab
function PlanTab({ plan, loading }: { plan: TradingPlanResponse | null; loading: boolean }) {
    if (loading) {
        return <div className="loading">🤖 AI กำลังวิเคราะห์และสร้างแผน...</div>;
    }

    if (!plan) {
        return <div className="empty-state">กดปุ่ม "AI วางแผน" เพื่อให้ AI สร้างแผนเทรด</div>;
    }

    return (
        <div className="plan-tab">
            <h4>{plan.plan_name}</h4>

            {/* Summary */}
            <div className="plan-summary">
                <pre>{plan.summary_th}</pre>
            </div>

            {/* Indicators */}
            <div className="plan-section">
                <h5>📊 Indicators แนะนำ</h5>
                {plan.indicators.map((ind, i) => (
                    <div key={i} className="indicator-card">
                        <div className="ind-header">
                            <span className="ind-name">{ind.name}</span>
                            <span className="ind-confidence">{(ind.confidence * 100).toFixed(0)}%</span>
                        </div>
                        <p className="ind-reason">{ind.reason_th}</p>
                    </div>
                ))}
            </div>

            {/* Entry Rules */}
            <div className="plan-section">
                <h5>✅ กฎเข้าเทรด</h5>
                <ul>
                    {plan.entry_rules_th.map((rule, i) => (
                        <li key={i}>{rule}</li>
                    ))}
                </ul>
            </div>

            {/* Exit Rules */}
            <div className="plan-section">
                <h5>🚪 กฎออกจากเทรด</h5>
                <ul>
                    {plan.exit_rules_th.map((rule, i) => (
                        <li key={i}>{rule}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

// Journal Tab
function JournalTab({ entries }: { entries: JournalEntry[] }) {
    if (entries.length === 0) {
        return <div className="empty-state">ยังไม่มีประวัติ</div>;
    }

    return (
        <div className="journal-tab">
            {entries.map((entry) => (
                <div key={entry.id} className="journal-entry">
                    <div className="entry-header">
                        <span className="entry-type">{getEntryTypeIcon(entry.entry_type)}</span>
                        <span className="entry-title">{entry.title}</span>
                        <span className="entry-time">
                            {entry.created_at ? new Date(entry.created_at).toLocaleTimeString('th-TH') : ''}
                        </span>
                    </div>
                    {entry.ai_summary_th && (
                        <p className="entry-summary">{entry.ai_summary_th}</p>
                    )}
                    {entry.profit_usd !== 0 && (
                        <span className={`entry-profit ${entry.profit_usd >= 0 ? 'positive' : 'negative'}`}>
                            {entry.profit_usd >= 0 ? '+' : ''}${entry.profit_usd.toFixed(2)}
                        </span>
                    )}
                </div>
            ))}
        </div>
    );
}

function getEntryTypeIcon(type: string): string {
    switch (type) {
        case 'indicator_usage': return '📊';
        case 'strategy_plan': return '📋';
        case 'trade_result': return '💰';
        case 'ai_analysis': return '🤖';
        case 'parameter_test': return '🔧';
        case 'daily_summary': return '📅';
        default: return '📝';
    }
}

export default AIControlPanel;
