import React, { useState } from 'react';
import { useBotStore, useAvailableIndicators, useIndicatorActions, IndicatorInstance } from '@/stores/botStore';
import { ChevronLeft, Info, CheckCircle2, PlusCircle, RefreshCw, Cloud, Database, Code, Settings, TrendingUp } from 'lucide-react';
import { AVAILABLE_INDICATORS } from '@/data/indicators';
import { SmartMoneyConceptsCapability } from '@/services/capabilities/smc';
import { IndicatorCapability, Control } from '@/types/indicatorCapability';

// =============================================================================
// INDICATOR CONFIG COMPONENTS - Different forms for different indicator types
// =============================================================================

interface IndicatorConfigProps {
    indicator: IndicatorInstance;
    onUpdateParams: (id: string, params: Record<string, string | number | boolean>) => void;
    onSaveConfig?: (indicatorId: string, config: Record<string, string | number | boolean>) => Promise<boolean>;
}

// Helper function to get capability schema for indicator
function getCapabilityForIndicator(indicator: IndicatorInstance): IndicatorCapability | null {
    // Check if indicator has embedded capability schema in config
    const configSchema = indicator.config?.capability_schema;
    if (configSchema && typeof configSchema === 'object') {
        return configSchema as unknown as IndicatorCapability;
    }

    // Match by name for known indicators
    if (indicator.name?.includes('Smart Money') || indicator.name?.includes('SMC')) {
        return SmartMoneyConceptsCapability;
    }

    return null;
}

