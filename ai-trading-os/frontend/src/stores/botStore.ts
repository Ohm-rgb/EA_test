import { create } from 'zustand';

// -----------------------------------------------------------------------------
// Pipeline Domain Models (Strict Types)
// -----------------------------------------------------------------------------

export interface IndicatorInstance {
    id: string; // Unique ID in the pool
    indicatorId: string; // Library ID (e.g., 'rsi_14')
    name: string;
    params: Record<string, any>;
    isBound: boolean;
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
    // volume, etc.
}

export interface PipelineState {
    // Phase 1: Context
    contextConfig: {
        symbol: string;
        timeframe: string;
        isComplete: boolean;
    };

    // Phase 2: Inventory (The Rack)
    indicatorPool: IndicatorInstance[];

    // Phase 3: Logic Engine
    ruleSets: {
        buy: LogicRule[];
        sell: LogicRule[];
    };

    // Phase 4: Risk & Filters
    riskConfig: {
        riskPerTrade: number; // %
        stopLoss: number; // pips or price
        rewardRatio: number; // optional target
    };

    // Phase 5: Action
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

    // Actions (Phase Authority)
    // Actions (Phase Authority)
    setContext: (symbol: string, timeframe: string) => void;
    syncIndicatorPool: (indicators: any[]) => void;
    selectItem: (type: 'indicator' | 'risk' | 'rule' | null, id?: string | null) => void;
    updateIndicatorParams: (id: string, params: Record<string, any>) => void;

    // New Actions for Refactoring
    addIndicator: (indicator: IndicatorInstance) => void;
    removeIndicator: (id: string) => void;
    setRisk: (config: Partial<PipelineState['riskConfig']>) => void;

    // Phase 3 Actions
    addRule: (rule: Omit<LogicRule, 'id'>) => void;
    removeRule: (id: string, type: 'buy' | 'sell') => void;
}

export const useBotStore = create<PipelineState>((set) => ({
    // Initial State (Invalid/Empty)
    contextConfig: { symbol: '', timeframe: '', isComplete: false },
    indicatorPool: [],
    ruleSets: { buy: [], sell: [] },
    riskConfig: { riskPerTrade: 1.0, stopLoss: 50, rewardRatio: 2.0 },
    actionConfig: { onBuy: null, onSell: null },
    selectedItem: { type: null, id: null }, // Default: No selection

    // Phase 1 Action
    setContext: (symbol, timeframe) => set({
        contextConfig: { symbol, timeframe, isComplete: !!(symbol && timeframe) }
    }),

    // UI Action: Select Item for Inspection
    selectItem: (type, id = null) => {
        console.log('[BotStore] selectItem called:', { type, id });
        set({ selectedItem: { type, id } });
    },

    // Config Action: Update Params via Inspector
    updateIndicatorParams: (id, params) => set((state) => ({
        indicatorPool: state.indicatorPool.map(ind =>
            ind.id === id ? { ...ind, params: { ...ind.params, ...params } } : ind
        )
    })),

    // Phase 2 Actions (New)
    addIndicator: (indicator) => set((state) => ({
        indicatorPool: [...state.indicatorPool, indicator]
    })),

    removeIndicator: (id) => set((state) => ({
        indicatorPool: state.indicatorPool.filter(i => i.id !== id)
    })),

    setRisk: (config) => set((state) => ({
        riskConfig: { ...state.riskConfig, ...config }
    })),

    // Phase 2 Action: Sync from Side Panel
    syncIndicatorPool: (availableIndicators) => {
        console.log('[BotStore] syncIndicatorPool called:', availableIndicators.length, availableIndicators);

        // Filter only bound & enabled indicators (or allow all for dev testing if empty)
        const active = availableIndicators.filter(i =>
            i.is_bound // && i.is_enabled
        );

        // Map to strict Domain Model
        const pool: IndicatorInstance[] = active.map(i => ({
            id: i.id || `inst_${i.indicator_id}`, // Use existing ID first, else generate
            indicatorId: i.indicator_id,
            name: i.name || i.type || 'Unknown',
            params: {}, // todo: extract params
            isBound: true
        }));

        console.log('[BotStore] New Indicator Pool:', pool);
        set({ indicatorPool: pool });
    },

    // Phase 3 Actions
    addRule: (rule) => set((state) => {
        const newRule = { ...rule, id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` };
        return {
            ruleSets: {
                ...state.ruleSets,
                [rule.type]: [...state.ruleSets[rule.type], newRule]
            }
        };
    }),

    removeRule: (id, type) => set((state) => ({
        ruleSets: {
            ...state.ruleSets,
            [type]: state.ruleSets[type].filter(r => r.id !== id)
        }
    })),
}));
