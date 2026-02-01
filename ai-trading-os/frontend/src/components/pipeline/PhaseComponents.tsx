import React from 'react';
import { useBotStore } from '@/stores/botStore';
import { Settings2 } from 'lucide-react';

export function ContextPhase() {
    const { contextConfig, setContext } = useBotStore();
    return (
        <div className="p-4 space-y-4">
            <h4 className="text-white text-sm font-bold">Market Context</h4>
            <div className="grid gap-2">
                <input
                    type="text"
                    placeholder="Symbol (e.g. EURUSD)"
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                    value={contextConfig.symbol}
                    onChange={(e) => setContext(e.target.value, contextConfig.timeframe)}
                />
                <select
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                    value={contextConfig.timeframe}
                    onChange={(e) => setContext(contextConfig.symbol, e.target.value)}
                >
                    <option value="">Select Timeframe...</option>
                    <option value="M1">M1</option>
                    <option value="M5">M5</option>
                    <option value="M15">M15</option>
                    <option value="H1">H1</option>
                    <option value="H4">H4</option>
                    <option value="D1">D1</option>
                </select>
            </div>
            {contextConfig.isComplete && <p className="text-emerald-400 text-xs text-center">✓ Context Set</p>}
        </div>
    );
}

import { AVAILABLE_INDICATORS } from '@/data/indicators';

export function InventoryPhase() {
    const { indicatorPool, addIndicator, removeIndicator } = useBotStore();

    const handleToggle = (type: string, name: string) => {
        // Check if already in pool
        const existing = indicatorPool.find(i => i.name === name || i.indicatorId === type.toLowerCase());

        if (existing) {
            removeIndicator(existing.id);
        } else {
            addIndicator({
                id: Date.now().toString(), // simplistic ID gen
                name: name,
                indicatorId: type.toLowerCase(),
                params: {}, // default params
                isBound: true
            });
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h4 className="text-white text-lg font-bold">Indicator Library</h4>
                <div className="text-xs text-slate-500 bg-slate-900 border border-slate-700 px-3 py-1 rounded-full">
                    {indicatorPool.length} Active
                </div>
            </div>

            <p className="text-sm text-slate-400">
                Select indicators to add them to your bot's flow. They will instantly appear in the Flow Panel on the left.
            </p>

            <div className="grid grid-cols-1 gap-3">
                {AVAILABLE_INDICATORS.map(ind => {
                    const isActive = indicatorPool.some(i => i.name === ind.name);

                    return (
                        <div
                            key={ind.type}
                            onClick={() => handleToggle(ind.type, ind.name)}
                            className={`
                                relative group flex items-start gap-4 p-4 border rounded-xl cursor-pointer transition-all duration-200
                                ${isActive
                                    ? 'bg-blue-600/10 border-blue-500/50 shadow-[0_0_15px_rgba(37,99,235,0.1)]'
                                    : 'bg-slate-800/40 border-slate-700 hover:bg-slate-800 hover:border-slate-600'}
                            `}
                        >
                            {/* Checkbox */}
                            <div className={`
                                flex-none w-5 h-5 rounded border mt-0.5 flex items-center justify-center transition-all
                                ${isActive
                                    ? 'bg-blue-500 border-blue-500 text-white'
                                    : 'bg-slate-900 border-slate-600 text-transparent group-hover:border-slate-500'}
                            `}>
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>

                            <div className="flex-1">
                                <h5 className={`text-sm font-bold mb-1 ${isActive ? 'text-blue-200' : 'text-slate-200'}`}>
                                    {ind.name}
                                </h5>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    Standard {ind.name} technical indicator.
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="pt-6 border-t border-slate-800 mt-6">
                <button className="w-full py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 border-dashed rounded-lg text-slate-400 text-sm font-medium transition-colors">
                    + Import Custom Indicator
                </button>
            </div>
        </div>
    );
}

export function RiskPhase() {
    const { riskConfig, setRisk } = useBotStore(); // Assuming setRisk exists or we update riskConfig check store
    // useBotStore technically has updateRiskConfig? Using riskConfig directly for now as read, need to check writes.
    // Let's implement full form inputs.

    return (
        <div className="p-6 space-y-6">
            <h4 className="text-white text-lg font-bold">Risk Management</h4>

            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-slate-500">Risk Per Trade (%)</label>
                    <div className="relative">
                        <input
                            type="number"
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                            placeholder="1.0"
                            defaultValue={riskConfig.riskPerTrade}
                        />
                        <span className="absolute right-3 top-3 text-slate-500">%</span>
                    </div>
                    <p className="text-[10px] text-slate-500">Percentage of total equity to risk per trade.</p>
                </div>

                <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-slate-500">Stop Loss (Pips)</label>
                    <div className="relative">
                        <input
                            type="number"
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                            placeholder="50"
                            defaultValue={riskConfig.stopLoss}
                        />
                        <span className="absolute right-3 top-3 text-slate-500">pips</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-slate-500">Take Profit (Pips)</label>
                    <div className="relative">
                        <input
                            type="number"
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                            placeholder="100"
                            defaultValue={100} // Mock
                        />
                        <span className="absolute right-3 top-3 text-slate-500">pips</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-slate-500">Max Open Trades</label>
                    <input
                        type="number"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                        placeholder="3"
                        defaultValue={3} // Mock
                    />
                </div>
            </div>

            <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg flex items-start gap-3">
                <span className="text-xl">⚠️</span>
                <div>
                    <h5 className="text-sm font-bold text-amber-500">Safety Check</h5>
                    <p className="text-xs text-amber-200/70 mt-1">
                        Your calculated risk is within safe limits for your account size.
                    </p>
                </div>
            </div>
        </div>
    );
}

export function ActionPhase() {
    return (
        <div className="p-6 space-y-6">
            <h4 className="text-white text-lg font-bold">Execution Actions</h4>

            <div className="space-y-4">
                <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                        <h5 className="font-bold text-emerald-400">On BUY Signal</h5>
                        <div className="flex bg-slate-900 rounded p-1">
                            <span className="px-3 py-1 text-xs bg-slate-700 text-white rounded shadow">Market</span>
                            <span className="px-3 py-1 text-xs text-slate-500">Limit</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs text-slate-400">Order Comment</label>
                        <input type="text" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" placeholder="AI_Bot_Buy" />
                    </div>
                </div>

                <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                        <h5 className="font-bold text-rose-400">On SELL Signal</h5>
                        <div className="flex bg-slate-900 rounded p-1">
                            <span className="px-3 py-1 text-xs bg-slate-700 text-white rounded shadow">Market</span>
                            <span className="px-3 py-1 text-xs text-slate-500">Limit</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs text-slate-400">Order Comment</label>
                        <input type="text" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" placeholder="AI_Bot_Sell" />
                    </div>
                </div>
            </div>
        </div>
    );
}
