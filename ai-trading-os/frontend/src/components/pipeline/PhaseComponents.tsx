import React, { useState } from 'react';
import { useBotStore, useAvailableIndicators, useIndicatorActions } from '@/stores/botStore';
import { ChevronLeft, Info, CheckCircle2, PlusCircle, RefreshCw, Cloud, Database } from 'lucide-react';
import { AVAILABLE_INDICATORS } from '@/data/indicators';

// =============================================================================
// CONTEXT PHASE - Market Setup
// =============================================================================

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

// =============================================================================
// INVENTORY PHASE - Indicator Management (SYNCED with Performance View)
// =============================================================================

export function InventoryPhase() {
    const {
        indicatorPool,
        addIndicator,
        removeIndicator,
        selectedItem,
        selectItem,
        updateIndicatorParams,
        isLoadingIndicators,
        lastSyncAt
    } = useBotStore();

    const availableIndicators = useAvailableIndicators();
    const indicatorActions = useIndicatorActions();

    // View Mode: 'library' (local templates) or 'cloud' (API indicators)
    const [viewSource, setViewSource] = useState<'library' | 'cloud'>('cloud');

    // 1. Determine Mode: Tuning vs Library
    const activeIndicatorID = selectedItem?.type === 'indicator' ? selectedItem.id : null;
    const activeIndicator = indicatorPool.find(i => i.id === activeIndicatorID);

    // =========================================================================
    // MODE: TUNING (If an indicator is selected)
    // =========================================================================
    if (activeIndicator) {
        return (
            <div className="p-6 space-y-6 h-full flex flex-col">
                {/* Header / Nav */}
                <div className="flex items-center gap-2 mb-2">
                    <button
                        onClick={() => selectItem(null)}
                        className="p-1 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h4 className="text-white text-lg font-bold">Configure {activeIndicator.name}</h4>
                </div>

                {/* Configuration Form */}
                <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl space-y-4">
                        <div className="flex items-start gap-3">
                            <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Adjust the parameters for this indicator. Changes will affect how the bot analyzes market data.
                            </p>
                        </div>
                    </div>

                    {/* Indicator Info */}
                    <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="font-mono bg-slate-800 px-2 py-0.5 rounded">ID: {activeIndicator.indicatorId}</span>
                            <span className={`px-2 py-0.5 rounded ${activeIndicator.status === 'ready' ? 'bg-green-500/10 text-green-400' :
                                    activeIndicator.status === 'active' ? 'bg-blue-500/10 text-blue-400' :
                                        'bg-yellow-500/10 text-yellow-400'
                                }`}>
                                {activeIndicator.status}
                            </span>
                        </div>
                    </div>

                    {/* Common Parameters */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase">Period / Length</label>
                            <input
                                type="number"
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-colors"
                                value={typeof activeIndicator.params?.period === 'number' ? activeIndicator.params.period : 14}
                                onChange={(e) => updateIndicatorParams(activeIndicator.id, { period: parseInt(e.target.value) })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase">Source Type</label>
                            <select
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-colors"
                                value={typeof activeIndicator.params?.source === 'string' ? activeIndicator.params.source : 'close'}
                                onChange={(e) => updateIndicatorParams(activeIndicator.id, { source: e.target.value })}
                            >
                                <option value="close">Close Price</option>
                                <option value="open">Open Price</option>
                                <option value="high">High Price</option>
                                <option value="low">Low Price</option>
                                <option value="hl2">(High + Low) / 2</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase">Shift / Offset</label>
                            <input
                                type="number"
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-colors"
                                value={typeof activeIndicator.params?.shift === 'number' ? activeIndicator.params.shift : 0}
                                onChange={(e) => updateIndicatorParams(activeIndicator.id, { shift: parseInt(e.target.value) })}
                            />
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-4 border-t border-slate-800">
                    <button
                        onClick={() => {
                            removeIndicator(activeIndicator.id);
                            selectItem(null);
                        }}
                        className="w-full py-2.5 text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-rose-500/20"
                    >
                        Remove from Flow
                    </button>
                </div>
            </div>
        );
    }

    // =========================================================================
    // MODE: LIBRARY (Default - Show both local and cloud indicators)
    // =========================================================================
    return (
        <div className="p-6 space-y-6 h-full flex flex-col">
            {/* Header with Source Toggle */}
            <div className="flex items-center justify-between">
                <h4 className="text-white text-lg font-bold">Indicator Inventory</h4>
                <div className="flex items-center gap-2">
                    {/* Source Toggle */}
                    <div className="flex bg-slate-900 border border-slate-700 rounded-lg p-0.5">
                        <button
                            onClick={() => setViewSource('cloud')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${viewSource === 'cloud'
                                    ? 'bg-blue-600 text-white'
                                    : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            <Cloud className="w-3.5 h-3.5" />
                            My Indicators
                        </button>
                        <button
                            onClick={() => setViewSource('library')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${viewSource === 'library'
                                    ? 'bg-blue-600 text-white'
                                    : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            <Database className="w-3.5 h-3.5" />
                            Templates
                        </button>
                    </div>

                    {/* Refresh Button */}
                    <button
                        onClick={() => indicatorActions.refresh()}
                        disabled={isLoadingIndicators}
                        className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-all disabled:opacity-50"
                        title="Refresh from server"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoadingIndicators ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Active Count Badge */}
            <div className="flex items-center justify-between">
                <div className="text-xs text-slate-500">
                    {viewSource === 'cloud'
                        ? `${availableIndicators.length} available • ${indicatorPool.length} in flow`
                        : `${AVAILABLE_INDICATORS.length} templates`
                    }
                </div>
                {lastSyncAt && (
                    <div className="text-[10px] text-slate-600">
                        Synced: {lastSyncAt.toLocaleTimeString()}
                    </div>
                )}
            </div>

            {/* Loading State */}
            {isLoadingIndicators && (
                <div className="flex items-center justify-center py-8">
                    <div className="flex items-center gap-2 text-slate-400">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Loading indicators...</span>
                    </div>
                </div>
            )}

            {/* ================================================================= */}
            {/* CLOUD VIEW: Indicators from API (synced with Performance) */}
            {/* ================================================================= */}
            {viewSource === 'cloud' && !isLoadingIndicators && (
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                    {availableIndicators.length === 0 ? (
                        <div className="text-center py-10 text-slate-600 border border-dashed border-slate-800 rounded-xl bg-slate-900/50">
                            <Cloud className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">No indicators found</p>
                            <p className="text-xs mt-1 opacity-50">Import or create one in Performance view</p>
                        </div>
                    ) : (
                        availableIndicators.map(ind => {
                            const isInFlow = indicatorPool.some(p => p.id === ind.id || p.indicatorId === ind.indicatorId);

                            return (
                                <div
                                    key={ind.id}
                                    className={`
                                        relative group flex items-center gap-4 p-4 border rounded-xl transition-all duration-200
                                        ${isInFlow
                                            ? 'bg-blue-600/10 border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                                            : 'bg-slate-800/40 border-slate-700 hover:bg-slate-800 hover:border-slate-600'
                                        }
                                    `}
                                >
                                    {/* Icon / Status */}
                                    <div className={`
                                        flex-none w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold transition-all
                                        ${isInFlow ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400'}
                                    `}>
                                        {ind.name.substring(0, 2).toUpperCase()}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h5 className={`text-sm font-bold truncate ${isInFlow ? 'text-blue-200' : 'text-slate-200'}`}>
                                            {ind.name}
                                        </h5>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] text-slate-500 font-mono">{ind.type}</span>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${ind.status === 'ready' ? 'bg-green-500/10 text-green-400' :
                                                    ind.status === 'active' ? 'bg-blue-500/10 text-blue-400' :
                                                        'bg-yellow-500/10 text-yellow-400'
                                                }`}>
                                                {ind.status}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <button
                                        onClick={async () => {
                                            if (isInFlow) {
                                                await indicatorActions.unbind(ind.indicatorId || ind.id);
                                            } else {
                                                await indicatorActions.bind(ind.indicatorId || ind.id);
                                            }
                                        }}
                                        className={`
                                            flex-none px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                                            ${isInFlow
                                                ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20'
                                                : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20'
                                            }
                                        `}
                                    >
                                        {isInFlow ? 'Remove' : 'Add to Flow'}
                                    </button>

                                    {/* Active Indicator */}
                                    {isInFlow && (
                                        <div className="absolute right-2 top-2">
                                            <CheckCircle2 className="w-4 h-4 text-blue-400" />
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* ================================================================= */}
            {/* LIBRARY VIEW: Local Templates (for quick add) */}
            {/* ================================================================= */}
            {viewSource === 'library' && !isLoadingIndicators && (
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                    {AVAILABLE_INDICATORS.map(ind => {
                        const isActive = indicatorPool.some(i => i.name === ind.name || i.type === ind.type);

                        return (
                            <div
                                key={ind.type}
                                className={`
                                    relative group flex items-start gap-4 p-4 border rounded-xl transition-all duration-200
                                    ${isActive
                                        ? 'bg-blue-600/5 border-blue-500/30'
                                        : 'bg-slate-800/40 border-slate-700 hover:bg-slate-800 hover:border-slate-500 hover:shadow-lg cursor-pointer'}
                                `}
                                onClick={() => {
                                    if (!isActive) {
                                        addIndicator({
                                            id: `local_${Date.now()}`,
                                            name: ind.name,
                                            indicatorId: ind.type.toLowerCase(),
                                            type: ind.type,
                                            status: 'draft',
                                            params: { period: 14, source: 'close' },
                                            isBound: true,
                                            isEnabled: true,
                                        });
                                    }
                                }}
                            >
                                {/* Icon / Status */}
                                <div className={`
                                    flex-none w-10 h-10 rounded-lg flex items-center justify-center transition-all
                                    ${isActive ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-900 text-slate-500 group-hover:bg-blue-600 group-hover:text-white'}
                                `}>
                                    {isActive ? <CheckCircle2 className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
                                </div>

                                <div className="flex-1">
                                    <h5 className={`text-sm font-bold mb-1 ${isActive ? 'text-blue-200' : 'text-slate-200'}`}>
                                        {ind.name}
                                    </h5>
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        {ind.description}
                                    </p>
                                    <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-500 border border-slate-800">
                                        {ind.category}
                                    </span>
                                </div>

                                {isActive && (
                                    <span className="absolute top-4 right-4 text-[10px] uppercase font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded">
                                        In Flow
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Footer */}
            <div className="pt-4 border-t border-slate-800">
                <p className="text-[10px] text-center text-slate-600">
                    {viewSource === 'cloud'
                        ? '☁️ Indicators sync with Performance view'
                        : '📚 Templates create local indicators'
                    }
                </p>
            </div>
        </div>
    );
}

// =============================================================================
// RISK PHASE - Risk Management
// =============================================================================

export function RiskPhase() {
    const { riskConfig, setRisk } = useBotStore();

    return (
        <div className="p-4 space-y-6">
            <h4 className="text-white text-sm font-bold">Risk Parameters</h4>

            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase flex justify-between">
                        <span>Risk Per Trade</span>
                        <span className="text-blue-400">{riskConfig.riskPerTrade}%</span>
                    </label>
                    <input
                        type="range"
                        min="0.1"
                        max="10"
                        step="0.1"
                        value={riskConfig.riskPerTrade}
                        onChange={(e) => setRisk({ riskPerTrade: parseFloat(e.target.value) })}
                        className="w-full accent-blue-500"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase">Stop Loss (pips)</label>
                    <input
                        type="number"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                        value={riskConfig.stopLoss}
                        onChange={(e) => setRisk({ stopLoss: parseInt(e.target.value) })}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase flex justify-between">
                        <span>Reward Ratio</span>
                        <span className="text-emerald-400">1:{riskConfig.rewardRatio}</span>
                    </label>
                    <input
                        type="range"
                        min="1"
                        max="5"
                        step="0.5"
                        value={riskConfig.rewardRatio}
                        onChange={(e) => setRisk({ rewardRatio: parseFloat(e.target.value) })}
                        className="w-full accent-emerald-500"
                    />
                </div>
            </div>

            {/* Visual Preview */}
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                <h5 className="text-xs font-bold text-slate-500 mb-3">Position Preview</h5>
                <div className="flex items-center justify-between text-xs">
                    <div className="text-rose-400">
                        <span className="font-mono">SL: -{riskConfig.stopLoss} pips</span>
                    </div>
                    <div className="text-slate-500">Entry</div>
                    <div className="text-emerald-400">
                        <span className="font-mono">TP: +{riskConfig.stopLoss * riskConfig.rewardRatio} pips</span>
                    </div>
                </div>
                <div className="mt-2 h-2 bg-slate-800 rounded-full relative overflow-hidden">
                    <div
                        className="absolute left-0 h-full bg-rose-500/50 rounded-l-full"
                        style={{ width: `${100 / (1 + riskConfig.rewardRatio)}%` }}
                    />
                    <div
                        className="absolute right-0 h-full bg-emerald-500/50 rounded-r-full"
                        style={{ width: `${(riskConfig.rewardRatio * 100) / (1 + riskConfig.rewardRatio)}%` }}
                    />
                </div>
            </div>
        </div>
    );
}

// =============================================================================
// ACTION PHASE - Trade Execution
// =============================================================================

export function ActionPhase() {
    return (
        <div className="p-4 space-y-4">
            <h4 className="text-white text-sm font-bold">Execution Actions</h4>

            <div className="space-y-3">
                <div className="p-4 bg-emerald-900/20 border border-emerald-700/30 rounded-xl">
                    <h5 className="text-emerald-400 text-xs font-bold uppercase mb-2">On Buy Signal</h5>
                    <select className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm">
                        <option value="market_buy">Market Buy</option>
                        <option value="limit_buy">Limit Buy</option>
                        <option value="alert_only">Alert Only</option>
                    </select>
                </div>

                <div className="p-4 bg-rose-900/20 border border-rose-700/30 rounded-xl">
                    <h5 className="text-rose-400 text-xs font-bold uppercase mb-2">On Sell Signal</h5>
                    <select className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm">
                        <option value="market_sell">Market Sell</option>
                        <option value="limit_sell">Limit Sell</option>
                        <option value="alert_only">Alert Only</option>
                    </select>
                </div>
            </div>

            <div className="p-3 bg-amber-900/10 border border-amber-700/20 rounded-lg">
                <p className="text-xs text-amber-400/80 text-center">
                    ⚠️ Live trading requires MT5 connection
                </p>
            </div>
        </div>
    );
}
