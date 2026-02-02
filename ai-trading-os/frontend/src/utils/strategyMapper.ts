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
        let subSignals = (pkg.subRules || []).map(mapRuleToSubSignal);

        // 2.1 Enrich SMC Signals (Auto-Inject if missing)
        if (indicatorType === 'SMC') {
            subSignals = enrichSMCSubSignals(subSignals);
        } else if (indicatorType === 'Session') {
            subSignals = enrichSessionSignals(subSignals);
        }

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
            params: pkg.params, // [NEW] Keep raw params for capability schema
            config: pkg.params || { period: pkg.period }, // [NEW] Active configuration values
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
    if (nameLower.includes('session') || nameLower.includes('fx market')) return 'Session';
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
 * Enriches SMC indicators with standard sub-signals for Logic Flow Visualization
 */
function enrichSMCSubSignals(existing: SubSignalConfig[]): SubSignalConfig[] {
    const requiredSignals = [
        { id: 'smc_bos', name: 'Break of Structure (BOS)', type: 'Structure' },
        { id: 'smc_choch', name: 'Change of Character', type: 'Structure' },
        { id: 'smc_ob', name: 'Order Block (Entry)', type: 'Entry Zone' },
        { id: 'smc_fvg', name: 'Fair Value Gap (Magnet)', type: 'Inefficiency' },
        { id: 'smc_eqh', name: 'Equal Highs/Lows', type: 'Liquidity' }
    ];

    const merged = [...existing];
    requiredSignals.forEach((req, index) => {
        // Check if a similar signal already exists (fuzzy match)
        const exists = existing.some(s => s.name.toLowerCase().includes(req.name.toLowerCase().split(' ')[0].toLowerCase()));

        if (!exists) {
            merged.push({
                id: `auto_smc_${index}`,
                name: req.name,
                indicatorType: req.type,
                isEnabled: true, // Auto-enable by default for visibility
                parameters: {
                    description: 'Auto-mapped from SMC Logic',
                    virtual: true
                }
            });
        }
    });

    return merged;
}

/**
 * Enriches Session indicators with standard session signals
 */
function enrichSessionSignals(existing: SubSignalConfig[]): SubSignalConfig[] {
    const requiredSignals = [
        { id: 'sess_lon_start', name: 'London Start', type: 'Session' },
        { id: 'sess_lon_end', name: 'London End', type: 'Session' },
        { id: 'sess_ny_start', name: 'NY Start', type: 'Session' },
        { id: 'sess_ny_end', name: 'NY End', type: 'Session' },
        { id: 'sess_tok_start', name: 'Tokyo Start', type: 'Session' },
        { id: 'sess_tok_end', name: 'Tokyo End', type: 'Session' },
        { id: 'sess_syd_start', name: 'Sydney Start', type: 'Session' },
        { id: 'sess_syd_end', name: 'Sydney End', type: 'Session' }
    ];

    const merged = [...existing];
    requiredSignals.forEach((req, index) => {
        // Check if a similar signal already exists (exact or partial match)
        const exists = existing.some(s => s.name.toLowerCase().includes(req.name.toLowerCase()));

        if (!exists) {
            merged.push({
                id: `auto_sess_${index}`,
                name: req.name,
                indicatorType: req.type,
                isEnabled: true,
                parameters: {
                    description: `Auto-mapped ${req.name} Signal`,
                    virtual: true
                }
            });
        }
    });

    return merged;
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
