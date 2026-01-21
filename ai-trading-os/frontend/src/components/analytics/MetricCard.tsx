"use client";

import { useMemo } from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: number; // % change
  trendLabel?: string;
  data?: any[]; // For sparkline
  dataKey?: string;
  color?: string; // Hex color for chart/trend
  className?: string; // Custom container class
  valueColor?: string; // Custom value text color
  labelColor?: string; // Custom label text color
}

export function MetricCard({
  label,
  value,
  subValue,
  trend,
  trendLabel = "vs last period",
  data,
  dataKey = "value",
  color = "#10b981", // Default Emerald-500
  className,
  valueColor = "text-white",
  labelColor = "text-white/60"
}: MetricCardProps) {

  const isPositive = trend && trend >= 0;
  // Use passed color or dynamic based on trend if valid
  const displayColor = trend !== undefined
    ? (isPositive ? "#8BCF9E" : "#E59A9A") // Pastel Green / Red
    : color;

  // Default Dark Glass if no className provided
  const containerClass = className || "bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex flex-col justify-between h-full relative overflow-hidden group hover:border-[#FCD535]/30 transition-all duration-300";

  return (
    <div className={containerClass}>

      {/* Background Glow (Only for dark mode or specific overrides) */}
      {!className && (
        <div
          className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-2xl -mr-16 -mt-16 transition-opacity opacity-0 group-hover:opacity-100"
          style={{ background: `radial-gradient(circle, ${displayColor}15 0%, transparent 70%)` }}
        />
      )}

      <div className="flex justify-between items-start z-10">
        <div>
          <h3 className={`text-sm font-medium ${labelColor} mb-1`}>{label}</h3>
          <div className={`text-3xl font-bold tracking-tight ${valueColor}`}>{value}</div>
          {subValue && <div className="text-xs opacity-60 mt-1">{subValue}</div>}
        </div>

        {/* Trend Badge */}
        {trend !== undefined && (
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium ${isPositive ? 'bg-emerald-500/10 text-[#8BCF9E]' : 'bg-red-500/10 text-[#E59A9A]'}`}>
            <span>{isPositive ? '+' : ''}{trend}%</span>
          </div>
        )}
      </div>

      {/* Sparkline Area */}
      <div className="h-16 w-full mt-4 -mb-2 z-10">
        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke={displayColor}
                strokeWidth={2}
                dot={false}
                isAnimationActive={true}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full w-full flex items-center justify-center opacity-30 text-xs italic">
            No history data
          </div>
        )}
      </div>

      {/* Labels */}
      {trend && (
        <div className={`text-[10px] ${labelColor} mt-2 z-10 opacity-70`}>{trendLabel}</div>
      )}
    </div>
  );
}
