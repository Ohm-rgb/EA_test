import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { useTheme } from '@/context/ThemeContext';

interface IndicatorNodeProps {
    data: {
        label: string;
        indicatorId: string;
        name: string;
        signalType: string;
        enabled: boolean;
    };
    selected?: boolean;
}

export const IndicatorNode = memo(({ data, selected }: IndicatorNodeProps) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark' || !theme; // Default to dark

    // Dynamic Styles based on Theme & Selection
    const baseClasses = `
        min-w-[150px] rounded-lg border backdrop-blur-md transition-all duration-200 flex items-center pr-3
        ${selected ? 'ring-2 ring-blue-500 shadow-lg scale-105' : 'shadow-sm hover:shadow-md'}
        ${isDark
            ? 'bg-slate-800/90 border-slate-700/50 text-slate-100'
            : 'bg-white/95 border-slate-200/80 text-slate-800'}
    `;

    return (
        <div className={baseClasses}>
            {/* Status Strip (Left Border alternative) */}
            <div className={`w-1.5 self-stretch rounded-l-lg mr-3 ${data.enabled ? 'bg-emerald-500' : 'bg-slate-500'}`} />

            {/* Content Body */}
            <div className="py-2 flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3">
                    <div className="text-xs font-semibold truncate" title={data.name}>
                        {data.name}
                    </div>
                    <span className={`
                        text-[9px] px-1.5 py-0.5 rounded font-mono font-medium opacity-80
                        ${isDark ? 'bg-slate-700 text-blue-300' : 'bg-slate-100 text-blue-600'}
                    `}>
                        {data.signalType}
                    </span>
                </div>
            </div>

            {/* Output Handle */}
            <Handle
                type="source"
                position={Position.Right}
                className={`
                    w-2.5 h-2.5 border-2 transition-colors
                    ${isDark ? 'bg-slate-900 border-blue-500' : 'bg-white border-blue-500'}
                    hover:bg-blue-500 hover:border-white
                `}
                style={{ right: -5 }}
            />
        </div>
    );
});

IndicatorNode.displayName = 'IndicatorNode';
