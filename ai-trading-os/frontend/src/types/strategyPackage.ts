/**
 * Strategy Package Types
 * Frontend-only abstraction for grouping related trading rules
 * 
 * @lifecycle draft → ready → active → disabled
 * @gate Only 'active' packages visible in Strategy Configuration
 */

// Control-First workflow: draft → ready → active → (partial) → disabled → paused → archived
export type PackageStatus = 'draft' | 'ready' | 'active' | 'partial' | 'disabled' | 'paused' | 'archived';

/**
 * Single sub-rule within a Strategy Package
 * Maps 1:1 to backend BotRule
 */
export interface SubRule {
    id: number;
    packageId: string;        // Links to parent package
    signal: string;           // e.g., "BOS Bullish", "CHoCH Bearish"
    indicator: string;        // e.g., "Structure", "FVG"
    operator: string;         // e.g., "signal", "crosses_above"
    value: number | null;     // Threshold value or null for signal-based
    action: 'Buy' | 'Sell' | 'Close Position' | 'Signal';
    isEnabled: boolean;
}

/**
 * Strategy Package - groups multiple SubRules into single UI card
 * Complex indicators (SMC, Ichimoku, etc.) are represented as packages
 */
export interface StrategyPackage {
    id: string;               // Unique package ID (e.g., "pkg_smc_001")
    name: string;             // Display name (e.g., "Smart Money Concepts")
    type: 'package';          // Discriminator for mixed-mode rendering
    sourceScript?: string;    // Original Pine Script (optional)
    subRules: SubRule[];      // Child rules
    isEnabled: boolean;       // Master toggle
    status: PackageStatus;    // Derived: active/partial/disabled
}

/**
 * Union type for rendering logic builder
 * Can be either a package OR individual rule
 */
export type LogicItem = StrategyPackage | SingleRule;

/**
 * Individual rule (not part of a package)
 */
export interface SingleRule {
    id: number;
    type: 'rule';             // Discriminator
    indicator: string;
    operator: string;
    value: number;
    action: 'Buy' | 'Sell' | 'Close Position' | 'Wait';
    isEnabled: boolean;
}

/**
 * Calculate package status from sub-rules
 */
export function calculatePackageStatus(subRules: SubRule[]): PackageStatus {
    const enabledCount = subRules.filter(r => r.isEnabled).length;

    if (enabledCount === 0) return 'disabled';
    if (enabledCount === subRules.length) return 'active';
    return 'partial';
}

/**
 * Generate unique package ID
 */
export function generatePackageId(name: string): string {
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 20);
    const timestamp = Date.now().toString(36);
    return `pkg_${slug}_${timestamp}`;
}

/**
 * Convert flat rules array to packages + single rules
 * Groups rules by packageId field
 */
export function groupRulesIntoPackages(rules: SubRule[]): LogicItem[] {
    const packages = new Map<string, StrategyPackage>();
    const singleRules: SingleRule[] = [];

    for (const rule of rules) {
        if (rule.packageId) {
            // Part of a package
            if (!packages.has(rule.packageId)) {
                packages.set(rule.packageId, {
                    id: rule.packageId,
                    name: extractPackageName(rule.packageId),
                    type: 'package',
                    subRules: [],
                    isEnabled: true,
                    status: 'active'
                });
            }
            packages.get(rule.packageId)!.subRules.push(rule);
        } else {
            // Individual rule
            singleRules.push({
                id: rule.id,
                type: 'rule',
                indicator: rule.indicator,
                operator: rule.operator,
                value: rule.value ?? 0,
                action: rule.action as SingleRule['action'],
                isEnabled: rule.isEnabled
            });
        }
    }

    // Calculate status for each package
    for (const pkg of packages.values()) {
        pkg.status = calculatePackageStatus(pkg.subRules);
        pkg.isEnabled = pkg.status !== 'disabled';
    }

    return [...packages.values(), ...singleRules];
}

/**
 * Extract display name from package ID
 */
function extractPackageName(packageId: string): string {
    // pkg_smart_money_concepts_abc123 -> Smart Money Concepts
    const parts = packageId.replace('pkg_', '').split('_');
    parts.pop(); // Remove timestamp
    return parts
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
