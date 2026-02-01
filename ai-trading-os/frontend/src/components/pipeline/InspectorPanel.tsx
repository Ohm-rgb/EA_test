import React, { useEffect, useState } from 'react';
import { useBotStore } from '@/stores/botStore';
import { Settings, Sliders, AlertTriangle } from 'lucide-react';
import { GlassCard } from "@/components/ui";

export function InspectorPanel() {
    const { selectedItem, indicatorPool, updateIndicatorParams, riskConfig } = useBotStore();

    // Internal state for params to debounce updates
    const [params, setParams] = useState<Record<string, any>>({});

    // Derived selected object
    const selectedIndicator = selectedItem.type === 'indicator'
        ? indicatorPool.find(i => i.id === selectedItem.id)
        : null;

    console.log('[InspectorPanel] Render:', { selectedItem, indicatorPoolSize: indicatorPool.length, found: !!selectedIndicator });

    // Sync state when selection changes
    useEffect(() => {
        if (selectedIndicator) {
            setParams(selectedIndicator.params || {});
        }
    }, [selectedIndicator]);

    // Handler for param changes
    const handleParamChange = (key: string, value: any) => {
        const newParams = { ...params, [key]: value };
        setParams(newParams);
        // Direct update for now (could debounce here in future)
        if (selectedItem.id) {
            updateIndicatorParams(selectedItem.id, newParams);
        }
    };

    if (selectedItem.type === 'risk') {
        return (
            <GlassCard className="p-6 h-full bg-[#1e293b]/30 border-slate-700/50 flex flex-col">
                <div className="flex items-center gap-2 mb-6 text-amber-500">
                    <AlertTriangle className="w-5 h-5" />
                    <h3 className="text-lg font-semibold">Risk Configuration</h3>
                </div>
                <div className="space-y-6 text-slate-300">
                    <p className="text-sm">Global Risk Settings are managed here.</p>
                    {/* Placeholder for actual Risk controls which might be moved here fully later */}
                    <div className="p-4 bg-slate-800/50 rounded border border-slate-700">
                        <div className="text-xs uppercase text-slate-500 mb-1">Risk Per Trade</div>
                        <div className="text-xl font-mono text-emerald-400">{riskConfig.riskPerTrade}%</div>
                    </div>
                    <div className="p-4 bg-slate-800/50 rounded border border-slate-700">
                        <div className="text-xs uppercase text-slate-500 mb-1">Stop Loss</div>
                        <div className="text-xl font-mono text-rose-400">{riskConfig.stopLoss} PIP</div>
                    </div>
                </div>
            </GlassCard>
        );
    }

    if (selectedItem.type === 'indicator' && selectedIndicator) {
        return (
            <GlassCard className="p-6 h-full bg-[#1e293b]/30 border-slate-700/50 flex flex-col animate-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-2 mb-6 text-blue-400">
                    <Sliders className="w-5 h-5" />
                    <h3 className="text-lg font-semibold">{selectedIndicator.name}</h3>
                </div>

                <div className="flex-1 overflow-auto space-y-6">
                    {/* ID Badge */}
                    <div className="text-xs font-mono text-slate-500 bg-slate-900/50 p-2 rounded">
                        ID: {selectedIndicator.indicatorId}
                    </div>

                    {/* Mock Params Form (Dynamic in future) */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs uppercase text-slate-400 font-bold mb-2">Period / Length</label>
                            <input
                                type="number"
                                value={params.period || 14} // Default mock
                                onChange={(e) => handleParamChange('period', parseInt(e.target.value))}
                                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white outline-none focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs uppercase text-slate-400 font-bold mb-2">Source</label>
                            <select
                                value={params.source || 'close'}
                                onChange={(e) => handleParamChange('source', e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white outline-none focus:border-blue-500"
                            >
                                <option value="close">Close</option>
                                <option value="open">Open</option>
                                <option value="high">High</option>
                                <option value="low">Low</option>
                                <option value="hl2">HL/2</option>
                            </select>
                        </div>
                    </div>

                    <div className="p-3 bg-blue-900/20 border border-blue-900/40 rounded text-xs text-blue-300">
                        Changes are auto-saved to the pipeline configuration.
                    </div>
                </div>
            </GlassCard>
        );
    }

    // Empty State
    return (
        <GlassCard className="p-6 h-full bg-[#1e293b]/30 border-slate-700/50 flex flex-col items-center justify-center text-slate-500">
            <Settings className="w-12 h-12 mb-4 opacity-50" />
            <h3 className="text-md font-semibold text-slate-400">Inspector Panel</h3>
            <p className="text-sm text-center mt-2 max-w-[200px]">
                Select an Indicator or Component from the pipeline to configure its settings.
            </p>
        </GlassCard>
    );
}
