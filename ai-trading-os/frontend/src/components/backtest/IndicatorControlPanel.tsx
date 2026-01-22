import { useState, useEffect } from 'react';
import { IndicatorCapability, Control, Section } from "@/types/indicatorCapability";
import { BotApi } from "@/services/botApi";

interface IndicatorControlPanelProps {
    indicatorId: string; // The ID of the binded indicator instance (e.g. "smc_123")
    capability: IndicatorCapability;
    initialConfig?: any; // The current config from the DB
    onSave?: () => void;
}

export function IndicatorControlPanel({ indicatorId, capability, initialConfig = {}, onSave }: IndicatorControlPanelProps) {
    // Local state for all controls
    const [config, setConfig] = useState<any>(initialConfig);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Update config when control changes
    const handleChange = (controlId: string, value: any) => {
        setConfig((prev: any) => ({
            ...prev,
            [controlId]: value
        }));
        setHasUnsavedChanges(true);
    };

    // Save handler
    const handleSave = async () => {
        try {
            await BotApi.updateIndicatorConfig(indicatorId, config);
            setHasUnsavedChanges(false);
            if (onSave) onSave();
            alert("Indicator configuration saved!");
        } catch (err: any) {
            console.error("Failed to save indicator config:", err);
            alert(`Error saving config: ${err.message}`);
        }
    };

    // Reset handler
    const handleReset = () => {
        if (confirm("Reset to defaults? Unsaved changes will be lost.")) {
            const defaults: any = {};
            capability.sections.forEach(section => {
                section.controls.forEach(control => {
                    if ('defaultValue' in control) {
                        defaults[control.id] = control.defaultValue;
                    }
                });
            });
            setConfig(defaults);
            setHasUnsavedChanges(true); // Technically changed from 'initialConfig' if it wasn't default
        }
    };

    return (
        <div className="h-full flex flex-col bg-[var(--bg-secondary)] border border-[var(--glass-border)] rounded-xl overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-[var(--glass-border)] flex justify-between items-center bg-[var(--glass-bg)]">
                <div>
                    <h3 className="font-semibold text-white flex items-center gap-2">
                        <span>🔧</span> {capability.name}
                    </h3>
                    <div className="text-xs text-[var(--text-muted)] mt-0.5">
                        v{capability.version} • {indicatorId}
                    </div>
                </div>
                {hasUnsavedChanges && (
                    <span className="text-xs font-medium text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                        Unsaved Changes
                    </span>
                )}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {capability.sections.map((section) => (
                    <ControlSection
                        key={section.id}
                        section={section}
                        config={config}
                        onChange={handleChange}
                    />
                ))}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-[var(--glass-border)] bg-[var(--bg-tertiary)] flex justify-between items-center">
                <button
                    onClick={handleReset}
                    className="text-xs text-[var(--text-secondary)] hover:text-white px-3 py-2 rounded hover:bg-[var(--glass-bg)] transition-colors"
                >
                    Reset to Default
                </button>
                <button
                    onClick={handleSave}
                    disabled={!hasUnsavedChanges}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all
                        ${!hasUnsavedChanges
                            ? 'bg-[var(--glass-border)] text-[var(--text-muted)] opacity-50 cursor-not-allowed'
                            : 'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent)]/80 shadow-lg hover:scale-105'
                        }`}
                >
                    <span>💾</span> Save Indicator
                </button>
            </div>
        </div>
    );
}

// Sub-component: Section
function ControlSection({ section, config, onChange }: { section: Section, config: any, onChange: (id: string, val: any) => void }) {
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
                <div className="h-px flex-1 bg-[var(--glass-border)]"></div>
                <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">{section.title}</h4>
                <div className="h-px flex-1 bg-[var(--glass-border)]"></div>
            </div>

            <div className="space-y-1">
                {section.controls.map(control => (
                    <ControlFactory
                        key={control.id}
                        control={control}
                        value={config[control.id] ?? ('defaultValue' in control ? control.defaultValue : undefined)}
                        allConfig={config}
                        onChange={onChange}
                    />
                ))}
            </div>
        </div>
    );
}

// Sub-component: Factory
function ControlFactory({ control, value, allConfig, onChange }: { control: Control, value: any, allConfig: any, onChange: (id: string, val: any) => void }) {
    // Check Visibility
    if (control.visibleWhen) {
        const dependentValue = allConfig[control.visibleWhen.controlId];
        if (dependentValue !== control.visibleWhen.equals) {
            return null;
        }
    }

    switch (control.type) {
        case 'toggle':
            return (
                <div className="flex items-center justify-between p-2 rounded hover:bg-[var(--glass-bg)] transition-colors">
                    <label className="text-sm text-[var(--text-primary)] cursor-pointer select-none flex-1" onClick={() => onChange(control.id, !value)}>
                        {control.label}
                    </label>
                    <div
                        onClick={() => onChange(control.id, !value)}
                        className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${value ? 'bg-[var(--color-accent)]' : 'bg-[var(--glass-border)]'}`}
                    >
                        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all shadow-sm ${value ? 'left-6' : 'left-1'}`}></div>
                    </div>
                </div>
            );

        case 'select':
            return (
                <div className="flex flex-col gap-1 p-2 rounded hover:bg-[var(--glass-bg)] transition-colors">
                    <label className="text-xs text-[var(--text-secondary)]">{control.label}</label>
                    <select
                        value={value}
                        onChange={(e) => onChange(control.id, e.target.value)}
                        className="w-full bg-[var(--bg-tertiary)] border border-[var(--glass-border)] rounded px-2 py-1.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-accent)]"
                    >
                        {control.options.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
            );

        case 'number':
            return (
                <div className="flex items-center justify-between p-2 rounded hover:bg-[var(--glass-bg)] transition-colors">
                    <label className="text-sm text-[var(--text-primary)]">{control.label}</label>
                    <input
                        type="number"
                        value={value}
                        min={control.min}
                        max={control.max}
                        step={control.step}
                        onChange={(e) => onChange(control.id, parseFloat(e.target.value))}
                        className="w-20 bg-[var(--bg-tertiary)] border border-[var(--glass-border)] rounded px-2 py-1 text-sm text-right text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-accent)]"
                    />
                </div>
            );

        case 'signal':
            return (
                <div className="flex items-center justify-between p-2 rounded bg-[var(--color-accent)]/5 border border-[var(--color-accent)]/10 my-1">
                    <div className="flex items-center gap-2">
                        <span className="text-xs">⚡</span>
                        <label className="text-sm text-[var(--text-primary)] font-medium">{control.label}</label>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[var(--text-secondary)]">Action:</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded border 
                            ${control.actionMap?.onTrigger === 'Buy' ? 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10' :
                                control.actionMap?.onTrigger === 'Sell' ? 'text-rose-400 border-rose-400/30 bg-rose-400/10' :
                                    'text-blue-400 border-blue-400/30 bg-blue-400/10'}`}>
                            {control.actionMap?.onTrigger || 'Signal'}
                        </span>
                    </div>
                </div>
            );

        case 'color':
            return (
                <div className="flex items-center justify-between p-2 rounded hover:bg-[var(--glass-bg)] transition-colors">
                    <label className="text-sm text-[var(--text-primary)]">{control.label}</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="color"
                            value={value}
                            onChange={(e) => onChange(control.id, e.target.value)}
                            className="w-8 h-8 rounded cursor-pointer bg-transparent border-none"
                        />
                        <span className="text-xs text-[var(--text-muted)] font-mono">{value}</span>
                    </div>
                </div>
            );

        default:
            return <div className="text-red-500 text-xs">Unknown control type: {(control as any).type}</div>;
    }
}
