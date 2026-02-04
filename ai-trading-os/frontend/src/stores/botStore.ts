import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { BotApi } from '@/services/botApi';

// -----------------------------------------------------------------------------
// Pipeline Domain Models (Strict Types)
// -----------------------------------------------------------------------------

export interface IndicatorInstance {
    id: string; // Unique ID in the pool
    indicatorId: string; // Library ID (e.g., 'rsi_14')
    name: string;
    type: string;
    status: string;
    params: Record<string, string | number | boolean>;
    isBound: boolean;
    isEnabled: boolean;
    botIndicatorId?: string | null;
    config?: Record<string, string | number | boolean>;
    configHash?: string;
}

export interface LogicRule {
    id: string;
    type: 'buy' | 'sell';
    leftOperandId: string; // Indicator ID from pool
    operator: '>' | '<' | '==' | '>=' | '<=' | 'crosses_above' | 'crosses_below';
    rightOperand: string | number; // Value (70) or Indicator ID
}

export interface TradeAction {
    type: 'market_buy' | 'market_sell' | 'close_position';
}

// -----------------------------------------------------------------------------
// Store State Interface
// -----------------------------------------------------------------------------

export interface PipelineState {
    // =========================================================================
    // SHARED STATE (Single Source of Truth)
    // =========================================================================

    // Active Bot Context
    activeBotId: string | null;

    // Master Indicator Pool - shared between Machine Data & Performance
    indicatorPool: IndicatorInstance[];

    // Available Indicators (from API - all user indicators)
    availableIndicators: IndicatorInstance[];

    // Loading States
    isLoadingIndicators: boolean;
    lastSyncAt: Date | null;

    // =========================================================================
    // PIPELINE STATE (Machine Data View)
    // =========================================================================

    // Phase 1: Context
    contextConfig: {
        symbol: string;
        timeframe: string;
        isComplete: boolean;
    };

    // Phase 3: Logic Engine
    ruleSets: {
        buy: LogicRule[];
        sell: LogicRule[];
    };

    // Phase 4: Risk & Filters
    riskConfig: {
        riskPerTrade: number;
        stopLoss: number;
        rewardRatio: number;
    };

    // Phase 5: Action
    actionConfig: {
        onBuy: TradeAction | null;
        onSell: TradeAction | null;
    };

    // UI State (Inspector)
    selectedItem: {
        type: 'indicator' | 'risk' | 'rule' | null;
        id: string | null;
    };

    // =========================================================================
    // ACTIONS - Bot Context
    // =========================================================================
    setActiveBotId: (botId: string | null) => void;

    // =========================================================================
    // ACTIONS - Indicator Management (Shared)
    // =========================================================================

    // Fetch & Sync from API
    fetchIndicators: (botId: string) => Promise<void>;
    refreshIndicators: () => Promise<void>;

    // Sync from external source (legacy support)
    syncIndicatorPool: (indicators: ApiIndicatorResponse[]) => void;

    // Bind/Unbind with API
    bindIndicator: (indicatorId: string) => Promise<boolean>;
    unbindIndicator: (indicatorId: string) => Promise<boolean>;

    // Local mutations
    addIndicator: (indicator: IndicatorInstance) => void;
    removeIndicator: (id: string) => void;
    updateIndicatorParams: (id: string, params: Record<string, string | number | boolean>) => void;
    updateIndicatorStatus: (id: string, status: string) => void;

    // =========================================================================
    // ACTIONS - Pipeline Configuration
    // =========================================================================
    setContext: (symbol: string, timeframe: string) => void;
    selectItem: (type: 'indicator' | 'risk' | 'rule' | null, id?: string | null) => void;
    setRisk: (config: Partial<PipelineState['riskConfig']>) => void;

    // =========================================================================
    // ACTIONS - Rules
    // =========================================================================
    addRule: (rule: Omit<LogicRule, 'id'>) => void;
    removeRule: (id: string, type: 'buy' | 'sell') => void;

    // =========================================================================
    // SELECTORS (Computed)
    // =========================================================================
    getBoundIndicators: () => IndicatorInstance[];
    getActiveIndicators: () => IndicatorInstance[];
    getIndicatorById: (id: string) => IndicatorInstance | undefined;
}

// -----------------------------------------------------------------------------
// Helper: Map API response to IndicatorInstance
// -----------------------------------------------------------------------------
export interface ApiIndicatorResponse {
    id?: string;
    indicator_id?: string;
    name?: string;
    type?: string;
    status?: string;
    params?: Record<string, string | number | boolean>;
    is_bound?: boolean;
    is_enabled?: boolean;
    bot_indicator_id?: string | null;
    config?: Record<string, string | number | boolean>;
    config_hash?: string;
}

