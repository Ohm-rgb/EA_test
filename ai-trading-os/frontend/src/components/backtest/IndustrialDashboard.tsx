'use client';

import { useState, useMemo, useEffect } from 'react';
import { StrategyPackage } from '@/types/strategyPackage';
import {
    ManagedIndicator,
    IndicatorStatus,
    BacktestResult,
    generateMockManagedIndicators,
} from '@/types/backtestTypes';
import { calculateBacktestMetrics } from '@/utils/backtestMetrics';
import { mapPackageToIndicator } from '@/utils/strategyMapper';

import { sliceTradesByPeriod } from '@/utils/reliabilityMetrics';
import { BacktestSummaryPanel } from './BacktestSummaryPanel';
import { EquityCurveChart } from './EquityCurveChart';
import { PerformanceSessionMatrix } from './PerformanceSessionMatrix'; // New
import { IntegrityInspector } from './IntegrityInspector'; // New
import { IndicatorManagementPanel } from './IndicatorManagementPanel';
import { IndicatorContextBar } from './IndicatorContextBar';
import { SmartMoneyConceptsCapability } from '@/services/capabilities/smc';
import { GenericCapability } from '@/services/capabilities/generic';
import { BotApi } from '@/services/botApi';

interface IndustrialDashboardProps {
    strategyPackages: StrategyPackage[];
    activeIndicatorId?: string | null;
    onIndicatorConfigure?: (indicator: ManagedIndicator) => void;
    onImportIndicator?: () => void;
}

