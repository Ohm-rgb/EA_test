'use client';

import { useState, useEffect, useCallback } from 'react';
import { GlassCard } from "@/components/ui";
import { PineScriptImportModal } from "@/components/modals/PineScriptImportModal";
import { StrategyPackageModal } from "@/components/strategy";
import { IndustrialDashboard } from "@/components/backtest";
import { ParsedStrategy } from "@/services/pineScriptService";
import { StrategyPackage, PackageStatus } from "@/types/strategyPackage";
import { Bot } from "@/types/botTypes";
import { BotApi } from "@/services/botApi";
import { BotSelector } from "@/components/bot/BotSelector";

import { FlowIndicatorsPanel } from "@/components/pipeline/FlowIndicatorsPanel";
import { StrategyPipeline } from "@/components/pipeline/StrategyPipeline";
import { DashboardLayout } from "@/components/bot-studio/DashboardLayout";
import { DashboardOverview } from "@/components/bot-studio/DashboardOverview";
import {
    useBotStore,
    useIndicatorPool,
    useAvailableIndicators
} from "@/stores/botStore";

interface BotRule {
    id: number;
    indicator: string;
    operator: string;
    value: number;
    action: string;
    isEnabled: boolean;
}

export default function BotStudio() {
    // -------------------------------------------------------------------------
    // 1. Core Dashboard State
    // -------------------------------------------------------------------------
    const [activeView, setActiveView] = useState<'overview' | 'machine' | 'performance'>('overview');

    // Settings State (Lifted Up)
    const [dashboardSettings] = useState({
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
    const [activeBotId, setActiveBotIdLocal] = useState<string>('');

    // Logic Builder State (Machine View)
    const [rules, setRules] = useState<BotRule[]>([]);

    // =========================================================================
    // CENTRALIZED INDICATOR STATE (Single Source of Truth)
    // =========================================================================
    const indicatorPool = useIndicatorPool();
    const availableIndicators = useAvailableIndicators();

    const {
        setActiveBotId: setStoreBotId,
        fetchIndicators,
        refreshIndicators,
    } = useBotStore();

    // Derived: activeIndicators from pool (for legacy compatibility)
    const activeIndicators = indicatorPool.filter(i => i.isBound).map(i => ({
        id: i.id,
        type: i.type,
        period: typeof i.params?.period === 'number' ? i.params.period : 14,
        source: typeof i.params?.source === 'string' ? i.params.source : 'close'
    }));

    // Sync activeBotId to store when it changes
    const setActiveBotId = useCallback((botId: string) => {
        setActiveBotIdLocal(botId);
        setStoreBotId(botId);
    }, [setStoreBotId]);

    // Strategy Packages - derived from availableIndicators for Performance view
    const strategyPackages: StrategyPackage[] = availableIndicators.map(ind => ({
        id: ind.id,
        name: ind.name,
        type: 'package' as const,
        status: (ind.status || 'draft') as PackageStatus,
        sourceScript: '',
        params: ind.params,
        subRules: [],
        isEnabled: ind.isEnabled,
    }));

    const [configurePackage, setConfigurePackage] = useState<StrategyPackage | null>(null);
    const [activeIndicatorId, setActiveIndicatorId] = useState<string | null>(null);

    // Modals
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    // -------------------------------------------------------------------------
    // Sync Logic
    // -------------------------------------------------------------------------
    // Ref: Sync local indicators to Flow Store
    // -------------------------------------------------------------------------
    // Sync Logic
    // -------------------------------------------------------------------------
    // Ref: Sync local indicators to Flow Store
    // REMOVED: Deprecated effect that conflicted with real data loading
    // useEffect(() => {
    //     const timer = setTimeout(() => {
    //         syncIndicatorPool(indicators);
    //     }, 100);
    //     return () => clearTimeout(timer);
    // }, [indicators, syncIndicatorPool]);

    // -------------------------------------------------------------------------
    // 2. Data Fetching & Effect
    // -------------------------------------------------------------------------

    // Create Bot Handler (defined before useEffect that uses it)
    const handleCreateBot = useCallback(async () => {
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
        } catch (err) {
            console.error(err);
        }
    }, [setActiveBotId]);

    // Fetch Bots on Mount
    useEffect(() => {
        const loadBots = async () => {
            try {
                const fetchedBots = await BotApi.getBots();
                if (fetchedBots.length > 0) {
                    setBots(fetchedBots);
                    setActiveBotId(fetchedBots[0].id);
                } else {
                    await handleCreateBot();
                }
            } catch (err) {
                console.error("Failed to load bots:", err);
            }
        };
        loadBots();
    }, [handleCreateBot, setActiveBotId]);

    // Derived Active Bot
    const activeBot = bots.find(b => b.id === activeBotId) || (bots.length > 0 ? bots[0] : null);

    // Fetch Data when Active Bot Changes
    useEffect(() => {
        if (!activeBotId) return;

        const loadBotData = async () => {
            try {
                // =========================================================
                // CENTRALIZED: Fetch indicators via store (syncs both views)
                // =========================================================
                await fetchIndicators(activeBotId);

                // Load Legacy Rules
                const fetchedRules = await BotApi.getBotRules(activeBotId);
                if (fetchedRules.length > 0) {
                    const mappedRules = fetchedRules.map((r: { id: number; indicator_id: string; operator: string; value: number; action: string; is_enabled: boolean }) => ({
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
    }, [activeBotId, fetchIndicators]);

    // -------------------------------------------------------------------------
    // 3. Handlers (Logic & Config)
    // -------------------------------------------------------------------------

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
                    period: '14', // Default period (backend required string)
                    params: {}, // Default params
                    type: 'pine_script'
                };
                await BotApi.createIndicator(pkgToCreate);
                // Refresh indicators via store
                await refreshIndicators();
                // Auto switch to performance view to manage it
                setActiveView('performance');
                setActiveIndicatorId(pkgToCreate.id as string); // Auto-select the new indicator
            } catch (err) {
                console.error("Strategy Import Failed:", err);
                const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                alert(`Failed to import strategy: ${errorMessage}. Please try again.`);
            }
        } else {
            // Legacy handling - no action needed
        }
    };

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
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            alert("Failed to save: " + message);
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
                        botStatus={activeBot?.status as 'running' | 'stopped' | 'draft' | undefined}
                        winRate={68}
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
                            <div className="shrink-0">
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
                    <div className="flex-1 min-h-0 grid grid-cols-12 gap-0 overflow-hidden bg-[#0f172a] border border-slate-800 rounded-xl shadow-2xl">
                        {/* Center: Visual Logic Canvas (Visualization) */}
                        <div className="col-span-5 h-full flex flex-col min-h-0 relative border-r border-slate-800">
                            <FlowIndicatorsPanel />
                        </div>

                        {/* Right: Inspector Panel (Configuration) */}
                        <div className="col-span-7 h-full flex flex-col min-h-0 bg-slate-900">
                            <StrategyPipeline />
                        </div>
                    </div>

                    {/* Strategy Package Modal */}
                    {configurePackage && (
                        <StrategyPackageModal
                            isOpen={!!configurePackage}
                            package_={configurePackage}
                            onClose={() => setConfigurePackage(null)}
                            onSave={() => {
                                // Refresh indicators after save
                                refreshIndicators();
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
