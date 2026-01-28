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
    const { indicatorPool, selectedItem, selectItem } = useBotStore();
    return (
        <div className="p-4 space-y-4">
            <h4 className="text-white text-sm font-bold">Indicator Inventory</h4>
            <p className="text-xs text-slate-400">
                Manage your tools here. Click an item to configure it in the Inspector Panel.
            </p>
            <div className="space-y-2">
                {indicatorPool.length === 0 ? (
                    <div className="text-center p-4 border border-dashed border-slate-700 rounded text-slate-500 text-xs">
                        No indicators in pool.
                        <br />
                        (Use the side panel to add)
                    </div>
                ) : (
                    indicatorPool.map(ind => {
                        const isSelected = selectedItem.type === 'indicator' && selectedItem.id === ind.id;
                        return (
                            <div
                                key={ind.id}
                                onClick={() => selectItem('indicator', ind.id)}
                                className={`
                                    p-2 rounded border flex justify-between items-center cursor-pointer transition-all
                                    ${isSelected
                                        ? 'bg-blue-900/30 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                                        : 'bg-slate-800 border-slate-700 hover:border-slate-500'}
                                `}
                            >
                                <span className={`text-xs font-mono font-bold ${isSelected ? 'text-blue-300' : 'text-slate-300'}`}>
                                    {ind.name}
                                </span>
                                <span className="text-slate-500 text-[10px]">{ind.indicatorId}</span>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

export function RiskPhase() {
    const { selectItem, selectedItem, riskConfig } = useBotStore();
    const isSelected = selectedItem.type === 'risk';
    return (
        <div
            onClick={() => selectItem('risk')}
            className={`
                p-4 text-center cursor-pointer transition-all h-full
                ${isSelected ? 'bg-amber-900/10' : ''}
            `}
        >
            <h4 className="text-slate-400 text-sm font-bold mb-2">Risk Management</h4>
            <div className={`
                p-4 border rounded bg-slate-800/50 transition-colors
                ${isSelected ? 'border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : 'border-slate-700'}
            `}>
                <p className="text-xs mb-2">Configure Stop Loss & Risk %</p>
                <div className="flex gap-2 justify-center text-xs text-emerald-400 font-mono">
                    <span>RISK: {riskConfig.riskPerTrade}%</span>
                    <span>SL: {riskConfig.stopLoss}</span>
                </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-2">(Click to Configure)</p>
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
