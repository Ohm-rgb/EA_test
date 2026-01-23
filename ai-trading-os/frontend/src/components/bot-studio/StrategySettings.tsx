import React, { useState } from 'react';
import { GlassCard } from '@/components/ui';

interface StrategySettingsProps {
    onSave: (settings: any) => void;
    initialSettings?: any;
}

export function StrategySettings({
    onSave,
    initialSettings = {}
}: StrategySettingsProps) {

    // --- State Management ---
    const [activeTab, setActiveTab] = useState<'general' | 'kpi' | 'targets'>('general');

    // Config State (Mock structure based on Plan)
    const [config, setConfig] = useState({
        refreshRate: 5,
        theme: 'industrial',
        showFinancials: true,

        // KPI Thresholds (OEE)
        availabilityWarn: 90,
        availabilityDanger: 80,
        qualityWarn: 60,
        qualityDanger: 40,
        efficiencyWarn: 80,
        efficiencyDanger: 60,

        // Strategy Targets
        targetProfit: 1000,
        maxDrawdown: 500,
        targetDailyTrades: 5
    });

    const handleChange = (key: string, value: any) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = () => {
        onSave(config);
    };

    return (
        <div className="h-full p-6 flex justify-center overflow-y-auto">
            <GlassCard className="w-full max-w-4xl bg-[#0f172a]/95 border-slate-700/50 flex flex-col">

                {/* Header */}
                <div className="p-6 border-b border-slate-700/50 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <span>⚙️</span> Strategy Settings
                        </h2>
                        <p className="text-sm text-slate-400 mt-1">Configure Dashboard KPI thresholds and targets</p>
                    </div>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-blue-500/20 transition-all"
                    >
                        Save Configuration
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-700/50 px-6">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'general' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                    >
                        General
                    </button>
                    <button
                        onClick={() => setActiveTab('kpi')}
                        className={`px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'kpi' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                    >
                        KPI Thresholds
                    </button>
                    <button
                        onClick={() => setActiveTab('targets')}
                        className={`px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'targets' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                    >
                        Strategy Targets
                    </button>
                </div>

                {/* Content Area */}
                <div className="p-8 flex-1">

                    {/* --- GENERAL TAB --- */}
                    {activeTab === 'general' && (
                        <div className="space-y-6 max-w-xl animate-in fade-in duration-200">
                            <div className="bg-slate-800/30 p-4 rounded border border-slate-700/50 mb-6">
                                <h3 className="text-amber-400 text-sm font-bold uppercase mb-2">Notice</h3>
                                <p className="text-slate-400 text-xs">
                                    These settings affect how data is displayed on the Strategy Overview (Control Room).
                                    They do not alter the bot's trading logic directly.
                                </p>
                            </div>

                            <div>
                                <label className="block text-slate-300 mb-2 font-medium">Data Refresh Rate (Seconds)</label>
                                <select
                                    value={config.refreshRate}
                                    onChange={(e) => handleChange('refreshRate', Number(e.target.value))}
                                    className="w-full bg-slate-800 border border-slate-600 rounded p-2.5 text-white outline-none focus:border-blue-500"
                                >
                                    <option value={1}>Real-time (1s)</option>
                                    <option value={5}>Fast (5s)</option>
                                    <option value={30}>Normal (30s)</option>
                                    <option value={60}>Slow (60s)</option>
                                </select>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded border border-slate-700">
                                <div>
                                    <div className="text-slate-200 font-medium">Show Financial Data</div>
                                    <div className="text-slate-500 text-xs">Display Net Profit and Trade Count on Overview</div>
                                </div>
                                <div
                                    onClick={() => handleChange('showFinancials', !config.showFinancials)}
                                    className={`w-12 h-6 rounded-full cursor-pointer relative transition-colors ${config.showFinancials ? 'bg-emerald-500' : 'bg-slate-600'}`}
                                >
                                    <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${config.showFinancials ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- KPI THRESHOLDS TAB --- */}
                    {activeTab === 'kpi' && (
                        <div className="space-y-8 animate-in fade-in duration-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Availability */}
                                <div className="space-y-4">
                                    <h3 className="text-blue-400 font-bold uppercase tracking-wider border-b border-blue-500/30 pb-2">Availability Limits</h3>
                                    <div>
                                        <label className="flex justify-between text-slate-300 mb-2 text-sm">
                                            <span>Warning Threshold (Amber)</span>
                                            <span className="text-amber-400 font-mono">{config.availabilityWarn}%</span>
                                        </label>
                                        <input
                                            type="range" min="0" max="100"
                                            value={config.availabilityWarn}
                                            onChange={(e) => handleChange('availabilityWarn', Number(e.target.value))}
                                            className="w-full accent-amber-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="flex justify-between text-slate-300 mb-2 text-sm">
                                            <span>Danger Threshold (Red)</span>
                                            <span className="text-red-400 font-mono">{config.availabilityDanger}%</span>
                                        </label>
                                        <input
                                            type="range" min="0" max="100"
                                            value={config.availabilityDanger}
                                            onChange={(e) => handleChange('availabilityDanger', Number(e.target.value))}
                                            className="w-full accent-red-500"
                                        />
                                    </div>
                                </div>

                                {/* Quality */}
                                <div className="space-y-4">
                                    <h3 className="text-purple-400 font-bold uppercase tracking-wider border-b border-purple-500/30 pb-2">Quality (Win Rate) Limits</h3>
                                    <div>
                                        <label className="flex justify-between text-slate-300 mb-2 text-sm">
                                            <span>Warning Threshold (Amber)</span>
                                            <span className="text-amber-400 font-mono">{config.qualityWarn}%</span>
                                        </label>
                                        <input
                                            type="range" min="0" max="100"
                                            value={config.qualityWarn}
                                            onChange={(e) => handleChange('qualityWarn', Number(e.target.value))}
                                            className="w-full accent-amber-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="flex justify-between text-slate-300 mb-2 text-sm">
                                            <span>Danger Threshold (Red)</span>
                                            <span className="text-red-400 font-mono">{config.qualityDanger}%</span>
                                        </label>
                                        <input
                                            type="range" min="0" max="100"
                                            value={config.qualityDanger}
                                            onChange={(e) => handleChange('qualityDanger', Number(e.target.value))}
                                            className="w-full accent-red-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- TARGETS TAB --- */}
                    {activeTab === 'targets' && (
                        <div className="space-y-6 max-w-xl animate-in fade-in duration-200">
                            <div className="space-y-4">
                                <h3 className="text-emerald-400 font-bold uppercase tracking-wider border-b border-emerald-500/30 pb-2">Financial Goals</h3>

                                <div>
                                    <label className="block text-slate-300 mb-2 text-sm">Target Net Profit ($)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-slate-500">$</span>
                                        <input
                                            type="number"
                                            value={config.targetProfit}
                                            onChange={(e) => handleChange('targetProfit', Number(e.target.value))}
                                            className="w-full bg-slate-800 border border-slate-600 rounded pl-8 py-2 text-white outline-none focus:border-emerald-500 font-mono"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-slate-300 mb-2 text-sm">Max Drawdown Limit ($)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-slate-500">$</span>
                                        <input
                                            type="number"
                                            value={config.maxDrawdown}
                                            onChange={(e) => handleChange('maxDrawdown', Number(e.target.value))}
                                            className="w-full bg-slate-800 border border-slate-600 rounded pl-8 py-2 text-white outline-none focus:border-red-500 font-mono"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </GlassCard>
        </div>
    );
}
