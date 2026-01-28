import { GlassCard } from "@/components/ui";

interface IndicatorSelectCardProps {
    indicator: {
        indicator_id: string;
        name: string;
        type: string;
        status: string;
        is_bound: boolean;
        is_enabled: boolean;
        bot_indicator_id: string | null;
    };
    onBind: (id: string) => void;
    onUnbind: (id: string) => void;
    onToggle: (bindingId: string, enabled: boolean) => void; // Future use
}

export function IndicatorSelectCard({ indicator, onBind, onUnbind }: IndicatorSelectCardProps) {
    const isDraft = indicator.status === 'draft';
    // const isArchived = indicator.status === 'archived'; // handled by parent filter

    const handleToggle = () => {
        if (indicator.is_bound) {
            onUnbind(indicator.indicator_id);
        } else {
            onBind(indicator.indicator_id);
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-500/10 text-green-400 border-green-500/20';
            case 'ready': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'draft': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
            default: return 'bg-slate-800 text-slate-500';
        }
    };

    return (
        <GlassCard className={`relative p-4 flex flex-col gap-3 transition-all duration-300 ${indicator.is_bound
                ? 'bg-blue-900/10 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                : 'bg-slate-800/20 border-slate-700/50 hover:border-slate-600'
            } ${isDraft ? 'opacity-75' : ''}`}>

            {/* Header: Name & Checkbox */}
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    {/* Icon Placeholder */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${indicator.is_bound ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400'
                        }`}>
                        {indicator.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <h4 className={`font-semibold text-sm ${indicator.is_bound ? 'text-blue-100' : 'text-slate-300'}`}>
                            {indicator.name}
                        </h4>
                        <span className="text-xs text-slate-500 font-mono">{indicator.type}</span>
                    </div>
                </div>

                {/* Bind Toggle */}
                <label className={`relative inline-flex items-center cursor-pointer ${isDraft ? 'cursor-not-allowed opacity-50' : ''}`}>
                    <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={indicator.is_bound}
                        onChange={handleToggle}
                        disabled={isDraft}
                    />
                    <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
            </div>

            {/* Footer: Status */}
            <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${getStatusStyle(indicator.status)}`}>
                    {indicator.status}
                </span>

                {isDraft && (
                    <span className="text-[10px] text-yellow-500/80 flex items-center gap-1">
                        ⚠️ Not Ready
                    </span>
                )}
            </div>

        </GlassCard>
    );
}