function mapApiToIndicator(apiIndicator: ApiIndicatorResponse): IndicatorInstance {
    return {
        id: apiIndicator.id || apiIndicator.indicator_id || `ind_${Date.now()}`,
        indicatorId: apiIndicator.indicator_id || apiIndicator.id || `ind_${Date.now()}`,
        name: apiIndicator.name || apiIndicator.type || 'Unknown',
        type: apiIndicator.type || 'generic',
        status: apiIndicator.status || 'draft',
        params: apiIndicator.params || {},
        isBound: apiIndicator.is_bound ?? false,
        isEnabled: apiIndicator.is_enabled ?? false,
        botIndicatorId: apiIndicator.bot_indicator_id || null,
        config: apiIndicator.config || apiIndicator.params || {},
        configHash: apiIndicator.config_hash || undefined,
    };
}

// -----------------------------------------------------------------------------
// Store Implementation
// -----------------------------------------------------------------------------

export const useBotStore = create<PipelineState>()(
    subscribeWithSelector((set, get) => ({
        // =====================================================================
        // INITIAL STATE
        // =====================================================================

        // Shared State
        activeBotId: null,
        indicatorPool: [],
        availableIndicators: [],
        isLoadingIndicators: false,
        lastSyncAt: null,

        // Pipeline State
        contextConfig: { symbol: '', timeframe: '', isComplete: false },
        ruleSets: { buy: [], sell: [] },
        riskConfig: { riskPerTrade: 1.0, stopLoss: 50, rewardRatio: 2.0 },
        actionConfig: { onBuy: null, onSell: null },
        selectedItem: { type: null, id: null },

        // =====================================================================
        // BOT CONTEXT ACTIONS
        // =====================================================================

        setActiveBotId: (botId) => {
            console.log('[BotStore] setActiveBotId:', botId);
            set({ activeBotId: botId });

            // Auto-fetch indicators when bot changes
            if (botId) {
                get().fetchIndicators(botId);
            }
        },

        // =====================================================================
        // INDICATOR MANAGEMENT ACTIONS
        // =====================================================================

        fetchIndicators: async (botId) => {
            console.log('[BotStore] fetchIndicators for bot:', botId);
            set({ isLoadingIndicators: true });

            try {
                const response = await BotApi.getAvailableIndicators(botId);
                console.log('[BotStore] API Response:', response);

                const mapped = response.map(mapApiToIndicator);

                // Update both pools
                const boundIndicators = mapped.filter(i => i.isBound);

                set({
                    availableIndicators: mapped,
                    indicatorPool: boundIndicators,
                    isLoadingIndicators: false,
                    lastSyncAt: new Date(),
                });

                console.log('[BotStore] Synced indicators:', {
                    available: mapped.length,
                    bound: boundIndicators.length,
                });
            } catch (error) {
                console.error('[BotStore] fetchIndicators error:', error);
                set({ isLoadingIndicators: false });
            }
        },

        refreshIndicators: async () => {
            const { activeBotId } = get();
            if (activeBotId) {
                await get().fetchIndicators(activeBotId);
            }
        },

        syncIndicatorPool: (indicators: ApiIndicatorResponse[]) => {
            console.log('[BotStore] syncIndicatorPool called:', indicators.length);

            const mapped = indicators.map(mapApiToIndicator);
            const boundIndicators = mapped.filter(i => i.isBound);

            set({
                availableIndicators: mapped,
                indicatorPool: boundIndicators,
                lastSyncAt: new Date(),
            });

            console.log('[BotStore] Pool synced:', {
                available: mapped.length,
                bound: boundIndicators.length,
            });
        },

        bindIndicator: async (indicatorId) => {
            const { activeBotId, availableIndicators } = get();
            if (!activeBotId) {
                console.error('[BotStore] No active bot for binding');
                return false;
            }

            console.log('[BotStore] bindIndicator:', indicatorId);

            // Optimistic update
            const updatedAvailable = availableIndicators.map(ind =>
                ind.indicatorId === indicatorId || ind.id === indicatorId
                    ? { ...ind, isBound: true, isEnabled: true }
                    : ind
            );
            const updatedPool = updatedAvailable.filter(i => i.isBound);

            set({
                availableIndicators: updatedAvailable,
                indicatorPool: updatedPool,
            });

            try {
                await BotApi.bindIndicator(activeBotId, indicatorId);
                console.log('[BotStore] bindIndicator success');
                return true;
            } catch (error) {
                console.error('[BotStore] bindIndicator error:', error);

                // Revert on failure
                const revertedAvailable = availableIndicators.map(ind =>
                    ind.indicatorId === indicatorId || ind.id === indicatorId
                        ? { ...ind, isBound: false, isEnabled: false }
                        : ind
                );
                const revertedPool = revertedAvailable.filter(i => i.isBound);

                set({
                    availableIndicators: revertedAvailable,
                    indicatorPool: revertedPool,
                });

                return false;
            }
        },

        unbindIndicator: async (indicatorId) => {
            const { activeBotId, availableIndicators } = get();
            if (!activeBotId) {
                console.error('[BotStore] No active bot for unbinding');
                return false;
            }

            console.log('[BotStore] unbindIndicator:', indicatorId);

            // Optimistic update
            const updatedAvailable = availableIndicators.map(ind =>
                ind.indicatorId === indicatorId || ind.id === indicatorId
                    ? { ...ind, isBound: false, isEnabled: false }
                    : ind
            );
            const updatedPool = updatedAvailable.filter(i => i.isBound);

            set({
                availableIndicators: updatedAvailable,
                indicatorPool: updatedPool,
            });

            try {
                await BotApi.unbindIndicator(activeBotId, indicatorId);
                console.log('[BotStore] unbindIndicator success');
                return true;
            } catch (error) {
                console.error('[BotStore] unbindIndicator error:', error);

                // Revert on failure
                const revertedAvailable = availableIndicators.map(ind =>
                    ind.indicatorId === indicatorId || ind.id === indicatorId
                        ? { ...ind, isBound: true, isEnabled: true }
                        : ind
                );
                const revertedPool = revertedAvailable.filter(i => i.isBound);

                set({
                    availableIndicators: revertedAvailable,
                    indicatorPool: revertedPool,
                });

                return false;
            }
        },

        addIndicator: (indicator) => {
            console.log('[BotStore] addIndicator:', indicator.name);
            set((state) => ({
                indicatorPool: [...state.indicatorPool, indicator],
                availableIndicators: [...state.availableIndicators, indicator],
            }));
        },

        removeIndicator: (id) => {
            console.log('[BotStore] removeIndicator:', id);
            set((state) => ({
                indicatorPool: state.indicatorPool.filter(i => i.id !== id),
            }));
        },

        updateIndicatorParams: (id, params) => {
            console.log('[BotStore] updateIndicatorParams:', id, params);
            set((state) => ({
                indicatorPool: state.indicatorPool.map(ind =>
                    ind.id === id ? { ...ind, params: { ...ind.params, ...params } } : ind
                ),
                availableIndicators: state.availableIndicators.map(ind =>
                    ind.id === id ? { ...ind, params: { ...ind.params, ...params } } : ind
                ),
            }));
        },

        updateIndicatorStatus: (id, status) => {
            console.log('[BotStore] updateIndicatorStatus:', id, status);
            set((state) => ({
                indicatorPool: state.indicatorPool.map(ind =>
                    ind.id === id ? { ...ind, status } : ind
                ),
                availableIndicators: state.availableIndicators.map(ind =>
                    ind.id === id ? { ...ind, status } : ind
                ),
            }));
        },

        // =====================================================================
        // PIPELINE CONFIGURATION ACTIONS
        // =====================================================================

        setContext: (symbol, timeframe) => {
            console.log('[BotStore] setContext:', symbol, timeframe);
            set({
                contextConfig: { symbol, timeframe, isComplete: !!(symbol && timeframe) }
            });
        },

        selectItem: (type, id = null) => {
            console.log('[BotStore] selectItem:', { type, id });
            set({ selectedItem: { type, id } });
        },

        setRisk: (config) => {
            console.log('[BotStore] setRisk:', config);
            set((state) => ({
                riskConfig: { ...state.riskConfig, ...config }
            }));
        },

        // =====================================================================
        // RULE ACTIONS
        // =====================================================================

        addRule: (rule) => {
            const newRule = {
                ...rule,
                id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            };
            console.log('[BotStore] addRule:', newRule);

            set((state) => ({
                ruleSets: {
                    ...state.ruleSets,
                    [rule.type]: [...state.ruleSets[rule.type], newRule]
                }
            }));
        },

        removeRule: (id, type) => {
            console.log('[BotStore] removeRule:', id, type);
            set((state) => ({
                ruleSets: {
                    ...state.ruleSets,
                    [type]: state.ruleSets[type].filter(r => r.id !== id)
                }
            }));
        },

        // =====================================================================
        // SELECTORS
        // =====================================================================

        getBoundIndicators: () => {
            return get().indicatorPool.filter(i => i.isBound);
        },

        getActiveIndicators: () => {
            return get().indicatorPool.filter(i => i.isBound && i.isEnabled);
        },

        getIndicatorById: (id) => {
            const { indicatorPool, availableIndicators } = get();
            return indicatorPool.find(i => i.id === id || i.indicatorId === id)
                || availableIndicators.find(i => i.id === id || i.indicatorId === id);
        },
    }))
);

// -----------------------------------------------------------------------------
// Hooks for specific use cases
// -----------------------------------------------------------------------------

export function useIndicatorPool() {
    return useBotStore((state) => state.indicatorPool);
}

export function useAvailableIndicators() {
    return useBotStore((state) => state.availableIndicators);
}

export function useBoundIndicators() {
    return useBotStore((state) => state.indicatorPool.filter(i => i.isBound));
}

export function useIndicatorActions() {
    return useBotStore((state) => ({
        bind: state.bindIndicator,
        unbind: state.unbindIndicator,
        refresh: state.refreshIndicators,
        add: state.addIndicator,
        remove: state.removeIndicator,
        updateParams: state.updateIndicatorParams,
        updateStatus: state.updateIndicatorStatus,
    }));
}

export function useActiveBotId() {
    return useBotStore((state) => state.activeBotId);
}

export function useSetActiveBotId() {
    return useBotStore((state) => state.setActiveBotId);
}
