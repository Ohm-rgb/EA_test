'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

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

import { ThemeToggle } from "./ThemeToggle";

interface TopBarProps {
    title: string;
    showKillSwitch?: boolean;
    onKillSwitch?: () => void;
}

export default function TopBar({ title, showKillSwitch = false, onKillSwitch }: TopBarProps) {
    const [internetStatus, setInternetStatus] = useState<'connected' | 'disconnected'>('connected');
    const [brokerStatus, setBrokerStatus] = useState<'connected' | 'warning' | 'disconnected'>('disconnected');
    const [aiStatus, setAiStatus] = useState<'connected' | 'warning' | 'error'>('warning');

    useEffect(() => {
        // 1. Internet Status
        const updateOnlineStatus = () => {
            setInternetStatus(navigator.onLine ? 'connected' : 'disconnected');
        };
        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);
        updateOnlineStatus(); // Initial check

        // 2. Fetch Backend Status
        const fetchStatus = async () => {
            try {
                const [settings, aiSettings] = await Promise.all([
                    api.getSettings(),
                    api.getAISettings()
                ]);

                // Broker Status (Check if MT5 server is configured)
                if (settings.mt5_server) {
                    setBrokerStatus('connected'); // Simplified for now since we don't have real MT5 ping
                } else {
                    setBrokerStatus('disconnected');
                }

                // AI Status (Use the verified status from backend)
                if (aiSettings.external_ai_status === 'connected') {
                    setAiStatus('connected');
                } else if (aiSettings.external_ai_status === 'error') {
                    setAiStatus('error');
                } else {
                    // Not tested or not configured
                    setAiStatus('warning');
                }
            } catch (err) {
                console.error("Failed to fetch system status:", err);
                setBrokerStatus('disconnected');
                setAiStatus('warning');
            }
        };

        fetchStatus();

        // Poll every 30 seconds
        const interval = setInterval(fetchStatus, 30000);

        return () => {
            window.removeEventListener('online', updateOnlineStatus);
            window.removeEventListener('offline', updateOnlineStatus);
            clearInterval(interval);
        };
    }, []);

    const handleKillSwitch = () => {
        if (onKillSwitch) {
            onKillSwitch();
        } else {
            // Default behavior if no callback provided
            if (confirm('Emergency Stop: Are you sure you want to stop ALL bots?')) {
                fetch('http://localhost:8000/api/v1/bots/emergency-stop', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || 'dev-token'}` }
                }).then(() => {
                    window.location.reload();
                }).catch(err => {
                    alert('Emergency stop failed: ' + err.message);
                });
            }
        }
    };

    return (
        <header className="flex items-center justify-between px-6 py-4 border-b border-[var(--glass-border)]">
            {/* Status Indicators */}
            <div className="flex items-center gap-6">
                <StatusIndicator status={internetStatus} label="Internet" />
                <StatusIndicator
                    status={brokerStatus === 'disconnected' ? 'warning' : brokerStatus}
                    label="Broker"
                />
                <StatusIndicator status={aiStatus} label="AI" />
            </div>

            {/* Title */}
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">{title}</h1>

            {/* Actions */}
            <div className="flex items-center gap-4">
                <ThemeToggle />

                {showKillSwitch && (
                    <button
                        className="kill-switch"
                        onClick={handleKillSwitch}
                    >
                        🛑 Kill Switch
                    </button>
                )}
            </div>
        </header>
    );
}