export function IndustrialDashboard({
    strategyPackages,
    activeIndicatorId,
    onIndicatorConfigure,
    onImportIndicator
}: IndustrialDashboardProps) {
    // Phases
    const [trades, setTrades] = useState<any[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);

    // Indicators
    const [managedIndicators, setManagedIndicators] = useState<ManagedIndicator[]>([]);

    useEffect(() => {
        const mapped = strategyPackages.map(pkg => mapPackageToIndicator(pkg));
        setManagedIndicators(mapped);
    }, [strategyPackages]);

    // Context / Selection
    const [activeContextId, setActiveContextId] = useState<string | null>(null);
    const isFocusMode = activeContextId !== null;

    useEffect(() => {
        if (activeIndicatorId) {
            setActiveContextId(activeIndicatorId);
        }
    }, [activeIndicatorId]);

    const activeContextIndicator = useMemo(() =>
        managedIndicators.find(i => i.id === activeContextId) || null,
        [managedIndicators, activeContextId]
    );

    // Data Fetching
    useEffect(() => {
        async function fetchAndCalculate() {
            setIsLoadingData(true);
            try {
                const tradeData = await BotApi.getTrades({
                    sourceIndicatorId: activeContextId || undefined,
                    limit: 200
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

    // Filter Logic
    const filteredDistributions = useMemo(() => {
        if (!backtestResult) return null;
        return {
            sourceLabel: activeContextIndicator ? activeContextIndicator.name : 'All Indicators'
        };
    }, [backtestResult, activeContextIndicator]);

    // Handlers
    const handleStatusChange = (indicatorId: string, newStatus: IndicatorStatus) => {
        setManagedIndicators(prev =>
            prev.map(ind =>
                ind.id === indicatorId
                    ? { ...ind, status: newStatus, updatedAt: new Date() }
                    : ind
            )
        );
    };

    const handleConfigure = (indicator: ManagedIndicator) => {
        setActiveContextId(indicator.id);
        if (onIndicatorConfigure) onIndicatorConfigure(indicator);
    };

    const handleSaveConfig = async (payload: any) => {
        try {
            console.log('📦 Saving Indicator Config:', payload);
            await BotApi.updateIndicatorConfig(payload.indicator_id, {
                config: payload.config,
                context: payload.context
            });
            console.log("✅ Save confirmed by backend");
        } catch (error: any) {
            console.error("❌ Save Failed:", error);
            alert(`Failed to save configuration: ${error.message || 'Unknown error'}`);
        }
    };

    return (
        <div className="h-full flex flex-col bg-[var(--bg-primary)]">
            {/* Header / Context Bar */}
            <div className="flex-none z-10">
                <IndicatorContextBar
                    indicators={managedIndicators}
                    activeIndicatorId={activeContextId}
                    onSelect={setActiveContextId}
                    onImport={() => onImportIndicator && onImportIndicator()}
                />
            </div>

            {/* Main Grid */}
            <div className="flex-1 min-h-0 grid grid-cols-12 gap-4 relative">

                {/* Left: Analytics Lab */}
                <div className="col-span-7 flex flex-col min-h-0 border-r border-[var(--glass-border)] bg-[var(--bg-secondary)]/30 overflow-y-auto custom-scrollbar p-6 gap-6">

                    {/* 1. Backtest Summary (With Toggle UI hint handled by 'isFocusMode' logic implicitly for now) */}
                    <div className="flex-none">
                        {isFocusMode && (
                            <div className="flex items-center gap-2 mb-2 animate-in fade-in slide-in-from-left-2 duration-300">
                                <span className="text-[10px] text-[var(--color-accent)] bg-[var(--color-accent)]/10 px-2 py-0.5 rounded font-medium">
                                    📊 Focused Analysis: {activeContextIndicator?.name}
                                </span>
                            </div>
                        )}

                        {backtestResult ? (
                            <BacktestSummaryPanel
                                result={backtestResult}
                                isStale={
                                    activeContextIndicator?.configHash !== undefined &&
                                    activeContextIndicator.configHash !== backtestResult.strategySnapshotHash
                                }
                            />
                        ) : (
                            <div className="h-32 flex items-center justify-center bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border)]">
                                <span className="text-xs text-[var(--text-dim)] flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin"></div>
                                    Loading Analytics...
                                </span>
                            </div>
                        )}
                    </div>

                    {/* 2. Conditional Equity Curve (Hidden in Focus Mode) */}
                    {!isFocusMode && (
                        <div className="flex-none animate-in fade-in zoom-in-95 duration-300">
                            {backtestResult && (
                                <EquityCurveChart data={backtestResult.equityCurve} />
                            )}
                        </div>
                    )}

                    {/* 3. Performance Matrix (Replaces Risk Simulator) */}
                    <div className="flex-none">
                        <PerformanceSessionMatrix
                            trades={trades}
                            timezone="UTC+7" // Dynamic prop in future
                        />
                    </div>

                    {/* 4. Registry (With Bot Counts) */}
                    <div className="flex-1 min-h-[300px]">
                        <IndicatorManagementPanel
                            indicators={managedIndicators}
                            onStatusChange={handleStatusChange}
                            onConfigure={handleConfigure}
                        />
                    </div>
                </div>

                {/* Right: Integrity & Configuration */}
                <div className="col-span-5 flex flex-col bg-[var(--bg-secondary)] p-6 gap-6 overflow-hidden">
                    {activeContextIndicator ? (
                        // Focus Mode: Integrity Inspector -> Config
                        <div className="h-full flex flex-col animate-in slide-in-from-right-4 duration-300">
                            <IntegrityInspector
                                indicator={activeContextIndicator}
                                capability={
                                    activeContextIndicator.name.includes('Smart Money')
                                        ? SmartMoneyConceptsCapability
                                        : GenericCapability
                                }
                                onSave={handleSaveConfig}
                            />
                        </div>
                    ) : (
                        // Overview Mode: Empty State
                        <div className="h-full flex flex-col items-center justify-center p-8 text-center border border-dashed border-[var(--glass-border)] rounded-xl bg-[var(--bg-tertiary)]/30">
                            <div className="p-6 rounded-full bg-[var(--bg-tertiary)] mb-4 animate-pulse">
                                <span className="text-5xl opacity-50">🔬</span>
                            </div>
                            <h3 className="text-xl font-bold text-[var(--text-primary)]">Integrity Lab</h3>
                            <p className="text-sm text-[var(--text-muted)] mt-2 max-w-[280px]">
                                Select an indicator from the left panel to verify its logic, inspect performance, and configure parameters.
                            </p>
                            <div className="mt-6 flex flex-col gap-2 text-xs text-[var(--text-muted)] opacity-70">
                                <span>✓ Verification Check</span>
                                <span>✓ Session Analysis</span>
                                <span>✓ Parameter Tuning</span>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
