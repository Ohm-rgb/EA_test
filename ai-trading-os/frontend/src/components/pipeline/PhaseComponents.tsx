import React from 'react';
import { useBotStore } from '@/stores/botStore';

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

export function InventoryPhase() {
    const { indicatorPool } = useBotStore();
    return (
        <div className="p-4 space-y-4">
            <h4 className="text-white text-sm font-bold">Indicator Inventory</h4>
            <p className="text-xs text-slate-400">
                Manage your tools here. Add indicators from the side panel (simulated for now).
            </p>
            <div className="space-y-2">
                {indicatorPool.length === 0 ? (
                    <div className="text-center p-4 border border-dashed border-slate-700 rounded text-slate-500 text-xs">
                        No indicators in pool.
                        <br />
                        (Use the side panel to add)
                    </div>
                ) : (
                    indicatorPool.map(ind => (
                        <div key={ind.id} className="bg-slate-800 p-2 rounded border border-slate-700 flex justify-between items-center">
                            <span className="text-blue-300 text-xs font-mono">{ind.name}</span>
                            <span className="text-slate-500 text-[10px]">{ind.indicatorId}</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export function RiskPhase() {
    return (
        <div className="p-4 text-center text-slate-500">
            <h4 className="text-slate-400 text-sm font-bold mb-2">Risk Management</h4>
            <div className="p-4 border border-slate-700 rounded bg-slate-800/50">
                <p className="text-xs mb-2">Configure Stop Loss & Risk %</p>
                {/* Mock Inputs */}
                <div className="flex gap-2 justify-center text-xs text-emerald-400 font-mono">
                    <span>RISK: 1.0%</span>
                    <span>SL: 50 PIP</span>
                </div>
            </div>
        </div>
    );
}

export function ActionPhase() {
    return (
        <div className="p-4 text-center text-slate-500">
            <h4 className="text-slate-400 text-sm font-bold mb-2">Trade Actions</h4>
            <div className="p-4 border border-slate-700 rounded bg-slate-800/50">
                <p className="text-xs mb-2">Define Execution Logic</p>
                {/* Mock Actions */}
                <div className="flex flex-col gap-2 text-xs text-blue-400 font-mono">
                    <span>BUY: MARKET ORDER</span>
                    <span>SELL: MARKET ORDER</span>
                </div>
            </div>
        </div>
    );
}
