'use client';

import {
    ManagedIndicator,
    IndicatorStatus,
    canTransitionStatus
} from '@/types/backtestTypes';

interface IndicatorManagementPanelProps {
    indicators: ManagedIndicator[];
    onStatusChange: (indicatorId: string, newStatus: IndicatorStatus) => void;
    onConfigure: (indicator: ManagedIndicator) => void;
}

/**
 * Industrial-style indicator control table
 * Post-conversion control - NO live execution from this page
 */
export function IndicatorManagementPanel({
    indicators,
    onStatusChange,
    onConfigure
}: IndicatorManagementPanelProps) {

    const getStatusBadge = (status: IndicatorStatus) => {
        const styles: Record<IndicatorStatus, { bg: string; text: string; dot: string; label: string }> = {
            draft: {
                bg: 'bg-yellow-500/10',
                text: 'text-yellow-400',
                dot: 'bg-yellow-400',
                label: 'Draft'
            },
            ready: {
                bg: 'bg-white/10',
                text: 'text-white',
                dot: 'bg-white',
                label: 'Ready'
            },
            active: {
                bg: 'bg-green-500/10',
                text: 'text-green-400',
                dot: 'bg-green-400',
                label: 'Active'
            },
            disabled: {
                bg: 'bg-gray-500/10',
                text: 'text-gray-400',
                dot: 'bg-gray-400',
                label: 'Disabled'
            }
        };

        const style = styles[status];
        return (
            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${style.bg} ${style.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${style.dot} animate-pulse`} />
                {style.label}
            </span>
        );
    };

    const getSourceBadge = (sourceType: ManagedIndicator['sourceType']) => {
        const styles = {
            pine_script: { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'Pine Script' },
            manual: { bg: 'bg-purple-500/10', text: 'text-purple-400', label: 'Manual' },
            ai_generated: { bg: 'bg-orange-500/10', text: 'text-orange-400', label: 'AI Generated' }
        };
        const style = styles[sourceType];
        return (
            <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${style.bg} ${style.text}`}>
                {style.label}
            </span>
        );
    };

    const handleStatusToggle = (indicator: ManagedIndicator) => {
        const hasTestResult = !!indicator.testResult;

        // Determine next status based on current
        let nextStatus: IndicatorStatus;
        switch (indicator.status) {
            case 'draft':
                nextStatus = 'ready';
                break;
            case 'ready':
                nextStatus = 'active';
                break;
            case 'active':
                nextStatus = 'disabled';
                break;
            case 'disabled':
                nextStatus = 'ready';
                break;
            default:
                return;
        }

        if (canTransitionStatus(indicator.status, nextStatus, hasTestResult)) {
            onStatusChange(indicator.id, nextStatus);
        }
    };

    const getActionButton = (indicator: ManagedIndicator) => {
        const hasTestResult = !!indicator.testResult;

        switch (indicator.status) {
            case 'draft':
                return (
                    <button
                        onClick={() => handleStatusToggle(indicator)}
                        disabled={!hasTestResult}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${hasTestResult
                            ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                            : 'bg-gray-500/10 text-gray-500 cursor-not-allowed'
                            }`}
                        title={hasTestResult ? 'Mark as Ready' : 'Test required before Ready'}
                    >
                        {hasTestResult ? 'Mark Ready' : 'Need Test'}
                    </button>
                );
            case 'ready':
                return (
                    <button
                        onClick={() => handleStatusToggle(indicator)}
                        className="px-3 py-1.5 rounded text-xs font-medium bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-all"
                    >
                        Activate
                    </button>
                );
            case 'active':
                return (
                    <button
                        onClick={() => handleStatusToggle(indicator)}
                        className="px-3 py-1.5 rounded text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
                    >
                        Disable
                    </button>
                );
            case 'disabled':
                return (
                    <button
                        onClick={() => handleStatusToggle(indicator)}
                        disabled={!hasTestResult}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${hasTestResult
                            ? 'bg-white/10 text-white hover:bg-white/20'
                            : 'bg-gray-500/10 text-gray-500 cursor-not-allowed'
                            }`}
                        title={hasTestResult ? 'Re-enable' : 'Re-test required'}
                    >
                        Re-enable
                    </button>
                );
        }
    };

    return (
        <div className="industrial-panel">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <span className="text-lg">⚙️</span>
                    <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide">
                        Indicator Management
                    </h3>
                    <span className="px-2 py-0.5 rounded bg-[var(--bg-tertiary)] text-[10px] text-[var(--text-muted)]">
                        {indicators.length} indicators
                    </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
                    <span>⚠️ Configuration only - No live execution</span>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-[var(--glass-border)]">
                            <th className="px-3 py-2 text-left text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
                                Indicator
                            </th>
                            <th className="px-3 py-2 text-left text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
                                Source
                            </th>
                            <th className="px-3 py-2 text-left text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-3 py-2 text-left text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
                                Sub-Signals
                            </th>
                            <th className="px-3 py-2 text-left text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
                                Bound Bots
                            </th>
                            <th className="px-3 py-2 text-right text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--glass-border)]/50">
                        {indicators.map((indicator) => (
                            <tr
                                key={indicator.id}
                                className="hover:bg-[var(--bg-tertiary)]/50 transition-colors"
                            >
                                {/* Indicator Name */}
                                <td className="px-3 py-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded bg-[var(--bg-tertiary)] flex items-center justify-center text-xs font-bold text-[var(--color-accent)]">
                                            {indicator.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <span className="text-sm font-medium text-[var(--text-primary)]">
                                            {indicator.name}
                                        </span>
                                    </div>
                                </td>

                                {/* Source Type */}
                                <td className="px-3 py-3">
                                    {getSourceBadge(indicator.sourceType)}
                                </td>

                                {/* Status */}
                                <td className="px-3 py-3">
                                    {getStatusBadge(indicator.status)}
                                </td>

                                {/* Sub-Signals */}
                                <td className="px-3 py-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-[var(--text-primary)]">
                                            {indicator.enabledSubSignalCount}/{indicator.subSignals.length}
                                        </span>
                                        <span className="text-xs text-[var(--text-muted)]">active</span>
                                        {/* Mini progress bar */}
                                        <div className="w-16 h-1.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-[var(--color-accent)] rounded-full"
                                                style={{
                                                    width: `${(indicator.enabledSubSignalCount / indicator.subSignals.length) * 100}%`
                                                }}
                                            />
                                        </div>
                                    </div>
                                </td>

                                {/* Bound Bots */}
                                <td className="px-3 py-3">
                                    {indicator.boundBotIds.length > 0 ? (
                                        <div className="flex items-center gap-1">
                                            {indicator.boundBotIds.slice(0, 2).map((botId) => (
                                                <span
                                                    key={botId}
                                                    className="px-2 py-0.5 rounded bg-[var(--bg-tertiary)] text-[10px] text-[var(--text-secondary)]"
                                                >
                                                    {botId}
                                                </span>
                                            ))}
                                            {indicator.boundBotIds.length > 2 && (
                                                <span className="text-xs text-[var(--text-muted)]">
                                                    +{indicator.boundBotIds.length - 2}
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-xs text-[var(--text-muted)]">—</span>
                                    )}
                                </td>

                                {/* Actions */}
                                <td className="px-3 py-3">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => onConfigure(indicator)}
                                            className="px-3 py-1.5 rounded text-xs font-medium bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-white hover:bg-[var(--glass-border)] transition-all"
                                        >
                                            Configure
                                        </button>
                                        {getActionButton(indicator)}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer Note */}
            <div className="mt-4 pt-3 border-t border-[var(--glass-border)] flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
                <span>💡</span>
                <span>
                    State transitions: Draft → Ready (requires test) → Active (explicit action) → Disabled (explicit action)
                </span>
            </div>
        </div>
    );
}
