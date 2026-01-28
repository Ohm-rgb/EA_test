import { describe, it, expect, beforeEach } from 'vitest';
import { useBotStore } from './botStore';

// Mock React Flow functions since we run in Node environment (vitest)
// We need to ensure applyNodeChanges and applyEdgeChanges don't crash
// But botStore imports them from 'reactflow'.
// We might need to mock 'reactflow' module.

// Minimal mock for checking state logic
describe('botStore Logic', () => {

    beforeEach(() => {
        useBotStore.setState({ nodes: [], edges: [] });
    });

    it('should inject nodes for bound, enabled, ready/active indicators', () => {
        const { syncIndicatorsToFlow } = useBotStore.getState();

        const indicators = [
            { indicator_id: 'ind1', name: 'RSI', type: 'RSI', status: 'active', is_bound: true, is_enabled: true },
            { indicator_id: 'ind2', name: 'SMA', type: 'SMA', status: 'ready', is_bound: true, is_enabled: true },
            { indicator_id: 'ind3', name: 'Draft', type: 'SMA', status: 'draft', is_bound: true, is_enabled: true }, // Should ignore
            { indicator_id: 'ind4', name: 'Unbound', type: 'SMA', status: 'active', is_bound: false, is_enabled: true }, // Should ignore
            { indicator_id: 'ind5', name: 'Disabled', type: 'SMA', status: 'active', is_bound: true, is_enabled: false }, // Should ignore
        ];

        syncIndicatorsToFlow(indicators);

        const nodes = useBotStore.getState().nodes;

        expect(nodes.length).toBe(2);
        expect(nodes.find(n => n.id === 'indicator-ind1')).toBeDefined();
        expect(nodes.find(n => n.id === 'indicator-ind2')).toBeDefined();
        expect(nodes.find(n => n.id === 'indicator-ind3')).toBeUndefined();
    });

    it('should remove nodes if indicator is unbound', () => {
        const { syncIndicatorsToFlow } = useBotStore.getState();

        // Initial State
        useBotStore.setState({
            nodes: [
                { id: 'indicator-ind1', position: { x: 0, y: 0 }, data: { label: 'RSI' } },
                { id: 'indicator-ind2', position: { x: 0, y: 0 }, data: { label: 'SMA' } }
            ]
        });

        // Update: bind only ind1
        const indicators = [
            { indicator_id: 'ind1', name: 'RSI', type: 'RSI', status: 'active', is_bound: true, is_enabled: true },
            // ind2 is missing or unbound
        ];

        syncIndicatorsToFlow(indicators);

        const nodes = useBotStore.getState().nodes;
        expect(nodes.length).toBe(1);
        expect(nodes[0].id).toBe('indicator-ind1');
    });

    it('should NOT remove user-created manual nodes', () => {
        const { syncIndicatorsToFlow } = useBotStore.getState();

        // Initial State
        useBotStore.setState({
            nodes: [
                { id: 'indicator-ind1', position: { x: 0, y: 0 }, data: { label: 'RSI' } },
                { id: 'manual-logic-node', position: { x: 0, y: 0 }, data: { label: 'My Logic' } }
            ]
        });

        // Update: unbind all
        syncIndicatorsToFlow([]);

        const nodes = useBotStore.getState().nodes;
        expect(nodes.length).toBe(1);
        expect(nodes[0].id).toBe('manual-logic-node');
    });

    it('should not duplicate nodes', () => {
        const { syncIndicatorsToFlow } = useBotStore.getState();

        const indicators = [
            { indicator_id: 'ind1', name: 'RSI', type: 'RSI', status: 'active', is_bound: true, is_enabled: true },
        ];

        syncIndicatorsToFlow(indicators);
        syncIndicatorsToFlow(indicators); // Call again

        const nodes = useBotStore.getState().nodes;
        expect(nodes.length).toBe(1);
    });
});
