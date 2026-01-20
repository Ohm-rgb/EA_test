interface KPICardProps {
    label: string;
    value: string | number;
    change?: string;
    trend?: 'up' | 'down' | 'neutral';
}

export function KPICard({ label, value, change, trend }: KPICardProps) {
    return (
        <div className="kpi-card">
            <div className="label">{label}</div>
            <div className={`value ${trend === 'up' ? 'positive' : trend === 'down' ? 'negative' : ''}`}>
                {typeof value === 'number' ? value.toLocaleString() : value}
            </div>
            {change && (
                <div className={`text-sm mt-1 ${trend === 'up' ? 'text-emerald-400' :
                        trend === 'down' ? 'text-red-400' :
                            'text-[var(--text-secondary)]'
                    }`}>
                    {change}
                </div>
            )}
        </div>
    );
}

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
}

export function GlassCard({ children, className = '', hover = false }: GlassCardProps) {
    return (
        <div className={`glass-card ${hover ? 'glass-card-hover' : ''} ${className}`}>
            {children}
        </div>
    );
}

interface BadgeProps {
    variant: 'success' | 'warning' | 'danger' | 'info';
    children: React.ReactNode;
}

export function Badge({ variant, children }: BadgeProps) {
    return (
        <span className={`badge ${variant}`}>
            {children}
        </span>
    );
}

interface ButtonProps {
    variant?: 'primary' | 'danger' | 'ghost';
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
    disabled?: boolean;
}

export function Button({
    variant = 'primary',
    children,
    onClick,
    className = '',
    disabled = false
}: ButtonProps) {
    const baseClass = variant === 'primary' ? 'btn-primary' :
        variant === 'danger' ? 'btn-danger' :
            'bg-transparent border border-[var(--glass-border)] text-[var(--text-primary)] px-6 py-3 rounded-xl font-medium hover:bg-white/5 transition-all';

    return (
        <button
            className={`${baseClass} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={onClick}
            disabled={disabled}
        >
            {children}
        </button>
    );
}

interface ChipProps {
    active?: boolean;
    children: React.ReactNode;
    onClick?: () => void;
}

export function Chip({ active = false, children, onClick }: ChipProps) {
    return (
        <button
            className={`chip ${active ? 'active' : ''}`}
            onClick={onClick}
        >
            {children}
        </button>
    );
}

interface ProgressBarProps {
    value: number;
    max?: number;
    showLabel?: boolean;
}

export function ProgressBar({ value, max = 100, showLabel = false }: ProgressBarProps) {
    const percentage = Math.min((value / max) * 100, 100);

    return (
        <div className="w-full">
            {showLabel && (
                <div className="flex justify-between text-sm mb-2">
                    <span className="text-[var(--text-secondary)]">{value.toLocaleString()} / {max.toLocaleString()}</span>
                    <span className="text-[var(--text-primary)]">{percentage.toFixed(0)}%</span>
                </div>
            )}
            <div className="progress-bar">
                <div
                    className="progress-fill"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}
