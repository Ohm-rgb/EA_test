'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AuditApi, AuditLog } from '@/services/auditApi';
import { AuditTimeline } from '@/components/audit/AuditTimeline';

export default function AuditPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLogs = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await AuditApi.getLogs({ limit: 50 });
            setLogs(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch logs');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    return (
        <DashboardLayout>
            <div className="space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">System Audit Logs</h1>
                        <p className="text-[var(--text-muted)]">Track system changes and user actions</p>
                    </div>
                    <button
                        onClick={fetchLogs}
                        className="px-4 py-2 bg-[var(--bg-tertiary)] hover:bg-[var(--glass-border)] rounded text-sm font-medium transition-colors"
                    >
                        Refresh
                    </button>
                </div>

                {/* Content */}
                <div className="bg-[var(--bg-secondary)] border border-[var(--glass-border)] rounded-lg p-6">
                    {isLoading ? (
                        <div className="flex justify-center py-10">
                            <span className="loading-spinner" />
                            {/* Assuming a global spinner class or text */}
                            <span className="text-[var(--text-muted)]">Loading logs...</span>
                        </div>
                    ) : error ? (
                        <div className="text-red-400 bg-red-500/10 p-4 rounded">
                            {error}
                        </div>
                    ) : (
                        <AuditTimeline logs={logs} />
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
