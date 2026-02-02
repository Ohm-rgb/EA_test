import { describe, it, expect, beforeEach } from 'vitest';
import { useBotStore, IndicatorInstance } from './botStore';

/**
 * Unit Tests for botStore (Pipeline State Management)
 * Tests the core state logic for indicator pool and rule management.
 */
describe('botStore Logic', () => {

    beforeEach(() => {
        // Reset state to initial empty before each test
        useBotStore.setState({
            contextConfig: { symbol: '', timeframe: '', isComplete: false },
            indicatorPool: [],
            ruleSets: { buy: [], sell: [] },
            riskConfig: { riskPerTrade: 1.0, stopLoss: 50, rewardRatio: 2.0 },
            actionConfig: { onBuy: null, onSell: null },
            selectedItem: { type: null, id: null }
        });
    });

    // =========================================================================
    // Phase 1: Context Tests
    // =========================================================================
    describe('Phase 1: Context', () => {
        it('should set context and mark as complete', () => {
            const { setContext } = useBotStore.getState();

            setContext('XAUUSD', 'H1');

            const { contextConfig } = useBotStore.getState();
            expect(contextConfig.symbol).toBe('XAUUSD');
            expect(contextConfig.timeframe).toBe('H1');
            expect(contextConfig.isComplete).toBe(true);
        });

        it('should mark context as incomplete if missing values', () => {
            const { setContext } = useBotStore.getState();

            setContext('XAUUSD', ''); // Missing timeframe

            const { contextConfig } = useBotStore.getState();
            expect(contextConfig.isComplete).toBe(false);
        });
    });

    // =========================================================================
    // Phase 2: Indicator Pool Tests
    // =========================================================================
    describe('Phase 2: Indicator Pool', () => {
        it('should sync indicators from external source', () => {
            const { syncIndicatorPool } = useBotStore.getState();

            const externalIndicators = [
                { id: 'ind1', indicator_id: 'rsi_14', name: 'RSI', type: 'RSI', is_bound: true },
                { id: 'ind2', indicator_id: 'sma_50', name: 'SMA 50', type: 'SMA', is_bound: true },
                { id: 'ind3', indicator_id: 'ema_200', name: 'EMA 200', type: 'EMA', is_bound: false }, // Unbound - should be filtered
            ];

            syncIndicatorPool(externalIndicators);

            const { indicatorPool } = useBotStore.getState();
            expect(indicatorPool.length).toBe(2); // Only bound indicators
            expect(indicatorPool.find(i => i.indicatorId === 'rsi_14')).toBeDefined();
            expect(indicatorPool.find(i => i.indicatorId === 'sma_50')).toBeDefined();
            expect(indicatorPool.find(i => i.indicatorId === 'ema_200')).toBeUndefined();
        });

        it('should add indicator to pool', () => {
            const { addIndicator } = useBotStore.getState();

            const newIndicator: IndicatorInstance = {
                id: 'inst_new',
                indicatorId: 'rsi_14',
                name: 'RSI',
                params: { period: 14 },
                isBound: true
            };

            addIndicator(newIndicator);

            const { indicatorPool } = useBotStore.getState();
            expect(indicatorPool.length).toBe(1);
            expect(indicatorPool[0].id).toBe('inst_new');
        });

        it('should remove indicator from pool', () => {
            // Setup: Add an indicator first
            useBotStore.setState({
                indicatorPool: [
                    { id: 'inst_1', indicatorId: 'rsi_14', name: 'RSI', params: {}, isBound: true },
                    { id: 'inst_2', indicatorId: 'sma_50', name: 'SMA', params: {}, isBound: true }
                ]
            });

            const { removeIndicator } = useBotStore.getState();
            removeIndicator('inst_1');

            const { indicatorPool } = useBotStore.getState();
            expect(indicatorPool.length).toBe(1);
            expect(indicatorPool[0].id).toBe('inst_2');
        });

        it('should update indicator params', () => {
            useBotStore.setState({
                indicatorPool: [
                    { id: 'inst_1', indicatorId: 'rsi_14', name: 'RSI', params: { period: 14 }, isBound: true }
                ]
            });

            const { updateIndicatorParams } = useBotStore.getState();
            updateIndicatorParams('inst_1', { period: 21, overbought: 80 });

            const { indicatorPool } = useBotStore.getState();
            expect(indicatorPool[0].params.period).toBe(21);
            expect(indicatorPool[0].params.overbought).toBe(80);
        });
    });

    // =========================================================================
    // Phase 3: Rule Sets Tests
    // =========================================================================
    describe('Phase 3: Rule Sets', () => {
        it('should add a buy rule', () => {
            const { addRule } = useBotStore.getState();

            addRule({
                type: 'buy',
                leftOperandId: 'rsi_14',
                operator: '<',
                rightOperand: 30
            });

            const { ruleSets } = useBotStore.getState();
            expect(ruleSets.buy.length).toBe(1);
            expect(ruleSets.buy[0].leftOperandId).toBe('rsi_14');
            expect(ruleSets.buy[0].operator).toBe('<');
            expect(ruleSets.buy[0].rightOperand).toBe(30);
        });

        it('should add a sell rule', () => {
            const { addRule } = useBotStore.getState();

            addRule({
                type: 'sell',
                leftOperandId: 'rsi_14',
                operator: '>',
                rightOperand: 70
            });

            const { ruleSets } = useBotStore.getState();
            expect(ruleSets.sell.length).toBe(1);
            expect(ruleSets.sell[0].rightOperand).toBe(70);
        });

        it('should remove a rule', () => {
            useBotStore.setState({
                ruleSets: {
                    buy: [
                        { id: 'rule_1', type: 'buy', leftOperandId: 'rsi', operator: '<', rightOperand: 30 },
                        { id: 'rule_2', type: 'buy', leftOperandId: 'ema', operator: 'crosses_above', rightOperand: 'sma' }
                    ],
                    sell: []
                }
            });

            const { removeRule } = useBotStore.getState();
            removeRule('rule_1', 'buy');

            const { ruleSets } = useBotStore.getState();
            expect(ruleSets.buy.length).toBe(1);
            expect(ruleSets.buy[0].id).toBe('rule_2');
        });
    });

    // =========================================================================
    // Phase 4: Risk Config Tests
    // =========================================================================
    describe('Phase 4: Risk Config', () => {
        it('should update risk config partially', () => {
            const { setRisk } = useBotStore.getState();

            setRisk({ riskPerTrade: 2.0 });

            const { riskConfig } = useBotStore.getState();
            expect(riskConfig.riskPerTrade).toBe(2.0);
            expect(riskConfig.stopLoss).toBe(50); // Unchanged
            expect(riskConfig.rewardRatio).toBe(2.0); // Unchanged
        });
    });

    // =========================================================================
    // UI State Tests
    // =========================================================================
    describe('UI State', () => {
        it('should select an item for inspection', () => {
            const { selectItem } = useBotStore.getState();

            selectItem('indicator', 'inst_1');

            const { selectedItem } = useBotStore.getState();
            expect(selectedItem.type).toBe('indicator');
            expect(selectedItem.id).toBe('inst_1');
        });

        it('should clear selection', () => {
            useBotStore.setState({ selectedItem: { type: 'indicator', id: 'inst_1' } });

            const { selectItem } = useBotStore.getState();
            selectItem(null);

            const { selectedItem } = useBotStore.getState();
            expect(selectedItem.type).toBeNull();
            expect(selectedItem.id).toBeNull();
        });
    });
});
