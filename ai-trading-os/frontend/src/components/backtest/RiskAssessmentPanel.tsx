'use client';

import { useState, useMemo } from 'react';
import { Trade } from '@/types/backtestTypes';
import { simulateRisk, detectKillZones, calculateDrawdownSeries } from '@/utils/riskMetrics';
import { sliceTradesByPeriod } from '@/utils/reliabilityMetrics';
import { EquityCurveChart } from './EquityCurveChart';
import { DrawdownChart } from './DrawdownChart';

interface RiskAssessmentPanelProps {
    trades: Trade[];
    initialCapital?: number;
}

export function RiskAssessmentPanel({ trades, initialCapital = 10000 }: RiskAssessmentPanelProps) {
    const [riskPercent, setRiskPercent] = useState(1.0); // Default 1%

    // Derived Simulation
    const simulation = useMemo(() => {
        return simulateRisk(trades, initialCapital, riskPercent);
    }, [trades, riskPercent, initialCapital]);

    // Derived Kill Zones (on Base Data or Simulated? "Kill Zone" detection implies base reliability failures)
    // But Risk Panel should show if *Simulation* survives.
    // Let's use Base Kill Zones for valid context warnings.
    const basePeriods = useMemo(() => sliceTradesByPeriod(trades, 'week'), [trades]);
    const killZones = useMemo(() => detectKillZones(basePeriods), [basePeriods]);

    const isHighRisk = riskPercent >= 3;

    return (
        <div className="industrial-panel space-y-6 border-l-4 border-l-[var(--color-primary)]">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-xl">🛡️</span>
                    <div>
                        <h3 className="text-base font-bold text-[var(--text-primary)] uppercase tracking-wide">
                            Risk Assessment Simulator
                        </h3>
                        <p className="text-[10px] text-[var(--text-muted)]">
                            Monte Carlo-lite: Simulating Fixed Fractional Sizing on historical sequence
                        </p>
                    </div>
                </div>

                {/* Survival Badge */}
                <div className={`px-4 py-2 rounded border ${simulation.isRuined
                        ? 'bg-[var(--color-critical)]/10 border-[var(--color-critical)] text-[var(--color-critical)]'
                        : 'bg-emerald-500/10 border-emerald-500 text-emerald-500'
                    }`}>
                    <div className="text-xs uppercase font-bold tracking-wider">
                        {simulation.isRuined ? 'SYSTEM RUINED' : 'SURVIVAL PROBABILITY'}
                    </div>
                    {simulation.isRuined ? (
                        <div className="text-lg font-black mt-1">💀 FAILED</div>
                    ) : (
                        <div className="flex items-baseline gap-1 mt-1">
                            <span className="text-xl font-black">{simulation.survivalScore}</span>
                            <span className="text-xs opacity-70">/100</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-12 gap-6 bg-[var(--bg-tertiary)]/30 p-4 rounded-lg border border-[var(--glass-border)]">
                <div className="col-span-4 flex flex-col justify-center">
                    <label className="text-xs text-[var(--text-muted)] font-medium mb-2 block uppercase">
                        Risk per Trade (Fixed %)
                    </label>
                    <div className="flex items-center gap-4">
                        <input
                            type="range"
                            min="0.1"
                            max="5.0"
                            step="0.1"
                            value={riskPercent}
                            onChange={(e) => setRiskPercent(parseFloat(e.target.value))}
                            className="flex-1 h-2 bg-[var(--bg-secondary)] rounded-lg appearance-none cursor-pointer accent-[var(--color-accent)]"
                        />
                        <div className="w-16 text-right font-mono font-bold text-lg text-[var(--color-accent)]">
                            {riskPercent.toFixed(1)}%
                        </div>
                    </div>
                    {isHighRisk && (
                        <div className="mt-2 text-[10px] text-amber-500 flex items-center gap-1">
                            <span>⚠️</span> High risk setting may lead to catastrophic drawdowns.
                        </div>
                    )}
                </div>

                {/* Simulation Key Stats */}
                <div className="col-span-8 grid grid-cols-3 gap-4 border-l border-[var(--glass-border)] pl-6">
                    <div>
                        <div className="text-[10px] text-[var(--text-muted)]">Projected Final Equity</div>
                        <div className={`text-lg font-bold ${simulation.finalBalance >= initialCapital ? 'text-emerald-400' : 'text-rose-400'}`}>
                            ${simulation.finalBalance.toLocaleString()}
                        </div>
                        <div className="text-[10px] opacity-60">vs Base: ${Math.round(initialCapital + trades.reduce((sum, t) => sum + (t.profit || 0), 0)).toLocaleString()}</div>
                    </div>
                    <div>
                        <div className="text-[10px] text-[var(--text-muted)]">Max Drawdown</div>
                        <div className={`text-lg font-bold ${simulation.maxDrawdownPercent > 20 ? 'text-rose-500' : (simulation.maxDrawdownPercent > 15 ? 'text-amber-500' : 'text-emerald-400')}`}>
                            -{simulation.maxDrawdownPercent.toFixed(2)}%
                        </div>
                        <div className="text-[10px] opacity-60">Safety Limit: 15%</div>
                    </div>
                    <div>
                        <div className="text-[10px] text-[var(--text-muted)]">Detected Kill Zones</div>
                        <div className="flex -space-x-2 mt-1">
                            {killZones.length > 0 ? (
                                killZones.slice(0, 3).map((kz, i) => (
                                    <div key={i} className="w-6 h-6 rounded-full bg-rose-500 border border-[var(--bg-primary)] flex items-center justify-center text-[8px] font-bold text-white z-10" title={kz.periodLabel}>
                                        !
                                    </div>
                                ))
                            ) : (
                                <span className="text-sm text-emerald-500 font-medium">None ✅</span>
                            )}
                            {killZones.length > 3 && (
                                <div className="w-6 h-6 rounded-full bg-[var(--bg-tertiary)] border border-[var(--glass-border)] flex items-center justify-center text-[8px] text-[var(--text-muted)] z-0">
                                    +{killZones.length - 3}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Visualizations */}
            <div className="grid grid-cols-1 gap-6">
                {/* Simulated Equity */}
                <div>
                    <div className="flex justify-between mb-1">
                        <span className="text-[10px] text-[var(--text-muted)] uppercase">Simulated Growth Curve</span>
                        <span className="text-[10px] text-[var(--text-muted)]">Comparing {riskPercent}% Risk vs Base</span>
                    </div>
                    <EquityCurveChart data={simulation.equityCurve} height={200} />
                </div>

                {/* Underwater Chart */}
                <div>
                    <div className="flex justify-between mb-1">
                        <span className="text-[10px] text-[var(--text-muted)] uppercase">Underwater Depth (Drawdown)</span>
                    </div>
                    <DrawdownChart data={simulation.drawdownCurve} height={150} />
                </div>
            </div>

            {/* Disclaimer */}
            <div className="text-[10px] text-[var(--text-muted)] italic text-center opacity-60">
                * Simulation assumes historical trades represent uniform risk units. Past performance is not indicative of future results.
            </div>
        </div>
    );
}
