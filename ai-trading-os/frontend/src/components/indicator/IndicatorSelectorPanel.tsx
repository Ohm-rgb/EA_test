import { IndicatorSelectCard } from "./IndicatorSelectCard";
import { useState } from "react";

interface IndicatorSelectorPanelProps {
    indicators: any[];
    onBind: (id: string) => void;
    onUnbind: (id: string) => void;
    isLoading?: boolean;
}

export function IndicatorSelectorPanel({ indicators, onBind, onUnbind, isLoading }: IndicatorSelectorPanelProps) {
    const [showArchived, setShowArchived] = useState(false);

    // Filter Logic
    const filteredIndicators = indicators.filter(ind =>
        showArchived ? true : ind.status !== 'archived'
    );

    if (isLoading) {
        return <div className="p-8 text-center text-slate-500 animate-pulse">Loading indicators...</div>;
    }

    return (
        <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="flex justify-between items-center mb-4 px-1">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Available Indicators ({filteredIndicators.length})
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowArchived(!showArchived)}
                        className={`text-[10px] px-2 py-1 rounded transition-colors ${showArchived ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'
                            }`}
                    >
                        {showArchived ? 'Hide Archived' : 'Show Archived'}
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                {filteredIndicators.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4 pb-4">
                        {filteredIndicators.map(ind => (
                            <IndicatorSelectCard
                                key={ind.indicator_id}
                                indicator={ind}
                                onBind={onBind}
                                onUnbind={onUnbind}
                                onToggle={() => { }}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-60">
                        <span className="text-4xl mb-2">📦</span>
                        <p className="text-sm">No indicators found.</p>
                        <p className="text-xs">Create or import one to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
