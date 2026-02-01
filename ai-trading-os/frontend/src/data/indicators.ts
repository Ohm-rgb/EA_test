export interface IndicatorDefinition {
    type: string;
    name: string;
    description: string;
    category: 'Trend' | 'Oscillator' | 'Volume' | 'Volatility' | 'Momentum';
}

export const AVAILABLE_INDICATORS: IndicatorDefinition[] = [
    { type: 'RSI', name: 'Relative Strength Index', description: 'Momentum oscillator that measures the speed and change of price movements.', category: 'Momentum' },
    { type: 'MACD', name: 'MACD', description: 'Trend-following momentum indicator that shows the relationship between two moving averages.', category: 'Trend' },
    { type: 'EMA', name: 'Exponential Moving Average', description: 'Moving average that places a greater weight and significance on the most recent data points.', category: 'Trend' },
    { type: 'SMA', name: 'Simple Moving Average', description: 'Arithmetic moving average calculated by adding recent prices and then dividing by the number of time periods.', category: 'Trend' },
    { type: 'BOLL', name: 'Bollinger Bands', description: 'Volatility indicator defined by a set of trendlines.', category: 'Volatility' },
    { type: 'ATR', name: 'Average True Range', description: 'Technical analysis indicator that measures market volatility.', category: 'Volatility' },
    { type: 'STOCH', name: 'Stochastic Oscillator', description: 'Momentum indicator comparing a particular closing price of a security to a range of its prices.', category: 'Momentum' },
    { type: 'CCI', name: 'Commodity Channel Index', description: 'Momentum-based oscillator used to help determine when an investment vehicle is reaching a condition of being overbought or oversold.', category: 'Momentum' }
];
