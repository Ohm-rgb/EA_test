'use client';

import { useState, useEffect } from 'react';
import { GlassCard, Button, Chip, Badge } from "@/components/ui";
import { PineScriptImportModal } from "@/components/modals/PineScriptImportModal";
import { StrategyPackageCard, StrategyPackageModal } from "@/components/strategy";
import { IndustrialDashboard } from "@/components/backtest";
import { ParsedStrategy } from "@/services/pineScriptService";
import { StrategyPackage } from "@/types/strategyPackage";
import { ManagedIndicator } from "@/types/backtestTypes";
import { Bot, BotConfig } from "@/types/botTypes";
import { BotApi } from "@/services/botApi";
import { BotSelector } from "@/components/bot/BotSelector";

// New Dashboard Components
import { DashboardLayout } from "@/components/bot-studio/DashboardLayout";
import { DashboardOverview } from "@/components/bot-studio/DashboardOverview";
import { IndicatorSelectorPanel } from "@/components/indicator/IndicatorSelectorPanel";
import { FlowEditor } from "@/components/flow/FlowEditor";
import { useBotStore } from "@/stores/botStore";

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
const actions = ['Buy', 'Sell', 'Close Position', 'Add to Position'];

export default function BotStudio() {
    // -------------------------------------------------------------------------
    // 1. Core Dashboard State
    // -------------------------------------------------------------------------
    const [activeView, setActiveView] = useState<'overview' | 'machine' | 'performance'>('overview');

    // Settings State (Lifted Up)
    const [dashboardSettings, setDashboardSettings] = useState({
        refreshRate: 5,
        theme: 'industrial',
        showFinancials: true,
        // KPI Thresholds (OEE)
        availabilityWarn: 90,
        availabilityDanger: 80,
        qualityWarn: 60,
        qualityDanger: 40,
        efficiencyWarn: 80,
        efficiencyDanger: 60,
        // Strategy Targets
        targetProfit: 1000,
        maxDrawdown: 500,
        targetDailyTrades: 5
    });

    // Multi-Bot State Management
    const [bots, setBots] = useState<Bot[]>([]);
    const [activeBotId, setActiveBotId] = useState<string>('');

    // Logic Builder State (Machine View)
    const [rules, setRules] = useState<BotRule[]>([]);
    const [viewMode, setViewMode] = useState<'logic' | 'indicators'>('logic'); // Sub-view for Machine
    const [activeIndicators, setActiveIndicators] = useState<Indicator[]>([]);
    const [availableIndicators, setAvailableIndicators] = useState<any[]>([]); // Epic 2: Selector State

    // Epic 3: Flow Store Actions
    // const syncIndicatorsToFlow = useBotStore(state => state.syncIndicatorsToFlow); // Deprecated
    const { syncIndicatorPool } = useBotStore();

    const [strategyPackages, setStrategyPackages] = useState<StrategyPackage[]>([]);
    const [configurePackage, setConfigurePackage] = useState<StrategyPackage | null>(null);
    const [activeIndicatorId, setActiveIndicatorId] = useState<string | null>(null);

    // Modals
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    // -------------------------------------------------------------------------
    // Sync Logic
    // -------------------------------------------------------------------------
    // Ref: Sync local indicators to Flow Store
    useEffect(() => {
        // Debounce slightly to prevent rapid firing
        const timer = setTimeout(() => {
            syncIndicatorPool(indicators);
        }, 100);
        return () => clearTimeout(timer);
    }, [indicators, syncIndicatorPool]);

    // -------------------------------------------------------------------------
    // 2. Data Fetching & Effect
    // -------------------------------------------------------------------------

    // Fetch Bots on Mount
    useEffect(() => {
        const loadBots = async () => {
            try {
                const fetchedBots = await BotApi.getBots();
                if (fetchedBots.length > 0) {
                    setBots(fetchedBots);
                    setActiveBotId(fetchedBots[0].id);
                } else {
                    const output = await handleCreateBot(true);
                }
            } catch (err) {
                console.error("Failed to load bots:", err);
            }
        };
        loadBots();
    }, []);

    // Derived Active Bot
    const activeBot = bots.find(b => b.id === activeBotId) || (bots.length > 0 ? bots[0] : null);

    // Fetch Data when Active Bot Changes
    useEffect(() => {
        if (!activeBotId) return;

        const loadBotData = async () => {
            try {
                // Load Indicators (Strategy Packages)
                const inds = await BotApi.getIndicators(activeBotId);

                // Map to StrategyPackage
                const mappedPackages = inds.map((i: any) => ({
                    ...i,
                    subRules: i.rules ? i.rules.map((r: any) => ({
                        ...r,
                        isEnabled: r.is_enabled
                    })) : [],
                    isEnabled: i.status !== 'disabled'
                }));
                setStrategyPackages(mappedPackages);

                // Map to Simplified Active Indicators (for Logic Builder)
                const activeInds = inds
                    .filter((i: any) => i.status === 'active')
                    .map((i: any) => ({
                        id: i.id,
                        type: i.type,
                        period: i.period,
                        source: i.source
                    }));
                setActiveIndicators(activeInds);

                try {
                    // Load Epic 2: Available Indicators (Selection View)
                    const avail = await BotApi.getAvailableIndicators(activeBotId);
                    setAvailableIndicators(avail);
                    // Epic 3: Auto-inject on load
                    syncIndicatorPool(avail);
                } catch (e) { console.error("Failed to load available indicators", e); }

                // Load Legacy Rules
                const fetchedRules = await BotApi.getBotRules(activeBotId);
                if (fetchedRules.length > 0) {
                    const mappedRules = fetchedRules.map((r: any) => ({
                        id: r.id,
                        indicator: r.indicator_id,
                        operator: r.operator,
                        value: r.value,
                        action: r.action,
                        isEnabled: r.is_enabled
                    }));
                    setRules(mappedRules);
                } else {
                    setRules([]);
                }

            } catch (err) {
                console.error("Failed to load bot data:", err);
            }
        };
        loadBotData();
    }, [activeBotId]);

    // -------------------------------------------------------------------------
    // 3. Handlers (Logic & Config)
    // -------------------------------------------------------------------------

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
            setActiveBotId(createdBot.id);
            return createdBot;
        } catch (err) { console.error(err); }
    };

    const updateActiveBotConfig = async (key: keyof BotConfig, value: any) => {
        if (!activeBot) return;
        const updatedBot = { ...activeBot, configuration: { ...activeBot.configuration, [key]: value } };
        setBots(prev => prev.map(b => b.id === activeBotId ? updatedBot : b));
        try {
            await BotApi.updateBotConfig(activeBotId, updatedBot.configuration);
        } catch (err) { console.error(err); }
    };

    // Configuration Updaters (Personality, Risk, etc.)
    const setPersonality = (val: string) => updateActiveBotConfig('personality', val);
    const setRiskPerTrade = (val: number) => updateActiveBotConfig('riskPerTrade', val);
    const setMaxDailyTrades = (val: number) => updateActiveBotConfig('maxDailyTrades', val);
    const setStopOnLoss = (val: number) => updateActiveBotConfig('stopOnLoss', val);
    const setTimeframe = (val: string) => updateActiveBotConfig('timeframe', val);

    // Rule Handlers
    const addRule = () => {
        const newRule: BotRule = {
            id: Date.now(),
            indicator: activeIndicators.length > 0 ? activeIndicators[0].id : '',
            operator: 'signal',
            value: 0,
            action: 'Buy',
            isEnabled: true,
        };
        setRules([...rules, newRule]);
    };
    const removeRule = (id: number) => setRules(rules.filter(r => r.id !== id));
    const updateRule = (id: number, field: keyof BotRule, value: any) => {
        setRules(rules.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    // Strategy Import & Toggle
    const handleStrategyImport = async (strategy: ParsedStrategy) => {
        if (strategy.package) {
            try {
                const pkgToCreate = {
                    ...strategy.package,
                    id: strategy.package.id || `pkg_${Date.now()}`,
                    status: 'draft',
                    bot_id: activeBotId,
                    // Schema Adapters for Backend (IndicatorCreate)
                    source: strategy.package.sourceScript || 'manual', // Map sourceScript -> source
                    period: 0, // Default period (backend required int)
                    params: {}, // Default params
                    type: 'pine_script' // Enforce type
                };
                await BotApi.createIndicator(pkgToCreate);
                // Refresh
                const inds = await BotApi.getIndicators(activeBotId);
                setStrategyPackages(inds);
                // Auto switch to performance view to manage it
                setActiveView('performance');
                setActiveIndicatorId(pkgToCreate.id); // Auto-select the new indicator
            } catch (err: any) {
                console.error("Strategy Import Failed:", err);
                alert(`Failed to import strategy: ${err.message || 'Unknown error'}. Please try again.`);
            }
        } else {
            // Legacy handling
            setViewMode('logic');
        }
    };

    const handlePackageToggle = async (packageId: string, enabled: boolean) => {
        // Find the package first to check status
        const pkg = strategyPackages.find(p => p.id === packageId);
        if (!pkg) return;

        // Auto-activate if Draft
        if (enabled && pkg.status === 'draft') {
            try {
                await BotApi.updateIndicatorStatus(packageId, 'active');
                // Optimistic update will happen below
            } catch (err) {
                console.error("Failed to activate indicator:", err);
                alert("Failed to activate indicator. Please try again.");
                return;
            }
        } else if (enabled && pkg.status !== 'active' && pkg.status !== 'partial') {
            console.error('Cannot enable non-active package');
            return;
        }

        setStrategyPackages(prev => prev.map(p => {
            if (p.id !== packageId) return p;

            // If we just activated it, update status too
            const newStatus = (enabled && p.status === 'draft') ? 'active' : p.status;

            const updatedSubRules = p.subRules.map(r => ({ ...r, isEnabled: enabled }));
            return { ...p, status: newStatus, subRules: updatedSubRules, isEnabled: enabled };
        }));
    };

    const visiblePackages = strategyPackages.filter(pkg => pkg.status === 'active' || pkg.status === 'draft');

    const handleSaveConfiguration = async () => {
        if (!activeBotId || !activeBot) return;
        try {
            const rulesPayload = rules.map(r => ({
                indicator_id: r.indicator,
                operator: r.operator,
                value: r.value,
                action: r.action,
                is_enabled: r.isEnabled
            }));
            await BotApi.replaceBotRules(activeBotId, rulesPayload);
            await BotApi.updateBotConfig(activeBotId, activeBot.configuration);
            alert("Configuration saved successfully!");
        } catch (err: any) {
            alert("Failed to save: " + err.message);
        }
    };

    // Epic 2: Binding Handlers
    const handleBindIndicator = async (indicatorId: string) => {
        // Optimistic Update
        const updatedIndicators = availableIndicators.map(ind =>
            ind.indicator_id === indicatorId ? { ...ind, is_bound: true, is_enabled: true } : ind
        );
        setAvailableIndicators(updatedIndicators);
        // Epic 3: Sync to Flow
        syncIndicatorPool(updatedIndicators);

        try {
            await BotApi.bindIndicator(activeBotId, indicatorId);
        } catch (err) {
            console.error(err);
            // Revert on failure
            const reverted = availableIndicators.map(ind =>
                ind.indicator_id === indicatorId ? { ...ind, is_bound: false } : ind
            );
            setAvailableIndicators(reverted);
            syncIndicatorPool(reverted); // Revert Flow
            alert("Failed to bind indicator");
        }
    };

    const handleUnbindIndicator = async (indicatorId: string) => {
        // Optimistic Update
        const updatedIndicators = availableIndicators.map(ind =>
            ind.indicator_id === indicatorId ? { ...ind, is_bound: false } : ind
        );
        setAvailableIndicators(updatedIndicators);
        // Epic 3: Sync to Flow
        syncIndicatorPool(updatedIndicators);

        try {
            await BotApi.unbindIndicator(activeBotId, indicatorId);
        } catch (err) {
            console.error(err);
            // Revert on failure
            const reverted = availableIndicators.map(ind =>
                ind.indicator_id === indicatorId ? { ...ind, is_bound: true } : ind
            );
            setAvailableIndicators(reverted);
            syncIndicatorPool(reverted); // Revert Flow
            alert("Failed to unbind indicator");
        }
    };

    // -------------------------------------------------------------------------
    // 4. Render
    // -------------------------------------------------------------------------
    return (
        <DashboardLayout activeView={activeView} onViewChange={setActiveView}>

            {/* VIEW 1: OVERVIEW */}
            {activeView === 'overview' && (
                <div className="h-full animate-in fade-in duration-300">
                    <DashboardOverview
                        activeBotName={activeBot?.name}
                        botStatus={activeBot?.status as any}
                        winRate={68} // TODO: Connect to real backtest result
                        netProfit={activeBot ? 12450 : 0}
                        totalTrades={activeBot ? 142 : 0}
                        activeIndicators={activeIndicators}
                        settings={dashboardSettings}
                    />
                </div>
            )}

            {/* VIEW 2: MACHINE DATA (LOGIC BUILDER) */}
            {activeView === 'machine' && (
                <div className="h-full flex flex-col gap-6 p-6 animate-in slide-in-from-right-4 duration-300 overflow-hidden text-slate-200">

                    {/* Bot & Config Header */}
                    <GlassCard className="p-6 flex-none bg-[#1e293b]/50 border-slate-700/50">
                        <div className="flex items-center gap-8">
                            <div className="flex-1">
                                <label className="block text-sm text-slate-400 mb-2">Target Machine</label>
                                <BotSelector
                                    bots={bots}
                                    activeBotId={activeBotId}
                                    onSelect={setActiveBotId}
                                    onCreate={handleCreateBot}
                                />
                            </div>
                            <div className="flex-shrink-0">
                                <button
                                    onClick={handleSaveConfiguration}
                                    disabled={activeBot?.status === 'running'}
                                    className={`px-6 py-3 rounded-xl flex items-center gap-2 font-semibold shadow-lg transition-all
                                        ${activeBot?.status === 'running'
                                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                            : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
                                >
                                    <span>✓</span> Save Logic
                                </button>
                            </div>
                        </div>
                    </GlassCard>

                    {/* Logic Grid */}
                    <div className="flex-1 min-h-0 grid grid-cols-12 gap-6">
                        {/* Logic Builder */}
                        <div className="col-span-8 h-full flex flex-col min-h-0">
                            <GlassCard className="p-6 h-full flex flex-col bg-[#1e293b]/30 border-slate-700/50">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                        <span>⚡</span> Visual Logic Builder
                                    </h3>
                                    <div className="flex bg-slate-800 rounded p-1">
                                        <button
                                            onClick={() => setViewMode('logic')}
                                            className={`px-3 py-1 text-xs rounded ${viewMode === 'logic' ? 'bg-slate-600 text-white' : 'text-slate-400'}`}
                                        >
                                            Flow
                                        </button>
                                        <button
                                            onClick={() => setViewMode('indicators')}
                                            className={`px-3 py-1 text-xs rounded ${viewMode === 'indicators' ? 'bg-slate-600 text-white' : 'text-slate-400'}`}
                                        >
                                            Indicators
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
                                    {viewMode === 'logic' ? (
                                        <div className="w-full h-full min-h-[400px]">
                                            <FlowEditor isDark={true} />
                                        </div>
                                    ) : (
                                        <IndicatorSelectorPanel
                                            indicators={availableIndicators}
                                            onBind={handleBindIndicator}
                                            onUnbind={handleUnbindIndicator}
                                        />
                                    )}
                                </div>
                            </GlassCard>
                        </div>

                        {/* Config Panel (Risk) */}
                        <div className="col-span-4 h-full flex flex-col min-h-0">
                            <GlassCard className="p-6 h-full bg-[#1e293b]/30 border-slate-700/50">
                                <h3 className="text-lg font-semibold text-amber-500 mb-6">Risk Configuration</h3>
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-xs uppercase text-slate-500 font-bold mb-2">Risk Per Trade</label>
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="range" min="0.5" max="5" step="0.5"
                                                value={activeBot?.configuration.riskPerTrade || 1}
                                                onChange={(e) => setRiskPerTrade(Number(e.target.value))}
                                                className="flex-1 accent-amber-500"
                                            />
                                            <span className="font-mono text-amber-400">{activeBot?.configuration.riskPerTrade}%</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase text-slate-500 font-bold mb-2">Stop on Loss (Streak)</label>
                                        <input
                                            type="number"
                                            value={activeBot?.configuration.stopOnLoss || 3}
                                            onChange={(e) => setStopOnLoss(Number(e.target.value))}
                                            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white outline-none focus:border-amber-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase text-slate-500 font-bold mb-2">Primary Timeframe</label>
                                        <select
                                            value={activeBot?.configuration.timeframe || 'H1'}
                                            onChange={(e) => setTimeframe(e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white outline-none focus:border-amber-500"
                                        >
                                            <option value="M15">M15</option>
                                            <option value="H1">H1</option>
                                            <option value="H4">H4</option>
                                        </select>
                                    </div>
                                </div>
                            </GlassCard>
                        </div>
                    </div>

                    {/* Strategy Package Modal */}
                    {configurePackage && (
                        <StrategyPackageModal
                            isOpen={!!configurePackage}
                            package_={configurePackage}
                            onClose={() => setConfigurePackage(null)}
                            onSave={(updated) => {
                                // Simple update
                                setStrategyPackages(prev => prev.map(p => p.id === updated.id ? updated : p));
                            }}
                        />
                    )}
                </div>
            )}

            {/* VIEW 3: PERFORMANCE (INDUSTRIAL DASHBOARD) */}
            {activeView === 'performance' && (
                <div className="h-full animate-in fade-in duration-300">
                    <IndustrialDashboard
                        strategyPackages={strategyPackages}
                        activeIndicatorId={activeIndicatorId}
                        onIndicatorConfigure={(managedInd) => {
                            // Find package and open modal
                            const pkg = strategyPackages.find(p => p.id === managedInd.id);
                            if (pkg) setConfigurePackage(pkg);
                        }}
                        onImportIndicator={() => setIsImportModalOpen(true)}
                    />
                </div>
            )}

            {/* VIEW 4: SETTINGS (CONFIGURATION) */}


            <PineScriptImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={handleStrategyImport}
            />

        </DashboardLayout>
    );
}
