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
                        <GlassCard className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">Rule Builder</h3>
                                <Badge variant="info">If-Then Logic</Badge>
                            </div>

                            <div className="space-y-4">
                                {rules.map((rule, index) => (
                                    <div key={rule.id} className="rule-card">
                                        <div className="rule-header">
                                            <span className="rule-title">Rule {index + 1}: Entry Signal</span>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => updateRule(rule.id, 'isEnabled', !rule.isEnabled)}
                                                    className={`toggle ${rule.isEnabled ? 'active' : ''}`}
                                                />
                                                <button
                                                    onClick={() => removeRule(rule.id)}
                                                    className="text-[var(--text-muted)] hover:text-red-400 transition-colors"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 flex-wrap">
                                            <span className="text-[var(--text-secondary)]">IF</span>

                                            <select
                                                value={rule.indicator}
                                                onChange={(e) => updateRule(rule.id, 'indicator', e.target.value)}
                                                className="dropdown"
                                            >
                                                {indicators.map(ind => (
                                                    <option key={ind} value={ind}>{ind}</option>
                                                ))}
                                            </select>

                                            <select
                                                value={rule.operator}
                                                onChange={(e) => updateRule(rule.id, 'operator', e.target.value)}
                                                className="dropdown"
                                            >
                                                {operators.map(op => (
                                                    <option key={op} value={op}>{op.replace('_', ' ')}</option>
                                                ))}
                                            </select>

                                            <input
                                                type="number"
                                                value={rule.value}
                                                onChange={(e) => updateRule(rule.id, 'value', Number(e.target.value))}
                                                className="input-field w-24"
                                            />

                                            <span className="text-[var(--text-secondary)]">THEN</span>

                                            <select
                                                value={rule.action}
                                                onChange={(e) => updateRule(rule.id, 'action', e.target.value)}
                                                className="dropdown"
                                            >
                                                {actions.map(act => (
                                                    <option key={act} value={act}>{act}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                ))}

                                <button
                                    onClick={addRule}
                                    className="w-full py-4 border-2 border-dashed border-[var(--glass-border)] rounded-xl text-[var(--text-secondary)] hover:border-emerald-500 hover:text-emerald-400 transition-all flex items-center justify-center gap-2"
                                >
                                    <span className="text-xl">+</span> Add Rule
                                </button>
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
