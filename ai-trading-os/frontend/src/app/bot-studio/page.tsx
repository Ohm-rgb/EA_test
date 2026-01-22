'use client';

import { useState, useEffect } from 'react';
import { TopBar } from "@/components/layout";
import { GlassCard, Button, Chip, Badge } from "@/components/ui";
import { PineScriptImportModal } from "@/components/modals/PineScriptImportModal";
import { StrategyPackageCard, StrategyPackageModal } from "@/components/strategy";
import { IndustrialDashboard } from "@/components/backtest";
import { ParsedStrategy } from "@/services/pineScriptService";
import { StrategyPackage, calculatePackageStatus } from "@/types/strategyPackage";
import { ManagedIndicator } from "@/types/backtestTypes";

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

import { BotSelector } from "@/components/bot/BotSelector";
import { Bot, BotStatus, BotConfig } from "@/types/botTypes";
import { BotApi } from "@/services/botApi"; // Import API Service

// Mock Generator Removed - Using Real API


export default function BotStudio() {
    // Multi-Bot State Management
    const [bots, setBots] = useState<Bot[]>([]); // Initialize empty
    const [activeBotId, setActiveBotId] = useState<string>(''); // Initialize empty

    // Fetch Bots on Mount
    useEffect(() => {
        const loadBots = async () => {
            try {
                const fetchedBots = await BotApi.getBots();
                if (fetchedBots.length > 0) {
                    setBots(fetchedBots);
                    setActiveBotId(fetchedBots[0].id);
                } else {
                    // Create Default Bot if none exist (First Run)
                    const output = await handleCreateBot(true); // Helper to create default
                }
            } catch (err) {
                console.error("Failed to load bots:", err);
            }
        };
        loadBots();
    }, []);

    // Derived Active Bot
    const activeBot = bots.find(b => b.id === activeBotId) || (bots.length > 0 ? bots[0] : null);

    const updateActiveBotConfig = async (key: keyof BotConfig, value: any) => {
        if (!activeBot) return;

        // Optimistic Update
        const updatedBot = { ...activeBot, configuration: { ...activeBot.configuration, [key]: value } };
        setBots(prev => prev.map(b => b.id === activeBotId ? updatedBot : b));

        // API Update (Debounced in real app, distinct here for simplicity)
        try {
            await BotApi.updateBotConfig(activeBotId, updatedBot.configuration);
        } catch (err) {
            console.error("Failed to save config:", err);
            // Revert on error?
        }
    };

    // Derived values for easier UI binding
    const personality = activeBot?.configuration.personality || 'balanced';
    const riskPerTrade = activeBot?.configuration.riskPerTrade || 1;
    const maxDailyTrades = activeBot?.configuration.maxDailyTrades || 10;
    const stopOnLoss = activeBot?.configuration.stopOnLoss || 3;
    const timeframe = activeBot?.configuration.timeframe || 'H1';

    // Derived setters
    const setPersonality = (val: 'conservative' | 'balanced' | 'aggressive') => updateActiveBotConfig('personality', val);
    const setRiskPerTrade = (val: number) => updateActiveBotConfig('riskPerTrade', val);
    const setMaxDailyTrades = (val: number) => updateActiveBotConfig('maxDailyTrades', val);
    const setStopOnLoss = (val: number) => updateActiveBotConfig('stopOnLoss', val);
    const setTimeframe = (val: string) => updateActiveBotConfig('timeframe', val);

    // Bot Rules State
    const [rules, setRules] = useState<BotRule[]>([
        { id: 1, indicator: 'RSI', operator: 'crosses_below', value: 30, action: 'Buy', isEnabled: true },
        { id: 2, indicator: 'Price', operator: 'crosses_above', value: 20, action: 'Sell', isEnabled: true },
    ]);

    const handleBotSelect = (botId: string) => {
        setActiveBotId(botId);
    };

    const handleCreateBot = async (isInit = false) => {
        const newBotPayload: Bot = {
            id: `bot_${Date.now()}`,
            name: 'New Trading Bot',
            status: 'draft',
            configuration: {
                personality: 'balanced',
                riskPerTrade: 1,
                maxDailyTrades: 10,
                stopOnLoss: 3,
                timeframe: 'H1'
            },
            boundIndicators: []
        };

        try {
            const createdBot = await BotApi.createBot(newBotPayload);
            setBots(prev => [...prev, createdBot]);
            if (isInit) { // If called during initialization
                setActiveBotId(createdBot.id);
            } else {
                setActiveBotId(createdBot.id);
            }
            return createdBot;
        } catch (err) {
            console.error("Failed to create bot:", err);
        }
    };
    const [viewMode, setViewMode] = useState<'logic' | 'indicators'>('logic');
    const [activeIndicators, setActiveIndicators] = useState<Indicator[]>([]);

    // Import Modal State
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    // Strategy Packages (complex indicators as single cards)
    const [strategyPackages, setStrategyPackages] = useState<StrategyPackage[]>([]);
    const [configurePackage, setConfigurePackage] = useState<StrategyPackage | null>(null);

    // Fetch Indicators when Active Bot Changes
    useEffect(() => {
        if (!activeBotId) return;

        const loadIndicators = async () => {
            try {
                // Fetch all indicators bound to this bot (or global ones if we support that later)
                const inds = await BotApi.getIndicators(activeBotId);

                // Map backend response to frontend StrategyPackage structure
                const mappedInds = inds.map((i: any) => ({
                    ...i,
                    subRules: i.rules ? i.rules.map((r: any) => ({
                        ...r,
                        isEnabled: r.is_enabled // Map snake_case to camelCase
                    })) : [],
                    isEnabled: i.status !== 'disabled' // Derive isEnabled from status
                }));

                // Update StrategyPackages state (Source of Truth)
                setStrategyPackages(mappedInds);

                // Derived: Update Active Indicators list for Logic Builder validation
                const activeInds = inds
                    .filter((i: any) => i.status === 'active')
                    .map((i: any) => ({
                        id: i.id,
                        type: i.type,
                        period: i.period,
                        source: i.source
                    }));
                setActiveIndicators(activeInds);

            } catch (err) {
                console.error("Failed to load indicators:", err);
            }
        };
        loadIndicators();
    }, [activeBotId]);

    // Load Rules
    useEffect(() => {
        if (!activeBotId) return;
        const loadRules = async () => {
            try {
                const fetchedRules = await BotApi.getBotRules(activeBotId);
                const mappedRules = fetchedRules.map((r: any) => ({
                    id: r.id,
                    indicator: r.indicator_id, // Map backend ID to frontend name/ID
                    operator: r.operator,
                    value: r.value,
                    action: r.action,
                    isEnabled: r.is_enabled
                }));
                // Only set if we have rules, otherwise keep default or empty? 
                // Better to clear if empty to reflect DB state
                if (fetchedRules.length > 0) {
                    setRules(mappedRules);
                } else {
                    setRules([]); // Clear defaults if DB is empty but verified
                }
            } catch (err) {
                console.error("Failed to load rules:", err);
            }
        };
        loadRules();
    }, [activeBotId]);

    const handleSaveConfiguration = async () => {
        if (!activeBotId || !activeBot) return;
        try {
            // 1. Save Rules
            const rulesPayload = rules.map(r => ({
                indicator_id: r.indicator,
                operator: r.operator,
                value: r.value,
                action: r.action,
                is_enabled: r.isEnabled
            }));
            await BotApi.replaceBotRules(activeBotId, rulesPayload);

            // 2. Save Bot Config (already auto-saved, but ensure latest)
            await BotApi.updateBotConfig(activeBotId, activeBot.configuration);

            alert("Configuration saved successfully!");
        } catch (err: any) {
            console.error("Failed to save configuration:", err);
            alert(`Failed to save: ${err.message}`);
        }
    };

    const handleStrategyImport = async (strategy: ParsedStrategy) => {
        // 1. Handle Strategy Package (Complex Indicator)
        if (strategy.package) {
            try {
                // Ensure ID is unique if needed, or rely on backend
                const pkgToCreate = {
                    ...strategy.package,
                    id: strategy.package.id || `pkg_${Date.now()}`,
                    status: 'draft',
                    bot_id: activeBotId // Bind to valid bot
                };

                await BotApi.createIndicator(pkgToCreate);

                // Refresh list
                const inds = await BotApi.getIndicators(activeBotId);
                setStrategyPackages(inds);

                // Switch to Control View
                setActiveTab('backtest');
            } catch (err) {
                console.error("Failed to import strategy package:", err);
            }
        }
        // 2. Handle Simple Rules (Legacy/Direct)
        else {
            const newIndicators = strategy.indicators.map(ind => ({
                id: ind.id,
                type: ind.type,
                period: ind.period,
                source: ind.source
            }));

            const newRules = strategy.rules.map(rule => ({
                id: Number(rule.id) || Date.now(),
                indicator: rule.indicator,
                operator: rule.operator,
                value: rule.value,
                action: rule.action,
                isEnabled: rule.isEnabled
            }));

            setActiveIndicators(newIndicators);
            setRules(newRules);
            setViewMode('logic');
        }
    };

    // CONTROL-FIRST: Only show Active packages in Strategy Configuration
    // Draft/Ready/Disabled packages must be activated in Industrial Control first
    const visiblePackages = strategyPackages.filter(pkg => pkg.status === 'active');

    const handlePackageUpdate = (updatedPackage: StrategyPackage) => {
        setStrategyPackages(prev => prev.map(pkg =>
            pkg.id === updatedPackage.id ? updatedPackage : pkg
        ));
    };

    const handlePackageToggle = (packageId: string, enabled: boolean) => {
        setStrategyPackages(prev => prev.map(pkg => {
            if (pkg.id !== packageId) return pkg;

            // Hard Guard: Cannot enable a package that is not active
            if (enabled && pkg.status !== 'active' && pkg.status !== 'partial') {
                // Throwing error or just preventing the toggle
                console.error('Security Guard: Cannot enable non-active package', pkg.id);
                return pkg;
            }

            const updatedSubRules = pkg.subRules.map(r => ({ ...r, isEnabled: enabled }));
            return {
                ...pkg,
                subRules: updatedSubRules,
                isEnabled: enabled,
                // Status remains active if we are just toggling visibility, 
                // but if all subrules are off, status logic might change. 
                // For now we trust the Industrial Control status as the source of truth for 'active'/'draft'
                // and this toggle just controls 'isEnabled' for the bot execution.
            };
        }));
    };


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

    const [activeTab, setActiveTab] = useState<'strategy' | 'backtest'>('strategy');

    return (
        <div className="h-screen w-full flex flex-col overflow-hidden bg-[var(--bg-primary)]">
            {/* 1. Header (Desk Top) - Fixed */}
            <div className="flex-none z-20 relative">
                <TopBar title="Bot Behavior Studio" />
            </div>

            {/* 2. Workspace Container - Full width/height, no padding */}
            <div className="flex-1 flex flex-col min-h-0 w-full animate-in fade-in duration-500">

                {/* Tab Rail - Sits at the top of the workspace */}
                <div className="flex-none flex items-end px-6 pt-0 gap-2">
                    {/* Tab 1: Strategy Configuration (Active) */}
                    <button
                        onClick={() => setActiveTab('strategy')}
                        className={`px-5 py-1.5 rounded-t-lg font-medium text-sm flex items-center gap-2 transition-all duration-200 shadow-sm border-t border-x ${activeTab === 'strategy'
                            ? 'bg-[var(--bg-secondary)] border-[var(--glass-border)] text-[var(--color-accent)] translate-y-[1px] z-10'
                            : 'bg-[var(--bg-tertiary)]/50 border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
                            }`}
                    >
                        <span className="text-lg">📂</span>
                        Strategy Configuration
                    </button>

                    {/* Tab 2: Backtesting (Inactive/Demo) */}
                    <button
                        onClick={() => setActiveTab('backtest')}
                        className={`px-5 py-1.5 rounded-t-lg font-medium text-sm flex items-center gap-2 transition-all duration-200 shadow-sm border-t border-x ${activeTab === 'backtest'
                            ? 'bg-[var(--bg-secondary)] border-[var(--glass-border)] text-[var(--color-accent)] translate-y-[1px] z-10'
                            : 'bg-[var(--bg-tertiary)]/50 border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
                            }`}
                    >
                        <span className="text-lg">🏭</span>
                        Industrial Control
                    </button>

                    <div className="flex-1 border-b border-[var(--glass-border)]"></div>
                </div>

                {/* Folder Body - Edge-to-edge content area */}
                <div className="flex-1 flex flex-col min-h-0 bg-[var(--bg-secondary)] border-t border-[var(--glass-border)] shadow-inner relative backdrop-blur-sm">
                    {activeTab === 'strategy' ? (
                        /* Strategy Content - Has internal padding */
                        <div className="h-full flex flex-col gap-6 p-6 animate-in slide-in-from-bottom-2 duration-300 overflow-hidden">

                            {/* Bot Name & Personality - Fixed height */}
                            <GlassCard className="p-6 flex-none">
                                <div className="flex items-center gap-8">
                                    {/* Bot Selector */}
                                    <div className="flex-1">
                                        <label className="block text-sm text-[var(--text-secondary)] mb-2">Target Machine</label>
                                        <BotSelector
                                            bots={bots}
                                            activeBotId={activeBotId}
                                            onSelect={handleBotSelect}
                                            onCreate={handleCreateBot}
                                        />
                                    </div>

                                    {/* GLOBAL Save Configuration Button */}
                                    <div className="flex-shrink-0">
                                        <button
                                            onClick={handleSaveConfiguration}
                                            disabled={activeBot?.status === 'running' || activeBot?.status === 'paused'}
                                            className={`px-6 py-3 rounded-xl flex items-center gap-2 transition-all font-semibold shadow-lg
                                                ${activeBot?.status === 'running' || activeBot?.status === 'paused'
                                                    ? 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] cursor-not-allowed opacity-70'
                                                    : 'bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-success)] text-white hover:shadow-xl hover:scale-105'}`}
                                        >
                                            {activeBot?.status === 'running' || activeBot?.status === 'paused' ? (
                                                <>
                                                    <span>🔒</span>
                                                    <span>Locked (Running)</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span>✓</span>
                                                    <span>Save Configuration</span>
                                                </>
                                            )}
                                        </button>
                                        <div className="text-[10px] text-[var(--text-muted)] text-center mt-1 opacity-60">
                                            Logic, Risk & Settings
                                        </div>
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

                            {/* Main Grid - Flex-1 to fill space */}
                            <div className="flex-1 min-h-0 grid grid-cols-12 gap-6">
                                {/* Rule Builder - Left Col */}
                                <div className="col-span-8 h-full flex flex-col min-h-0">
                                    <GlassCard className="p-6 h-full flex flex-col bg-[var(--glass-bg)] border-[var(--glass-border)]">
                                        {/* Header with Switcher - Fixed */}
                                        <div className="flex-none flex items-center justify-between mb-6">
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
                                            <div className="flex items-center gap-3">
                                                <Badge variant="info">{viewMode === 'logic' ? 'Natural Language Mode' : 'Configuration Mode'}</Badge>
                                            </div>
                                        </div>

                                        <PineScriptImportModal
                                            isOpen={isImportModalOpen}
                                            onClose={() => setIsImportModalOpen(false)}
                                            onImport={handleStrategyImport}
                                        />

                                        {/* Strategy Package Configuration Modal */}
                                        {configurePackage && (
                                            <StrategyPackageModal
                                                isOpen={!!configurePackage}
                                                package_={configurePackage}
                                                onClose={() => setConfigurePackage(null)}
                                                onSave={handlePackageUpdate}
                                            />
                                        )}

                                        {/* View Content - Scrollable */}
                                        <div className="flex-1 min-h-0 overflow-y-auto pr-2 custom-scrollbar">
                                            {viewMode === 'logic' ? (
                                                <div className="space-y-4">
                                                    {/* Strategy Packages Section - Only Active packages visible */}
                                                    {visiblePackages.length > 0 && (
                                                        <div className="space-y-3 mb-6">
                                                            <div className="flex items-center justify-between">
                                                                <div className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
                                                                    Strategy Packages
                                                                </div>
                                                                <span className="text-[9px] text-[var(--text-muted)] flex items-center gap-1">
                                                                    🏭 Controlled by Industrial Control
                                                                </span>
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                {visiblePackages.map(pkg => (
                                                                    <StrategyPackageCard
                                                                        key={pkg.id}
                                                                        package_={pkg}
                                                                        onConfigure={() => setConfigurePackage(pkg)}
                                                                        onToggle={(enabled) => handlePackageToggle(pkg.id, enabled)}
                                                                    />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Individual Rules Section */}
                                                    {rules.length > 0 && (
                                                        <div className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-3">
                                                            {visiblePackages.length > 0 ? 'Additional Rules' : 'Trading Rules'}
                                                        </div>
                                                    )}

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
                                                                        className="p-2 text-[var(--text-muted)] hover:text-[var(--color-critical)]"
                                                                    >
                                                                        ✕
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}

                                                    <button
                                                        onClick={addRule}
                                                        className="w-full py-4 border-2 border-dashed border-[var(--glass-border)] rounded-xl text-[var(--text-secondary)] hover:border-[var(--color-success)] hover:text-[var(--color-success)] transition-all flex items-center justify-center gap-2 group"
                                                    >
                                                        <span className="bg-[var(--glass-bg)] w-8 h-8 rounded-full flex items-center justify-center border border-[var(--glass-border)] group-hover:border-[var(--color-success)] transition-colors">+</span>
                                                        <span>Add Logic Block</span>
                                                    </button>
                                                </div>
                                            ) : (
                                                /* Indicators View - READ ONLY SHELF */
                                                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">

                                                    {/* Shelf Header */}
                                                    <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-tertiary)]/50 border border-dashed border-[var(--glass-border)]">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded bg-[var(--color-accent)]/20 flex items-center justify-center text-lg">🏭</div>
                                                            <div>
                                                                <div className="text-xs font-bold text-[var(--color-accent)] uppercase tracking-wide">Approved Parts Shelf</div>
                                                                <div className="text-[10px] text-[var(--text-muted)]">These indicators are Active and ready for use.</div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => setActiveTab('backtest')}
                                                            className="text-xs text-[var(--text-primary)] hover:text-[var(--color-accent)] hover:underline flex items-center gap-1"
                                                        >
                                                            Manage in Industrial Control ↗
                                                        </button>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        {activeIndicators.map((ind) => (
                                                            <div key={ind.id} className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--glass-border)] opacity-80 hover:opacity-100 transition-opacity">
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--color-accent)] font-bold text-xs border border-[var(--glass-border)]">
                                                                            {ind.type.substring(0, 3)}
                                                                        </div>
                                                                        <div>
                                                                            <h4 className="font-semibold text-sm text-[var(--text-primary)]">{ind.type}</h4>
                                                                            <span className="text-xs text-[var(--text-muted)]">Source: {ind.source}</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="px-2 py-0.5 rounded text-[10px] uppercase font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20">
                                                                        Active
                                                                    </div>
                                                                </div>

                                                                {ind.period > 0 && (
                                                                    <div className="mt-3 opacity-60">
                                                                        <label className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider">Period</label>
                                                                        <div className="text-sm font-medium mt-1">{ind.period}</div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </GlassCard>
                                </div>

                                {/* Risk Settings - Right Col */}
                                <div className="col-span-4 h-full flex flex-col min-h-0">
                                    <GlassCard className="p-6 h-full flex flex-col overflow-y-auto custom-scrollbar">
                                        <h3 className="flex-none text-lg font-semibold mb-6 text-[var(--color-warning)] flex items-center gap-2">
                                            <span>🛡️</span> Risk Settings
                                        </h3>

                                        <div className="space-y-8 flex-1">
                                            {/* Risk per trade */}
                                            <div>
                                                <div className="flex justify-between mb-4">
                                                    <label className="text-sm font-medium text-[var(--text-secondary)]">Risk per trade</label>
                                                    <span className={`text-sm font-bold px-2 py-1 rounded bg-[var(--bg-tertiary)] border border-[var(--glass-border)] ${riskPerTrade > 2 ? 'text-[var(--color-critical)]' : 'text-[var(--color-success)]'}`}>
                                                        {riskPerTrade}%
                                                    </span>
                                                </div>
                                                <div className="h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden mb-2">
                                                    <div
                                                        className="h-full bg-[var(--color-warning)] transition-all duration-300 rounded-full"
                                                        style={{ width: `${(riskPerTrade / 5) * 100}%` }}
                                                    />
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0.5"
                                                    max="5"
                                                    step="0.5"
                                                    value={riskPerTrade}
                                                    onChange={(e) => setRiskPerTrade(Number(e.target.value))}
                                                    className="w-full accent-[var(--color-warning)] cursor-pointer"
                                                />
                                                <div className="flex justify-between text-[10px] text-[var(--text-muted)] mt-1">
                                                    <span>0.5% (Safe)</span>
                                                    <span>5.0% (High Risk)</span>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                {/* Max daily trades */}
                                                <div>
                                                    <label className="block text-sm text-[var(--text-secondary)] mb-2">Max daily trades</label>
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            value={maxDailyTrades}
                                                            onChange={(e) => setMaxDailyTrades(Number(e.target.value))}
                                                            className="input-field pl-10"
                                                        />
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">📊</span>
                                                    </div>
                                                </div>

                                                {/* Stop on consecutive loss */}
                                                <div>
                                                    <label className="block text-sm text-[var(--text-secondary)] mb-2">Stop on consecutive loss</label>
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            value={stopOnLoss}
                                                            onChange={(e) => setStopOnLoss(Number(e.target.value))}
                                                            className="input-field pl-10"
                                                        />
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">🛑</span>
                                                    </div>
                                                </div>

                                                {/* Primary timeframe */}
                                                <div>
                                                    <label className="block text-sm text-[var(--text-secondary)] mb-2">Primary timeframe</label>
                                                    <div className="relative">
                                                        <select
                                                            value={timeframe}
                                                            onChange={(e) => setTimeframe(e.target.value)}
                                                            className="dropdown w-full pl-10"
                                                        >
                                                            <option value="M1">M1 (1 Minute)</option>
                                                            <option value="M5">M5 (5 Minutes)</option>
                                                            <option value="M15">M15 (15 Minutes)</option>
                                                            <option value="H1">H1 (1 Hour)</option>
                                                            <option value="H4">H4 (4 Hours)</option>
                                                            <option value="D1">D1 (1 Day)</option>
                                                        </select>
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">⏱️</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex-none mt-8 pt-6 border-t border-[var(--glass-border)]">
                                            <Button className="w-full py-6 text-lg shadow-lg shadow-[var(--color-primary)]/20 hover:shadow-[var(--color-primary)]/40 hover:-translate-y-1 transition-all">
                                                ✓ Save Configuration
                                            </Button>
                                        </div>
                                    </GlassCard>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Industrial Dashboard - Post-conversion control layer */
                        <IndustrialDashboard
                            strategyPackages={strategyPackages}
                            onIndicatorConfigure={(indicator: ManagedIndicator) => {
                                console.log('Configure indicator:', indicator.name);
                                // TODO: Open indicator configuration modal
                            }}
                            onImportIndicator={() => setIsImportModalOpen(true)}
                        />
                    )}
                </div>
            </div>

            <PineScriptImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={handleStrategyImport}
            />
        </div>
    );
}
