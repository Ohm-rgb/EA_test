import React, { useState, useEffect, memo } from 'react';
import { GlassCard } from '@/components/ui';

interface ControlRoomHeaderProps {
    title?: string;
    systemStatus?: 'online' | 'offline' | 'maintenance';
    viewMode?: 'monitor' | 'configure';
    onViewModeChange?: (mode: 'monitor' | 'configure') => void;
}

export const ControlRoomHeader = memo(({
    title = "KPI Dashboard",
    systemStatus = 'online',
    viewMode = 'monitor',
    onViewModeChange
}: ControlRoomHeaderProps) => {
    const [currentTime, setCurrentTime] = useState<Date | null>(null);

    useEffect(() => {
        // Set initial time
        setCurrentTime(new Date());

        const timerId = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timerId);
    }, []);

    // Format metrics
    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'online': return 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]';
            case 'offline': return 'bg-slate-500';
            case 'maintenance': return 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]';
            default: return 'bg-slate-500';
        }
    };

    return (
        <GlassCard className="p-4 bg-gradient-to-r from-slate-900 to-slate-800 border-slate-700/50 mb-6">
            <div className="flex justify-between items-center">
                {/* Left: Dashboard Controls / Title */}
                <div className="flex items-center gap-6">
                    <h1 className="text-xl font-bold text-white tracking-widest uppercase flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(systemStatus)} animate-pulse`} />
                        {title}
                    </h1>

                    <div className="flex bg-slate-800 rounded p-1 border border-slate-700">
                        <button
                            onClick={() => onViewModeChange?.('monitor')}
                            className={`px-4 py-1 rounded text-xs font-mono uppercase tracking-wider transition-all ${viewMode === 'monitor'
                                    ? 'bg-cyan-500/20 text-cyan-400 font-bold shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                                    : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            Monitor
                        </button>
                        <button
                            onClick={() => onViewModeChange?.('configure')}
                            className={`px-4 py-1 rounded text-xs font-mono uppercase tracking-wider transition-all ${viewMode === 'configure'
                                    ? 'bg-amber-500/20 text-amber-400 font-bold shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                                    : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            Configure
                        </button>
                    </div>
                </div>

                {/* Right: Time & System Info */}
                <div className="text-right">
                    {currentTime ? (
                        <div className="font-mono text-cyan-400 font-bold text-xl tracking-widest leading-none">
                            {formatTime(currentTime)}
                        </div>
                    ) : (
                        <div className="font-mono text-slate-600 font-bold text-xl tracking-widest leading-none">
                            --:--:--
                        </div>
                    )}
                    <div className="text-[10px] text-slate-400 uppercase tracking-[0.2em] mt-1">
                        {currentTime ? formatDate(currentTime) : '--/--/----'} • SYSTEM {systemStatus.toUpperCase()}
                    </div>
                </div>
            </div>
        </GlassCard>
    );
});

ControlRoomHeader.displayName = 'ControlRoomHeader';
