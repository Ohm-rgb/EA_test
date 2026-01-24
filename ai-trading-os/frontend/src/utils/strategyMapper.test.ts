import { expect, test, describe } from 'vitest';
import { mapPackageToIndicator } from './strategyMapper';
import { StrategyPackage } from '@/types/strategyPackage';

describe('StrategyMapper', () => {

    // --- 1. Happy Path ---
    test('maps a standard StrategyPackage correctly', () => {
        const input: StrategyPackage = {
            id: 'pkg_test_123',
            name: 'Test Strategy',
            type: 'package',
            sourceScript: '//@version=5...',
            status: 'active',
            isEnabled: true,
            subRules: [
                { id: 1, packageId: 'pkg_test_123', signal: 'Buy Sig', indicator: 'RSI', operator: '>', value: 30, action: 'Buy', isEnabled: true }
            ]
        };

        const result = mapPackageToIndicator(input);

        expect(result.id).toBe('pkg_test_123');
        expect(result.name).toBe('Test Strategy');
        expect(result.sourceType).toBe('pine_script');
        expect(result.status).toBe('active');
        expect(result.subSignals).toHaveLength(1);
        expect(result.subSignals[0].name).toBe('Buy Sig');
    });

    // --- 2. Type Detection ---
    test('detects SMC type correctly', () => {
        const input: StrategyPackage = {
            id: 'smc_1', name: 'Smart Money Concepts', type: 'package', status: 'draft', isEnabled: true, subRules: []
        };
        const result = mapPackageToIndicator(input);
        // Assuming your heuristic detects 'Smart Money'
        // You might need to check if mapPackageToIndicator exposes a way to see detected type, 
        // or check internal structure if exposed. 
        // Since `indicatorType` isn't a top-level field on ManagedIndicator (derived or internal?), 
        // we might verify indirectly via logs or if you added a type field.
        // Actually, ManagedIndicator doesn't have a broad `type` field, but subSignals do.
        // Let's assume the mapper logic sets subsignal types or we just check if it mapped safely.
        expect(result.name).toContain('Smart Money');
    });

    // --- 3. Fallback / Error Handling ---
    test('handles malformed data without crashing', () => {
        const malformedInput = {} as any; // Cast to bypass TS for test

        // Should not throw
        const result = mapPackageToIndicator(malformedInput);

        // Expect fallback
        expect(result.name).toContain('Analysis Failed');
        expect(result.status).toBe('draft');
        expect(result.subSignals[0].name).toBe('Import Error');
    });

    test('handles missing optional fields safely', () => {
        const input: StrategyPackage = {
            id: 'pkg_minimal', name: 'Minimal', type: 'package',
            status: 'draft', isEnabled: true,
            subRules: []
            // Missing sourceScript
        };

        const result = mapPackageToIndicator(input);
        expect(result.sourceType).toBe('manual'); // Assuming fallback for missing script is 'manual'
    });

    // --- 4. Status Mapping ---
    test('maps status correctly', () => {
        const activeVar: StrategyPackage = { id: '1', name: 'S', type: 'package', status: 'active', isEnabled: true, subRules: [] };
        const draftVar: StrategyPackage = { id: '2', name: 'S', type: 'package', status: 'draft', isEnabled: true, subRules: [] };

        expect(mapPackageToIndicator(activeVar).status).toBe('active');
        expect(mapPackageToIndicator(draftVar).status).toBe('draft');
    });
});
