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
import { TradeDistributionChart } from './TradeDistributionChart';

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

    // Get active indicators
    const activeIndicators = useMemo(() =>
        managedIndicators.filter(ind => ind.status === 'active'),
        [managedIndicators]
    );

    // Filter distributions by active indicators
    const filteredDistributions = useMemo(() => {
        const activeIds = activeIndicators.map(ind => ind.id);

        if (activeIds.length === 0) {
            // No active indicators - show all data (fallback)
            return {
                dayOfWeek: backtestResult.dayOfWeekDistribution,
                hourOfDay: backtestResult.hourOfDayDistribution,
                sourceLabel: 'All Indicators'
            };
        }

        // Filter to only active indicators
        const activeDistributions = indicatorDistributions.filter(
            d => activeIds.includes(d.indicatorId)
        );

        if (activeDistributions.length === 0) {
            return {
                dayOfWeek: backtestResult.dayOfWeekDistribution,
                hourOfDay: backtestResult.hourOfDayDistribution,
                sourceLabel: 'All Indicators'
            };
        }

        // Aggregate distributions from active indicators
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

        // Build source label
        const sourceLabel = activeIndicators.length === 1
            ? activeIndicators[0].name
            : `${activeIndicators.length} Active Indicators`;

        return { dayOfWeek, hourOfDay, sourceLabel };
    }, [activeIndicators, indicatorDistributions, backtestResult]);

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

    // Handle configure indicator
    const handleConfigure = (indicator: ManagedIndicator) => {
        if (onIndicatorConfigure) {
            onIndicatorConfigure(indicator);
        } else {
            // Default: just log for now
            console.log('Configure indicator:', indicator.name);
        }
    };

    return (
        <div className="h-full flex flex-col gap-4 p-6 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-bottom-2 duration-300 relative">
            {/* Corner Status Badge - System Indicator */}
            <div className="absolute top-2 right-3 flex items-center gap-2 text-[10px] text-[var(--text-muted)] opacity-60">
                {strategyPackages.length > 0 && (
                    <span>Pkg: {strategyPackages.length}</span>
                )}
                <span className="text-[var(--color-success)]">
                    ● {managedIndicators.filter(i => i.status === 'active').length}/{managedIndicators.length}
                </span>
            </div>

            {/* Main Grid Layout - Industrial Style */}
            <div className="flex-1 min-h-0 grid grid-cols-12 gap-4">
                {/* Left Column - Metrics & Analysis */}
                <div className="col-span-7 flex flex-col gap-4 min-h-0">
                    {/* Backtest Summary Panel */}
                    <div className="flex-none">
                        <BacktestSummaryPanel result={backtestResult} />
                    </div>

                    {/* Equity Curve Chart */}
                    <div className="flex-none">
                        <EquityCurveChart
                            data={backtestResult.equityCurve}
                            height={180}
                        />
                    </div>

                    {/* Indicator Management Panel */}
                    <div className="flex-1 min-h-0 overflow-hidden">
                        <IndicatorManagementPanel
                            indicators={managedIndicators}
                            onStatusChange={handleStatusChange}
                            onConfigure={handleConfigure}
                            onImportIndicator={onImportIndicator}
                        />
                    </div>
                </div>

                {/* Right Column - Distribution Charts */}
                <div className="col-span-5 flex flex-col gap-4">
                    {/* Day of Week Distribution */}
                    <TradeDistributionChart
                        title="Trade Distribution by Day"
                        data={filteredDistributions.dayOfWeek}
                        colorScheme="purple"
                        sourceLabel={filteredDistributions.sourceLabel}
                    />

                    {/* Hour of Day Distribution */}
                    <TradeDistributionChart
                        title="Trade Distribution by Hour"
                        data={filteredDistributions.hourOfDay}
                        colorScheme="cyan"
                        sourceLabel={filteredDistributions.sourceLabel}
                    />

                    {/* Quick Stats Panel */}
                    <div className="industrial-panel-sm flex-1">
                        <h4 className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">
                            Test Period Details
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <div className="text-[10px] text-[var(--text-muted)]">Start Date</div>
                                <div className="text-sm font-medium text-[var(--text-primary)]">
                                    {backtestResult.testPeriod.start.toLocaleDateString()}
                                </div>
                            </div>
                            <div>
                                <div className="text-[10px] text-[var(--text-muted)]">End Date</div>
                                <div className="text-sm font-medium text-[var(--text-primary)]">
                                    {backtestResult.testPeriod.end.toLocaleDateString()}
                                </div>
                            </div>
                            <div>
                                <div className="text-[10px] text-[var(--text-muted)]">Winning</div>
                                <div className="text-sm font-medium text-[var(--color-success)]">
                                    {backtestResult.winningTrades} trades
                                </div>
                            </div>
                            <div>
                                <div className="text-[10px] text-[var(--text-muted)]">Losing</div>
                                <div className="text-sm font-medium text-[var(--color-critical)]">
                                    {backtestResult.losingTrades} trades
                                </div>
                            </div>
                            <div>
                                <div className="text-[10px] text-[var(--text-muted)]">Gross Profit</div>
                                <div className="text-sm font-medium text-[var(--color-success)]">
                                    ${backtestResult.grossProfit.toLocaleString()}
                                </div>
                            </div>
                            <div>
                                <div className="text-[10px] text-[var(--text-muted)]">Gross Loss</div>
                                <div className="text-sm font-medium text-[var(--color-critical)]">
                                    ${backtestResult.grossLoss.toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Control Layer Notice */}
                    <div className="industrial-panel-sm bg-amber-500/5 border-amber-500/20">
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
