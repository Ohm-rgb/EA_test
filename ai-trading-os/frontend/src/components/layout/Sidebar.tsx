'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
    { href: '/', icon: '👁', label: 'Dashboard' },
    { href: '/bot-studio', icon: '🤖', label: 'Bot Studio' },
    { href: '/history', icon: '⏰', label: 'History' },
    { href: '/portfolio', icon: '📊', label: 'Portfolio' },
    { href: '/settings', icon: '⚙️', label: 'Settings' },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="sidebar">
            {/* Logo - Gold branding */}
            <div className="sidebar-logo">
                <span className="logo-text gold">G</span>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`sidebar-item ${pathname === item.href ? 'active' : ''}`}
                        title={item.label}
                    >
                        <span className="sidebar-icon">{item.icon}</span>
                    </Link>
                ))}
            </nav>

            {/* Spacer */}
            <div className="flex-1" />
        </aside>
    );
}

export default Sidebar;
