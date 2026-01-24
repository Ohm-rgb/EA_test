import { AuditLog } from "@/services/auditApi";

interface AuditTimelineProps {
    logs: AuditLog[];
}

export function AuditTimeline({ logs }: AuditTimelineProps) {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    const renderDiff = (oldVal: any, newVal: any) => {
        if (!oldVal || !newVal) return null;

        // Simple key-value diff for flat objects
        const keys = new Set([...Object.keys(oldVal), ...Object.keys(newVal)]);

        return (
            <div className="mt-2 text-xs font-mono bg-[var(--bg-tertiary)] p-2 rounded border border-[var(--glass-border)]">
                {Array.from(keys).map(key => {
                    const v1 = oldVal[key];
                    const v2 = newVal[key];
                    if (v1 === v2) return null;

                    return (
                        <div key={key} className="flex gap-2">
                            <span className="text-[var(--text-muted)]">{key}:</span>
                            <span className="text-red-400 line-through opacity-70">{String(v1)}</span>
                            <span>→</span>
                            <span className="text-green-400 font-semibold">{String(v2)}</span>
                        </div>
                    );
                })}
            </div>
        );
    };

    if (logs.length === 0) {
        return (
            <div className="text-center py-10 text-[var(--text-muted)]">
                No activity logs found.
            </div>
        );
    }

    return (
        <div className="space-y-6 relative ml-4">
            {/* Vertical Line */}
            <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-[var(--glass-border)] -ml-[5px]" />

            {logs.map((log) => (
                <div key={log.id} className="relative pl-6">
                    {/* Dot */}
                    <div className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full bg-[var(--color-accent)] -ml-[10px] shadow-[0_0_10px_var(--color-accent)] ring-2 ring-[var(--bg-primary)]" />

                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                            <span className="font-semibold text-[var(--text-primary)]">{log.performed_by}</span>
                            <span>{log.action}</span>
                            <span className="opacity-50">•</span>
                            <span>{formatDate(log.performed_at)}</span>
                        </div>

                        <div className="text-sm font-medium text-[var(--text-secondary)]">
                            {log.target_table} <span className="text-[var(--text-muted)]">#{log.target_id}</span>
                        </div>

                        {renderDiff(log.old_value, log.new_value)}
                    </div>
                </div>
            ))}
        </div>
    );
}
