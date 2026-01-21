'use client';

import { useState } from 'react';
import { StrategyPackage, SubRule, calculatePackageStatus } from '@/types/strategyPackage';
import { GlassCard, Button } from '@/components/ui';

interface StrategyPackageModalProps {
    isOpen: boolean;
    package_: StrategyPackage;
    onClose: () => void;
    onSave: (updatedPackage: StrategyPackage) => void;
}

const actionColors: Record<string, string> = {
    'Buy': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    'Sell': 'bg-red-500/20 text-red-400 border-red-500/30',
    'Close Position': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    'Signal': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

export function StrategyPackageModal({ isOpen, package_, onClose, onSave }: StrategyPackageModalProps) {
    const [subRules, setSubRules] = useState<SubRule[]>(package_.subRules);

    if (!isOpen) return null;

    const handleToggleRule = (ruleId: number) => {
        setSubRules(prev => prev.map(rule =>
            rule.id === ruleId ? { ...rule, isEnabled: !rule.isEnabled } : rule
        ));
    };

    const handleActionChange = (ruleId: number, action: SubRule['action']) => {
        setSubRules(prev => prev.map(rule =>
            rule.id === ruleId ? { ...rule, action } : rule
        ));
    };

    const handleEnableAll = () => {
        setSubRules(prev => prev.map(rule => ({ ...rule, isEnabled: true })));
    };

    const handleDisableAll = () => {
        setSubRules(prev => prev.map(rule => ({ ...rule, isEnabled: false })));
    };

    const handleSave = () => {
        const updatedPackage: StrategyPackage = {
            ...package_,
            subRules,
            status: calculatePackageStatus(subRules),
            isEnabled: subRules.some(r => r.isEnabled)
        };
        onSave(updatedPackage);
        onClose();
    };

    const enabledCount = subRules.filter(r => r.isEnabled).length;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <GlassCard className="w-full max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden shadow-2xl border-white/10">
                {/* Header */}
                <div className="p-6 border-b border-white/5 bg-[var(--bg-secondary)]">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <span>📦</span>
                                {package_.name}
                            </h3>
                            <p className="text-sm text-[var(--text-secondary)] mt-1">
                                Configure which signals to enable for this strategy
                            </p>
                        </div>
                        <button onClick={onClose} className="text-[var(--text-muted)] hover:text-white transition-colors">
                            ✕
                        </button>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex gap-2 mt-4">
                        <button
                            onClick={handleEnableAll}
                            className="px-3 py-1.5 text-xs rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                        >
                            Enable All
                        </button>
                        <button
                            onClick={handleDisableAll}
                            className="px-3 py-1.5 text-xs rounded-lg bg-gray-500/20 text-gray-400 hover:bg-gray-500/30 transition-colors"
                        >
                            Disable All
                        </button>
                        <div className="ml-auto text-sm text-[var(--text-muted)]">
                            {enabledCount}/{subRules.length} enabled
                        </div>
                    </div>
                </div>

                {/* Rules List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {subRules.map((rule) => (
                        <div
                            key={rule.id}
                            className={`
                p-4 rounded-xl border transition-all duration-200
                ${rule.isEnabled
                                    ? 'bg-[var(--bg-tertiary)] border-[var(--glass-border)]'
                                    : 'bg-[var(--bg-secondary)] border-[var(--glass-border)]/50 opacity-50'
                                }
              `}
                        >
                            <div className="flex items-center justify-between">
                                {/* Left: Toggle + Signal Name */}
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => handleToggleRule(rule.id)}
                                        className={`
                      w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors
                      ${rule.isEnabled
                                                ? 'bg-[var(--color-accent)] border-[var(--color-accent)]'
                                                : 'border-gray-500'
                                            }
                    `}
                                    >
                                        {rule.isEnabled && <span className="text-white text-xs">✓</span>}
                                    </button>

                                    <div>
                                        <span className="font-medium text-[var(--text-primary)]">{rule.signal}</span>
                                        <span className="text-xs text-[var(--text-muted)] ml-2">({rule.indicator})</span>
                                    </div>
                                </div>

                                {/* Right: Action Selector */}
                                <select
                                    value={rule.action}
                                    onChange={(e) => handleActionChange(rule.id, e.target.value as SubRule['action'])}
                                    disabled={!rule.isEnabled}
                                    className={`
                    px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors cursor-pointer
                    ${actionColors[rule.action] || 'bg-gray-500/20 text-gray-400'}
                    ${!rule.isEnabled && 'opacity-50 cursor-not-allowed'}
                  `}
                                >
                                    <option value="Buy">Buy</option>
                                    <option value="Sell">Sell</option>
                                    <option value="Close Position">Close Position</option>
                                    <option value="Signal">Signal Only</option>
                                </select>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/5 bg-[var(--bg-secondary)] flex justify-end gap-3">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave}>Save Changes</Button>
                </div>
            </GlassCard>
        </div>
    );
}
