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
    actionConfig: {
        onBuy: TradeAction | null;
        onSell: TradeAction | null;
    };

    // Actions (Phase Authority)
    setContext: (symbol: string, timeframe: string) => void;
    syncIndicatorPool: (indicators: any[]) => void;

    // Phase 3 Actions
    addRule: (rule: Omit<LogicRule, 'id'>) => void;
    removeRule: (id: string, type: 'buy' | 'sell') => void;
    // Logic/Risk/Action setters will be added in their respective implementation phases
}

export const useBotStore = create<PipelineState>((set) => ({
    // Initial State (Invalid/Empty)
    contextConfig: { symbol: '', timeframe: '', isComplete: false },
    indicatorPool: [],
    ruleSets: { buy: [], sell: [] },
    riskConfig: { riskPerTrade: 1.0, stopLoss: 50, rewardRatio: 2.0 },
    actionConfig: { onBuy: null, onSell: null },

    // Phase 1 Action
    setContext: (symbol, timeframe) => set({
        contextConfig: { symbol, timeframe, isComplete: !!(symbol && timeframe) }
    }),

    // Phase 2 Action: Sync from Side Panel
    syncIndicatorPool: (availableIndicators) => {
        // Filter only bound & enabled indicators
        const active = availableIndicators.filter(i =>
            i.is_bound && i.is_enabled && (i.status === 'ready' || i.status === 'active')
        );

        // Map to strict Domain Model
        const pool: IndicatorInstance[] = active.map(i => ({
            id: `inst_${i.indicator_id}`,
            indicatorId: i.indicator_id,
            name: i.name,
            params: {}, // todo: extract params
            isBound: true
        }));

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
