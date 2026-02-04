'use client';

import { useState } from 'react';
import { Search, TrendingUp, Clock } from 'lucide-react';
import { usePortfolio } from "@/hooks";
import RealtimeLineChart from "@/components/RealtimeLineChart";

// ========================================
// Dashboard Header Component
// ========================================
function DashboardHeader() {
    return (
        <div className="glass-card flex items-center justify-between mb-4 px-4 py-3">
            <h1 className="text-lg font-semibold text-[var(--text-primary)] tracking-wide">
                Glassmorphism Dashboard
            </h1>
            <div className="flex items-center gap-3">
                <button className="px-3 py-1.5 rounded-md glass-card text-xs text-[var(--text-secondary)] hover:bg-white/10 transition-colors">
                    Shehate
                </button>
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="pl-8 pr-3 py-1.5 rounded-md bg-[var(--bg-input)] border border-[var(--glass-border)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-info)] transition-colors w-36"
                    />
                </div>
            </div>
        </div>
    );
}

// ========================================
// Portfolio Card Component
// ========================================
function PortfolioCard({ title, value, metrics }: {
    title: string;
    value: number;
    metrics: { label: string; value: string }[]
}) {
    return (
        <div className="glass-card p-4">
            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-2">{title}</h3>
            <div className="text-4xl font-bold text-[var(--text-primary)] mb-3">
                {value}%
            </div>
            <div className="space-y-2">
                {metrics.map((m, i) => (
                    <div key={i} className="flex items-center justify-between">
                        <span className="text-xs text-[var(--text-muted)]">{m.label}</span>
                        <div className="flex items-center gap-2">
                            <div className="w-16 h-1 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                                <div className="h-full w-1/3 rounded-full bg-[var(--color-info)]" />
                            </div>
                            <span className="text-xs text-[var(--text-secondary)] w-12 text-right">{m.value}</span>
                        </div>
                    </div>
                ))}
            </div>
            {title === 'Portfolio' && (
                <button className="mt-3 flex items-center gap-1.5 text-xs text-[var(--color-info)] hover:underline">
                    <TrendingUp className="w-3 h-3" />
                    <span>More Frame</span>
                    <span className="ml-auto">›</span>
                </button>
            )}
        </div>
    );
}

// ========================================
// Toggle Row Component
// ========================================
function ToggleRow({ icon, label, value, enabled, onToggle }: {
    icon: 'up' | 'circle' | 'square';
    label: string;
    value?: string;
    enabled: boolean;
    onToggle: () => void;
}) {
    const icons = {
        up: <span className="text-[var(--color-info)] text-xs">△</span>,
        circle: <span className="text-[var(--color-info)] text-xs">○</span>,
        square: <span className="text-[var(--color-info)] text-xs">□</span>,
    };

    return (
        <div className="flex items-center justify-between py-1.5">
            <div className="flex items-center gap-2">
                {icons[icon]}
                <span className="text-xs text-[var(--text-secondary)]">{label}</span>
            </div>
            <div className="flex items-center gap-2">
                {value && <span className="text-xs text-[var(--text-muted)]">{value}</span>}
                <button
                    onClick={onToggle}
                    className={`w-8 h-4 rounded-full transition-colors flex items-center ${enabled ? 'bg-[var(--color-info)]' : 'bg-[var(--bg-tertiary)]'
                        }`}
                >
                    <div className={`w-3 h-3 rounded-full bg-white shadow transition-transform mx-0.5 ${enabled ? 'translate-x-4' : 'translate-x-0'
                        }`} />
                </button>
            </div>
        </div>
    );
}

// ========================================
// Trades Toggle Card
// ========================================
function TradesToggleCard({ toggles, setToggles, items }: {
    toggles: Record<string, boolean>;
    setToggles: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    items: { key: string; icon: 'up' | 'circle' | 'square'; label: string; value?: string }[];
}) {
    return (
        <div className="glass-card p-4">
            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-2">Recent Trades</h3>
            {items.map(item => (
                <ToggleRow
                    key={item.key}
                    icon={item.icon}
                    label={item.label}
                    value={item.value}
                    enabled={toggles[item.key] || false}
                    onToggle={() => setToggles(p => ({ ...p, [item.key]: !p[item.key] }))}
                />
            ))}
        </div>
    );
}

