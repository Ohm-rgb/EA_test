'use client';

import { useState, useMemo, useEffect } from 'react';
import { StrategyPackage } from '@/types/strategyPackage';
import {
    ManagedIndicator,
    IndicatorStatus,
    BacktestResult,
    TradeDistribution,
    IndicatorDistributionData,
    generateMockManagedIndicators,
} from '@/types/backtestTypes';
import { calculateBacktestMetrics } from '@/utils/backtestMetrics';
import { mapPackageToIndicator } from '@/utils/strategyMapper';

import { sliceTradesByPeriod } from '@/utils/reliabilityMetrics';
import { BacktestSummaryPanel } from './BacktestSummaryPanel';
import { EquityCurveChart } from './EquityCurveChart';
import { ReliabilityPanel } from './ReliabilityPanel';
import { RiskAssessmentPanel } from './RiskAssessmentPanel';
import { TradeDistributionChart } from './TradeDistributionChart';
import { IndicatorManagementPanel } from './IndicatorManagementPanel';
import { IndicatorControlPanel } from './IndicatorControlPanel';
import { IndicatorContextBar } from './IndicatorContextBar';
import { SmartMoneyConceptsCapability } from '@/services/capabilities/smc';
import { BotApi } from '@/services/botApi';

interface IndustrialDashboardProps {
    strategyPackages: StrategyPackage[];
    activeIndicatorId?: string | null;  // New Prop
    onIndicatorConfigure?: (indicator: ManagedIndicator) => void;
    onImportIndicator?: () => void;
}


