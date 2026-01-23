import React, { memo } from 'react';

interface MetricGaugeProps {
    label: string;
    value: number; // 0-100
    subtext?: string;
    color?: string; // Hex or Tailwind class prefix if handled dynamically, but here we use strict colors
    thresholds?: {
        warn: number;
        danger: number;
    };
    size?: 'sm' | 'md' | 'lg';
}

export const MetricGauge = memo(({
    label,
    value,
    subtext,
    color = "#10b981", // Default Emerald
    thresholds = { warn: 70, danger: 50 },
    size = 'md'
}: MetricGaugeProps) => {

    // Size mapping
    const sizeMap = {
        sm: { width: 80, stroke: 2, fontSize: 'text-lg', labelSize: 'text-[10px]' },
        md: { width: 120, stroke: 3, fontSize: 'text-3xl', labelSize: 'text-xs' },
        lg: { width: 160, stroke: 4, fontSize: 'text-4xl', labelSize: 'text-sm' },
    };

    const currentSize = sizeMap[size];

    // Calculate color based on thresholds if not overridden
    // We'll trust the passed color if provided, otherwise logic:
    // This logic mimics industrial "Traffic Light"
    const getColor = (val: number) => {
        if (color !== "#10b981") return color; // If custom color passed, use it
        if (val < thresholds.danger) return "#ef4444"; // Red
        if (val < thresholds.warn) return "#f59e0b";   // Amber
        return "#10b981"; // Emerald
    };

    const finalColor = getColor(value);

    // SVG Math for Circle
    const radius = 18;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;

    return (
        <div className="flex flex-col items-center">
            {/* Gauge */}
            <div className="relative flex items-center justify-center mb-2" style={{ width: currentSize.width, height: currentSize.width }}>
                <svg className="w-full h-full rotate-[-90deg]" viewBox="0 0 40 40">
                    {/* Background Ring */}
                    <circle
                        cx="20" cy="20" r={radius}
                        fill="none"
                        stroke="#1e293b"
                        strokeWidth={currentSize.stroke}
                    />
                    {/* Progress Ring */}
                    <circle
                        cx="20" cy="20" r={radius}
                        fill="none"
                        stroke={finalColor}
                        strokeWidth={currentSize.stroke}
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                    />
                </svg>

                {/* Center Value */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                    <span className={`font-mono font-bold ${currentSize.fontSize} tracking-tighter`}>
                        {Math.round(value)}
                    </span>
                    <span className="text-[10px] text-slate-500">%</span>
                </div>
            </div>

            {/* Labels */}
            <div className="text-center">
                <div className={`font-bold text-slate-300 uppercase tracking-wider ${currentSize.labelSize} mb-0.5`}>
                    {label}
                </div>
                {subtext && (
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                        {subtext}
                    </div>
                )}
            </div>
        </div>
    );
});

MetricGauge.displayName = 'MetricGauge';
