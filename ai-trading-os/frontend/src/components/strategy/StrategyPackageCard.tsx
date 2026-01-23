'use client';

import { StrategyPackage, PackageStatus } from '@/types/strategyPackage';

interface StrategyPackageCardProps {
    package_: StrategyPackage;
    onConfigure: () => void;
    onToggle: (enabled: boolean) => void;
}

const statusConfig: Record<PackageStatus, { color: string; bg: string; label: string }> = {
    draft: { color: 'text-gray-400', bg: 'bg-gray-500/10', label: 'Draft' },
    ready: { color: 'text-blue-400', bg: 'bg-blue-500/20', label: 'Ready' },
    active: { color: 'text-emerald-400', bg: 'bg-emerald-500/20', label: 'Active' },
    partial: { color: 'text-amber-400', bg: 'bg-amber-500/20', label: 'Partial' },
    disabled: { color: 'text-gray-400', bg: 'bg-gray-500/20', label: 'Disabled' }
};

export function StrategyPackageCard({ package_, onConfigure, onToggle }: StrategyPackageCardProps) {
    const enabledCount = package_.subRules.filter(r => r.isEnabled).length;
    const totalCount = package_.subRules.length;
    const status = statusConfig[package_.status];

    return (
        <div className={`
      relative p-4 rounded-xl border transition-all duration-200
      ${package_.isEnabled
                ? 'bg-[var(--bg-tertiary)] border-[var(--glass-border)] hover:border-[var(--color-accent)]/50'
                : 'bg-[var(--bg-secondary)] border-[var(--glass-border)]/50 opacity-60'
            }
    `}>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    {/* Package Icon */}
                    <div className="w-10 h-10 rounded-lg bg-[var(--color-accent)]/20 flex items-center justify-center">
                        <span className="text-lg">📦</span>
                    </div>

                    {/* Name & Status */}
                    <div>
                        <h4 className="font-semibold text-[var(--text-primary)]">{package_.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${status.bg} ${status.color}`}>
                                {status.label}
                            </span>
                            <span className="text-xs text-[var(--text-muted)]">
                                {enabledCount}/{totalCount} signals
                            </span>
                        </div>
                    </div>
                </div>

                {/* Toggle */}
                <button
                    onClick={() => onToggle(!package_.isEnabled)}
                    className={`
            w-12 h-6 rounded-full transition-colors duration-200 relative
            ${package_.isEnabled ? 'bg-[var(--color-accent)]' : 'bg-gray-600'}
          `}
                >
                    <div className={`
            absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-200
            ${package_.isEnabled ? 'translate-x-7' : 'translate-x-1'}
          `} />
                </button>
            </div>

            {/* Preview of signals */}
            <div className="flex flex-wrap gap-1 mb-3">
                {package_.subRules.slice(0, 4).map((rule, i) => (
                    <span
                        key={i}
                        className={`
              text-xs px-2 py-1 rounded-md
              ${rule.isEnabled
                                ? rule.action === 'Buy'
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : rule.action === 'Sell'
                                        ? 'bg-red-500/20 text-red-400'
                                        : 'bg-blue-500/20 text-blue-400'
                                : 'bg-gray-500/10 text-gray-500'
                            }
            `}
                    >
                        {rule.signal}
                    </span>
                ))}
                {package_.subRules.length > 4 && (
                    <span className="text-xs px-2 py-1 text-[var(--text-muted)]">
                        +{package_.subRules.length - 4} more
                    </span>
                )}
            </div>

            {/* Configure Button */}
            <button
                onClick={onConfigure}
                className="w-full py-2 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--color-accent)]/20 
                   text-[var(--text-secondary)] hover:text-[var(--color-accent)] 
                   text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2"
            >
                <span>⚙️</span>
                Configure Signals
            </button>
        </div>
    );
}
