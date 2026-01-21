import { useState } from 'react';
import { GlassCard, Button } from '@/components/ui';
import { pineScriptService, ParsedStrategy } from '@/services/pineScriptService';

interface PineScriptImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (strategy: ParsedStrategy) => void;
}

export function PineScriptImportModal({ isOpen, onClose, onImport }: PineScriptImportModalProps) {
    const [script, setScript] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<ParsedStrategy | null>(null);

    const handleAnalyze = async () => {
        if (!script.trim()) return;

        setIsAnalyzing(true);
        setResult(null);

        // Simulate minimum loading time for UX
        const startTime = Date.now();

        try {
            // Enable debug mode to see raw AI response
            const strategy = await pineScriptService.parseScript(script, true);

            // UX delay if too fast
            const elapsed = Date.now() - startTime;
            if (elapsed < 1500) await new Promise(r => setTimeout(r, 1500 - elapsed));

            // Log debug info
            console.log("🔍 Parse Result:", strategy);
            if (strategy.rawAiResponse) {
                console.log("🤖 Raw AI Response:", strategy.rawAiResponse);
            }

            setResult(strategy);

            if (strategy.status === 'success') {
                // Auto import on perfect success after a brief delay or immediately?
                // Better to let user review the "Success" state briefly or click "Apply"
                // For now, let's auto-close on success if user clicks "Apply"
            }
        } catch (e) {
            console.error("❌ Parse Error:", e);
            setResult({
                schemaVersion: '1.0',
                indicators: [],
                rules: [],
                status: 'failed',
                warning: e instanceof Error ? e.message : 'Unexpected error during analysis.'
            });
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleConfirmImport = () => {
        if (result) {
            onImport(result);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <GlassCard className="w-full max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden shadow-2xl border-white/10">
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[var(--bg-secondary)]">
                    <div>
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <span className="text-[var(--color-accent)]">⚡</span>
                            Import Strategy
                        </h3>
                        <p className="text-sm text-[var(--text-secondary)]">Generate Visual Logic from Pine Script Intent</p>
                    </div>
                    <button onClick={onClose} className="text-[var(--text-muted)] hover:text-white transition-colors">✕</button>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 overflow-y-auto space-y-6">
                    {/* Disclaimer Guardrail */}
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-start gap-3">
                        <span className="text-lg">⚠️</span>
                        <div>
                            <p className="text-amber-200 font-medium text-sm">AI Confidence Boundary</p>
                            <p className="text-amber-200/70 text-xs mt-1">
                                Strategy logic is approximated based on intent. Please review the generated nodes in the builder.
                            </p>
                        </div>
                    </div>

                    {!result && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[var(--text-secondary)]">Paste Pine Script Strategy</label>
                            <textarea
                                value={script}
                                onChange={(e) => setScript(e.target.value)}
                                className="w-full h-64 bg-[var(--bg-input)] border border-[var(--glass-border)] rounded-xl p-4 font-mono text-xs text-[var(--text-primary)] focus:border-[var(--color-accent)] outline-none resize-none"
                                placeholder="// Paste your TradingView strategy code here..."
                            />
                        </div>
                    )}

                    {/* Loading State */}
                    {isAnalyzing && (
                        <div className="flex flex-col items-center justify-center py-8 space-y-4">
                            <div className="relative w-16 h-16">
                                <div className="absolute inset-0 border-4 border-[var(--color-accent)]/20 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-[var(--color-accent)] rounded-full border-t-transparent animate-spin"></div>
                            </div>
                            <p className="text-[var(--text-primary)] animate-pulse">Extracting Trading Intent...</p>
                        </div>
                    )}

                    {/* Result State */}
                    {result && !isAnalyzing && (
                        <div className="space-y-4 animate-in slide-in-from-bottom-5">
                            <div className={`p-4 rounded-xl border ${result.status === 'success' ? 'bg-emerald-500/10 border-emerald-500/20' :
                                result.status === 'partial' ? 'bg-amber-500/10 border-amber-500/20' :
                                    'bg-red-500/10 border-red-500/20'
                                }`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className={`w-2 h-2 rounded-full ${result.status === 'success' ? 'bg-emerald-500' :
                                        result.status === 'partial' ? 'bg-amber-500' : 'bg-red-500'
                                        }`} />
                                    <span className={`font-bold ${result.status === 'success' ? 'text-emerald-400' :
                                        result.status === 'partial' ? 'text-amber-400' : 'text-red-400'
                                        }`}>
                                        {result.status === 'success' ? 'Strategy Logic Extracted' :
                                            result.status === 'partial' ? 'Partially Extracted' : 'Extraction Failed'}
                                    </span>
                                </div>
                                <p className="text-sm opacity-80">
                                    {result.status === 'success' ? 'All trading rules were mapped to nodes successfully.' :
                                        result.status === 'partial' ? (result.warning || 'Some complex logic was approximated.') :
                                            'Could not identify clear trading intent. Please check the script.'}
                                </p>
                            </div>

                            {/* Preview Summary */}
                            {result.status !== 'failed' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-[var(--bg-tertiary)] p-3 rounded-lg border border-[var(--glass-border)]">
                                        <label className="text-xs text-[var(--text-muted)] uppercase">Indicators Found</label>
                                        <div className="text-xl font-bold">{result.indicators.length}</div>
                                    </div>
                                    <div className="bg-[var(--bg-tertiary)] p-3 rounded-lg border border-[var(--glass-border)]">
                                        <label className="text-xs text-[var(--text-muted)] uppercase">Logic Blocks</label>
                                        <div className="text-xl font-bold">{result.rules.length}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/5 bg-[var(--bg-secondary)] flex justify-end gap-3">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>

                    {!result ? (
                        <Button
                            onClick={handleAnalyze}
                            disabled={!script.trim() || isAnalyzing}
                            className={isAnalyzing ? 'opacity-50' : ''}
                        >
                            {isAnalyzing ? 'Analyzing...' : 'Analyze Strategy'}
                        </Button>
                    ) : (
                        <div className="flex gap-3">
                            <Button variant="ghost" onClick={() => setResult(null)}>Retry</Button>
                            <Button
                                onClick={handleConfirmImport}
                                disabled={result.status === 'failed'}
                                variant={result.status === 'partial' ? 'danger' : 'primary'} // Visual cue for partial caution
                            >
                                {result.status === 'failed' ? 'Cannot Import' :
                                    result.status === 'partial' ? 'Import (Review Needed)' : 'Apply to Bot'}
                            </Button>
                        </div>
                    )}
                </div>
            </GlassCard>
        </div>
    );
}
