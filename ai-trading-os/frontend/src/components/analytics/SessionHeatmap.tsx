"use client";

import { useMemo } from 'react';
import { CHART_THEME } from '@/config/ChartTheme';

interface SessionHeatmapProps {
    data: {
        day: number; // 0-6 (Sun-Sat) or 1-7 (Mon-Sun)
        hour: number; // 0-23
        value: number; // Profit or Volume
    }[];
    theme?: 'light' | 'dark';
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Purple-based intensity scale for calm analytical tone
const HEATMAP_SCALE_LIGHT = [
    '#F1F2FA', // Lowest
    '#DADCF2',
    '#BFC3E8',
    '#9FA5DA',
    '#7D82C8'  // Highest
];

export function SessionHeatmap({ data, theme = 'dark' }: SessionHeatmapProps) {
    const isLight = theme === 'light';
    const themeColors = CHART_THEME[theme];

    // Normalize data for lookup
    const heatMapData = useMemo(() => {
        const map = new Map<string, number>();
        let max = 0;

        data.forEach(d => {
            const key = `${d.day}-${d.hour}`;
            map.set(key, d.value);
            if (Math.abs(d.value) > max) max = Math.abs(d.value);
        });

        return { map, max };
    }, [data]);

    const getColor = (dayIdx: number, hour: number) => {
        const val = heatMapData.map.get(`${dayIdx}-${hour}`) || 0;

        if (val === 0) return theme === 'light' ? 'rgba(0,0,0,0.03)' : 'bg-white/5';

        const intensity = Math.min(Math.abs(val) / (heatMapData.max || 1), 1);

        // Use colors from centralized config
        if (theme === 'light') {
            // Purple-based scale for light mode (Hospital ER Vibe)
            // Map 0-1 intensity to 0-4 index
            const scaleIndex = Math.min(Math.floor(intensity * 5), 4);
            return HEATMAP_SCALE_LIGHT[scaleIndex];
        } else {
            // Dark mode: keep existing logic for now or update if needed
            if (val > 0) {
                return `rgba(139, 92, 246, ${0.1 + intensity * 0.9})`; // Violet
            } else {
                return `rgba(239, 68, 68, ${0.1 + intensity * 0.9})`;  // Red
            }
        }
    };

    const containerClass = "bg-[var(--bg-secondary)] border border-[var(--glass-border)] rounded-2xl shadow-sm overflow-hidden";
    const textColor = "text-[var(--text-primary)]";
    const mutedColor = "text-[var(--text-muted)]";

    return (
        <div className={containerClass}>
            {/* Structural Header */}
            <div className="bg-[var(--bg-structure)] px-6 py-4 border-b border-[var(--glass-border)] flex justify-between items-center">
                <h3 className={`text-lg font-semibold ${textColor}`}>Trading Session Heatmap</h3>
                <div className="flex space-x-2">
                    <span className={`text-xs ${mutedColor} flex items-center gap-1`}>
                        <div className={`w-3 h-3 rounded-sm`} style={{ backgroundColor: themeColors.profit, opacity: 0.2 }}></div> Low
                    </span>
                    <span className={`text-xs ${mutedColor} flex items-center gap-1`}>
                        <div className={`w-3 h-3 rounded-sm`} style={{ backgroundColor: themeColors.profit }}></div> High
                    </span>
                </div>
            </div>

            <div className="p-6 w-full overflow-x-auto">
                <div className="min-w-[800px]">
                    {/* Header (Hours) */}
                    <div className="flex mb-2">
                        <div className="w-12 shrink-0"></div> {/* Row Label Spacer */}
                        {HOURS.map(h => (
                            <div key={h} className={`flex-1 text-center text-[10px] uppercase ${mutedColor}`}>
                                {h === 0 ? '12AM' : h === 12 ? '12PM' : h > 12 ? `${h - 12}PM` : `${h}AM`}
                            </div>
                        ))}
                    </div>

                    {/* Grid */}
                    <div className="space-y-1">
                        {DAYS.map((day, dayIdx) => (
                            <div key={day} className="flex items-center h-8">
                                <div className={`w-12 text-xs font-medium shrink-0 ${mutedColor}`}>{day}</div>
                                {HOURS.map(hour => (
                                    <div key={hour} className="flex-1 h-full px-[1px]">
                                        <div
                                            className="w-full h-full rounded-sm transition-all duration-300 hover:scale-110 hover:z-10 cursor-pointer relative group"
                                            style={{ backgroundColor: getColor(dayIdx, hour) }}
                                        >
                                            {/* Tooltip */}
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-black/90 text-white text-xs p-2 rounded whitespace-nowrap z-50 pointer-events-none border border-white/10">
                                                {day} {hour}:00 - Value: {heatMapData.map.get(`${dayIdx}-${hour}`) || 0}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
