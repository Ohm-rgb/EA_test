'use client';

import { useState } from 'react';
import { TopBar } from "@/components/layout";
import { GlassCard, Button, Chip, Badge } from "@/components/ui";

interface BotRule {
    id: number;
    indicator: string;
    operator: string;
    value: number;
    action: string;
    isEnabled: boolean;
}

interface Indicator {
    id: string;
    type: string;
    period: number;
    source: string;
}

const indicators = ['RSI', 'MACD', 'EMA', 'SMA', 'Bollinger Bands', 'Price', 'Volume'];
const operators = ['crosses_above', 'crosses_below', 'greater_than', 'less_than', 'equals'];
const actions = ['Buy', 'Sell', 'Close Position', 'Add to Position'];

export default function BotStudio() {
    const [botName, setBotName] = useState('AlphaBot');
    const [personality, setPersonality] = useState<'conservative' | 'balanced' | 'aggressive'>('balanced');
    const [rules, setRules] = useState<BotRule[]>([
        { id: 1, indicator: 'RSI', operator: 'crosses_below', value: 30, action: 'Buy', isEnabled: true },
        { id: 2, indicator: 'Price', operator: 'crosses_above', value: 20, action: 'Sell', isEnabled: true },
    ]);
    const [riskPerTrade, setRiskPerTrade] = useState(1);
    const [maxDailyTrades, setMaxDailyTrades] = useState(10);
    const [stopOnLoss, setStopOnLoss] = useState(3);
    const [timeframe, setTimeframe] = useState('H1');

    // Visual Logic Builder View Mode
    const [viewMode, setViewMode] = useState<'logic' | 'indicators'>('logic');
    const [activeIndicators, setActiveIndicators] = useState<Indicator[]>([
        { id: 'rsi_14', type: 'RSI', period: 14, source: 'Close' },
        { id: 'ema_20', type: 'EMA', period: 20, source: 'Close' },
        { id: 'price', type: 'Price', period: 0, source: 'Real-time' }
    ]);

    const addRule = () => {
        const newRule: BotRule = {
            id: Date.now(),
            indicator: 'RSI',
            operator: 'crosses_above',
            value: 50,
            action: 'Buy',
            isEnabled: true,
        };
        setRules([...rules, newRule]);
    };

    const removeRule = (id: number) => {
        setRules(rules.filter(r => r.id !== id));
    };

    const updateRule = (id: number, field: keyof BotRule, value: string | number | boolean) => {
        setRules(rules.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    return (
        <div className="min-h-screen">
            <TopBar title="Bot Behavior Studio" />

            <div className="p-6 fade-in">
                {/* Bot Name & Personality */}
                <GlassCard className="p-6 mb-6">
                    <div className="flex items-center gap-8">
                        {/* Bot Name */}
                        <div className="flex-1">
                            <label className="block text-sm text-[var(--text-secondary)] mb-2">Bot Name</label>
                            <input
                                type="text"
                                value={botName}
                                onChange={(e) => setBotName(e.target.value)}
                                className="input-field text-lg font-semibold"
                            />
                        </div>

                        {/* Personality Selector */}
                        <div>
                            <label className="block text-sm text-[var(--text-secondary)] mb-2">Personality</label>
                            <div className="flex gap-2">
                                <Chip
                                    active={personality === 'conservative'}
                                    onClick={() => setPersonality('conservative')}
                                >
                                    🛡️ Conservative
                                </Chip>
                                <Chip
                                    active={personality === 'balanced'}
                                    onClick={() => setPersonality('balanced')}
                                >
                                    ⚖️ Balanced
                                </Chip>
                                <Chip
                                    active={personality === 'aggressive'}
                                    onClick={() => setPersonality('aggressive')}
                                >
                                    🔥 Aggressive
                                </Chip>
                            </div>
                        </div>
                    </div>
                </GlassCard>

                <div className="grid grid-cols-3 gap-6">
                    {/* Rule Builder */}
                    <div className="col-span-2">
                        <GlassCard className="p-6 h-full flex flex-col">
                            {/* Header with Switcher */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">⚡</span>
                                        <h3 className="text-lg font-semibold">Visual Logic Builder</h3>
                                    </div>

                                    {/* View Switcher */}
                                    <div className="flex bg-[var(--bg-secondary)] rounded-lg p-1 border border-[var(--glass-border)]">
                                        <button
                                            onClick={() => setViewMode('logic')}
                                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === 'logic'
                                                ? 'bg-[var(--glass-bg)] text-white shadow-sm'
                                                : 'text-[var(--text-secondary)] hover:text-white'
                                                }`}
                                        >
                                            Logic Flow
                                        </button>
                                        <button
                                            onClick={() => setViewMode('indicators')}
                                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === 'indicators'
                                                ? 'bg-[var(--glass-bg)] text-white shadow-sm'
                                                : 'text-[var(--text-secondary)] hover:text-white'
                                                }`}
                                        >
                                            Indicators
                                        </button>
                                    </div>
                                </div>
                                <Badge variant="info">{viewMode === 'logic' ? 'Natural Language Mode' : 'Configuration Mode'}</Badge>
                            </div>

                            {/* View Content */}
                            <div className="flex-1">
                                {viewMode === 'logic' ? (
                                    <div className="space-y-4">
                                        {rules.map((rule, index) => (
                                            <div key={rule.id} className="relative group">
                                                <div className="logic-row">
                                                    {/* Rule Number / Status */}
                                                    <div className="absolute -left-3 -top-3 w-6 h-6 rounded-full bg-[var(--bg-tertiary)] border border-[var(--glass-border)] flex items-center justify-center text-xs font-bold text-[var(--text-muted)] shadow-md">
                                                        {index + 1}
                                                    </div>

                                                    {/* IF Segment */}
                                                    <span className="logic-tag tag-if">IF</span>

                                                    <div className="relative">
                                                        <select
                                                            value={rule.indicator}
                                                            onChange={(e) => updateRule(rule.id, 'indicator', e.target.value)}
                                                            className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                                                        >
                                                            {activeIndicators.map(ind => (
                                                                <option key={ind.id} value={ind.type}>{ind.type} {ind.period > 0 ? `(${ind.period})` : ''}</option>
                                                            ))}
                                                        </select>
                                                        <div className="logic-block block-trigger">
                                                            {rule.indicator === 'Price' ? '💲' : '📈'} {rule.indicator}
                                                        </div>
                                                    </div>

                                                    <div className="relative">
                                                        <select
                                                            value={rule.operator}
                                                            onChange={(e) => updateRule(rule.id, 'operator', e.target.value)}
                                                            className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                                                        >
                                                            {operators.map(op => <option key={op} value={op}>{op.replace('_', ' ')}</option>)}
                                                        </select>
                                                        <div className="logic-block block-operator">
                                                            {rule.operator === 'crosses_above' ? '↗️ Crosses Above' :
                                                                rule.operator === 'crosses_below' ? '↘️ Crosses Below' :
                                                                    rule.operator === 'greater_than' ? '> Greater Than' :
                                                                        rule.operator === 'less_than' ? '< Less Than' : '= Equals'}
                                                        </div>
                                                    </div>

                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            value={rule.value}
                                                            onChange={(e) => updateRule(rule.id, 'value', Number(e.target.value))}
                                                            className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                                                        />
                                                        <div className="logic-block block-value">
                                                            {rule.value}
                                                        </div>
                                                    </div>

                                                    {/* Arrow */}
                                                    <span className="logic-arrow">→</span>

                                                    {/* THEN Segment */}
                                                    <span className="logic-tag tag-then">THEN</span>

                                                    <div className="relative">
                                                        <select
                                                            value={rule.action}
                                                            onChange={(e) => updateRule(rule.id, 'action', e.target.value)}
                                                            className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                                                        >
                                                            {actions.map(act => <option key={act} value={act}>{act}</option>)}
                                                        </select>
                                                        <div className={`logic-block block-action ${rule.action === 'Sell' ? 'sell' : ''}`}>
                                                            {rule.action === 'Buy' ? '🟢 Buy' :
                                                                rule.action === 'Sell' ? '🔴 Sell' :
                                                                    rule.action === 'Close Position' ? '❌ Close' : '➕ Add'}
                                                        </div>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="ml-auto flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => updateRule(rule.id, 'isEnabled', !rule.isEnabled)}
                                                            className={`toggle ${rule.isEnabled ? 'active' : ''} scale-75`}
                                                        />
                                                        <button
                                                            onClick={() => removeRule(rule.id)}
                                                            className="p-2 text-[var(--text-muted)] hover:text-red-400"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        <button
                                            onClick={addRule}
                                            className="w-full py-4 border-2 border-dashed border-[var(--glass-border)] rounded-xl text-[var(--text-secondary)] hover:border-emerald-500 hover:text-emerald-400 transition-all flex items-center justify-center gap-2 group"
                                        >
                                            <span className="bg-[var(--glass-bg)] w-8 h-8 rounded-full flex items-center justify-center border border-[var(--glass-border)] group-hover:border-emerald-500 transition-colors">+</span>
                                            <span>Add Logic Block</span>
                                        </button>
                                    </div>
                                ) : (
                                    /* Indicators View */
                                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <div className="grid grid-cols-2 gap-4">
                                            {activeIndicators.map((ind) => (
                                                <div key={ind.id} className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--glass-border)] hover:border-purple-500/50 transition-colors group relative">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-xs">
                                                                {ind.type.substring(0, 3)}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-semibold text-sm text-[var(--text-primary)]">{ind.type}</h4>
                                                                <span className="text-xs text-[var(--text-muted)]">Source: {ind.source}</span>
                                                            </div>
                                                        </div>
                                                        <button className="text-[var(--text-muted)] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                                                    </div>

                                                    {ind.period > 0 && (
                                                        <div className="mt-3">
                                                            <label className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider">Period</label>
                                                            <input
                                                                type="number"
                                                                value={ind.period}
                                                                onChange={(e) => {
                                                                    const val = Number(e.target.value);
                                                                    setActiveIndicators(activeIndicators.map(i => i.id === ind.id ? { ...i, period: val } : i));
                                                                }}
                                                                className="w-full bg-black/20 border border-[var(--glass-border)] rounded px-2 py-1 text-sm mt-1 focus:border-purple-500 outline-none transition-colors"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}

                                            {/* Add New Indicator Card */}
                                            <button className="p-4 rounded-xl border-2 border-dashed border-[var(--glass-border)] flex flex-col items-center justify-center gap-2 text-[var(--text-secondary)] hover:border-purple-500 hover:text-purple-400 transition-all min-h-[100px]">
                                                <span className="text-2xl">+</span>
                                                <span className="text-sm font-medium">Add Indicator</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </GlassCard>
                    </div>

                    {/* Risk Settings */}
                    <div>
                        <GlassCard className="p-6">
                            <h3 className="text-lg font-semibold mb-4 text-amber-400">Risk Settings</h3>

                            <div className="space-y-6">
                                {/* Risk per trade */}
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <label className="text-sm text-[var(--text-secondary)]">Risk per trade</label>
                                        <span className="text-sm font-medium">{riskPerTrade}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0.5"
                                        max="5"
                                        step="0.5"
                                        value={riskPerTrade}
                                        onChange={(e) => setRiskPerTrade(Number(e.target.value))}
                                        className="w-full"
                                    />
                                </div>

                                {/* Max daily trades */}
                                <div>
                                    <label className="block text-sm text-[var(--text-secondary)] mb-2">Max daily trades</label>
                                    <input
                                        type="number"
                                        value={maxDailyTrades}
                                        onChange={(e) => setMaxDailyTrades(Number(e.target.value))}
                                        className="input-field"
                                    />
                                </div>

                                {/* Stop on consecutive loss */}
                                <div>
                                    <label className="block text-sm text-[var(--text-secondary)] mb-2">Stop on consecutive loss</label>
                                    <input
                                        type="number"
                                        value={stopOnLoss}
                                        onChange={(e) => setStopOnLoss(Number(e.target.value))}
                                        className="input-field"
                                    />
                                </div>

                                {/* Primary timeframe */}
                                <div>
                                    <label className="block text-sm text-[var(--text-secondary)] mb-2">Primary timeframe</label>
                                    <select
                                        value={timeframe}
                                        onChange={(e) => setTimeframe(e.target.value)}
                                        className="dropdown w-full"
                                    >
                                        <option value="M1">M1</option>
                                        <option value="M5">M5</option>
                                        <option value="M15">M15</option>
                                        <option value="H1">H1</option>
                                        <option value="H4">H4</option>
                                        <option value="D1">D1</option>
                                    </select>
                                </div>
                            </div>

                            <Button className="w-full mt-6">
                                ✓ Save Profile
                            </Button>
                        </GlassCard>
                    </div>
                </div>
            </div>
        </div>
    );
}
