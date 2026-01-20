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
    const baseStyle: React.CSSProperties = {
        background: 'rgba(30, 30, 30, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
        padding: '24px',
        height: '100%',
    };

    return (
        <div
            className={`${hover ? 'glass-card-hover' : ''} ${className}`}
            style={baseStyle}
        >
            {children}
        </div>
    );
}

interface BadgeProps {
    variant: 'success' | 'warning' | 'danger' | 'info';
    children: React.ReactNode;
}

export function Badge({ variant, children }: BadgeProps) {
    const variantStyles: Record<string, React.CSSProperties> = {
        success: {
            background: 'rgba(74, 222, 128, 0.15)',
            color: '#4ade80',
            border: '1px solid rgba(74, 222, 128, 0.25)',
        },
        warning: {
            background: 'rgba(251, 191, 36, 0.15)',
            color: '#fbbf24',
            border: '1px solid rgba(251, 191, 36, 0.25)',
        },
        danger: {
            background: 'rgba(248, 113, 113, 0.15)',
            color: '#f87171',
            border: '1px solid rgba(248, 113, 113, 0.25)',
        },
        info: {
            background: 'rgba(96, 165, 250, 0.15)',
            color: '#60a5fa',
            border: '1px solid rgba(96, 165, 250, 0.25)',
        },
    };

    const baseStyle: React.CSSProperties = {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 14px',
        borderRadius: '100px',
        fontSize: '12px',
        fontWeight: 600,
        letterSpacing: '0.02em',
        ...variantStyles[variant],
    };

    const dotStyle: React.CSSProperties = {
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        background: 'currentColor',
        flexShrink: 0,
    };

    return (
        <span style={baseStyle}>
            <span style={dotStyle}></span>
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
    const baseStyle: React.CSSProperties = {
        padding: '10px 18px',
        borderRadius: '100px',
        fontSize: '13px',
        fontWeight: active ? 600 : 500,
        border: active ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
        background: active
            ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
            : 'rgba(255, 255, 255, 0.04)',
        color: active ? '#0f172a' : 'var(--text-secondary)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
    };

    return (
        <button
            style={baseStyle}
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
