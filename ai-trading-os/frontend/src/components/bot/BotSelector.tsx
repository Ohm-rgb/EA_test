'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, BotStatus } from '@/types/botTypes';

interface BotSelectorProps {
    bots: Bot[];
    activeBotId: string;
    onSelect: (botId: string) => void;
    onCreate: () => void;
}

export function BotSelector({ bots, activeBotId, onSelect, onCreate }: BotSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const activeBot = bots.find(b => b.id === activeBotId) || bots[0];

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getStatusColor = (status: BotStatus) => {
        switch (status) {
            case 'active': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
            case 'running': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
            case 'paused': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
            default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Main Selector Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] hover:bg-[var(--glass-hover)] transition-all min-w-[280px]"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[var(--color-primary)]/20 flex items-center justify-center text-xl">
                        🤖
                    </div>
                    <div className="text-left">
                        <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-medium">
                            Selected Machine
                        </div>
                        <div className="text-sm font-bold text-[var(--text-primary)]">
                            {activeBot?.name || 'Select Bot'}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {activeBot && (
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${getStatusColor(activeBot.status)}`}>
                            {activeBot.status}
                        </span>
                    )}
                    <span className="text-[var(--text-muted)] text-xs">▼</span>
                </div>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 p-2 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] backdrop-blur-xl shadow-2xl z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="text-[10px] font-medium text-[var(--text-muted)] px-3 py-2 uppercase tracking-wider">
                        Available Bots
                    </div>

                    <div className="space-y-1 max-h-[300px] overflow-y-auto custom-scrollbar">
                        {bots.map(bot => (
                            <button
                                key={bot.id}
                                onClick={() => {
                                    onSelect(bot.id);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${bot.id === activeBotId
                                        ? 'bg-[var(--color-primary)]/20 border border-[var(--color-primary)]/30'
                                        : 'hover:bg-[var(--glass-hover)] border border-transparent'
                                    }`}
                            >
                                <div className="text-sm font-medium text-[var(--text-primary)]">
                                    {bot.name}
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${getStatusColor(bot.status)}`}>
                                    {bot.status}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="h-px bg-[var(--glass-border)] my-2" />

                    <button
                        onClick={() => {
                            onCreate();
                            setIsOpen(false);
                        }}
                        className="w-full flex items-center gap-2 p-3 rounded-lg text-sm font-medium text-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/10 transition-all border border-dashed border-[var(--color-secondary)]/30 hover:border-[var(--color-secondary)]/60"
                    >
                        <span>➕</span> Create New Bot
                    </button>
                </div>
            )}
        </div>
    );
}