export function IndustrialDashboard({
    strategyPackages,
    activeIndicatorId,
    onIndicatorConfigure,
    onImportIndicator
}: IndustrialDashboardProps) {
    // Phase C1: Real Data Binding
    const [trades, setTrades] = useState<any[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);


    // State: Managed Indicators (Mapped from StrategyPackages)
    const [managedIndicators, setManagedIndicators] = useState<ManagedIndicator[]>([]);

    // Sync StrategyPackages -> ManagedIndicators
    useEffect(() => {
        const mapped = strategyPackages.map(pkg => mapPackageToIndicator(pkg));
        setManagedIndicators(mapped);
    }, [strategyPackages]);

    // State for Global Context
    const [activeContextId, setActiveContextId] = useState<string | null>(null);

    // Sync Prop -> Internal State
    useEffect(() => {
        if (activeIndicatorId) {
            setActiveContextId(activeIndicatorId);
        }
    }, [activeIndicatorId]);

    // Active Context Object
    const activeContextIndicator = useMemo(() =>
        managedIndicators.find(i => i.id === activeContextId) || null,
        [managedIndicators, activeContextId]
    );

    // ... (Keep existing data fetching logic)

    // Fetch Trades & Calculate Metrics whenever Context Changes
    useEffect(() => {
        async function fetchAndCalculate() {
            setIsLoadingData(true);
            try {
                const tradeData = await BotApi.getTrades({
                    sourceIndicatorId: activeContextId || undefined,
                    limit: 200  // Backend max limit is 200
                });
                setTrades(tradeData);

                const metrics = calculateBacktestMetrics(
                    tradeData,
                    'bot_alpha',
                    'AlphaBot',
                    activeContextIndicator?.configHash || 'initial_hash'
                );
                setBacktestResult(metrics);

            } catch (error) {
                console.error("Failed to fetch backtest data:", error);
            } finally {
                setIsLoadingData(false);
            }
        }

        fetchAndCalculate();
    }, [activeContextId, activeContextIndicator?.configHash]);

    // ... (Keep filteredDistributions and reliabilityPeriods logic)
    const filteredDistributions = useMemo(() => {
        if (!backtestResult) return null;
        return {
            dayOfWeek: backtestResult.dayOfWeekDistribution,
            hourOfDay: backtestResult.hourOfDayDistribution,
            sourceLabel: activeContextIndicator ? activeContextIndicator.name : 'All Indicators'
        };
    }, [backtestResult, activeContextIndicator]);

    const reliabilityPeriods = useMemo(() => {
        if (!trades || trades.length === 0) return [];
        return sliceTradesByPeriod(trades, 'week');
    }, [trades]);

    // Handle indicator status change (explicit user action only)
    const handleStatusChange = (indicatorId: string, newStatus: IndicatorStatus) => {
        setManagedIndicators(prev =>
            prev.map(ind =>
                ind.id === indicatorId
                    ? { ...ind, status: newStatus, updatedAt: new Date() }
                    : ind
            )
        );
    };

    // Handle configure
    const handleConfigure = (indicator: ManagedIndicator) => {
        setActiveContextId(indicator.id);
        if (onIndicatorConfigure) {
            onIndicatorConfigure(indicator);
        }
    };


    return (
        <div className="h-full flex flex-col bg-[var(--bg-primary)]">
            {/* 1. Control Desk Header (Indicator Context) */}
            <div className="flex-none z-10">
                <IndicatorContextBar
                    indicators={managedIndicators}
                    activeIndicatorId={activeContextId}
                    onSelect={setActiveContextId}
                    onImport={() => onImportIndicator && onImportIndicator()}
                />
            </div>

            {/* 2. Main Dashboard Grid */}
            <div className="flex-1 min-h-0 grid grid-cols-12 gap-4 relative">

                {/* Left Column: Metrics & Analysis (Scrollable) */}
                <div className="col-span-7 flex flex-col min-h-0 border-r border-[var(--glass-border)] bg-[var(--bg-secondary)]/30 overflow-y-auto custom-scrollbar p-6 gap-6">

                    {/* Backtest Summary (Context Aware) */}
                    <div className="flex-none">
                        {/* Context Badge */}
                        {activeContextId && filteredDistributions && (
                            <div className="flex items-center gap-2 mb-2 animate-in fade-in slide-in-from-left-2 duration-300">
                                <span className="text-[10px] text-[var(--color-accent)] bg-[var(--color-accent)]/10 px-2 py-0.5 rounded font-medium">
                                    📊 Filtered: {filteredDistributions.sourceLabel}
                                </span>
                            </div>
                        )}
                        <div className={`transition-opacity duration-300 ${activeContextId ? 'opacity-100' : 'opacity-90'}`}>
                            {backtestResult ? (
                                <BacktestSummaryPanel
                                    result={backtestResult}
                                    isStale={
                                        activeContextIndicator?.configHash !== undefined &&
                                        activeContextIndicator.configHash !== backtestResult.strategySnapshotHash
                                    }
                                />
                            ) : (
                                <div className="h-48 flex items-center justify-center bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border)]">
                                    <span className="text-[var(--color-text-dim)] flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin"></div>
                                        {isLoadingData ? 'Loading Backtest Data...' : 'No Data Available'}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Equity Curve (Context Filtered) */}
                    <div className="h-[400px]">
                        {backtestResult ? (
                            <EquityCurveChart
                                data={backtestResult.equityCurve}
                            />
                        ) : null}
                    </div>

                    {/* Reliability Layer (Phase C2) */}
                    <div className="flex-none">
                        <ReliabilityPanel
                            periods={reliabilityPeriods}
                            isLoading={isLoadingData}
                        />
                    </div>

                    {/* Risk Layer (Phase C3) */}
                    <div className="flex-none">
                        <RiskAssessmentPanel
                            trades={trades}
                            initialCapital={10000}
                        />
                    </div>

                    {/* Trade Distributions (Context Filtered) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <TradeDistributionChart
                            title="Trade Distribution by Day"
                            data={filteredDistributions?.dayOfWeek || []}
                            sourceLabel={filteredDistributions?.sourceLabel}
                        />
                        <TradeDistributionChart
                            title="Trade Distribution by Hour"
                            data={filteredDistributions?.hourOfDay || []}
                            sourceLabel={filteredDistributions?.sourceLabel}
                        />
                    </div>

                    {/* Management List (Keep for bulk view) */}
                    <div className="flex-1 min-h-[300px]">
                        <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-4 flex items-center gap-2">
                            <span>📚</span> All Indicators Registry
                        </h4>
                        <IndicatorManagementPanel
                            indicators={managedIndicators}
                            onStatusChange={handleStatusChange}
                            onConfigure={handleConfigure}
                        />
                    </div>
                </div>

                {/* Right Column: Control Panel (Context Driven) */}
                <div className="col-span-5 flex flex-col bg-[var(--bg-secondary)] p-6 gap-6 overflow-y-auto custom-scrollbar">

                    {/* Active Control Panel */}
                    <div className="flex-1 min-h-0 flex flex-col">
                        {activeContextIndicator ? (
                            <IndicatorControlPanel
                                indicatorId={activeContextIndicator.id}
                                capability={
                                    activeContextIndicator.name.includes('Smart Money')
                                        ? SmartMoneyConceptsCapability
                                        : { ...SmartMoneyConceptsCapability, id: 'generic_cap' }
                                }
                                initialConfig={{}} // Would load from indicator.config

                                // Context Passing
                                boundBotIds={activeContextIndicator.boundBotIds}
                                indicatorStatus={activeContextIndicator.status}
                                backtestHash={backtestResult?.strategySnapshotHash} // Safe access
                                isBotRunning={backtestResult?.botId === 'bot_running_mock'} // Mock running check

                                onSave={async (payload) => {
                                    try {
                                        console.log('📦 Saving Indicator Config:', payload);
                                        await BotApi.updateIndicatorConfig(payload.indicator_id, {
                                            config: payload.config,
                                            context: payload.context
                                        });
                                        // In a real app, use a Toast here. For now:
                                        console.log("✅ Save confirmed by backend");
                                        // Optional: Refresh indicators to update 'updated_at' or status
                                    } catch (error: any) {
                                        console.error("❌ Save Failed:", error);
                                        alert(`Failed to save configuration: ${error.message || 'Unknown error'}`);
                                    }
                                }}
                            />
                        ) : (
                            // Empty State / Overview State
                            <div className="h-full flex flex-col items-center justify-center p-8 text-center border border-dashed border-[var(--glass-border)] rounded-xl bg-[var(--bg-tertiary)]/30">
                                <div className="p-4 rounded-full bg-[var(--bg-tertiary)] mb-4 animate-pulse">
                                    <span className="text-4xl opacity-50">👆</span>
                                </div>
                                <h3 className="text-lg font-medium text-[var(--text-primary)]">Select Context to Configure</h3>
                                <p className="text-sm text-[var(--text-muted)] mt-2 max-w-[280px]">
                                    Use the <b>Context Bar</b> at the top or select from the list on the left to configure a specific indicator.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Quick Stats Panel (Only show if data exists) */}
                    {backtestResult && (
                        <div className="industrial-panel-sm flex-none">
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
                                    Test Period Details
                                </h4>
                                <span className="text-[10px] text-[var(--color-accent)]">{backtestResult.testPeriod.start.toLocaleDateString()} - {backtestResult.testPeriod.end.toLocaleDateString()}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <div className="text-[10px] text-[var(--text-muted)]">Win Rate</div>
                                    <div className="text-sm font-medium text-[var(--color-success)]">
                                        {Math.round((backtestResult.winningTrades / backtestResult.totalTrades) * 100)}%
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-[var(--text-muted)]">Net Profit</div>
                                    <div className={`text-sm font-medium ${backtestResult.netProfit >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-critical)]'}`}>
                                        ${backtestResult.netProfit.toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Control Layer Notice */}
                    <div className="industrial-panel-sm bg-amber-500/5 border-amber-500/20 flex-none">
                        <div className="flex items-start gap-2">
                            <span className="text-lg">⚠️</span>
                            <div>
                                <h4 className="text-xs font-medium text-amber-400">
                                    Control Layer Only
                                </h4>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );

}
