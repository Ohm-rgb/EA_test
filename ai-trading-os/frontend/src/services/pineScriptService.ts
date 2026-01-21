import api, { PineScriptParseResult } from '@/lib/api';
import { StrategyPackage, SubRule, generatePackageId, calculatePackageStatus } from '@/types/strategyPackage';

export interface ParsedStrategy {
  schemaVersion: string;
  indicators: Array<{
    id: string;
    type: string;
    period: number;
    source: string;
  }>;
  rules: Array<{
    id: number;
    indicator: string;
    operator: string;
    value: number;
    action: string;
    isEnabled: boolean;
  }>;
  status: 'success' | 'partial' | 'failed';
  warning?: string;
  rawAiResponse?: string;
  // New: Package support
  package?: StrategyPackage;
}

export const pineScriptService = {
  /**
   * Parse Pine Script and extract trading logic.
   * Returns a StrategyPackage for complex indicators, or flat rules for simple ones.
   */
  async parseScript(scriptContent: string, debug: boolean = false): Promise<ParsedStrategy> {
    try {
      const result: PineScriptParseResult = await api.parsePineScript(scriptContent, debug);

      console.log("Pine Script Parse Result:", result);
      if (debug && result.raw_ai_response) {
        console.log("Raw AI Response:", result.raw_ai_response);
      }

      // Determine package name from script or indicators
      const packageName = this.extractPackageName(scriptContent, result);
      const packageId = generatePackageId(packageName);

      // Convert rules to SubRules with packageId
      const subRules: SubRule[] = result.rules.map((rule, index) => ({
        id: Date.now() + index,
        packageId: packageId,
        signal: this.generateSignalName(rule.indicator, rule.operator, rule.action),
        indicator: rule.indicator,
        operator: rule.operator,
        value: rule.value,
        action: rule.action as SubRule['action'],
        isEnabled: rule.isEnabled
      }));

      // Create package if multiple rules (complex indicator)
      let package_: StrategyPackage | undefined;

      if (subRules.length > 1) {
        package_ = {
          id: packageId,
          name: packageName,
          type: 'package',
          sourceScript: scriptContent,
          subRules,
          isEnabled: true,
          status: calculatePackageStatus(subRules)
        };
      }

      return {
        schemaVersion: result.schemaVersion,
        indicators: result.indicators,
        rules: result.rules,
        status: result.status,
        warning: result.warning,
        rawAiResponse: result.raw_ai_response,
        package: package_
      };

    } catch (error) {
      console.error("Pine Script Parsing Error:", error);
      return {
        schemaVersion: "1.0",
        indicators: [],
        rules: [],
        status: 'failed',
        warning: error instanceof Error ? error.message : "Connection to AI service failed."
      };
    }
  },

  /**
   * Extract package name from Pine Script or fall back to indicator type
   */
  extractPackageName(script: string, result: PineScriptParseResult): string {
    // Try to find indicator/strategy name in script
    const indicatorMatch = script.match(/indicator\s*\(\s*['"]([^'"]+)['"]/);
    const strategyMatch = script.match(/strategy\s*\(\s*['"]([^'"]+)['"]/);

    if (indicatorMatch) return indicatorMatch[1];
    if (strategyMatch) return strategyMatch[1];

    // Fall back to first indicator type
    if (result.indicators.length > 0) {
      return result.indicators[0].type + " Strategy";
    }

    return "Custom Strategy";
  },

  /**
   * Generate human-readable signal name
   */
  generateSignalName(indicator: string, operator: string, action: string): string {
    const opMap: Record<string, string> = {
      'crosses_above': 'Cross Up',
      'crosses_below': 'Cross Down',
      'greater_than': '>',
      'less_than': '<',
      'equals': '=',
      'signal': ''
    };

    const opText = opMap[operator] || operator;

    if (operator === 'signal') {
      return `${indicator} ${action}`;
    }

    return `${indicator} ${opText} → ${action}`;
  }
};

