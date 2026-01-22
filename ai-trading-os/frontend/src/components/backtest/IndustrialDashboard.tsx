'use client';

import { useState } from 'react';
import { StrategyPackage } from '@/types/strategyPackage';
import {
    ManagedIndicator,
    IndicatorStatus,
    BacktestResult,
    generateMockBacktestResult,
    generateMockManagedIndicators
} from '@/types/backtestTypes';
import { BacktestSummaryPanel } from './BacktestSummaryPanel';
import { EquityCurveChart } from './EquityCurveChart';
import { IndicatorManagementPanel } from './IndicatorManagementPanel';
import { TradeDistributionChart } from './TradeDistributionChart';

interface IndustrialDashboardProps {
    strategyPackages: StrategyPackage[];
    onIndicatorConfigure?: (indicator: ManagedIndicator) => void;
}

/**
 * Industrial Dashboard - Post-conversion control layer
 * Decision console for Backtesting & Indicator Management
 * 
 * @important No live execution from this page
 * @important Configuration & binding only
 */
export function IndustrialDashboard({
    strategyPackages,
    onIndicatorConfigure
}: IndustrialDashboardProps) {
    // Phase 1: Mock data (backend-ready interfaces)
    const [backtestResult] = useState<BacktestResult>(() =>
        generateMockBacktestResult('bot_alpha', 'AlphaBot')
    );

    const [managedIndicators, setManagedIndicators] = useState<ManagedIndicator[]>(() =>
        generateMockManagedIndicators()
    );

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
        <div className="h-full flex flex-col gap-4 p-6 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Dashboard Header */}
            <div className="flex-none flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">🏭</span>
                    <div>
                        <h2 className="text-lg font-bold text-[var(--text-primary)]">
                            Industrial Control Dashboard
                        </h2>
                        <p className="text-xs text-[var(--text-muted)]">
                            Post-conversion analysis & indicator management
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Strategy Packages Count */}
                    {strategyPackages.length > 0 && (
                        <div className="px-3 py-1.5 rounded bg-[var(--bg-tertiary)] border border-[var(--glass-border)]">
                            <span className="text-xs text-[var(--text-muted)]">Packages: </span>
                            <span className="text-sm font-bold text-[var(--color-accent)]">
                                {strategyPackages.length}
                            </span>
                        </div>
                    )}
                    {/* Active Indicators Count */}
                    <div className="px-3 py-1.5 rounded bg-[var(--bg-tertiary)] border border-[var(--glass-border)]">
                        <span className="text-xs text-[var(--text-muted)]">Active: </span>
                        <span className="text-sm font-bold text-[var(--color-success)]">
                            {managedIndicators.filter(i => i.status === 'active').length}/{managedIndicators.length}
                        </span>
                    </div>
                </div>
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
                        />
                    </div>
                </div>

                {/* Right Column - Distribution Charts */}
                <div className="col-span-5 flex flex-col gap-4">
                    {/* Day of Week Distribution */}
                    <TradeDistributionChart
                        title="Trade Distribution by Day"
                        data={backtestResult.dayOfWeekDistribution}
                        colorScheme="purple"
                    />

                    {/* Hour of Day Distribution */}
                    <TradeDistributionChart
                        title="Trade Distribution by Hour"
                        data={backtestResult.hourOfDayDistribution}
                        colorScheme="cyan"
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
