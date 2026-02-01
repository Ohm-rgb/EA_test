import { useState } from 'react';
import { useBotStore } from '@/stores/botStore';
import { Activity, XCircle, Library, PlusCircle, CheckCircle2 } from 'lucide-react';
import { AVAILABLE_INDICATORS } from '@/data/indicators';

export function FlowIndicatorsPanel() {
    const { indicatorPool, addIndicator, removeIndicator } = useBotStore();
    const [viewMode, setViewMode] = useState<'flow' | 'library'>('flow');

    return (
        <div className="w-full h-full flex flex-col bg-slate-900 border-r border-slate-800">
            {/* Header with Toggle */}
            <div className="p-4 border-b border-slate-800 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg transition-colors ${viewMode === 'flow' ? 'bg-blue-500/10' : 'bg-purple-500/10'}`}>
                            {viewMode === 'flow' ? (
                                <Activity className="w-5 h-5 text-blue-400" />
                            ) : (
                                <Library className="w-5 h-5 text-purple-400" />
                            )}
                        </div>
                        <div>
                            <h3 className="text-slate-200 font-bold text-sm">
                                {viewMode === 'flow' ? 'Active Flow' : 'Indicator Library'}
                            </h3>
                            <p className="text-xs text-slate-500">
                                {viewMode === 'flow' ? 'Currently Active Inputs' : 'Available for Selection'}
                            </p>
                        </div>
                    </div>
                    {viewMode === 'flow' && (
                        <div className="bg-slate-800 px-2 py-1 rounded-full text-xs font-mono text-slate-400 font-bold">
                            {indicatorPool.length}
                        </div>
                    )}
                </div>

                {/* Toggle Switch */}
                <div className="flex p-1 bg-slate-950 rounded-lg border border-slate-800">
                    <button
                        onClick={() => setViewMode('flow')}
                        className={`
                            flex-1 py-1.5 text-xs font-bold rounded-md transition-all
                            ${viewMode === 'flow'
                                ? 'bg-slate-800 text-blue-400 shadow-sm'
                                : 'text-slate-500 hover:text-slate-300'}
                        `}
                    >
                        Active Flow
                    </button>
                    <button
                        onClick={() => setViewMode('library')}
                        className={`
                            flex-1 py-1.5 text-xs font-bold rounded-md transition-all
                            ${viewMode === 'library'
                                ? 'bg-slate-800 text-purple-400 shadow-sm'
                                : 'text-slate-500 hover:text-slate-300'}
                        `}
                    >
                        + Library
                    </button>
                </div>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {/* MODE A: ACTIVE FLOW */}
                {viewMode === 'flow' && (
                    indicatorPool.length === 0 ? (
                        <div className="text-center py-10 text-slate-600 border border-dashed border-slate-800 rounded-xl bg-slate-900/50">
                            <p className="text-xs">No active indicators.</p>
                            <button
                                onClick={() => setViewMode('library')}
                                className="text-[10px] mt-2 text-blue-400 hover:text-blue-300 underline"
                            >
                                Browse Library to add
                            </button>
                        </div>
                    ) : (
                        indicatorPool.map((ind) => (
                            <div
                                key={ind.id}
                                className="bg-slate-800/50 border border-slate-700 p-3 rounded-lg flex items-center justify-between group hover:border-blue-500/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-200">{ind.name}</h4>
                                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                                            <span className="bg-slate-900 px-1 rounded">ID: {ind.indicatorId}</span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeIndicator(ind.id);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-rose-500/20 rounded-md text-slate-500 hover:text-rose-400 transition-all"
                                    title="Remove Indicator"
                                >
                                    <XCircle className="w-4 h-4" />
                                </button>
                            </div>
                        ))
                    )
                )}

                {/* MODE B: INDICATOR LIBRARY */}
                {viewMode === 'library' && (
                    AVAILABLE_INDICATORS.map((def) => {
                        // Check if already active
                        const isActive = indicatorPool.some(i => i.name === def.name || i.indicatorId === def.type.toLowerCase());

                        return (
                            <div
                                key={def.type}
                                className={`
                                    p-3 rounded-lg border transition-all
                                    ${isActive
                                        ? 'bg-emerald-900/10 border-emerald-500/30 opacity-75'
                                        : 'bg-slate-800/20 border-slate-700 hover:bg-slate-800 hover:border-slate-500'}
                                `}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] uppercase font-bold bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
                                            {def.category}
                                        </span>
                                    </div>
                                    {isActive ? (
                                        <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3" /> Added
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => addIndicator({
                                                id: Date.now().toString(),
                                                name: def.name,
                                                indicatorId: def.type.toLowerCase(),
                                                params: {},
                                                isBound: true
                                            })}
                                            className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md shadow transition-colors"
                                            title="Add to Flow"
                                        >
                                            <PlusCircle className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                <h4 className="text-sm font-bold text-slate-200">{def.name}</h4>
                                <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">
                                    {def.description}
                                </p>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-800 text-[10px] text-center text-slate-600 font-mono">
                {viewMode === 'flow' ? 'LIVE SYNC ACTIVE' : 'LIBRARY MODE'}
            </div>
        </div>
    );
}
