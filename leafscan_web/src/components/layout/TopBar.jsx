import { Search, Globe } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './TopBar.css';

export default function TopBar() {
    const { user } = useAuth();
    const initial = user?.full_name?.[0]?.toUpperCase() || 'A';
    const name    = user?.full_name || 'Admin';
    const email   = user?.email    || 'admin@leafscan.ai';

    return (
        <header className="topbar">
            {/* Search */}
            <div className="topbar-search">
                <Search size={15} color="var(--text-muted)" strokeWidth={1.8} />
                <input
                    className="topbar-search-input"
                    placeholder="Search..."
                    type="text"
                />
            </div>

            {/* Right side */}
            <div className="topbar-right">
                {/* Language */}
                <button className="topbar-icon-btn">
                    <Globe size={16} strokeWidth={1.8} color="var(--text-muted)" />
                    <span className="topbar-lang">EN</span>
                </button>

                {/* User — no arrow, no notifications */}
                <div className="topbar-user">
                    <div className="topbar-avatar">{initial}</div>
                    <div className="topbar-user-info">
                        <div className="topbar-user-name">{name}</div>
                        <div className="topbar-user-email">{email}</div>
                    </div>
                </div>
            </div>
        </header>
    );
}
