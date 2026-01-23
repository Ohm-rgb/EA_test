import React, { memo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface MonthlyMetric {
    month: string;
    value: number; // 0-100
}

interface TrendChartProps {
    data?: MonthlyMetric[];
    title?: string;
}

// TODO: Replace with real API data source
const MOCK_DATA: MonthlyMetric[] = [
    { month: 'Jan', value: 65 },
    { month: 'Feb', value: 72 },
    { month: 'Mar', value: 68 },
    { month: 'Apr', value: 85 },
    { month: 'May', value: 90 },
    { month: 'Jun', value: 88 },
    { month: 'Jul', value: 92 },
    { month: 'Aug', value: 95 },
    { month: 'Sep', value: 84 },
    { month: 'Oct', value: 89 },
    { month: 'Nov', value: 94 },
    { month: 'Dec', value: 98 },
];

export const TrendChart = memo(({
    data = MOCK_DATA,
    title = "Rolling 12-month Trend"
}: TrendChartProps) => {

    return (
        <div className="w-full h-full flex flex-col">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 px-2">
                {title}
            </h3>
            <div className="flex-1 w-full min-h-[150px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 10 }}
                            dy={10}
                        />
                        <YAxis
                            hide
                            domain={[0, 100]}
                        />
                        <Tooltip
                            cursor={{ fill: '#1e293b' }}
                            contentStyle={{
                                backgroundColor: '#0f172a',
                                borderColor: '#334155',
                                color: '#f8fafc',
                                fontSize: '12px'
                            }}
                            itemStyle={{ color: '#10b981' }}
                            formatter={(value: any) => [`${value}%`, 'Performance']}
                        />
                        <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.value < 70 ? '#f59e0b' : '#0ea5e9'}
                                    opacity={0.8}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
});

TrendChart.displayName = 'TrendChart';
