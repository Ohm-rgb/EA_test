'use client';

import { useState, useMemo } from 'react';
import { StrategyPackage } from '@/types/strategyPackage';
import {
    ManagedIndicator,
    IndicatorStatus,
    BacktestResult,
    TradeDistribution,
    IndicatorDistributionData,
    generateMockBacktestResult,
    generateMockManagedIndicators,
    generateIndicatorDistributions
} from '@/types/backtestTypes';
import { BacktestSummaryPanel } from './BacktestSummaryPanel';
import { EquityCurveChart } from './EquityCurveChart';
import { IndicatorManagementPanel } from './IndicatorManagementPanel';
import { IndicatorControlPanel } from './IndicatorControlPanel';
import { IndicatorContextBar } from './IndicatorContextBar';
import { SmartMoneyConceptsCapability } from '@/services/capabilities/smc';
import { BotApi } from '@/services/botApi';

interface IndustrialDashboardProps {
    strategyPackages: StrategyPackage[];
    onIndicatorConfigure?: (indicator: ManagedIndicator) => void;
    onImportIndicator?: () => void;  // Opens Pine Script Import modal
}

/**
 * Industrial Dashboard - Post-conversion control layer
 * Decision console for Backtesting & Indicator Management
 * 
 * @responsibility Import → Configure → Activate indicators
 * @gate Only Active indicators visible in Strategy Configuration
 * @important No live execution from this page
 */
export function IndustrialDashboard({
    strategyPackages,
    onIndicatorConfigure,
    onImportIndicator
}: IndustrialDashboardProps) {
    // Phase 1: Mock data (backend-ready interfaces)
    const [backtestResult] = useState<BacktestResult>(() =>
        generateMockBacktestResult('bot_alpha', 'AlphaBot')
    );

    const [managedIndicators, setManagedIndicators] = useState<ManagedIndicator[]>(() =>
        generateMockManagedIndicators()
    );

    // Per-indicator distribution data (generated once)
    const [indicatorDistributions] = useState<IndicatorDistributionData[]>(() =>
        generateIndicatorDistributions(
            generateMockManagedIndicators().map(ind => ({ id: ind.id, name: ind.name }))
        )
    );

    // Get active indicators (Used for filtering)
    const activeIndicators = useMemo(() =>
        managedIndicators.filter(ind => ind.status === 'active'),
        [managedIndicators]
    );

    // State for Global Context
    const [activeContextId, setActiveContextId] = useState<string | null>(null);

    // Derived: Selected Indicator Logic
    const activeContextIndicator = useMemo(() =>
        managedIndicators.find(i => i.id === activeContextId) || null,
        [managedIndicators, activeContextId]
    );

    // Filter distributions/metrics based on Context
    const filteredDistributions = useMemo(() => {
        // If specific indicator selected, filter to it. Else show all active.
        const targetIds = activeContextId
            ? [activeContextId]
            : activeIndicators.map(ind => ind.id); // Default to all ACTIVE indicators

        if (targetIds.length === 0) {
            return {
                dayOfWeek: backtestResult.dayOfWeekDistribution,
                hourOfDay: backtestResult.hourOfDayDistribution,
                sourceLabel: 'All Indicators'
            };
        }

        const activeDistributions = indicatorDistributions.filter(
            d => targetIds.includes(d.indicatorId)
        );

        if (activeDistributions.length === 0) {
            return {
                dayOfWeek: backtestResult.dayOfWeekDistribution,
                hourOfDay: backtestResult.hourOfDayDistribution,
                sourceLabel: activeContextId ? 'Selected (No Data)' : 'All Indicators'
            };
        }

        // Aggregate 
        const aggregateDayOfWeek: Record<string, { count: number; winSum: number }> = {};
        const aggregateHourOfDay: Record<string, { count: number; winSum: number }> = {};

        activeDistributions.forEach(dist => {
            dist.dayOfWeekDistribution.forEach(d => {
                if (!aggregateDayOfWeek[d.label]) {
                    aggregateDayOfWeek[d.label] = { count: 0, winSum: 0 };
                }
                aggregateDayOfWeek[d.label].count += d.count;
                aggregateDayOfWeek[d.label].winSum += d.winRate * d.count;
            });

            dist.hourOfDayDistribution.forEach(d => {
                if (!aggregateHourOfDay[d.label]) {
                    aggregateHourOfDay[d.label] = { count: 0, winSum: 0 };
                }
                aggregateHourOfDay[d.label].count += d.count;
                aggregateHourOfDay[d.label].winSum += d.winRate * d.count;
            });
        });

        const dayOfWeek: TradeDistribution[] = Object.entries(aggregateDayOfWeek).map(([label, data]) => ({
            label,
            count: data.count,
            winRate: data.count > 0 ? Math.round((data.winSum / data.count) * 10) / 10 : 0
        }));

        const hourOfDay: TradeDistribution[] = Object.entries(aggregateHourOfDay).map(([label, data]) => ({
            label,
            count: data.count,
            winRate: data.count > 0 ? Math.round((data.winSum / data.count) * 10) / 10 : 0
        }));

        const sourceLabel = activeContextId
            ? (managedIndicators.find(i => i.id === activeContextId)?.name || 'Unknown')
            : `${activeIndicators.length} Active Indicators`;

        return { dayOfWeek, hourOfDay, sourceLabel };
    }, [activeContextId, activeIndicators, indicatorDistributions, backtestResult, managedIndicators]);

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

    // Handle configure indicator (List click adapter)
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
                        {/* Mocking contextual data change by title/opacity for now */}
                        <div className={`transition-opacity duration-300 ${activeContextId ? 'opacity-100' : 'opacity-90'}`}>
                            <BacktestSummaryPanel result={backtestResult} />
                        </div>
                    </div>

                    {/* Equity Curve (Context Aware) */}
                    <div className="flex-none">
                        <EquityCurveChart
                            data={backtestResult.equityCurve}
                            height={220}
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
                                backtestHash={backtestResult.strategySnapshotHash}
                                isBotRunning={backtestResult.botId === 'bot_running_mock'} // Mock running check

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

                    {/* Quick Stats Panel */}
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

                    {/* Control Layer Notice */}
                    <div className="industrial-panel-sm bg-amber-500/5 border-amber-500/20 flex-none">
                        <div className="flex items-start gap-2">
                            <span className="text-lg">⚠️</span>
                            <div>
                                <h4 className="text-xs font-medium text-amber-400">
                                    Control Layer Only
                                </h4>
                                <p className="text-[10px] text-[var(--text-muted)] mt-1">
                                    This dashboard is for configuration and binding. Live execution happens in Bot Control panel.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
