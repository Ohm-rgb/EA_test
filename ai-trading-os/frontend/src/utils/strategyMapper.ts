import { StrategyPackage, SubRule } from "@/types/strategyPackage";
import { ManagedIndicator, SubSignalConfig, IndicatorStatus } from "@/types/backtestTypes";

/**
 * Result of the mapping operation, potentially containing warnings
 */
export interface MappingResult {
    indicator: ManagedIndicator;
    warnings: string[];
    success: boolean;
}

/**
 * Maps a raw StrategyPackage to a ManagedIndicator for the dashboard.
 * Includes error handling and fallback logic to prevent UI crashes.
 */
export function mapPackageToIndicator(pkg: StrategyPackage): ManagedIndicator {
    try {
        // 1. Detect Indicator Type
        const indicatorType = detectIndicatorType(pkg);

        // 2. Map Sub-Rules to Sub-Signals
        const subSignals = pkg.subRules.map(mapRuleToSubSignal);

        // 3. Determine Status (Safe handling)
        const status = mapStatus(pkg.status);

        // 4. Construct View Model
        return {
            id: pkg.id,
            name: pkg.name || 'Untitled Strategy',
            sourceType: pkg.sourceScript ? 'pine_script' : 'manual',
            status: status,
            packageId: pkg.id,
            boundBotIds: [], // TODO: Bind from actual bot/package relationship if available
            config: pkg.params || { period: pkg.period }, // [NEW] Propagate params
            subSignals: subSignals,
            enabledSubSignalCount: subSignals.filter(s => s.isEnabled).length,
            // Mock test result for consistency until real backtest data is available
            testResult: {
                testedAt: new Date(),
                winRate: 0,
                profitFactor: 0,
                totalTrades: 0,
                passed: false
            },
            createdAt: new Date(), // In real app, parse pkg.createdAt if available
            updatedAt: new Date()
        };
    } catch (error) {
        console.error(`[Mapper] Failed to map package ${pkg.id}:`, error);
        return createFallbackIndicator(pkg, error instanceof Error ? error.message : "Unknown error");
    }
}

/**
 * Detects the high-level type of the strategy based on its content/name
 */
function detectIndicatorType(pkg: StrategyPackage): string {
    const nameLower = pkg.name.toLowerCase();

    // Heuristic Matching
    if (nameLower.includes('smc') || nameLower.includes('smart money')) return 'SMC';
    if (nameLower.includes('ict')) return 'SMC';
    if (nameLower.includes('rsi')) return 'RSI';
    if (nameLower.includes('macd')) return 'MACD';
    if (nameLower.includes('ema') || nameLower.includes('ma')) return 'Trend';
    if (nameLower.includes('bollinger')) return 'Volatility';

    // Fallback based on first rule
    if (pkg.subRules.length > 0) {
        return pkg.subRules[0].indicator || 'Generic';
    }

    return 'Generic';
}

/**
 * Maps a single sub-rule to a sub-signal configuration
 */
function mapRuleToSubSignal(rule: SubRule): SubSignalConfig {
    return {
        id: rule.id.toString(),
        name: rule.signal || `Rule ${rule.id}`, // Fallback name if signal is missing
        indicatorType: rule.indicator || 'Unknown',
        isEnabled: rule.isEnabled,
        parameters: {
            value: rule.value ?? 0,
            operator: rule.operator,
            action: rule.action
        }
    };
}

/**
 * Safe status mapping
 */
function mapStatus(pkgStatus: string): IndicatorStatus {
    switch (pkgStatus) {
        case 'active': return 'active';
        case 'disabled': return 'disabled';
        case 'draft': return 'draft';
        case 'ready': return 'ready';
        case 'paused': return 'paused';
        case 'archived': return 'archived';
        default: return 'draft'; // Default fallback
    }
}

/**
 * Creates a safe, "broken" state indicator to prevent UI crashes
 */
function createFallbackIndicator(pkg: StrategyPackage, errorMessage: string): ManagedIndicator {
    return {
        id: pkg.id || `fallback_${Date.now()}`,
        name: `${pkg.name || 'Unknown'} (Analysis Failed)`,
        sourceType: 'manual',
        status: 'draft',
        packageId: pkg.id,
        boundBotIds: [],
        subSignals: [{
            id: 'err_1',
            name: 'Import Error',
            indicatorType: 'System',
            isEnabled: false,
            parameters: { error: errorMessage }
        }],
        enabledSubSignalCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
    };
}