// Render a single control based on type
function renderCapabilityControl(
    control: Control,
    config: Record<string, string | number | boolean>,
    onChange: (key: string, value: string | number | boolean) => void
) {
    const value = config[control.bind] ?? ('default' in control ? control.default : undefined);

    switch (control.type) {
        case 'toggle':
            return (
                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                    <label className="text-sm font-medium text-slate-300">{control.label}</label>
                    <button
                        onClick={() => onChange(control.bind, !value)}
                        className={`w-12 h-6 rounded-full transition-colors relative flex items-center ${
                            value
                                ? 'bg-emerald-500/20 border border-emerald-500/50'
                                : 'bg-slate-900 border border-slate-700'
                        }`}
                    >
                        <span className={`w-4 h-4 rounded-full absolute transition-transform duration-200 ${
                            value
                                ? 'translate-x-7 bg-emerald-400'
                                : 'translate-x-1 bg-slate-500'
                        }`} />
                    </button>
                </div>
            );

        case 'select':
            return (
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">{control.label}</label>
                    <select
                        value={String(value ?? '')}
                        onChange={(e) => onChange(control.bind, e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-2.5 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                    >
                        {control.options.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
            );

        case 'number':
            return (
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">{control.label}</label>
                    <input
                        type="number"
                        value={typeof value === 'number' ? value : Number(value) || 0}
                        min={control.min}
                        max={control.max}
                        step={control.step}
                        onChange={(e) => onChange(control.bind, parseFloat(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-2.5 rounded-lg focus:outline-none focus:border-blue-500 transition-colors font-mono"
                    />
                </div>
            );

        case 'color':
            return (
                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                    <label className="text-sm font-medium text-slate-300">{control.label}</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="color"
                            value={String(value ?? '#000000')}
                            onChange={(e) => onChange(control.bind, e.target.value)}
                            className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
                        />
                        <span className="text-xs font-mono text-slate-500">{String(value)}</span>
                    </div>
                </div>
            );

        case 'text':
            return (
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">{control.label}</label>
                    <input
                        type="text"
                        value={String(value ?? '')}
                        onChange={(e) => onChange(control.bind, e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-2.5 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                    />
                </div>
            );

        default:
            return null;
    }
}

// Pine Script Indicator - With Capability Schema Support
function PineScriptConfig({ indicator, onUpdateParams, onSaveConfig }: IndicatorConfigProps) {
    const capability = getCapabilityForIndicator(indicator);
    const [localConfig, setLocalConfig] = useState<Record<string, string | number | boolean>>(indicator.config || indicator.params || {});
    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleConfigChange = (key: string, value: string | number | boolean) => {
        const newConfig = { ...localConfig, [key]: value };
        setLocalConfig(newConfig);
        setIsDirty(true);
        setSaveMessage(null);
        onUpdateParams(indicator.id, { [key]: value });
    };

    const handleSave = async () => {
        if (!onSaveConfig || !isDirty) return;

        setIsSaving(true);
        setSaveMessage(null);

        try {
            const success = await onSaveConfig(indicator.indicatorId || indicator.id, localConfig);
            if (success) {
                setIsDirty(false);
                setSaveMessage({ type: 'success', text: 'Configuration saved successfully!' });
                setTimeout(() => setSaveMessage(null), 3000);
            } else {
                setSaveMessage({ type: 'error', text: 'Failed to save configuration' });
            }
        } catch {
            setSaveMessage({ type: 'error', text: 'Error saving configuration' });
        } finally {
            setIsSaving(false);
        }
    };

    // If we have a capability schema, render the full config form
    if (capability) {
        return (
            <div className="space-y-6">
                {/* Header */}
                <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                    <div className="flex items-start gap-3">
                        <Code className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                        <div>
                            <h5 className="text-sm font-bold text-purple-300 mb-1">Pine Script Indicator</h5>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Configure the indicator parameters below. These settings control how the indicator analyzes the market.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Schema Version Info */}
                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <span>Schema: {capability.id}</span>
                    <span>•</span>
                    <span>v{capability.ui_version}</span>
                </div>

                {/* Render sections from capability schema */}
                {capability.sections.map(section => (
                    <div key={section.id} className="space-y-4">
                        <div className="border-b border-slate-700/50 pb-2">
                            <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wider">
                                {section.title}
                            </h4>
                            {section.description && (
                                <p className="text-xs text-slate-500 mt-1">{section.description}</p>
                            )}
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            {section.controls.map(control => (
                                <div key={control.id}>
                                    {renderCapabilityControl(control, localConfig, handleConfigChange)}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Save Button */}
                {onSaveConfig && (
                    <div className="pt-4 border-t border-slate-700/50 space-y-3">
                        {saveMessage && (
                            <div className={`p-3 rounded-lg text-sm ${
                                saveMessage.type === 'success'
                                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                                    : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                            }`}>
                                {saveMessage.text}
                            </div>
                        )}
                        <button
                            onClick={handleSave}
                            disabled={!isDirty || isSaving}
                            className={`w-full py-3 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                                isDirty && !isSaving
                                    ? 'bg-blue-600 hover:bg-blue-500 text-white'
                                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                        >
                            {isSaving ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    💾 Save Configuration
                                </>
                            )}
                        </button>
                        {isDirty && (
                            <p className="text-[10px] text-amber-400 text-center">
                                ⚠️ You have unsaved changes
                            </p>
                        )}
                    </div>
                )}
            </div>
        );
    }

    // Fallback: No capability schema - show read-only display
    return (
        <div className="space-y-4">
            <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                <div className="flex items-start gap-3">
                    <Code className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                    <div>
                        <h5 className="text-sm font-bold text-purple-300 mb-1">Pine Script Indicator</h5>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            This indicator is defined by Pine Script code. No configuration schema is available.
                        </p>
                    </div>
                </div>
            </div>

            {/* Display current params if any */}
            {Object.keys(indicator.params || {}).length > 0 && (
                <div className="space-y-3">
                    <h5 className="text-xs font-bold text-slate-400 uppercase">Current Parameters</h5>
                    <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-2">
                        {Object.entries(indicator.params).map(([key, value]) => (
                            <div key={key} className="flex justify-between items-center text-sm">
                                <span className="text-slate-500 capitalize">{key.replace(/_/g, ' ')}</span>
                                <span className="text-white font-mono">{String(value)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-lg">
                <p className="text-[10px] text-slate-600 text-center">
                    To modify this indicator, edit the Pine Script source in TradingView
                </p>
            </div>
        </div>
    );
}

// RSI / Momentum Oscillator Config
function RSIConfig({ indicator, onUpdateParams }: IndicatorConfigProps) {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Period / Length</label>
                <input
                    type="number"
                    min="1"
                    max="200"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-colors"
                    value={typeof indicator.params?.period === 'number' ? indicator.params.period : 14}
                    onChange={(e) => onUpdateParams(indicator.id, { period: parseInt(e.target.value) || 14 })}
                />
                <p className="text-[10px] text-slate-600">Number of periods for RSI calculation (default: 14)</p>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Source</label>
                <select
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-colors"
                    value={typeof indicator.params?.source === 'string' ? indicator.params.source : 'close'}
                    onChange={(e) => onUpdateParams(indicator.id, { source: e.target.value })}
                >
                    <option value="close">Close Price</option>
                    <option value="open">Open Price</option>
                    <option value="high">High Price</option>
                    <option value="low">Low Price</option>
                    <option value="hl2">(High + Low) / 2</option>
                    <option value="hlc3">(High + Low + Close) / 3</option>
                    <option value="ohlc4">(Open + High + Low + Close) / 4</option>
                </select>
            </div>

            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-center gap-2 text-xs text-blue-400">
                    <TrendingUp className="w-4 h-4" />
                    <span>Overbought: &gt;70 | Oversold: &lt;30</span>
                </div>
            </div>
        </div>
    );
}

// MACD Config
function MACDConfig({ indicator, onUpdateParams }: IndicatorConfigProps) {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Fast Period</label>
                <input
                    type="number"
                    min="1"
                    max="100"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-colors"
                    value={typeof indicator.params?.fastPeriod === 'number' ? indicator.params.fastPeriod : 12}
                    onChange={(e) => onUpdateParams(indicator.id, { fastPeriod: parseInt(e.target.value) || 12 })}
                />
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Slow Period</label>
                <input
                    type="number"
                    min="1"
                    max="100"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-colors"
                    value={typeof indicator.params?.slowPeriod === 'number' ? indicator.params.slowPeriod : 26}
                    onChange={(e) => onUpdateParams(indicator.id, { slowPeriod: parseInt(e.target.value) || 26 })}
                />
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Signal Period</label>
                <input
                    type="number"
                    min="1"
                    max="100"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-colors"
                    value={typeof indicator.params?.signalPeriod === 'number' ? indicator.params.signalPeriod : 9}
                    onChange={(e) => onUpdateParams(indicator.id, { signalPeriod: parseInt(e.target.value) || 9 })}
                />
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Source</label>
                <select
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-colors"
                    value={typeof indicator.params?.source === 'string' ? indicator.params.source : 'close'}
                    onChange={(e) => onUpdateParams(indicator.id, { source: e.target.value })}
                >
                    <option value="close">Close Price</option>
                    <option value="open">Open Price</option>
                    <option value="high">High Price</option>
                    <option value="low">Low Price</option>
                </select>
            </div>
        </div>
    );
}

// Moving Average (EMA/SMA) Config
function MovingAverageConfig({ indicator, onUpdateParams }: IndicatorConfigProps) {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Period / Length</label>
                <input
                    type="number"
                    min="1"
                    max="500"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-colors"
                    value={typeof indicator.params?.period === 'number' ? indicator.params.period : 20}
                    onChange={(e) => onUpdateParams(indicator.id, { period: parseInt(e.target.value) || 20 })}
                />
                <p className="text-[10px] text-slate-600">Common values: 9, 20, 50, 100, 200</p>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Source</label>
                <select
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-colors"
                    value={typeof indicator.params?.source === 'string' ? indicator.params.source : 'close'}
                    onChange={(e) => onUpdateParams(indicator.id, { source: e.target.value })}
                >
                    <option value="close">Close Price</option>
                    <option value="open">Open Price</option>
                    <option value="high">High Price</option>
                    <option value="low">Low Price</option>
                    <option value="hl2">(High + Low) / 2</option>
                </select>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Offset / Shift</label>
                <input
                    type="number"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-colors"
                    value={typeof indicator.params?.shift === 'number' ? indicator.params.shift : 0}
                    onChange={(e) => onUpdateParams(indicator.id, { shift: parseInt(e.target.value) || 0 })}
                />
            </div>
        </div>
    );
}

// Bollinger Bands Config
function BollingerConfig({ indicator, onUpdateParams }: IndicatorConfigProps) {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Period / Length</label>
                <input
                    type="number"
                    min="1"
                    max="200"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-colors"
                    value={typeof indicator.params?.period === 'number' ? indicator.params.period : 20}
                    onChange={(e) => onUpdateParams(indicator.id, { period: parseInt(e.target.value) || 20 })}
                />
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Standard Deviation</label>
                <input
                    type="number"
                    min="0.1"
                    max="5"
                    step="0.1"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-colors"
                    value={typeof indicator.params?.stdDev === 'number' ? indicator.params.stdDev : 2}
                    onChange={(e) => onUpdateParams(indicator.id, { stdDev: parseFloat(e.target.value) || 2 })}
                />
                <p className="text-[10px] text-slate-600">Multiplier for standard deviation (default: 2)</p>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Source</label>
                <select
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-colors"
                    value={typeof indicator.params?.source === 'string' ? indicator.params.source : 'close'}
                    onChange={(e) => onUpdateParams(indicator.id, { source: e.target.value })}
                >
                    <option value="close">Close Price</option>
                    <option value="open">Open Price</option>
                    <option value="high">High Price</option>
                    <option value="low">Low Price</option>
                </select>
            </div>
        </div>
    );
}

// Stochastic Config
function StochasticConfig({ indicator, onUpdateParams }: IndicatorConfigProps) {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">%K Period</label>
                <input
                    type="number"
                    min="1"
                    max="100"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-colors"
                    value={typeof indicator.params?.kPeriod === 'number' ? indicator.params.kPeriod : 14}
                    onChange={(e) => onUpdateParams(indicator.id, { kPeriod: parseInt(e.target.value) || 14 })}
                />
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">%D Period (Smoothing)</label>
                <input
                    type="number"
                    min="1"
                    max="100"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-colors"
                    value={typeof indicator.params?.dPeriod === 'number' ? indicator.params.dPeriod : 3}
                    onChange={(e) => onUpdateParams(indicator.id, { dPeriod: parseInt(e.target.value) || 3 })}
                />
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Slowing</label>
                <input
                    type="number"
                    min="1"
                    max="100"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-colors"
                    value={typeof indicator.params?.slowing === 'number' ? indicator.params.slowing : 3}
                    onChange={(e) => onUpdateParams(indicator.id, { slowing: parseInt(e.target.value) || 3 })}
                />
            </div>

            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-center gap-2 text-xs text-blue-400">
                    <TrendingUp className="w-4 h-4" />
                    <span>Overbought: &gt;80 | Oversold: &lt;20</span>
                </div>
            </div>
        </div>
    );
}

// ATR / Volatility Config
function ATRConfig({ indicator, onUpdateParams }: IndicatorConfigProps) {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Period / Length</label>
                <input
                    type="number"
                    min="1"
                    max="200"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-colors"
                    value={typeof indicator.params?.period === 'number' ? indicator.params.period : 14}
                    onChange={(e) => onUpdateParams(indicator.id, { period: parseInt(e.target.value) || 14 })}
                />
                <p className="text-[10px] text-slate-600">Number of periods for ATR calculation (default: 14)</p>
            </div>

            <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                <div className="flex items-start gap-2 text-xs text-orange-400">
                    <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>ATR measures market volatility. Higher values indicate more volatile markets.</span>
                </div>
            </div>
        </div>
    );
}

// CCI Config
function CCIConfig({ indicator, onUpdateParams }: IndicatorConfigProps) {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Period / Length</label>
                <input
                    type="number"
                    min="1"
                    max="200"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-colors"
                    value={typeof indicator.params?.period === 'number' ? indicator.params.period : 20}
                    onChange={(e) => onUpdateParams(indicator.id, { period: parseInt(e.target.value) || 20 })}
                />
            </div>

            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-center gap-2 text-xs text-blue-400">
                    <TrendingUp className="w-4 h-4" />
                    <span>Overbought: &gt;+100 | Oversold: &lt;-100</span>
                </div>
            </div>
        </div>
    );
}

// Generic/Fallback Config - Shows all params dynamically
function GenericConfig({ indicator, onUpdateParams }: IndicatorConfigProps) {
    const params = indicator.params || {};
    const hasParams = Object.keys(params).length > 0;

    return (
        <div className="space-y-4">
            {!hasParams && (
                <div className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl">
                    <div className="flex items-start gap-3">
                        <Settings className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-slate-400 leading-relaxed">
                            No configurable parameters available for this indicator.
                        </p>
                    </div>
                </div>
            )}

            {hasParams && Object.entries(params).map(([key, value]) => (
                <div key={key} className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase">
                        {key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                    {typeof value === 'boolean' ? (
                        <select
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-colors"
                            value={value ? 'true' : 'false'}
                            onChange={(e) => onUpdateParams(indicator.id, { [key]: e.target.value === 'true' })}
                        >
                            <option value="true">Enabled</option>
                            <option value="false">Disabled</option>
                        </select>
                    ) : typeof value === 'number' ? (
                        <input
                            type="number"
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-colors"
                            value={value}
                            onChange={(e) => onUpdateParams(indicator.id, { [key]: parseFloat(e.target.value) || 0 })}
                        />
                    ) : (
                        <input
                            type="text"
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-colors"
                            value={String(value)}
                            onChange={(e) => onUpdateParams(indicator.id, { [key]: e.target.value })}
                        />
                    )}
                </div>
            ))}
        </div>
    );
}

// Config selector based on indicator type
function IndicatorConfigForm({ indicator, onUpdateParams, onSaveConfig }: IndicatorConfigProps) {
    const type = indicator.type?.toLowerCase() || '';

    // Pine Script indicators
    if (type === 'pine_script' || type === 'pinescript') {
        return <PineScriptConfig indicator={indicator} onUpdateParams={onUpdateParams} onSaveConfig={onSaveConfig} />;
    }

    // RSI and similar oscillators
    if (type === 'rsi' || type === 'relative_strength_index') {
        return <RSIConfig indicator={indicator} onUpdateParams={onUpdateParams} />;
    }

    // MACD
    if (type === 'macd') {
        return <MACDConfig indicator={indicator} onUpdateParams={onUpdateParams} />;
    }

    // Moving Averages
    if (type === 'ema' || type === 'sma' || type === 'wma' || type.includes('moving_average')) {
        return <MovingAverageConfig indicator={indicator} onUpdateParams={onUpdateParams} />;
    }

    // Bollinger Bands
    if (type === 'boll' || type === 'bollinger' || type === 'bb') {
        return <BollingerConfig indicator={indicator} onUpdateParams={onUpdateParams} />;
    }

    // Stochastic
    if (type === 'stoch' || type === 'stochastic') {
        return <StochasticConfig indicator={indicator} onUpdateParams={onUpdateParams} />;
    }

    // ATR
    if (type === 'atr' || type === 'average_true_range') {
        return <ATRConfig indicator={indicator} onUpdateParams={onUpdateParams} />;
    }

    // CCI
    if (type === 'cci' || type === 'commodity_channel_index') {
        return <CCIConfig indicator={indicator} onUpdateParams={onUpdateParams} />;
    }

    // Default: Generic config
    return <GenericConfig indicator={indicator} onUpdateParams={onUpdateParams} />;
}

// Helper to get indicator type display info
function getIndicatorTypeInfo(type: string): { label: string; color: string; icon: React.ReactNode } {
    const t = type?.toLowerCase() || '';

    if (t === 'pine_script' || t === 'pinescript') {
        return { label: 'Pine Script', color: 'text-purple-400 bg-purple-500/10 border-purple-500/30', icon: <Code className="w-3.5 h-3.5" /> };
    }
    if (t === 'rsi' || t === 'stoch' || t === 'cci') {
        return { label: 'Oscillator', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30', icon: <TrendingUp className="w-3.5 h-3.5" /> };
    }
    if (t === 'ema' || t === 'sma' || t === 'macd') {
        return { label: 'Trend', color: 'text-green-400 bg-green-500/10 border-green-500/30', icon: <TrendingUp className="w-3.5 h-3.5" /> };
    }
    if (t === 'atr' || t === 'boll' || t === 'bollinger') {
        return { label: 'Volatility', color: 'text-orange-400 bg-orange-500/10 border-orange-500/30', icon: <Settings className="w-3.5 h-3.5" /> };
    }

    return { label: 'Custom', color: 'text-slate-400 bg-slate-500/10 border-slate-500/30', icon: <Settings className="w-3.5 h-3.5" /> };
}

// =============================================================================
// CONTEXT PHASE - Market Setup
// =============================================================================

export function ContextPhase() {
    const { contextConfig, setContext } = useBotStore();
    return (
        <div className="p-4 space-y-4">
            <h4 className="text-white text-sm font-bold">Market Context</h4>
            <div className="grid gap-2">
                <input
                    type="text"
                    placeholder="Symbol (e.g. EURUSD)"
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                    value={contextConfig.symbol}
                    onChange={(e) => setContext(e.target.value, contextConfig.timeframe)}
                />
                <select
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                    value={contextConfig.timeframe}
                    onChange={(e) => setContext(contextConfig.symbol, e.target.value)}
                >
                    <option value="">Select Timeframe...</option>
                    <option value="M1">M1</option>
                    <option value="M5">M5</option>
                    <option value="M15">M15</option>
                    <option value="H1">H1</option>
                    <option value="H4">H4</option>
                    <option value="D1">D1</option>
                </select>
            </div>
            {contextConfig.isComplete && <p className="text-emerald-400 text-xs text-center">✓ Context Set</p>}
        </div>
    );
}

// =============================================================================
// INVENTORY PHASE - Indicator Management (SYNCED with Performance View)
// =============================================================================

export function InventoryPhase() {
    const {
        indicatorPool,
        addIndicator,
        removeIndicator,
        selectedItem,
        selectItem,
        updateIndicatorParams,
        isLoadingIndicators,
        lastSyncAt
    } = useBotStore();

    const availableIndicators = useAvailableIndicators();
    const indicatorActions = useIndicatorActions();

    // View Mode: 'library' (local templates) or 'cloud' (API indicators)
    const [viewSource, setViewSource] = useState<'library' | 'cloud'>('cloud');

    // 1. Determine Mode: Tuning vs Library
    const activeIndicatorID = selectedItem?.type === 'indicator' ? selectedItem.id : null;
    const activeIndicator = indicatorPool.find(i => i.id === activeIndicatorID);

    // =========================================================================
    // MODE: TUNING (If an indicator is selected)
    // =========================================================================
    if (activeIndicator) {
        const typeInfo = getIndicatorTypeInfo(activeIndicator.type);

        return (
            <div className="p-6 space-y-6 h-full flex flex-col">
                {/* Header / Nav */}
                <div className="flex items-center gap-2 mb-2">
                    <button
                        onClick={() => selectItem(null)}
                        className="p-1 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h4 className="text-white text-lg font-bold">Configure {activeIndicator.name}</h4>
                </div>

                {/* Configuration Form */}
                <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                    {/* Indicator Info Card */}
                    <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-xs bg-slate-800 px-2 py-1 rounded text-slate-400">
                                    {activeIndicator.indicatorId}
                                </span>
                                <span className={`px-2 py-1 rounded text-xs ${activeIndicator.status === 'ready' ? 'bg-green-500/10 text-green-400' :
                                        activeIndicator.status === 'active' ? 'bg-blue-500/10 text-blue-400' :
                                            'bg-yellow-500/10 text-yellow-400'
                                    }`}>
                                    {activeIndicator.status}
                                </span>
                            </div>
                            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs border ${typeInfo.color}`}>
                                {typeInfo.icon}
                                <span>{typeInfo.label}</span>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500">
                            Type: <span className="text-slate-400 font-mono">{activeIndicator.type}</span>
                        </p>
                    </div>

                    {/* Dynamic Config Form based on indicator type */}
                    <IndicatorConfigForm
                        indicator={activeIndicator}
                        onUpdateParams={updateIndicatorParams}
                        onSaveConfig={indicatorActions.saveConfig}
                    />
                </div>

                {/* Footer Actions */}
                <div className="pt-4 border-t border-slate-800">
                    <button
                        onClick={() => {
                            removeIndicator(activeIndicator.id);
                            selectItem(null);
                        }}
                        className="w-full py-2.5 text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-rose-500/20"
                    >
                        Remove from Flow
                    </button>
                </div>
            </div>
        );
    }

    // =========================================================================
    // MODE: LIBRARY (Default - Show both local and cloud indicators)
    // =========================================================================
    return (
        <div className="p-6 space-y-6 h-full flex flex-col">
            {/* Header with Source Toggle */}
            <div className="flex items-center justify-between">
                <h4 className="text-white text-lg font-bold">Indicator Inventory</h4>
                <div className="flex items-center gap-2">
                    {/* Source Toggle */}
                    <div className="flex bg-slate-900 border border-slate-700 rounded-lg p-0.5">
                        <button
                            onClick={() => setViewSource('cloud')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${viewSource === 'cloud'
                                    ? 'bg-blue-600 text-white'
                                    : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            <Cloud className="w-3.5 h-3.5" />
                            My Indicators
                        </button>
                        <button
                            onClick={() => setViewSource('library')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${viewSource === 'library'
                                    ? 'bg-blue-600 text-white'
                                    : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            <Database className="w-3.5 h-3.5" />
                            Templates
                        </button>
                    </div>

                    {/* Refresh Button */}
                    <button
                        onClick={() => indicatorActions.refresh()}
                        disabled={isLoadingIndicators}
                        className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-all disabled:opacity-50"
                        title="Refresh from server"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoadingIndicators ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Active Count Badge */}
            <div className="flex items-center justify-between">
                <div className="text-xs text-slate-500">
                    {viewSource === 'cloud'
                        ? `${availableIndicators.length} available • ${indicatorPool.length} in flow`
                        : `${AVAILABLE_INDICATORS.length} templates`
                    }
                </div>
                {lastSyncAt && (
                    <div className="text-[10px] text-slate-600">
                        Synced: {lastSyncAt.toLocaleTimeString()}
                    </div>
                )}
            </div>

            {/* Loading State */}
            {isLoadingIndicators && (
                <div className="flex items-center justify-center py-8">
                    <div className="flex items-center gap-2 text-slate-400">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Loading indicators...</span>
                    </div>
                </div>
            )}

            {/* ================================================================= */}
            {/* CLOUD VIEW: Indicators from API (synced with Performance) */}
            {/* ================================================================= */}
            {viewSource === 'cloud' && !isLoadingIndicators && (
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                    {availableIndicators.length === 0 ? (
                        <div className="text-center py-10 text-slate-600 border border-dashed border-slate-800 rounded-xl bg-slate-900/50">
                            <Cloud className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">No indicators found</p>
                            <p className="text-xs mt-1 opacity-50">Import or create one in Performance view</p>
                        </div>
                    ) : (
                        availableIndicators.map(ind => {
                            const isInFlow = indicatorPool.some(p => p.id === ind.id || p.indicatorId === ind.indicatorId);

                            return (
                                <div
                                    key={ind.id}
                                    className={`
                                        relative group flex items-center gap-4 p-4 border rounded-xl transition-all duration-200
                                        ${isInFlow
                                            ? 'bg-blue-600/10 border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                                            : 'bg-slate-800/40 border-slate-700 hover:bg-slate-800 hover:border-slate-600'
                                        }
                                    `}
                                >
                                    {/* Icon / Status */}
                                    <div className={`
                                        flex-none w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold transition-all
                                        ${isInFlow ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400'}
                                    `}>
                                        {ind.name.substring(0, 2).toUpperCase()}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h5 className={`text-sm font-bold truncate ${isInFlow ? 'text-blue-200' : 'text-slate-200'}`}>
                                            {ind.name}
                                        </h5>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] text-slate-500 font-mono">{ind.type}</span>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${ind.status === 'ready' ? 'bg-green-500/10 text-green-400' :
                                                    ind.status === 'active' ? 'bg-blue-500/10 text-blue-400' :
                                                        'bg-yellow-500/10 text-yellow-400'
                                                }`}>
                                                {ind.status}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <button
                                        onClick={async () => {
                                            if (isInFlow) {
                                                await indicatorActions.unbind(ind.indicatorId || ind.id);
                                            } else {
                                                await indicatorActions.bind(ind.indicatorId || ind.id);
                                            }
                                        }}
                                        className={`
                                            flex-none px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                                            ${isInFlow
                                                ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20'
                                                : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20'
                                            }
                                        `}
                                    >
                                        {isInFlow ? 'Remove' : 'Add to Flow'}
                                    </button>

                                    {/* Active Indicator */}
                                    {isInFlow && (
                                        <div className="absolute right-2 top-2">
                                            <CheckCircle2 className="w-4 h-4 text-blue-400" />
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* ================================================================= */}
            {/* LIBRARY VIEW: Local Templates (for quick add) */}
            {/* ================================================================= */}
            {viewSource === 'library' && !isLoadingIndicators && (
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                    {AVAILABLE_INDICATORS.map(ind => {
                        const isActive = indicatorPool.some(i => i.name === ind.name || i.type === ind.type);

                        return (
                            <div
                                key={ind.type}
                                className={`
                                    relative group flex items-start gap-4 p-4 border rounded-xl transition-all duration-200
                                    ${isActive
                                        ? 'bg-blue-600/5 border-blue-500/30'
                                        : 'bg-slate-800/40 border-slate-700 hover:bg-slate-800 hover:border-slate-500 hover:shadow-lg cursor-pointer'}
                                `}
                                onClick={() => {
                                    if (!isActive) {
                                        addIndicator({
                                            id: `local_${Date.now()}`,
                                            name: ind.name,
                                            indicatorId: ind.type.toLowerCase(),
                                            type: ind.type,
                                            status: 'draft',
                                            params: { period: 14, source: 'close' },
                                            isBound: true,
                                            isEnabled: true,
                                        });
                                    }
                                }}
                            >
                                {/* Icon / Status */}
                                <div className={`
                                    flex-none w-10 h-10 rounded-lg flex items-center justify-center transition-all
                                    ${isActive ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-900 text-slate-500 group-hover:bg-blue-600 group-hover:text-white'}
                                `}>
                                    {isActive ? <CheckCircle2 className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
                                </div>

                                <div className="flex-1">
                                    <h5 className={`text-sm font-bold mb-1 ${isActive ? 'text-blue-200' : 'text-slate-200'}`}>
                                        {ind.name}
                                    </h5>
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        {ind.description}
                                    </p>
                                    <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-500 border border-slate-800">
                                        {ind.category}
                                    </span>
                                </div>

                                {isActive && (
                                    <span className="absolute top-4 right-4 text-[10px] uppercase font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded">
                                        In Flow
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Footer */}
            <div className="pt-4 border-t border-slate-800">
                <p className="text-[10px] text-center text-slate-600">
                    {viewSource === 'cloud'
                        ? '☁️ Indicators sync with Performance view'
                        : '📚 Templates create local indicators'
                    }
                </p>
            </div>
        </div>
    );
}

// =============================================================================
// RISK PHASE - Risk Management
// =============================================================================

export function RiskPhase() {
    const { riskConfig, setRisk } = useBotStore();

    return (
        <div className="p-4 space-y-6">
            <h4 className="text-white text-sm font-bold">Risk Parameters</h4>

            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase flex justify-between">
                        <span>Risk Per Trade</span>
                        <span className="text-blue-400">{riskConfig.riskPerTrade}%</span>
                    </label>
                    <input
                        type="range"
                        min="0.1"
                        max="10"
                        step="0.1"
                        value={riskConfig.riskPerTrade}
                        onChange={(e) => setRisk({ riskPerTrade: parseFloat(e.target.value) })}
                        className="w-full accent-blue-500"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase">Stop Loss (pips)</label>
                    <input
                        type="number"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                        value={riskConfig.stopLoss}
                        onChange={(e) => setRisk({ stopLoss: parseInt(e.target.value) })}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase flex justify-between">
                        <span>Reward Ratio</span>
                        <span className="text-emerald-400">1:{riskConfig.rewardRatio}</span>
                    </label>
                    <input
                        type="range"
                        min="1"
                        max="5"
                        step="0.5"
                        value={riskConfig.rewardRatio}
                        onChange={(e) => setRisk({ rewardRatio: parseFloat(e.target.value) })}
                        className="w-full accent-emerald-500"
                    />
                </div>
            </div>

            {/* Visual Preview */}
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                <h5 className="text-xs font-bold text-slate-500 mb-3">Position Preview</h5>
                <div className="flex items-center justify-between text-xs">
                    <div className="text-rose-400">
                        <span className="font-mono">SL: -{riskConfig.stopLoss} pips</span>
                    </div>
                    <div className="text-slate-500">Entry</div>
                    <div className="text-emerald-400">
                        <span className="font-mono">TP: +{riskConfig.stopLoss * riskConfig.rewardRatio} pips</span>
                    </div>
                </div>
                <div className="mt-2 h-2 bg-slate-800 rounded-full relative overflow-hidden">
                    <div
                        className="absolute left-0 h-full bg-rose-500/50 rounded-l-full"
                        style={{ width: `${100 / (1 + riskConfig.rewardRatio)}%` }}
                    />
                    <div
                        className="absolute right-0 h-full bg-emerald-500/50 rounded-r-full"
                        style={{ width: `${(riskConfig.rewardRatio * 100) / (1 + riskConfig.rewardRatio)}%` }}
                    />
                </div>
            </div>
        </div>
    );
}

// =============================================================================
// ACTION PHASE - Trade Execution
// =============================================================================

export function ActionPhase() {
    return (
        <div className="p-4 space-y-4">
            <h4 className="text-white text-sm font-bold">Execution Actions</h4>

            <div className="space-y-3">
                <div className="p-4 bg-emerald-900/20 border border-emerald-700/30 rounded-xl">
                    <h5 className="text-emerald-400 text-xs font-bold uppercase mb-2">On Buy Signal</h5>
                    <select className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm">
                        <option value="market_buy">Market Buy</option>
                        <option value="limit_buy">Limit Buy</option>
                        <option value="alert_only">Alert Only</option>
                    </select>
                </div>

                <div className="p-4 bg-rose-900/20 border border-rose-700/30 rounded-xl">
                    <h5 className="text-rose-400 text-xs font-bold uppercase mb-2">On Sell Signal</h5>
                    <select className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm">
                        <option value="market_sell">Market Sell</option>
                        <option value="limit_sell">Limit Sell</option>
                        <option value="alert_only">Alert Only</option>
                    </select>
                </div>
            </div>

            <div className="p-3 bg-amber-900/10 border border-amber-700/20 rounded-lg">
                <p className="text-xs text-amber-400/80 text-center">
                    ⚠️ Live trading requires MT5 connection
                </p>
            </div>
        </div>
    );
}
