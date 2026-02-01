import React, { useMemo } from 'react';
import { useBotStore } from '@/stores/botStore';
import { RuleBuilder } from './RuleBuilder';
import { ContextPhase, InventoryPhase, RiskPhase, ActionPhase } from './PhaseComponents';

type Phase = 'context' | 'inventory' | 'logic' | 'risk' | 'action';

const PHASES: Phase[] = ['context', 'inventory', 'logic', 'risk', 'action'];

import {
    LayoutTemplate,
    Package,
    GitMerge,
    ShieldAlert,
    Zap
} from 'lucide-react';

export function StrategyPipeline() {
    const {
        contextConfig,
        indicatorPool,
        ruleSets,
        riskConfig,
        actionConfig
    } = useBotStore();

    // Active Step State (Internal to this panel now)
    const [activeTab, setActiveTab] = React.useState<Phase>('context');

    const phaseStatus = useMemo(() => {
        return {
            context: !!(contextConfig.symbol && contextConfig.timeframe),
            inventory: indicatorPool.length > 0,
            logic: (ruleSets.buy.length > 0 || ruleSets.sell.length > 0),
            risk: !!(riskConfig.riskPerTrade > 0 && riskConfig.stopLoss > 0),
            action: !!(actionConfig.onBuy || actionConfig.onSell)
        };
    }, [contextConfig, indicatorPool, ruleSets, riskConfig, actionConfig]);

    const tabs: { id: Phase; label: string; icon: React.ReactNode }[] = [
        { id: 'context', label: 'Context', icon: <LayoutTemplate className="w-4 h-4" /> },
        { id: 'inventory', label: 'Inventory', icon: <Package className="w-4 h-4" /> },
        { id: 'logic', label: 'Logic', icon: <GitMerge className="w-4 h-4" /> },
        { id: 'risk', label: 'Risk', icon: <ShieldAlert className="w-4 h-4" /> },
        { id: 'action', label: 'Action', icon: <Zap className="w-4 h-4" /> },
    ];

    return (
        <div className="w-full h-full flex flex-col bg-slate-900 border-l border-slate-700/50">
            {/* 1. Tab Switcher Header */}
            <div className="flex items-center justify-between p-2 bg-slate-950 border-b border-slate-800">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const isComplete = phaseStatus[tab.id];

                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            title={tab.label}
                            className={`
                                relative flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 group
                                ${isActive
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                                    : 'bg-transparent text-slate-500 hover:bg-slate-800 hover:text-slate-300'}
                            `}
                        >
                            {tab.icon}

                            {/* Status Dot */}
                            {isComplete && !isActive && (
                                <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full border-2 border-slate-950" />
                            )}

                            {/* Tooltip (Simple) */}
                            <span className="absolute -bottom-8 bg-slate-900 text-slate-200 text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none border border-slate-700">
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* 2. Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-900/50 p-4">
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="mb-4 flex items-center gap-2 pb-2 border-b border-white/5">
                        <span className="bg-slate-800 p-1.5 rounded text-blue-400">
                            {tabs.find(t => t.id === activeTab)?.icon}
                        </span>
                        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                            {tabs.find(t => t.id === activeTab)?.label} Configuration
                        </h3>
                    </div>

                    {activeTab === 'context' && <ContextPhase />}
                    {activeTab === 'inventory' && <InventoryPhase />}
                    {activeTab === 'logic' && <RuleBuilder />}
                    {activeTab === 'risk' && <RiskPhase />}
                    {activeTab === 'action' && <ActionPhase />}
                </div>
            </div>
        </div>
    );
}
