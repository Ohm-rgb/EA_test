export type BotStatus = 'draft' | 'active' | 'running' | 'paused';

export interface BotConfig {
    personality: 'conservative' | 'balanced' | 'aggressive';
    riskPerTrade: number;
    maxDailyTrades: number;
    stopOnLoss: number;
    timeframe: string;
}

export interface Bot {
    id: string;
    name: string;
    status: BotStatus;
    configuration: BotConfig;
    // We will link rules and active indicators to the bot essentially
    boundIndicators: string[]; // List of StrategyPackage IDs
    rules?: any[]; // Making optional for now as it's handled separately in frontend state but will be part of API
}
