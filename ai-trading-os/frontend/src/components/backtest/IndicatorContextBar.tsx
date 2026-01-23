import { ManagedIndicator } from "@/types/backtestTypes";

interface IndicatorContextBarProps {
    indicators: ManagedIndicator[];
    activeIndicatorId: string | null;
    onSelect: (id: string | null) => void;
    onImport: () => void;
}

export function IndicatorContextBar({ indicators, activeIndicatorId, onSelect, onImport }: IndicatorContextBarProps) {
    const activeIndicator = indicators.find(i => i.id === activeIndicatorId);

    return (
        <div className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] border-b border-[var(--glass-border)] h-16">
            {/* Left: Context Selector */}
            <div className="flex items-center gap-4 flex-1">
                <div className="flex items-center gap-2">
                    <span className="text-lg">📊</span>
                    <span className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wide">
                        Context:
                    </span>
                </div>

                <div className="relative min-w-[300px]">
                    <select
                        value={activeIndicatorId || ""}
                        onChange={(e) => onSelect(e.target.value || null)}
                        className="w-full appearance-none bg-[var(--bg-tertiary)] border border-[var(--glass-border)] text-white font-medium pl-4 pr-10 py-2 rounded-lg focus:outline-none focus:border-[var(--color-accent)] transition-colors cursor-pointer"
                    >
                        <option value="">Overview (All Indicators)</option>
                        {indicators.map(ind => (
                            <option key={ind.id} value={ind.id}>
                                {ind.name} {ind.status === 'active' ? '●' : ''}
                            </option>
                        ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)]">
                        ▼
                    </div>
                </div>

                {/* Context Info Pills */}
                {activeIndicator && (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border 
                            ${activeIndicator.status === 'active'
                                ? 'text-emerald-400 border-emerald-400/20 bg-emerald-400/10'
                                : 'text-amber-400 border-amber-400/20 bg-amber-400/10'}`}>
                            {activeIndicator.status}
                        </span>
                        <span className="text-xs text-[var(--text-muted)]">
                            v1.0 • {activeIndicator.sourceType}
                        </span>
                    </div>
                )}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
                <button
                    onClick={onImport}
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/20 rounded-lg hover:bg-[var(--color-accent)] hover:text-white transition-all font-medium text-sm group"
                >
                    <span className="group-hover:translate-y-[-2px] transition-transform duration-300">⬆</span>
                    <span>Import & Register</span>
                </button>
            </div>
        </div>
    );
}
