'use client';

import { useState, useEffect, useCallback } from 'react';
import api, {
    PortfolioOverview,
    EquityPoint,
    BotPerformance,
    ExposureInfo,
    TradeResponse
} from '@/lib/api';

interface UsePortfolioOptions {
    refreshInterval?: number; // ms, default 30000
    autoFetch?: boolean;
}

interface UsePortfolioReturn {
    overview: PortfolioOverview | null;
    equityCurve: EquityPoint[];
    botPerformance: BotPerformance[];
    exposure: ExposureInfo[];
    recentTrades: TradeResponse[];
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

export function usePortfolio(options: UsePortfolioOptions = {}): UsePortfolioReturn {
    const { refreshInterval = 30000, autoFetch = true } = options;

    const [overview, setOverview] = useState<PortfolioOverview | null>(null);
    const [equityCurve, setEquityCurve] = useState<EquityPoint[]>([]);
    const [botPerformance, setBotPerformance] = useState<BotPerformance[]>([]);
    const [exposure, setExposure] = useState<ExposureInfo[]>([]);
    const [recentTrades, setRecentTrades] = useState<TradeResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setError(null);

            const [overviewData, curveData, perfData, exposureData, tradesData] = await Promise.all([
                api.getPortfolioOverview(),
                api.getEquityCurve(30),
                api.getBotPerformance(),
                api.getCurrentExposure(),
                api.getTrades(5),
            ]);

            setOverview(overviewData);
            setEquityCurve(curveData);
            setBotPerformance(perfData);
            setExposure(exposureData);
            setRecentTrades(tradesData);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch portfolio data';
            setError(message);
            console.error('Portfolio fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        if (autoFetch) {
            fetchData();
        }
    }, [autoFetch, fetchData]);

    // Polling interval
    useEffect(() => {
        if (!autoFetch || refreshInterval <= 0) return;

        const interval = setInterval(fetchData, refreshInterval);
        return () => clearInterval(interval);
    }, [autoFetch, refreshInterval, fetchData]);

    return {
        overview,
        equityCurve,
        botPerformance,
        exposure,
        recentTrades,
        loading,
        error,
        refresh: fetchData,
    };
}

export default usePortfolio;
