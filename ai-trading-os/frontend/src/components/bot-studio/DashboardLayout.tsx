import { useState, useEffect } from 'react';

interface DashboardLayoutProps {
    activeView: 'overview' | 'machine' | 'performance';
    onViewChange: (view: 'overview' | 'machine' | 'performance') => void;
    children: React.ReactNode;
}

export function DashboardLayout({ activeView, onViewChange, children }: DashboardLayoutProps) {
    // Real-time Clock
    const [time, setTime] = useState<Date | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        setTime(new Date());
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    };

    // Navigation Item Helper
    const NavItem = ({ view, label, icon }: { view: 'overview' | 'machine' | 'performance', label: string, icon: string }) => (
        <button
            onClick={() => onViewChange(view)}
            className={`
                relative h-full px-6 flex items-center gap-2 text-sm font-medium transition-all duration-200
                border-r border-white/10
                ${activeView === view
                    ? 'bg-white/10 text-white shadow-[inset_0_-2px_0_var(--color-accent)]'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }
            `}
        >
            <span className="text-lg opacity-80">{icon}</span>
            {label}
        </button>
    );

    return (
        <div className="h-screen w-full flex flex-col bg-[#0f172a] text-slate-200 overflow-hidden font-sans">
            {/* Industrial Header / Top Bar */}
            <header className="flex-none h-14 bg-[#1e293b] border-b border-slate-700 shadow-md flex items-center justify-between z-50">

                {/* Left: Brand / Title */}
                <div className="flex items-center h-full pl-4 pr-8 border-r border-slate-700 bg-[#0f172a]/50">
                    <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold mr-3 shadow-lg shadow-blue-500/20">
                        B
                    </div>
                    <div>
                        <h1 className="text-white font-bold text-sm tracking-wide uppercase">Strategy Management</h1>
                        <div className="text-[10px] text-slate-400 font-mono tracking-wider">CONSOLE v2.0</div>
                    </div>
                </div>

                {/* Center: Navigation Rail */}
                <nav className="flex-1 h-full flex items-center">
                    <NavItem view="overview" label="Overview" icon="📊" />
                    <NavItem view="machine" label="Machine Data" icon="⚡" />
                    <NavItem view="performance" label="Performance" icon="🏭" />
                </nav>

                {/* Right: System Status & Time */}
                <div className="flex items-center h-full px-6 bg-[#0f172a]/30 border-l border-slate-700 gap-6">
                    {/* Status Indicator */}
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                        <span className="text-xs font-mono text-emerald-400">SYSTEM ONLINE</span>
                    </div>

                    {/* Clock */}
                    <div className="text-right">
                        <div className="text-lg font-mono font-bold text-white leading-none">
                            {mounted && time ? formatTime(time) : "00:00:00"}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono uppercase text-right mt-0.5">
                            {mounted && time ? formatDate(time) : "Loading..."}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 min-h-0 relative bg-[#0f172a] overflow-hidden">
                {children}
            </main>
        </div>
    );
}
