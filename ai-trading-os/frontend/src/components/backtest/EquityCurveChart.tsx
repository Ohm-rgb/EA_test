'use client';

import { EquityPoint } from '@/types/backtestTypes';
import { useEffect, useRef } from 'react';

interface EquityCurveChartProps {
    data: EquityPoint[];
    height?: number;
}

/**
 * Area chart for equity curve - Industrial style
 * Teal/cyan gradient fill similar to reference dashboard
 */
export function EquityCurveChart({ data, height = 200 }: EquityCurveChartProps) {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!svgRef.current) return;

        // Handle empty or insufficient data
        if (data.length === 0) {
            const svg = svgRef.current;
            const lineElement = svg.querySelector('.equity-line') as SVGPathElement;
            const areaElement = svg.querySelector('.equity-area') as SVGPathElement;
            if (lineElement) lineElement.setAttribute('d', '');
            if (areaElement) areaElement.setAttribute('d', '');
            return;
        }

        const svg = svgRef.current;
        const rect = svg.getBoundingClientRect();
        const width = rect.width;
        const chartHeight = height - 30; // Leave room for axis

        // Calculate scaling
        const equities = data.map(d => d.equity);
        const minEquity = Math.min(...equities);
        const maxEquity = Math.max(...equities);
        const range = maxEquity - minEquity;
        const safeRange = range === 0 ? 1 : range; // Prevent division by zero

        const xScale = (i: number) => {
            if (data.length <= 1) return width / 2; // Center single point
            return (i / (data.length - 1)) * width;
        };

        const yScale = (v: number) => {
            // If flat line (range=0), center it vertically
            if (range === 0) return chartHeight / 2;
            return chartHeight - ((v - minEquity) / safeRange) * (chartHeight - 20);
        };

        // Build path
        let linePath = `M ${xScale(0)} ${yScale(data[0].equity)}`;
        let areaPath = `M ${xScale(0)} ${chartHeight} L ${xScale(0)} ${yScale(data[0].equity)}`;

        for (let i = 1; i < data.length; i++) {
            linePath += ` L ${xScale(i)} ${yScale(data[i].equity)}`;
            areaPath += ` L ${xScale(i)} ${yScale(data[i].equity)}`;
        }

        if (data.length > 1) {
            areaPath += ` L ${xScale(data.length - 1)} ${chartHeight} Z`;
        } else {
            // Close single point area for validity (vertical line down)
            areaPath += ` L ${xScale(0)} ${chartHeight} Z`;
        }

        // Update paths
        const lineElement = svg.querySelector('.equity-line') as SVGPathElement;
        const areaElement = svg.querySelector('.equity-area') as SVGPathElement;

        if (lineElement) lineElement.setAttribute('d', linePath);
        if (areaElement) areaElement.setAttribute('d', areaPath);

    }, [data, height]);

    const currentEquity = data[data.length - 1]?.equity ?? 0;
    const startEquity = data[0]?.equity ?? 0;
    const change = currentEquity - startEquity;
    const changePercent = startEquity > 0 ? (change / startEquity) * 100 : 0;

    return (
        <div className="industrial-panel">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <span className="text-lg">📈</span>
                    <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide">
                        Equity Curve
                    </h3>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <div className="text-xs text-[var(--text-muted)]">Current</div>
                        <div className="text-lg font-bold text-[var(--text-primary)]">
                            ${currentEquity.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                    </div>
                    <div
                        className={`px-2 py-1 rounded text-sm font-bold ${change >= 0
                            ? 'bg-[var(--color-success)]/20 text-[var(--color-success)]'
                            : 'bg-[var(--color-critical)]/20 text-[var(--color-critical)]'
                            }`}
                    >
                        {change >= 0 ? '+' : ''}{changePercent.toFixed(1)}%
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="relative" style={{ height }}>
                <svg
                    ref={svgRef}
                    className="w-full h-full"
                    style={{ overflow: 'visible' }}
                >
                    {/* Gradient Definition */}
                    <defs>
                        <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="rgb(6, 182, 212)" stopOpacity="0.5" />
                            <stop offset="100%" stopColor="rgb(6, 182, 212)" stopOpacity="0.05" />
                        </linearGradient>
                        <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="rgb(6, 182, 212)" />
                            <stop offset="100%" stopColor="rgb(34, 211, 238)" />
                        </linearGradient>
                    </defs>

                    {/* Grid Lines */}
                    {[0, 1, 2, 3, 4].map(i => (
                        <line
                            key={i}
                            x1="0"
                            y1={`${20 + (i * (height - 50) / 4)}%`}
                            x2="100%"
                            y2={`${20 + (i * (height - 50) / 4)}%`}
                            stroke="var(--glass-border)"
                            strokeWidth="1"
                            strokeDasharray="4 4"
                            opacity="0.5"
                        />
                    ))}

                    {/* Area Fill */}
                    <path
                        className="equity-area"
                        fill="url(#equityGradient)"
                        d=""
                    />

                    {/* Line */}
                    <path
                        className="equity-line"
                        fill="none"
                        stroke="url(#lineGradient)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d=""
                    />
                </svg>

                {/* Time Labels */}
                <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 text-[10px] text-[var(--text-muted)]">
                    <span>{data[0]?.timestamp.toLocaleDateString() ?? ''}</span>
                    <span>{data[Math.floor(data.length / 2)]?.timestamp.toLocaleDateString() ?? ''}</span>
                    <span>{data[data.length - 1]?.timestamp.toLocaleDateString() ?? ''}</span>
                </div>
            </div>
        </div>
    );
}
