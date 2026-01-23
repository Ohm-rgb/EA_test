'use client';

import { useEffect, useRef } from 'react';

export interface DrawdownPoint {
    timestamp: Date;
    drawdownPercent: number; // 0 to 100
}

interface DrawdownChartProps {
    data: DrawdownPoint[];
    height?: number;
}

/**
 * Underwater chart for Drawdown - Industrial style
 * Red/Orange gradient fill from 0 (top) downwards
 */
export function DrawdownChart({ data, height = 150 }: DrawdownChartProps) {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!svgRef.current || data.length === 0) return;

        const svg = svgRef.current;
        const rect = svg.getBoundingClientRect();
        const width = rect.width;
        const chartHeight = height - 30;

        // Drawdown ranges from 0 (top) to Max (bottom)
        const maxDD = Math.max(...data.map(d => d.drawdownPercent), 10); // Min scale 10%

        const xScale = (i: number) => (i / (data.length - 1)) * width;
        // 0 DD is at y=0 (top), Max DD is at y=chartHeight
        const yScale = (dd: number) => (dd / maxDD) * chartHeight;

        // Build path
        let areaPath = `M ${xScale(0)} 0 L ${xScale(0)} ${yScale(data[0].drawdownPercent)}`;

        for (let i = 1; i < data.length; i++) {
            areaPath += ` L ${xScale(i)} ${yScale(data[i].drawdownPercent)}`;
        }

        // Close path to top
        areaPath += ` L ${xScale(data.length - 1)} 0 Z`;

        const areaElement = svg.querySelector('.dd-area') as SVGPathElement;
        const lineElement = svg.querySelector('.dd-line') as SVGPathElement;

        // Line path follows the edge
        let linePath = `M ${xScale(0)} ${yScale(data[0].drawdownPercent)}`;
        for (let i = 1; i < data.length; i++) {
            linePath += ` L ${xScale(i)} ${yScale(data[i].drawdownPercent)}`;
        }

        if (areaElement) areaElement.setAttribute('d', areaPath);
        if (lineElement) lineElement.setAttribute('d', linePath);

    }, [data, height]);

    const currentDD = data[data.length - 1]?.drawdownPercent ?? 0;
    const maxDD = Math.max(...data.map(d => d.drawdownPercent));

    return (
        <div className="industrial-panel">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-lg">🌊</span>
                    <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide">
                        Risk Depth (Underwater)
                    </h3>
                </div>
                <div className="text-right">
                    <span className="text-[10px] text-[var(--text-muted)] mr-2">Peak Depth</span>
                    <span className={`text-sm font-bold ${maxDD > 20 ? 'text-[var(--color-critical)]' : 'text-amber-500'}`}>
                        -{maxDD.toFixed(1)}%
                    </span>
                </div>
            </div>

            {/* Chart */}
            <div className="relative" style={{ height }}>
                <svg
                    ref={svgRef}
                    className="w-full h-full"
                    style={{ overflow: 'visible' }}
                >
                    <defs>
                        <linearGradient id="ddGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="rgb(244, 63, 94)" stopOpacity="0.1" />
                            <stop offset="100%" stopColor="rgb(244, 63, 94)" stopOpacity="0.6" />
                        </linearGradient>
                    </defs>

                    {/* Grid */}
                    <line x1="0" y1="0" x2="100%" y2="0" stroke="var(--text-muted)" strokeWidth="1" opacity="0.2" />
                    <line x1="0" y1="50%" x2="100%" y2="50%" stroke="var(--glass-border)" strokeDasharray="4 4" />
                    <line x1="0" y1="100%" x2="100%" y2="100%" stroke="var(--glass-border)" strokeDasharray="4 4" />

                    <path
                        className="dd-area"
                        fill="url(#ddGradient)"
                        d=""
                    />
                    <path
                        className="dd-line"
                        fill="none"
                        stroke="rgb(244, 63, 94)"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                        d=""
                    />
                </svg>
            </div>
            <div className="flex justify-between px-1 mt-1 text-[10px] text-[var(--text-muted)]">
                <span>Start</span>
                <span>End</span>
            </div>
        </div>
    );
}
