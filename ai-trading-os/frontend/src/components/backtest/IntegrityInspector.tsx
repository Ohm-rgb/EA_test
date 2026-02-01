'use client';

import { useState, useMemo } from 'react';
import { IndicatorControlPanel } from './IndicatorControlPanel';
import { ManagedIndicator } from '@/types/backtestTypes';
import { IndicatorCapability } from '@/types/indicatorCapability';

interface IntegrityInspectorProps {
    indicator: ManagedIndicator;
    capability: IndicatorCapability | null;
    onSave: (payload: any) => void;
}

export function IntegrityInspector({ indicator, capability, onSave }: IntegrityInspectorProps) {
    // Mock Integrity Check Logic
    const checks = useMemo(() => {
        const isDraft = indicator.status === 'draft';
        const hasLogic = indicator.configHash !== 'empty'; // Mock check
        const hasParams = indicator.id !== 'undefined';

        return [
            { id: 'logic', label: 'Logic Integrity', valid: hasLogic, message: hasLogic ? 'Signal logic compiled' : 'Missing signal logic' },
            { id: 'params', label: 'Parameter Completeness', valid: hasParams, message: hasParams ? 'All inputs defined' : 'Undefined inputs detected' },
            { id: 'source', label: 'Data Source Binding', valid: true, message: 'Connected to XAUUSD:M15' }, // Mock
        ];
    }, [indicator]);

    const allPassed = checks.every(c => c.valid);

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
                <div className={`px-2 py-1 rounded text-xs font-bold uppercase border ${allPassed
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                    }`}>
                    {allPassed ? 'Verified' : 'Issues Found'}
                </div>
            </div>

            {/* Checklist Area */}
            <div className="p-4 grid grid-cols-1 gap-2 bg-[var(--bg-primary)]/50 border-b border-[var(--glass-border)]">
                {checks.map(check => (
                    <div key={check.id} className="flex items-center gap-3 p-2 rounded hover:bg-[var(--bg-tertiary)]/50 transition-colors">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold border ${check.valid
                                ? 'bg-emerald-500 text-white border-emerald-600'
                                : 'bg-[var(--bg-primary)] text-rose-500 border-rose-500'
                            }`}>
                            {check.valid ? '✓' : '!'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-[var(--text-secondary)]">{check.label}</div>
                            <div className={`text-[10px] truncate ${check.valid ? 'text-[var(--text-muted)]' : 'text-rose-400'}`}>
                                {check.message}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Config / Tuning Area */}
            <div className="flex-1 min-h-0 relative">
                {/* Overlay if failed */}
                {!allPassed && (
                    <div className="absolute inset-0 bg-[var(--bg-primary)]/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-center p-6">
                        <div className="text-rose-500 text-4xl mb-2">⚠️</div>
                        <h4 className="text-lg font-bold text-[var(--text-primary)]">Integrity Check Failed</h4>
                        <p className="text-sm text-[var(--text-muted)] mt-2">
                            Please resolve the flagged issues in the Logic Builder before configuring this indicator.
                        </p>
                    </div>
                )}

                {/* Control Panel (Reusing existing component) */}
                <IndicatorControlPanel
                    indicatorId={indicator.id}
                    capability={capability}
                    indicatorStatus={indicator.status}
                    boundBotIds={indicator.boundBotIds}
                    initialConfig={{}} // Mock
                    onSave={onSave}
                />
            </div>
        </div>
    );
}
