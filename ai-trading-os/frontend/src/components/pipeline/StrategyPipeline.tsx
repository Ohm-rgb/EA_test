import React, { useMemo } from 'react';
import { useBotStore } from '@/stores/botStore';
import { RuleBuilder } from './RuleBuilder';
import { ContextPhase, InventoryPhase, RiskPhase, ActionPhase } from './PhaseComponents';

type Phase = 'context' | 'inventory' | 'logic' | 'risk' | 'action';

const PHASES: Phase[] = ['context', 'inventory', 'logic', 'risk', 'action'];

export function StrategyPipeline() {
    const {
        contextConfig,
        indicatorPool,
        ruleSets,
        riskConfig,
        actionConfig
    } = useBotStore();

    // -------------------------------------------------------------------------
    // SYSTEM CONSTRAINT: Phase Completeness Logic
    // -------------------------------------------------------------------------
    const phaseStatus = useMemo(() => {
        const status = {
            context: !!(contextConfig.symbol && contextConfig.timeframe),
            inventory: indicatorPool.length > 0,
            logic: (ruleSets.buy.length > 0 || ruleSets.sell.length > 0),
            risk: !!(riskConfig.riskPerTrade > 0 && riskConfig.stopLoss > 0),
            action: !!(actionConfig.onBuy || actionConfig.onSell) // Strict check for actions
        };
        return status;
    }, [contextConfig, indicatorPool, ruleSets, riskConfig, actionConfig]);

    // -------------------------------------------------------------------------
    // SYSTEM CONSTRAINT: Phase Access Control
    // -------------------------------------------------------------------------
    const canAccess = (phase: Phase) => {
        const index = PHASES.indexOf(phase);
        if (index === 0) return true; // Context always accessible

        // Access if previous complete OR if this phase is already complete (re-visiting)
        const prevPhase = PHASES[index - 1];
        return phaseStatus[prevPhase] || phaseStatus[phase];
    };

    return (
        <div className="w-full h-full flex flex-col bg-slate-900 overflow-hidden">
            {/* Pipeline Header / Progress Bar */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-900/50">
                {PHASES.map((phase, i) => {
                    const isComplete = phaseStatus[phase];
                    const isAccessible = canAccess(phase);

                    return (
                        <div key={phase} className={`flex items-center ${i < PHASES.length - 1 ? 'flex-1' : ''}`}>
                            {/* Node */}
                            <div className={`
                                relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 
                                text-xs font-bold transition-all duration-300
                                ${isComplete ? 'bg-emerald-500 border-emerald-500 text-white' :
                                    isAccessible ? 'bg-slate-800 border-blue-500 text-blue-200 shadow-[0_0_10px_rgba(59,130,246,0.5)]' :
                                        'bg-slate-800 border-slate-700 text-slate-600'}
                            `}>
                                {isComplete ? '✓' : i + 1}
                            </div>

                            {/* Label */}
                            <div className="ml-2 mr-4">
                                <span className={`text-xs uppercase tracking-wider font-semibold ${isAccessible ? 'text-slate-200' : 'text-slate-600'
                                    }`}>
                                    {phase}
                                </span>
                            </div>

                            {/* Connector Line */}
                            {i < PHASES.length - 1 && (
                                <div className={`flex-1 h-0.5 mx-2 ${isComplete ? 'bg-emerald-500/50' : 'bg-slate-800'
                                    }`} />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Pipeline Content Area */}
            <div className="flex-1 relative overflow-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 h-full">
                    {PHASES.map((phase) => (
                        <div
                            key={phase}
                            className={`
                                relative flex flex-col border rounded-lg p-4 h-full transition-opacity duration-300
                                ${canAccess(phase)
                                    ? 'opacity-100 border-slate-700 bg-slate-800/20'
                                    : 'opacity-40 border-slate-800 bg-slate-900/10 pointer-events-none grayscale'}
                            `}
                        >
                            <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase">{phase}</h3>

                            {/* Access Denied Overlay removed for better UX on revisit */}

                            {/* Content Slot */}
                            <div className="flex-1 overflow-hidden flex flex-col relative">
                                {phase === 'context' && <ContextPhase />}
                                {phase === 'inventory' && <InventoryPhase />}
                                {phase === 'logic' && <RuleBuilder />}
                                {phase === 'risk' && <RiskPhase />}
                                {phase === 'action' && <ActionPhase />}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
