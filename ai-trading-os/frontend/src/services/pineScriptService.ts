import api from '@/lib/api';

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
}

const SYSTEM_PROMPT = `
You are an expert trading strategy logic extractor.
Your task is NOT to compile or validate Pine Script code. 
Your task is to **extract the trading intent** (what the user wants the bot to do) and **create valid Logic Nodes** in JSON format.

### MENTAL MODEL
1. **Ignore Syntax Errors**: The user might paste broken or partial code. Do not try to fix it. RATHER, read it as "pseudo-code" to understand the goal.
2. **Extract Intent**: Look for keywords like "cross over", "rsi", "ema", "buy", "sell", "alert". Use this to construct the logic.
3. **Construct Nodes**: Map the extracted intent to the specific JSON schema below.

### Target Schema (JSON)
{
  "schemaVersion": "1.0",
  "status": "success" | "partial" | "failed",
  "warning": "Optional warning message if logic is guessed",
  "indicators": [
    { "id": "unique_id", "type": "RSI" | "EMA" | "SMA" | "MACD" | "Bollinger Bands" | "Price" | "Volume" | "Custom", "period": number, "source": "Close" | "Open" | "High" | "Low" }
  ],
  "rules": [
    {
      "id": number, // Generate a unique timestamp-based ID
      "indicator": "Indicator Type",
      "operator": "crosses_above" | "crosses_below" | "greater_than" | "less_than" | "equals" | "signal",
      "value": number,
      "action": "Buy" | "Sell",
      "isEnabled": true
    }
  ]
}

### Example Output
{
  "schemaVersion": "1.0",
  "status": "success",
  "indicators": [
    { "id": "rsi_14", "type": "RSI", "period": 14, "source": "Close" }
  ],
  "rules": [
    { "id": 101, "indicator": "RSI", "operator": "crosses_below", "value": 30, "action": "Buy", "isEnabled": true }
  ]
}

### Guidelines
1. **Aggressive Extraction**: If you see "RSI 14", create an RSI indicator object, even if the variable name is weird.
2. **Strategy Mapping**:
   - \`strategy.entry\` / \`strategy.order\` -> Buy/Sell Action
   - \`alertcondition\` -> Signal Action
   - \`plotshape\` -> Signal Action
3. **Defaults**: If period is missing, use standard defaults (RSI=14, EMA=200). If source is missing, use "Close".
4. **Approximate Complex Logic**: If the logic is "Buy if RSI < 30 AND EMA > 200", break it down into best-effort simple rules or just capture the dominant rule. Set "status" to "partial" if you simplify heavily.
5. **Output**: Return ONLY raw JSON. No markdown.
`;

export const pineScriptService = {
  async parseScript(scriptContent: string): Promise<ParsedStrategy> {
    try {
      const response = await api.sendChatMessage(
        `Generate Logic Nodes from this Strategy Intent:\n\n${scriptContent}\n\n(Ignore strict syntax, focus on intent)`,
        SYSTEM_PROMPT
      );

      // Log raw response for debugging
      console.log("AI Raw Response:", response.message);

      let cleanMessage = response.message.trim();

      // 1. Strip Markdown Code Blocks
      cleanMessage = cleanMessage.replace(/```json/g, "").replace(/```/g, "");

      // 2. Find JSON Object (first '{' to last '}')
      const firstBrace = cleanMessage.indexOf('{');
      const lastBrace = cleanMessage.lastIndexOf('}');

      if (firstBrace !== -1 && lastBrace !== -1) {
        const jsonString = cleanMessage.substring(firstBrace, lastBrace + 1);
        try {
          const parsed = JSON.parse(jsonString);

          // Validation & Defaults
          if (!parsed.schemaVersion) parsed.schemaVersion = "1.0";
          if (!parsed.status) parsed.status = "success";
          if (!parsed.indicators) parsed.indicators = [];
          if (!parsed.rules) parsed.rules = [];

          return parsed as ParsedStrategy;
        } catch (parseError) {
          console.error("JSON Parse Error on extracted string:", jsonString);
          throw new Error(`Invalid JSON structure received. Start of content: ${jsonString.substring(0, 50)}...`);
        }
      } else {
        // Fallback: Use the first 100 chars of response to give user a hint
        const safePreview = cleanMessage.substring(0, 100).replace(/\n/g, " ");
        throw new Error(`No JSON found. AI replied: "${safePreview}..."`);
      }

    } catch (error) {
      console.error("Pine Script Parsing Detailed Error:", error);
      // Return failure state with detailed warning
      return {
        schemaVersion: "1.0",
        indicators: [],
        rules: [],
        status: 'failed',
        warning: error instanceof Error ? error.message : "Strategy analysis failed."
      };
    }
  }
};
