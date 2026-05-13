import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
    ScanLine, Users, Bug, Target,
    TrendingUp, ArrowRight
} from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
    BarChart, Bar
} from 'recharts';
import { useLang } from '../../context/LanguageContext';
import { dashboardAPI } from '../../services/api';
import './Dashboard.css';

const PIE_COLORS = ['#5C9E78', '#7CC49A', '#E8924A', '#F5C87A', '#A8D5B5', '#3A7A56', '#9AC0A6'];

const formatNumber = (n) => {
    if (typeof n !== 'number') return n ?? '—';
    return n.toLocaleString();
};

const formatPercent = (n) => {
    if (typeof n !== 'number') return '—';
    return `${n.toFixed(1)}%`;
};

const formatMonth = (iso) => {
    if (!iso) return '';
    // backend враќа ISO date (YYYY-MM-01) или month string. Конвертирај во кратко име.
    try {
        const d = new Date(iso);
        if (!isNaN(d)) return d.toLocaleString('en-US', { month: 'short' });
    } catch {}
    return String(iso).slice(0, 7);
};

const formatTrend = (n) => {
    if (typeof n !== 'number' || n === 0) return '—';
    const sign = n > 0 ? '+' : '';
    return `${sign}${n.toFixed(1)}%`;
};

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, trend, Icon, color }) {
    return (
        <div className={`dash-stat dash-stat--${color}`}>
            <div className="dash-stat-left">
                <div className="dash-stat-label">{label}</div>
                <div className="dash-stat-value">{value}</div>
                <div className="dash-stat-trend">
                    <TrendingUp size={11} strokeWidth={2} style={{ display:'inline', marginRight:3 }} />
                    {trend}
                </div>
            </div>
            <div className="dash-stat-icon">
                <Icon size={22} strokeWidth={1.8} />
            </div>
        </div>
    );
}

// ── Result badge ──────────────────────────────────────────────────────────────
function ResultBadge({ result, t }) {
    const isHealthy = result === 'HEALTHY';
    return (
        <span className={`result-badge result-badge--${isHealthy ? 'healthy' : 'infected'}`}>
            {isHealthy ? t('analyses.healthy') : t('analyses.infected')}
        </span>
    );
}

