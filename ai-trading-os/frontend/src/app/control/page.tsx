import { TopBar } from "@/components/layout";
import { KPICard, GlassCard, Button, Badge } from "@/components/ui";

export default function ControlCenter() {
    return (
        <div className="min-h-screen">
            {/* Top Bar */}
            <TopBar title="Control Center" showKillSwitch />

            {/* Main Content */}
            <div className="p-6 fade-in">
                {/* KPI Grid */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                    <KPICard
                        label="Balance"
                        value="$10,000.00"
                    />
                    <KPICard
                        label="Equity"
                        value="$10,250.00"
                        trend="up"
                    />
                    <KPICard
                        label="Today's P/L"
                        value="+$45.50"
                        change="+0.45%"
                        trend="up"
                    />
                    <KPICard
                        label="Win Rate"
                        value="68%"
                    />
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-3 gap-6">
                    {/* Control Button */}
                    <GlassCard className="p-8 flex flex-col items-center justify-center">
                        <div className="control-button mb-4">
                            <span className="text-xl font-bold text-emerald-400">START</span>
                        </div>
                        <p className="text-[var(--text-secondary)] text-sm">
                            Click to start all active bots
                        </p>
                    </GlassCard>

                    {/* Active Bots */}
                    <GlassCard className="p-6 col-span-2">
                        <h3 className="text-lg font-semibold mb-4">Active Bots</h3>

                        <div className="space-y-3">
                            {/* Bot Card */}
                            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                                        🤖
                                    </div>
                                    <div>
                                        <div className="font-medium">AlphaBot</div>
                                        <div className="text-sm text-[var(--text-secondary)]">Balanced • H1</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-emerald-400 font-medium">+$12.30</span>
                                    <Badge variant="success">Running</Badge>
                                </div>
                            </div>

                            {/* Bot Card 2 */}
                            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                                        🤖
                                    </div>
                                    <div>
                                        <div className="font-medium">DeltaGrid</div>
                                        <div className="text-sm text-[var(--text-secondary)]">Conservative • H4</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-[var(--text-secondary)]">$0.00</span>
                                    <Badge variant="warning">Paused</Badge>
                                </div>
                            </div>
                        </div>

                        <Button className="w-full mt-4" variant="ghost">
                            + Add New Bot
                        </Button>
                    </GlassCard>
                </div>

                {/* Quick Stats */}
                <div className="mt-6 grid grid-cols-4 gap-4">
                    <GlassCard className="p-4" hover>
                        <div className="text-sm text-[var(--text-secondary)]">Open Trades</div>
                        <div className="text-2xl font-bold mt-1">3</div>
                    </GlassCard>
                    <GlassCard className="p-4" hover>
                        <div className="text-sm text-[var(--text-secondary)]">Today's Trades</div>
                        <div className="text-2xl font-bold mt-1">12</div>
                    </GlassCard>
                    <GlassCard className="p-4" hover>
                        <div className="text-sm text-[var(--text-secondary)]">Max Drawdown</div>
                        <div className="text-2xl font-bold mt-1 text-amber-400">-4.2%</div>
                    </GlassCard>
                    <GlassCard className="p-4" hover>
                        <div className="text-sm text-[var(--text-secondary)]">Profit Factor</div>
                        <div className="text-2xl font-bold mt-1 text-emerald-400">1.85</div>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}
