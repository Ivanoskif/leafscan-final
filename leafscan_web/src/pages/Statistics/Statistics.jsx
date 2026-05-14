import { useState, useEffect } from 'react';
import { TrendingUp, ScanLine, Bug, Target, Users, Calendar, Award, AlertTriangle } from 'lucide-react';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { statisticsAPI } from '../../services/api';
import { useLang } from '../../context/LanguageContext';
import './Statistics.css';

const COLORS = ['#5C9E78','#7CC49A','#E8924A','#F5C87A','#7AB8F5','#C084FC'];

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="chart-tooltip">
                <div className="chart-tooltip-label">{label}</div>
                {payload.map((p, i) => (
                    <div key={i} className="chart-tooltip-row">
                        <span className="chart-tooltip-dot" style={{ background: p.color }} />
                        <span className="chart-tooltip-name">{p.name}:</span>
                        <span className="chart-tooltip-value">{p.value}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

function StatCard({ label, value, trend, Icon, color }) {
    return (
        <div className={`dash-stat dash-stat--${color}`}>
            <div className="dash-stat-left">
                <div className="dash-stat-label">{label}</div>
                <div className="dash-stat-value">{value ?? '—'}</div>
                {trend && <div className="dash-stat-trend">
                    <TrendingUp size={11} strokeWidth={2} style={{ display: 'inline', marginRight: 3 }} />
                    {trend}
                </div>}
            </div>
            <div className="dash-stat-icon"><Icon size={22} strokeWidth={1.8} /></div>
        </div>
    );
}

export default function Statistics() {
    const { t } = useLang();
    const [overview,      setOverview]      = useState(null);
    const [monthlyData,   setMonthlyData]   = useState([]);
    const [diseaseData,   setDiseaseData]   = useState([]);
    const [userGrowth,    setUserGrowth]    = useState([]);
    const [accuracy,      setAccuracy]      = useState([]);
    const [topDiseases,   setTopDiseases]   = useState([]);
    const [loading,       setLoading]       = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [ovRes, moRes, diRes, ugRes, acRes, tdRes] = await Promise.all([
                    statisticsAPI.getOverview(),
                    statisticsAPI.getAnalysesByMonth(),
                    statisticsAPI.getDiseasesByCategory(),
                    statisticsAPI.getUserGrowth(),
                    statisticsAPI.getDetectionAccuracy(),
                    statisticsAPI.getTopDetectedDiseases(),
                ]);
                setOverview(ovRes.data);
                setMonthlyData(moRes.data);
                setDiseaseData(diRes.data.map((d, i) => ({ ...d, color: COLORS[i % COLORS.length] })));
                setUserGrowth(ugRes.data);
                setAccuracy(acRes.data);
                setTopDiseases(tdRes.data);
            } catch (err) {
                console.error('Statistics load error:', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const TOP_STATS = [
        { label: t('statistics.totalAnalyses'),   value: overview?.total_analyses,    Icon: ScanLine, color: 'green'  },
        { label: t('dashboard.diseasesDetected'), value: overview?.diseases_detected, Icon: Bug,      color: 'orange' },
        { label: t('statistics.avgConfidence'),   value: overview?.avg_confidence,    Icon: Target,   color: 'teal'   },
        { label: t('statistics.activePlants'),    value: overview?.total_users,       Icon: Users,    color: 'blue'   },
    ];

    if (loading) return <div className="dash-loading">Loading statistics...</div>;

    return (
        <div className="statistics-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">{t('statistics.title')}</h1>
                    <p className="page-subtitle">{t('statistics.subtitle')}</p>
                </div>
            </div>

            <div className="dash-stats-grid">
                {TOP_STATS.map(s => <StatCard key={s.label} {...s} />)}
            </div>

            <div className="stat-charts-row">
                <div className="dash-card dash-card--wide">
                    <div className="dash-card-header">
                        <h2 className="dash-card-title">{t('statistics.analysesOverTime')}</h2>
                    </div>
                    <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={monthlyData} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
                            <defs>
                                <linearGradient id="healthyGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#5C9E78" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#5C9E78" stopOpacity={0.02} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="count" name="Analyses" stroke="#5C9E78" strokeWidth={2} fill="url(#healthyGrad)" dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="dash-card">
                    <div className="dash-card-header">
                        <h2 className="dash-card-title">{t('statistics.diseaseDistribution')}</h2>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie data={diseaseData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="count">
                                {diseaseData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                            </Pie>
                            <Tooltip formatter={(val, name) => [`${val} cases`, name]} contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13 }} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="pie-legend">
                        {diseaseData.map(d => (
                            <div key={d.name} className="pie-legend-item">
                                <span className="pie-legend-dot" style={{ background: d.color }} />
                                <span className="pie-legend-name">{d.name}</span>
                                <span className="pie-legend-val">{d.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="stat-charts-row">
                <div className="dash-card">
                    <div className="dash-card-header">
                        <h2 className="dash-card-title">Top Detected Diseases</h2>
                    </div>
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={topDiseases} layout="vertical" margin={{ top: 0, right: 16, left: 10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                            <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                            <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={100} />
                            <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13 }} />
                            <Bar dataKey="count" fill="#E8924A" radius={[0, 6, 6, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="dash-card dash-card--wide">
                    <div className="dash-card-header">
                        <h2 className="dash-card-title">User Growth</h2>
                    </div>
                    <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={userGrowth} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13 }} />
                            <Line type="monotone" dataKey="count" stroke="#7AB8F5" strokeWidth={2.5} dot={{ fill: '#7AB8F5', r: 4, strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
