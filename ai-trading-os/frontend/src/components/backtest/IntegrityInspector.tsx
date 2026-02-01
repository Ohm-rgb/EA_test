'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { IndicatorControlPanel } from './IndicatorControlPanel';
import { ManagedIndicator } from '@/types/backtestTypes';
import { IndicatorCapability } from '@/types/indicatorCapability';
import { BotApi } from '@/services/botApi';

interface IntegrityInspectorProps {
    indicator: ManagedIndicator;
    capability: IndicatorCapability | null;
    onSave: (payload: any) => void;
}

interface CheckResult {
    id: string;
    label: string;
    valid: boolean;
    warning: boolean;
    message: string;
}

export function IntegrityInspector({ indicator, capability, onSave }: IntegrityInspectorProps) {
    const [isRunning, setIsRunning] = useState(false);
    const [deploying, setDeploying] = useState(false);
    const [report, setReport] = useState<any>(null);
    const [checks, setChecks] = useState<CheckResult[]>([]);

    const runChecks = useCallback(async () => {
        setIsRunning(true);
        try {
            const result = await BotApi.checkIntegrity(indicator.id);
            setReport(result);

            // Map Backend Logic to UI Checks
            const newChecks: CheckResult[] = [
                // Logic
                ...result.checks.logic.map((r: any) => ({
                    id: r.id,
                    label: r.id === 'signal_output' ? 'Logic Integrity' : 'Repaint Stress Test',
                    valid: r.status === 'pass',
                    warning: r.status === 'warning',
                    message: r.message
                })),
                // Params
                ...result.checks.params.map((r: any) => ({
                    id: r.id,
                    label: r.id === 'undefined_params' ? 'Parameter Completeness' : 'Range Validation',
                    valid: r.status === 'pass',
                    warning: r.status === 'warning',
                    message: r.message
                })),
                // Resource
                ...result.checks.resource.map((r: any) => ({
                    id: r.id,
                    label: 'Data Source Binding',
                    valid: r.status === 'pass',
                    warning: r.status === 'warning',
                    message: r.message
                })),
                // Script
                ...result.checks.script.map((r: any) => ({
                    id: r.id,
                    label: 'Script Syntax',
                    valid: r.status === 'pass',
                    warning: r.status === 'warning',
                    message: r.message
                }))
            ];
            setChecks(newChecks);
        } catch (error) {
            console.error(error);
        } finally {
            setIsRunning(false);
        }
    }, [indicator.id]);

    useEffect(() => {
        runChecks();
    }, [runChecks]);

    const handleDeploy = async () => {
        if (!window.confirm(`Deploy ${indicator.name} to ${indicator.boundBotIds.length} bots?`)) return;
        setDeploying(true);
        try {
            await BotApi.deployIndicator(indicator.id, ["all"]);
            alert('Deployed successfully to all bots.');
        } catch (err) {
            alert('Deployment failed.');
        } finally {
            setDeploying(false);
        }
    };

    const handleSnapshot = async () => {
        const note = prompt("Enter version note:");
        if (!note) return;
        await BotApi.snapshotIndicator(indicator.id, note);
        alert('Version snapshot created.');
    };

    const allPassed = checks.every(c => c.valid || c.warning);
    const hasWarnings = checks.some(c => c.warning);

    return (
        <div className="flex flex-col h-full bg-[var(--bg-secondary)] rounded-xl border border-[var(--glass-border)] shadow-xl overflow-hidden">
            {/* Header: Inspector Status */}
            <div className="p-4 bg-[var(--bg-tertiary)] border-b border-[var(--glass-border)] flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wide flex items-center gap-2">
                        <span>🛡️</span> Integrity Inspector
                    </h3>
                    <div className="text-[10px] text-[var(--text-muted)] mt-1">
                        Verifying {indicator.name} ({indicator.id})
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleSnapshot}
                        className="p-1 px-2 text-[10px] bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
                    >
                        📸 Snapshot
                    </button>
                    <div className={`px-2 py-1 rounded text-xs font-bold uppercase border flex items-center gap-1 ${isRunning ? 'animate-pulse bg-blue-500/10 border-blue-500/30 text-blue-400' :
                        allPassed
                            ? (hasWarnings ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400')
                            : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                        }`}>
                        {isRunning ? 'Checking...' : (allPassed ? (hasWarnings ? 'Verified (Warnings)' : 'Verified') : 'Issues Found')}
                        {!isRunning && <button onClick={runChecks} className="ml-1 hover:text-white">↻</button>}
                    </div>
                </div>
            </div>

            {/* Checklist Area (Pipeline Mode) */}
            <div className="p-4 bg-[var(--bg-primary)]/50 border-b border-[var(--glass-border)]">
                {/* Progress Bar */}
                {isRunning && (
                    <div className="w-full h-1 bg-[var(--bg-tertiary)] mb-4 overflow-hidden rounded-full">
                        <div className="h-full bg-blue-500 animate-progress-indeterminate"></div>
                    </div>
                )}

                {/* Horizontal Pipeline */}
                <div className="flex items-center justify-between relative">
                    {/* Connecting Line */}
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-[var(--bg-tertiary)] -z-10 transform -translate-y-1/2" />

                    {checks.map((check, index) => {
                        const isPending = isRunning && index >= checks.findIndex(c => !c.valid); // Simplified logic
                        return (
                            <div key={check.id} className="flex flex-col items-center gap-2 relative bg-[var(--bg-secondary)] px-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 ${isRunning
                                    ? 'border-blue-500 text-blue-400 animate-pulse bg-[var(--bg-secondary)]' // Active checking state
                                    : check.valid
                                        ? (check.warning ? 'bg-amber-500 text-white border-amber-600 shadow-[0_0_10px_rgba(245,158,11,0.4)]' : 'bg-emerald-500 text-white border-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.4)]')
                                        : 'bg-[var(--bg-primary)] text-rose-500 border-rose-500'
                                    }`}>
                                    {isRunning ? (index + 1) : (check.valid ? (check.warning ? '!' : '✓') : 'X')}
                                </div>

                                <div className="text-center w-24">
                                    <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">{check.label.split(' ')[0]}</div>
                                    <div className={`text-[9px] truncate transition-opacity duration-300 ${isRunning ? 'opacity-50' : 'opacity-100'} ${check.valid ? (check.warning ? 'text-amber-400' : 'text-[var(--text-muted)]') : 'text-rose-400 font-bold'
                                        }`}>
                                        {isRunning ? 'Checking...' : check.message}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Deployment Action */}
            {allPassed && (
                <div className="p-2 px-4 bg-emerald-900/10 border-b border-emerald-500/20 flex items-center justify-between">
                    <span className="text-[10px] text-emerald-400">System Ready for Deployment</span>
                    <button
                        onClick={handleDeploy}
                        disabled={deploying}
                        className="text-[10px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded shadow-lg shadow-emerald-900/20 transition-all"
                    >
                        {deploying ? 'Deploying...' : `🚀 Deploy to ${indicator.boundBotIds.length} Bots`}
                    </button>
                </div>
            )}

            {/* Config / Tuning Area */}
            <div className="flex-1 min-h-0 relative">
                {/* Overlay if failed */}
                {!allPassed && checks.length > 0 && !isRunning && (
                    <div className="absolute inset-0 bg-[var(--bg-primary)]/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-center p-6">
                        <div className="text-rose-500 text-4xl mb-2">⚠️</div>
                        <h4 className="text-lg font-bold text-[var(--text-primary)]">Integrity Check Failed</h4>
                        <p className="text-sm text-[var(--text-muted)] mt-2">
                            Please resolve the critical issues above before configuring parameters.
                        </p>
                    </div>
                )}

                {/* Control Panel (Reusing existing component) */}
                <IndicatorControlPanel
                    indicatorId={indicator.id}
                    capability={capability}
                    indicatorStatus={indicator.status}
                    boundBotIds={indicator.boundBotIds}
                    initialConfig={indicator.config || {}} // Use real config
                    onSave={onSave}
                />
            </div>
        </div>
    );
}