// ── Custom tooltip ─────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="chart-tooltip">
                <div className="chart-tooltip-label">{label}</div>
                <div className="chart-tooltip-value">{payload[0].value}</div>
            </div>
        );
    }
    return null;
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
    const { t } = useLang();
    const [overview, setOverview] = useState(null);
    const [loading,  setLoading]  = useState(true);
    const [error,    setError]    = useState('');

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            setError('');
            try {
                const res = await dashboardAPI.overview();
                if (cancelled) return;
                setOverview(res.data || null);
            } catch (err) {
                if (cancelled) return;
                setError(err?.response?.data?.detail || err?.message || 'Failed to load dashboard');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const summary  = overview?.summary || {};
    const growth   = summary?.growth   || {};

    const STATS = [
        { label: t('dashboard.totalAnalyses'),    value: formatNumber(summary.total_analyses),    trend: formatTrend(growth.analyses),  Icon: ScanLine, color: 'green'  },
        { label: t('dashboard.totalUsers'),       value: formatNumber(summary.total_users),       trend: formatTrend(growth.users),     Icon: Users,    color: 'blue'   },
        { label: t('dashboard.diseasesDetected'), value: formatNumber(summary.diseases_detected), trend: formatTrend(growth.diseases),  Icon: Bug,      color: 'orange' },
        { label: t('dashboard.accuracyRate'),     value: formatPercent(summary.accuracy_rate),    trend: formatTrend(growth.accuracy),  Icon: Target,   color: 'teal'   },
    ];

    const monthlyTrend = useMemo(
        () => (overview?.monthly_trend || []).map(m => ({ month: formatMonth(m.month), count: m.count ?? 0 })),
        [overview],
    );

    const diseaseDist = useMemo(
        () => (overview?.disease_distribution || []).map((d, i) => ({
            name:  d.name,
            value: d.value ?? d.count ?? 0,
            color: PIE_COLORS[i % PIE_COLORS.length],
        })),
        [overview],
    );

    const recentAnalyses = overview?.recent_analyses || [];
    const topDiseases    = overview?.top_detected_diseases || [];

    return (
        <div className="dashboard">
            {/* Header */}
            <div className="dashboard-header">
                <div>
                    <h1 className="dashboard-title">{t('dashboard.title')}</h1>
                    <p className="dashboard-subtitle">{t('dashboard.subtitle')}</p>
                </div>
                <div className="dashboard-date">
                    {new Date().toLocaleDateString('en-US', {
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                    })}
                </div>
            </div>

            {/* Stats */}
            <div className="dash-stats-grid">
                {STATS.map(s => <StatCard key={s.label} {...s} />)}
            </div>

            {/* Charts row 1 */}
            <div className="dash-charts-row">
                <div className="dash-card dash-card--wide">
                    <div className="dash-card-header">
                        <h2 className="dash-card-title">{t('dashboard.monthlyTrend')}</h2>
                    </div>
                    <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={monthlyTrend} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#243028" />
                            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#7A9080' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 12, fill: '#7A9080' }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Line
                                type="monotone"
                                dataKey="count"
                                stroke="#5C9E78"
                                strokeWidth={2.5}
                                dot={{ fill: '#5C9E78', r: 4, strokeWidth: 0 }}
                                activeDot={{ r: 6, fill: '#7CC49A', strokeWidth: 0 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="dash-card">
                    <div className="dash-card-header">
                        <h2 className="dash-card-title">{t('dashboard.diseaseDistribution')}</h2>
                    </div>
                    <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                            <Pie
                                data={diseaseDist}
                                cx="50%" cy="50%"
                                innerRadius={55} outerRadius={85}
                                paddingAngle={3}
                                dataKey="value"
                            >
                                {diseaseDist.map((entry, i) => (
                                    <Cell key={i} fill={entry.color} />
                                ))}
                            </Pie>
                            <Legend
                                iconType="circle" iconSize={8}
                                formatter={val => <span style={{ fontSize: 12, color: '#7A9080' }}>{val}</span>}
                            />
                            <Tooltip formatter={val => `${val}%`} contentStyle={{ background: '#1E2923', border: '1px solid #243028', borderRadius: 10, fontSize: 13 }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Charts row 2 */}
            <div className="dash-charts-row">
                <div className="dash-card dash-card--wide">
                    <div className="dash-card-header">
                        <h2 className="dash-card-title">{t('dashboard.recentAnalyses')}</h2>
                        <Link to="/analyses" className="dash-view-all">
                            {t('common.viewAll')} <ArrowRight size={13} strokeWidth={2} style={{ display:'inline', verticalAlign:'middle' }} />
                        </Link>
                    </div>
                    <div className="dash-table-wrap">
                        <table className="dash-table">
                            <thead>
                            <tr>
                                <th>{t('analyses.id')}</th>
                                <th>{t('analyses.plant')}</th>
                                <th>{t('analyses.disease')}</th>
                                <th>{t('analyses.confidence')}</th>
                                <th>{t('analyses.result')}</th>
                            </tr>
                            </thead>
                            <tbody>
                            {recentAnalyses.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: 24, color: '#7A9080' }}>
                                        {loading ? 'Loading…' : error ? error : 'No analyses yet'}
                                    </td>
                                </tr>
                            ) : recentAnalyses.map(row => (
                                <tr key={row.id}>
                                    <td className="dash-table-id">{row.analysis_key || `AN-${row.id}`}</td>
                                    <td>{row.plant || '—'}</td>
                                    <td className="dash-table-disease">{row.disease || '—'}</td>
                                    <td>{typeof row.confidence === 'number' ? `${row.confidence.toFixed(1)}%` : (row.confidence || '—')}</td>
                                    <td><ResultBadge result={row.result_label || (row.disease ? 'INFECTED' : 'HEALTHY')} t={t} /></td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="dash-card">
                    <div className="dash-card-header">
                        <h2 className="dash-card-title">{t('dashboard.topDetected')}</h2>
                    </div>
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart
                            data={topDiseases}
                            layout="vertical"
                            margin={{ top: 0, right: 16, left: 10, bottom: 0 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#243028" horizontal={false} />
                            <XAxis type="number" tick={{ fontSize: 11, fill: '#7A9080' }} axisLine={false} tickLine={false} />
                            <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: '#7A9080' }} axisLine={false} tickLine={false} width={90} />
                            <Tooltip contentStyle={{ background: '#1E2923', border: '1px solid #243028', borderRadius: 10, fontSize: 13 }} />
                            <Bar dataKey="count" fill="#7CC49A" radius={[0, 6, 6, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}