// ========================================
// Trades Table Component
// ========================================
function TradesTable({ title, trades }: {
    title: string;
    trades: { symbol: string; samlo: string; pt: number; ptPercent: number; mowip: number }[]
}) {
    return (
        <div className="glass-card p-4">
            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">{title}</h3>
            <table className="w-full text-xs">
                <thead>
                    <tr className="text-[var(--text-muted)]">
                        <th className="text-left pb-2 font-normal">Symbol</th>
                        <th className="text-right pb-2 font-normal">Samlo</th>
                        <th className="text-right pb-2 font-normal">Pt</th>
                        <th className="text-right pb-2 font-normal">Pt%</th>
                        <th className="text-right pb-2 font-normal">Mowip</th>
                    </tr>
                </thead>
                <tbody>
                    {trades.map((t, i) => (
                        <tr key={i} className="border-t border-[var(--glass-border)]">
                            <td className="py-2 text-[var(--text-secondary)]">{t.symbol}</td>
                            <td className="py-2 text-right text-[var(--text-secondary)]">{t.samlo}</td>
                            <td className="py-2 text-right text-[var(--text-secondary)]">{t.pt}</td>
                            <td className="py-2 text-right text-[var(--text-secondary)]">{t.ptPercent}%</td>
                            <td className="py-2 text-right text-[var(--text-secondary)]">{t.mowip}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ========================================
// Control Panel Component
// ========================================
function ControlPanel() {
    const items = [
        { label: 'Orpe ficient', value: '60xds', active: false },
        { label: 'Armulister', value: '80xds', active: true },
        { label: 'Sape Weatols', value: '86xds', active: true },
    ];

    return (
        <div className="glass-card p-4">
            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">Cont Panel</h3>
            <div className="space-y-2">
                {items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${item.active ? 'bg-[var(--color-success)]' : 'bg-[var(--text-muted)]'}`} />
                            <span className="text-xs text-[var(--text-secondary)]">{item.label}</span>
                        </div>
                        <span className="text-xs text-[var(--color-info)]">{item.value}</span>
                    </div>
                ))}
            </div>
            <div className="mt-4 pt-3 border-t border-[var(--glass-border)] flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-[var(--text-muted)]" />
                    <span className="text-xs text-[var(--text-muted)]">Comopx Madot:</span>
                </div>
                <span className="text-xs text-[var(--color-info)]">38s⁶¹¹</span>
            </div>
        </div>
    );
}

// ========================================
// Main Dashboard Page
// ========================================
export default function Portfolio() {
    const { overview, loading, error } = usePortfolio();

    const [leftToggles, setLeftToggles] = useState({ montes: false, coute: true });
    const [rightToggles, setRightToggles] = useState({ haost: false, octetAmes: true, ocumico: true });

    const recentTrades = [
        { symbol: 'Dvsarah Frars ysers', samlo: '10.54', pt: 2, ptPercent: 26, mowip: 34 },
        { symbol: 'Dnoenols Fiors pxorrs', samlo: '10.45', pt: 1, ptPercent: 3, mowip: 36 },
    ];

    const activeOrders = [
        { symbol: 'Dvarah Forrs merts', samlo: '19.93', pt: 22, ptPercent: 26, mowip: 11 },
        { symbol: 'Dxpands florrs pnerrs', samlo: '10.03', pt: 35, ptPercent: 22, mowip: 13 },
    ];

    if (loading) {
        return (
            <div className="min-h-screen p-4 flex items-center justify-center bg-[var(--bg-primary)]">
                <div className="text-[var(--color-info)]">Loading...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen p-4 flex items-center justify-center bg-[var(--bg-primary)]">
                <div className="text-[var(--color-critical)]">Error: {error}</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 bg-[var(--bg-primary)]">
            <DashboardHeader />

            {/* Main 3-Column Grid */}
            <div className="grid grid-cols-12 gap-3">
                {/* Left Column */}
                <div className="col-span-3 space-y-3">
                    <PortfolioCard
                        title="Portfolio"
                        value={overview?.total_pnl ? Math.round((overview.total_pnl / 1000) * 100) : 559}
                        metrics={[
                            { label: 'Serp Avg', value: '0.5.207' },
                            { label: 'Acmos', value: '9.6%' },
                        ]}
                    />
                    <TradesToggleCard
                        toggles={leftToggles}
                        setToggles={setLeftToggles}
                        items={[
                            { key: 'montes', icon: 'up', label: 'Montes', value: '02 ds' },
                            { key: 'coute', icon: 'circle', label: 'Coute' },
                        ]}
                    />
                </div>

                {/* Center Column - Chart + Tables */}
                <div className="col-span-6 space-y-3">
                    <div className="glass-card p-3 h-[260px]">
                        <RealtimeLineChart title="Market Overview (Real-time)" className="h-full" />
                    </div>
                    <TradesTable title="Recent Trades" trades={recentTrades} />
                    <TradesTable title="Active Orders" trades={activeOrders} />
                </div>

                {/* Right Column */}
                <div className="col-span-3 space-y-3">
                    <PortfolioCard
                        title="Contfolio"
                        value={overview?.daily_pnl ? Math.round((overview.daily_pnl / 100) * 100) : 229}
                        metrics={[
                            { label: 'Toap Avg', value: '0.5.933' },
                            { label: 'Moc', value: '3%' },
                        ]}
                    />
                    <TradesToggleCard
                        toggles={rightToggles}
                        setToggles={setRightToggles}
                        items={[
                            { key: 'haost', icon: 'up', label: 'Haost', value: '33 ätl' },
                            { key: 'octetAmes', icon: 'circle', label: 'Octet ames' },
                            { key: 'ocumico', icon: 'square', label: 'Ocumico' },
                        ]}
                    />
                    <ControlPanel />
                </div>
            </div>
        </div>
    );
}
