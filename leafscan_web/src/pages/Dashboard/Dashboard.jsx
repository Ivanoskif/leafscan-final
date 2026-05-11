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
import './Dashboard.css';

// ── Mock data ─────────────────────────────────────────────────────────────────
const MONTHLY_TREND = [
    { month: 'Jan', count: 130 },
    { month: 'Feb', count: 168 },
    { month: 'Mar', count: 220 },
    { month: 'Apr', count: 305 },
    { month: 'May', count: 288 },
    { month: 'Jun', count: 430 },
    { month: 'Jul', count: 325 },
    { month: 'Aug', count: 475 },
];

const DISEASE_DIST = [
    { name: 'Leaf Blight',    value: 35, color: '#5C9E78' },
    { name: 'Powdery Mildew', value: 22, color: '#7CC49A' },
    { name: 'Root Rot',       value: 18, color: '#E8924A' },
    { name: 'Rust',           value: 14, color: '#F5C87A' },
    { name: 'Healthy',        value: 11, color: '#A8D5B5' },
];

const RECENT_ANALYSES = [
    { id: 'AN-2847', plant: 'Tomato', disease: '—',              confidence: '94.2%', result: 'INFECTED' },
    { id: 'AN-2846', plant: 'Potato', disease: '—',              confidence: '98.1%', result: 'HEALTHY'  },
    { id: 'AN-2845', plant: 'Corn',   disease: 'Rust',           confidence: '87.5%', result: 'INFECTED' },
    { id: 'AN-2844', plant: 'Grape',  disease: 'Powdery Mildew', confidence: '91.3%', result: 'INFECTED' },
    { id: 'AN-2843', plant: 'Apple',  disease: '—',              confidence: '96.7%', result: 'HEALTHY'  },
];

const TOP_PLANTS = [
    { plant: 'Tomato', count: 152 },
    { plant: 'Potato', count: 118 },
    { plant: 'Corn',   count: 97  },
    { plant: 'Grape',  count: 84  },
    { plant: 'Apple',  count: 61  },
    { plant: 'Pepper', count: 43  },
];

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

    const STATS = [
        { label: t('dashboard.totalAnalyses'),    value: '2,847', trend: '+12.5%', Icon: ScanLine, color: 'green'  },
        { label: t('dashboard.totalUsers'),       value: '1,234', trend: '+8.2%',  Icon: Users,    color: 'blue'   },
        { label: t('dashboard.diseasesDetected'), value: '47',    trend: '+3',     Icon: Bug,      color: 'orange' },
        { label: t('dashboard.accuracyRate'),     value: '94.7%', trend: '+1.2%',  Icon: Target,   color: 'teal'   },
    ];

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
                        <LineChart data={MONTHLY_TREND} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
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
                                data={DISEASE_DIST}
                                cx="50%" cy="50%"
                                innerRadius={55} outerRadius={85}
                                paddingAngle={3}
                                dataKey="value"
                            >
                                {DISEASE_DIST.map((entry, i) => (
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
                            {RECENT_ANALYSES.map(row => (
                                <tr key={row.id}>
                                    <td className="dash-table-id">{row.id}</td>
                                    <td>{row.plant}</td>
                                    <td className="dash-table-disease">{row.disease}</td>
                                    <td>{row.confidence}</td>
                                    <td><ResultBadge result={row.result} t={t} /></td>
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
                            data={TOP_PLANTS}
                            layout="vertical"
                            margin={{ top: 0, right: 16, left: 10, bottom: 0 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#243028" horizontal={false} />
                            <XAxis type="number" tick={{ fontSize: 11, fill: '#7A9080' }} axisLine={false} tickLine={false} />
                            <YAxis dataKey="plant" type="category" tick={{ fontSize: 12, fill: '#7A9080' }} axisLine={false} tickLine={false} width={50} />
                            <Tooltip contentStyle={{ background: '#1E2923', border: '1px solid #243028', borderRadius: 10, fontSize: 13 }} />
                            <Bar dataKey="count" fill="#7CC49A" radius={[0, 6, 6, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}