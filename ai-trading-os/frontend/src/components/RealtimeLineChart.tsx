// frontend/src/components/RealtimeLineChart.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    Area,
    AreaChart,
} from 'recharts';
import {
    generateRealtimeChartData,
    generateSingleDataPoint,
    ChartDataItem,
} from '../lib/chartData';

// จำนวน data points สูงสุดที่จะเก็บไว้ (เพื่อ performance)
const MAX_DATA_POINTS = 25;

// Interval สำหรับอัปเดตข้อมูล (milliseconds)
const UPDATE_INTERVAL = 2000;

interface RealtimeLineChartProps {
    title?: string;
    className?: string;
}

const RealtimeLineChart: React.FC<RealtimeLineChartProps> = ({
    title = 'Market Overview (Real-time)',
    className = '',
}) => {
    const [data, setData] = useState<ChartDataItem[]>([]);
    const [isClient, setIsClient] = useState(false);

    // Initialize data on client side only
    useEffect(() => {
        setIsClient(true);
        setData(generateRealtimeChartData(MAX_DATA_POINTS));
    }, []);

    // Update data every 2 seconds
    useEffect(() => {
        if (!isClient) return;

        const interval = setInterval(() => {
            setData((prevData) => {
                // ลบจุดแรกออก และเพิ่มจุดใหม่เข้าไป
                // ใช้ .slice(1) เพื่อคุมจำนวน data points ไม่ให้เกิน MAX_DATA_POINTS
                const newData = [...prevData.slice(1), generateSingleDataPoint()];
                return newData;
            });
        }, UPDATE_INTERVAL);

        return () => clearInterval(interval);
    }, [isClient]);

    // Custom Tooltip Component - using Recharts compatible signature
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const renderCustomTooltip = (props: any) => {
        const { active, payload } = props;
        if (active && payload && payload.length) {
            return (
                <div
                    className="glass-tooltip"
                    style={{
                        backgroundColor: 'rgba(20, 20, 30, 0.95)',
                        border: '1px solid rgba(59, 130, 246, 0.5)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                        zIndex: 9999,
                    }}
                >
                    <p style={{ color: '#3b82f6', fontWeight: 600, margin: 0 }}>
                        ${payload[0].value.toFixed(2)}
                    </p>
                    <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px', margin: '4px 0 0 0' }}>
                        {payload[0].payload.name}
                    </p>
                </div>
            );
        }
        return null;
    };

    if (!isClient) {
        return (
            <div className={`glass-card p-4 h-full flex flex-col ${className}`}>
                <h3 className="section-title mb-4">{title}</h3>
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-[var(--text-muted)]">Loading chart...</div>
                </div>
            </div>
        );
    }

    return (
        <div className={`glass-card p-4 h-full flex flex-col ${className}`}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="section-title text-lg font-semibold">{title}</h3>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--color-success)] animate-pulse" />
                    <span className="text-xs text-[var(--text-muted)]">Live</span>
                </div>
            </div>

            <div className="flex-1 min-h-[200px]" style={{ position: 'relative', zIndex: 1 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                        </defs>

                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="rgba(255, 255, 255, 0.08)"
                            vertical={false}
                        />

                        <XAxis
                            dataKey="name"
                            hide
                            axisLine={false}
                            tickLine={false}
                        />

                        <YAxis
                            domain={['dataMin - 5', 'dataMax + 5']}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'rgba(255, 255, 255, 0.5)', fontSize: 11 }}
                            width={40}
                        />

                        <Tooltip
                            content={renderCustomTooltip}
                            cursor={{
                                stroke: 'rgba(59, 130, 246, 0.3)',
                                strokeWidth: 1,
                                strokeDasharray: '3 3',
                            }}
                            wrapperStyle={{ zIndex: 9999 }}
                        />

                        <Area
                            type="monotone"
                            dataKey="price"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            fill="url(#priceGradient)"
                            isAnimationActive={false}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Stats Footer */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--glass-border)]">
                <div className="flex items-center gap-4">
                    <div>
                        <span className="text-xs text-[var(--text-muted)]">Current</span>
                        <span className="ml-2 text-sm font-semibold text-[var(--color-info)]">
                            ${data[data.length - 1]?.price.toFixed(2) || '0.00'}
                        </span>
                    </div>
                    <div>
                        <span className="text-xs text-[var(--text-muted)]">Points</span>
                        <span className="ml-2 text-sm text-[var(--text-secondary)]">{data.length}</span>
                    </div>
                </div>
                <span className="text-xs text-[var(--text-muted)]">Updates every 2s</span>
            </div>
        </div>
    );
};

export default RealtimeLineChart;
