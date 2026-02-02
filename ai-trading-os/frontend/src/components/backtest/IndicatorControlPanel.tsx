import { useState, useEffect } from 'react';
import { IndicatorCapability, Control } from '@/types/indicatorCapability';

export interface SaveIndicatorConfigPayload {
    indicator_id: string;
    config: Record<string, any>;
    context: {
        bound_bot_ids: string[];
        backtest_hash: string;
    }
}

interface IndicatorControlPanelProps {
    indicatorId: string;
    capability: IndicatorCapability | null;
    initialConfig?: Record<string, any>;

    // Context for Guards & Audit
    boundBotIds?: string[];
    isBotRunning?: boolean;
    backtestHash?: string;
    indicatorStatus?: string; // 'draft' | 'ready' | 'active'

    onSave: (payload: SaveIndicatorConfigPayload) => void;
}

export function IndicatorControlPanel({
    indicatorId,
    capability,
    initialConfig = {},
    boundBotIds = [],
    isBotRunning = false,
    backtestHash = 'pending_hash',
    indicatorStatus = 'draft',
    onSave
}: IndicatorControlPanelProps) {
    const [config, setConfig] = useState<Record<string, any>>(initialConfig);
    const [isDirty, setIsDirty] = useState(false);

    // Reset config when indicator changes
    useEffect(() => {
        setConfig(initialConfig);
        setIsDirty(false);
    }, [indicatorId, initialConfig]);

    if (!capability) {
        return (
            <div className="flex items-center justify-center h-full text-[var(--text-muted)] p-8 border border-dashed border-[var(--glass-border)] rounded-xl bg-[var(--bg-secondary)]/30">
                <div className="text-center">
                    <span className="text-4xl block mb-4 opacity-50">🧩</span>
                    <p>No Capability Schema found for this indicator.</p>
                </div>
            </div>
        );
    }

    // 🔐 Guard Logic
    const isLocked = isBotRunning || indicatorStatus === 'active';
    const lockReason = isBotRunning
        ? "Locked: Bot is currently running"
        : indicatorStatus === 'active'
            ? "Locked: Indicator is Active"
            : null;

    const handleChange = (key: string, value: any) => {
        if (isLocked) return;
        setConfig(prev => ({ ...prev, [key]: value }));
        setIsDirty(true);
    };

    const handleSave = () => {
        if (isLocked) return;

        onSave({
            indicator_id: indicatorId,
            config,
            context: {
                bound_bot_ids: boundBotIds,
                backtest_hash: backtestHash
            }
        });
        setIsDirty(false);
    };

    const renderControl = (control: Control) => {
        const value = config[control.bind] ?? ('default' in control ? control.default : undefined);
        const disabled = isLocked;

        switch (control.type) {
            case 'toggle':
                return (
                    <div className="flex items-center justify-between p-3 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--glass-border)]">
                        <label className="text-sm font-medium text-[var(--text-secondary)]">{control.label}</label>
                        <button
                            onClick={() => handleChange(control.bind, !value)}
                            disabled={disabled}
                            className={`w-12 h-6 rounded-full transition-colors relative flex items-center ${value ? 'bg-emerald-500/20 border border-emerald-500/50' : 'bg-[var(--bg-primary)] border border-[var(--glass-border)]'
                                } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-[var(--color-accent)]'}`}
                        >
                            <span className={`w-4 h-4 rounded-full bg-current absolute transition-transform duration-200 ${value ? 'translate-x-7 text-emerald-400' : 'translate-x-1 text-[var(--text-muted)]'
                                }`} />
                        </button>
                    </div>
                );

            case 'select':
                return (
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide">{control.label}</label>
                        <div className="relative">
                            <select
                                value={value}
                                onChange={(e) => handleChange(control.bind, e.target.value)}
                                disabled={disabled}
                                className={`w-full appearance-none bg-[var(--bg-tertiary)] border border-[var(--glass-border)] text-white px-4 py-2 rounded-lg focus:outline-none focus:border-[var(--color-accent)] transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                                {control.options.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)]">▼</div>
                        </div>
                    </div>
                );

            case 'number':
                return (
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide">{control.label}</label>
                        <input
                            type="number"
                            value={value}
                            min={control.min}
                            max={control.max}
                            step={control.step}
                            onChange={(e) => handleChange(control.bind, parseFloat(e.target.value))}
                            disabled={disabled}
                            className={`w-full bg-[var(--bg-tertiary)] border border-[var(--glass-border)] text-white px-4 py-2 rounded-lg focus:outline-none focus:border-[var(--color-accent)] transition-colors font-mono ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                    </div>
                );

            case 'color':
                return (
                    <div className="flex items-center justify-between p-3 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--glass-border)]">
                        <label className="text-sm font-medium text-[var(--text-secondary)]">{control.label}</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={value}
                                onChange={(e) => handleChange(control.bind, e.target.value)}
                                disabled={disabled}
                                className={`w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                            />
                            <span className="text-xs font-mono text-[var(--text-muted)]">{value}</span>
                        </div>
                    </div>
                );

            case 'text':
                return (
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide">{control.label}</label>
                        <input
                            type="text"
                            value={value}
                            placeholder={(control as any).placeholder}
                            onChange={(e) => handleChange(control.bind, e.target.value)}
                            disabled={disabled}
                            className={`w-full bg-[var(--bg-tertiary)] border border-[var(--glass-border)] text-white px-4 py-2 rounded-lg focus:outline-none focus:border-[var(--color-accent)] transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="h-full flex flex-col bg-[var(--bg-primary)] rounded-xl border border-[var(--glass-border)] overflow-hidden shadow-2xl">
            {/* Context Header */}
            <div className={`p-4 border-b border-[var(--glass-border)] flex justify-between items-center ${isLocked ? 'bg-amber-900/10' : 'bg-[var(--bg-secondary)]'}`}>
                <div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">Control Panel</h3>
                    <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] mt-1">
                        <span>Schema: {capability.id}</span>
                        <span>v{capability.ui_version}</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Lock Banner - Visible if locked, but cleaner layout */}
                    {isLocked && (
                        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold animate-pulse">
                            <span>🔒</span>
                            <span>{lockReason}</span>
                        </div>
                    )}

                    {/* Actions - Always visible, but states change */}
                    <button
                        onClick={() => setConfig(initialConfig)}
                        disabled={isLocked || !isDirty}
                        className={`hidden sm:block px-3 py-1.5 text-xs font-medium transition-colors border border-transparent rounded
                            ${isLocked
                                ? 'text-gray-600 cursor-not-allowed opacity-50'
                                : isDirty
                                    ? 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                                    : 'text-gray-700 cursor-default opacity-50'
                            }`}
                        title="Reset to initial values"
                    >
                        Reset
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={isLocked || !isDirty}
                        title={isLocked ? `Locked: ${lockReason}. Stop bot to edit.` : "Save configuration changes"}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold shadow-lg transition-all border
                            ${isLocked
                                ? 'bg-[var(--bg-tertiary)] text-gray-500 border-gray-700/50 cursor-not-allowed grayscale'
                                : isDirty
                                    ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)] hover:bg-blue-600 hover:scale-[1.02] shadow-blue-500/20'
                                    : 'bg-[var(--bg-tertiary)] text-gray-500 border-transparent opacity-50 cursor-not-allowed'
                            }`}
                    >
                        <span>{isLocked ? '🔒' : '💾'}</span>
                        <span>{isLocked ? 'Locked' : 'Save'}</span>
                    </button>
                </div>
            </div>

            {/* Scrollable Controls Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                {capability.sections.map(section => (
                    <div key={section.id} className="space-y-4">
                        <div className="flex items-baseline gap-2 border-b border-[var(--glass-border)] pb-2 mb-4">
                            <h4 className="text-sm font-bold text-[var(--color-accent)] uppercase tracking-wider">
                                {section.title}
                            </h4>
                            {section.description && (
                                <span className="text-xs text-[var(--text-muted)]">{section.description}</span>
                            )}
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            {section.controls.map(control => (
                                <div key={control.id}>
                                    {renderControl(control)}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
