import { useBotStore } from '@/stores/botStore';
import { Activity, XCircle, Settings2 } from 'lucide-react';

export function FlowIndicatorsPanel() {
    const { indicatorPool, removeIndicator, selectItem, selectedItem } = useBotStore();

    return (
        <div className="w-full h-full flex flex-col bg-slate-900 border-r border-slate-800">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                        <Activity className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-slate-200 font-bold text-sm">Active Flow</h3>
                        <p className="text-xs text-slate-500">Command Center</p>
                    </div>
                </div>
                <div className="bg-slate-800 px-2 py-1 rounded-full text-xs font-mono text-slate-400 font-bold">
                    {indicatorPool.length}
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {indicatorPool.length === 0 ? (
                    <div className="text-center py-10 text-slate-600 border border-dashed border-slate-800 rounded-xl bg-slate-900/50">
                        <p className="text-xs">No active indicators.</p>
                        <p className="text-[10px] mt-1 opacity-50">Add from Library on the right →</p>
                    </div>
                ) : (
                    indicatorPool.map((ind) => {
                        const isSelected = selectedItem?.id === ind.id;
                        return (
                            <div
                                key={ind.id}
                                onClick={() => selectItem('indicator', ind.id)}
                                className={`
                                    relative p-3 rounded-lg flex items-center justify-between cursor-pointer transition-all duration-200 border
                                    ${isSelected
                                        ? 'bg-blue-600/20 border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.2)]'
                                        : 'bg-slate-800/40 border-slate-700 hover:bg-slate-800 hover:border-slate-600'}
                                `}
                            >
                                <div className="flex items-center gap-3">
                                    {/* Status Dot / Icon */}
                                    <div className={`
                                        w-8 h-8 rounded-lg flex items-center justify-center transition-colors
                                        ${isSelected ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-500'}
                                    `}>
                                        {isSelected ? <Settings2 className="w-4 h-4 animate-spin-slow" /> : <Activity className="w-4 h-4" />}
                                    </div>

                                    <div>
                                        <h4 className={`text-sm font-bold ${isSelected ? 'text-blue-200' : 'text-slate-200'}`}>
                                            {ind.name}
                                        </h4>
                                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                                            <span className="bg-slate-950 px-1 rounded border border-slate-800">
                                                ID: {ind.indicatorId}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Actions */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeIndicator(ind.id);
                                        if (isSelected) selectItem(null, null); // Deselect if removed
                                    }}
                                    className="p-2 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors"
                                    title="Remove from Flow"
                                >
                                    <XCircle className="w-4 h-4" />
                                </button>

                                {/* Active Indicator Bar (Left Edge) */}
                                {isSelected && (
                                    <div className="absolute left-0 top-2 bottom-2 w-1 bg-blue-500 rounded-r-full" />
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-800 text-[10px] text-center text-slate-600 font-mono">
                SELECT TO CONFIGURE
            </div>
        </div>
    );
}
