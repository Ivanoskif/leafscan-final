import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ScanLine, Users, Bug, Target, TrendingUp, ArrowRight } from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts';
import { dashboardAPI } from '../../services/api';
import { useLang } from '../../context/LanguageContext';
import './Dashboard.css';

const DISEASE_COLORS = ['#5C9E78','#7CC49A','#E8924A','#F5C87A','#A8D5B5'];

function StatCard({ label, value, trend, Icon, color }) {
    return (
        <div className={`dash-stat dash-stat--${color}`}>
            <div className="dash-stat-left">
                <div className="dash-stat-label">{label}</div>
                <div className="dash-stat-value">{value ?? '—'}</div>
                {trend && <div className="dash-stat-trend">
                    <TrendingUp size={11} strokeWidth={2} style={{ display:'inline', marginRight:3 }} />
                    {trend}
                </div>}
            </div>
            <div className="dash-stat-icon"><Icon size={22} strokeWidth={1.8} /></div>
        </div>
    );
}

function ResultBadge({ result, t }) {
    const isHealthy = result === 'HEALTHY';
    return (
        <span className={`result-badge result-badge--${isHealthy ? 'healthy' : 'infected'}`}>
            {isHealthy ? t('analyses.healthy') : t('analyses.infected')}
        </span>
    );
}

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

export default function Dashboard() {
    const { t } = useLang();
    const [summary,        setSummary]        = useState(null);
    const [monthlyTrend,   setMonthlyTrend]   = useState([]);
    const [diseaseDist,    setDiseaseDist]     = useState([]);
    const [recentAnalyses, setRecentAnalyses]  = useState([]);
    const [topDiseases,    setTopDiseases]     = useState([]);
    const [loading,        setLoading]         = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [sumRes, trendRes, distRes, recentRes, topRes] = await Promise.all([
                    dashboardAPI.getSummary(),
                    dashboardAPI.getMonthlyTrend(),
                    dashboardAPI.getDiseaseDistribution(),
                    dashboardAPI.getRecentAnalyses(),
                    dashboardAPI.getTopDetectedDiseases(),
                ]);
                setSummary(sumRes.data);
                setMonthlyTrend(trendRes.data);
                setDiseaseDist(distRes.data.map((d, i) => ({ ...d, color: DISEASE_COLORS[i % DISEASE_COLORS.length] })));
                setRecentAnalyses(recentRes.data);
                setTopDiseases(topRes.data);
            } catch (err) {
                console.error('Dashboard load error:', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const STATS = [
        { label: t('dashboard.totalAnalyses'),    value: summary?.total_analyses,    Icon: ScanLine, color: 'green'  },
        { label: t('dashboard.totalUsers'),       value: summary?.total_users,       Icon: Users,    color: 'blue'   },
        { label: t('dashboard.diseasesDetected'), value: summary?.diseases_detected, Icon: Bug,      color: 'orange' },
        { label: t('dashboard.accuracyRate'),     value: summary?.accuracy_rate,     Icon: Target,   color: 'teal'   },
    ];

    if (loading) return <div className="dash-loading">Loading dashboard...</div>;

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <div>
                    <h1 className="dashboard-title">{t('dashboard.title')}</h1>
                    <p className="dashboard-subtitle">{t('dashboard.subtitle')}</p>
                </div>
                <div className="dashboard-date">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            <div className="dash-stats-grid">
                {STATS.map(s => <StatCard key={s.label} {...s} />)}
            </div>

            <div className="dash-charts-row">
                <div className="dash-card dash-card--wide">
                    <div className="dash-card-header">
                        <h2 className="dash-card-title">{t('dashboard.monthlyTrend')}</h2>
                    </div>
                    <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={monthlyTrend} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Line type="monotone" dataKey="count" stroke="#5C9E78" strokeWidth={2.5}
                                  dot={{ fill: '#5C9E78', r: 4, strokeWidth: 0 }}
                                  activeDot={{ r: 6, fill: '#7CC49A', strokeWidth: 0 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="dash-card">
                    <div className="dash-card-header">
                        <h2 className="dash-card-title">{t('dashboard.diseaseDistribution')}</h2>
                    </div>
                    <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                            <Pie data={diseaseDist} cx="50%" cy="42%" innerRadius={65} outerRadius={100} paddingAngle={3} dataKey="value">
                                {diseaseDist.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                            </Pie>
                            <Legend iconType="circle" iconSize={8} formatter={val => <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{val}</span>} />
                            <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13 }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

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
                            {recentAnalyses.map(row => (
                                <tr key={row.id}>
                                    <td className="dash-table-id">{row.analysis_key}</td>
                                    <td>{row.plant?.name || row.plant_name || '—'}</td>
                                    <td className="dash-table-disease">{row.disease?.name || row.disease_name || '—'}</td>
                                    <td>{row.confidence ? `${(row.confidence * 100).toFixed(1)}%` : '—'}</td>
                                    <td><ResultBadge result={row.result_label} t={t} /></td>
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
                        <BarChart data={topDiseases} layout="vertical" margin={{ top: 0, right: 16, left: 10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                            <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                            <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={90} />
                            <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13 }} />
                            <Bar dataKey="count" fill="#7CC49A" radius={[0, 6, 6, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
