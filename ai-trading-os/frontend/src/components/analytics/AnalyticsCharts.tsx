"use client";

import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
    PieChart, Pie, Sector
} from 'recharts';
import { CHART_THEME } from '@/config/ChartTheme';
import { useState } from 'react';

// --- Components ---

export function PerformanceBarChart({ data, title, theme = 'dark' }: { data: any[], title: string, theme?: 'light' | 'dark' }) {
    const colors = CHART_THEME[theme];

    // Use semantic variables for container
    const containerClass = "bg-[var(--bg-secondary)] border border-[var(--glass-border)] rounded-2xl p-6 h-[300px] flex flex-col shadow-sm transition-colors duration-300";

    return (
        <div className={containerClass}>
            <h3 className="text-lg font-semibold mb-4 text-[var(--text-primary)]">{title}</h3>
            <div className="flex-1 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} horizontal={false} />
                        <XAxis type="number" stroke={colors.axis} tick={{ fontSize: 10, fill: colors.axis }} />
                        <YAxis dataKey="name" type="category" stroke={colors.axis} width={100} tick={{ fontSize: 11, fill: colors.axis }} />
                        <Tooltip
                            contentStyle={{ backgroundColor: colors.tooltipBg, borderColor: colors.axis, borderRadius: '8px', color: colors.tooltipText }}
                            cursor={{ fill: theme === 'light' ? '#00000005' : '#ffffff05' }}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.value >= 0 ? colors.profit : colors.loss} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

export function AssetAllocationChart({ data, theme = 'dark' }: { data: { name: string, value: number, color: string }[], theme?: 'light' | 'dark' }) {
    const colors = CHART_THEME[theme];
    const containerClass = "bg-[var(--bg-secondary)] border border-[var(--glass-border)] rounded-2xl p-6 h-[300px] flex flex-col shadow-sm transition-colors duration-300";

    return (
        <div className={containerClass}>
            <h3 className="text-lg font-semibold mb-4 text-[var(--text-primary)]">Asset Breakdown</h3>
            <div className="flex-1 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            stroke="none"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ backgroundColor: colors.tooltipBg, borderColor: colors.axis, borderRadius: '8px', color: colors.tooltipText }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
