'use client';

interface StatusIndicatorProps {
    status: 'connected' | 'warning' | 'error' | 'disconnected';
    label: string;
}

export function StatusIndicator({ status, label }: StatusIndicatorProps) {
    const statusColors = {
        connected: 'connected',
        warning: 'warning',
        error: 'error',
        disconnected: 'error',
    };

    const statusLabels = {
        connected: 'Connected',
        warning: 'Warning',
        error: 'Error',
        disconnected: 'Disconnected',
    };

    return (
        <div className="flex items-center gap-2">
            <span className={`status-dot ${statusColors[status]}`} />
            <span className="text-sm text-[var(--text-secondary)]">{label}:</span>
            <span className={`text-sm font-medium ${status === 'connected' ? 'text-emerald-400' :
                    status === 'warning' ? 'text-amber-400' :
                        'text-red-400'
                }`}>
                {statusLabels[status]}
            </span>
        </div>
    );
}

interface TopBarProps {
    title: string;
    showKillSwitch?: boolean;
}

export default function TopBar({ title, showKillSwitch = false }: TopBarProps) {
    return (
        <header className="flex items-center justify-between px-6 py-4 border-b border-[var(--glass-border)]">
            {/* Status Indicators */}
            <div className="flex items-center gap-6">
                <StatusIndicator status="connected" label="Internet" />
                <StatusIndicator status="connected" label="Broker" />
                <StatusIndicator status="warning" label="AI" />
            </div>

            {/* Title */}
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">{title}</h1>

            {/* Actions */}
            <div className="flex items-center gap-4">
                {showKillSwitch && (
                    <button className="kill-switch">
                        Kill Switch
                    </button>
                )}
            </div>
        </header>
    );
}
