import { useState, useEffect, useMemo } from 'react';
import {
    TrendingUp, ScanLine, Bug, Target,
    Users, Calendar, Award, AlertTriangle
} from 'lucide-react';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
} from 'recharts';
import { useLang } from '../../context/LanguageContext';
import { statisticsAPI } from '../../services/api';
import './Statistics.css';

const PIE_COLORS = ['#5C9E78', '#7CC49A', '#E8924A', '#F5C87A', '#7AB8F5', '#C084FC', '#3A7A56'];

const monthLabel = (iso) => {
    if (!iso) return '';
    try {
        const d = new Date(iso);
        if (!isNaN(d)) return d.toLocaleString('en-US', { month: 'short' });
    } catch {}
    return String(iso).slice(0, 7);
};

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

const AccuracyTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="chart-tooltip">
                <div className="chart-tooltip-label">{label}</div>
                <div className="chart-tooltip-value">{payload[0].value}%</div>
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
                <div className="dash-stat-value">{value}</div>
                <div className="dash-stat-trend">
                    <TrendingUp size={11} strokeWidth={2} style={{ display: 'inline', marginRight: 3 }} />
                    {trend}
                </div>
            </div>
            <div className="dash-stat-icon">
                <Icon size={22} strokeWidth={1.8} />
            </div>
        </div>
    );
}

export default function Statistics() {
    const { t } = useLang();
    const [range, setRange] = useState('last12');
    const [data,  setData]  = useState(null);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState('');

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            setError('');
            try {
                const res = await statisticsAPI.overview();
                if (cancelled) return;
                setData(res.data || null);
            } catch (err) {
                if (cancelled) return;
                setError(err?.response?.data?.detail || err?.message || 'Failed to load statistics');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const RANGE_OPTIONS = [
        { key: 'last6',  label: t('statistics.last6months')  || t('statistics.last7days') },
        { key: 'last12', label: t('statistics.last12months') },
        { key: 'year',   label: t('statistics.last3months')  },
    ];

    // Backend нема breakdown по healthy/infected. Користиме `count` ко проксија.
    // Кога backend ке додаде split, само заменете го мапирањето.
    const analysesByMonth = useMemo(() => {
        const arr = data?.analyses_by_month || [];
        return arr.map(m => ({
            month:    monthLabel(m.month),
            analyses: m.count ?? 0,
            healthy:  m.healthy ?? 0,
            infected: m.infected ?? 0,
        }));
    }, [data]);

    const displayData = range === 'last6'
        ? analysesByMonth.slice(-6)
        : analysesByMonth;

    const diseaseBreakdown = useMemo(() => {
        const arr = data?.top_detected_diseases || [];
        return arr.map((d, i) => ({
            name:  d.name,
            value: d.count ?? d.value ?? 0,
            color: PIE_COLORS[i % PIE_COLORS.length],
        }));
    }, [data]);

    const accuracyTrend = useMemo(() => {
        const arr = data?.detection_accuracy || [];
        return arr.map(m => ({
            month:    monthLabel(m.month),
            accuracy: typeof m.accuracy === 'number' ? m.accuracy : parseFloat(m.accuracy) || 0,
        }));
    }, [data]);

    const userGrowth = useMemo(() => {
        const arr = data?.user_growth || [];
        return arr.map(m => ({ month: monthLabel(m.month), users: m.count ?? 0 }));
    }, [data]);

    // Derived top stats.
    const totalAnalyses = displayData.reduce((s, d) => s + d.analyses, 0);
    const totalInfected = displayData.reduce((s, d) => s + d.infected, 0);
    const infectionRate = totalAnalyses
        ? ((totalInfected / totalAnalyses) * 100).toFixed(1)
        : '0.0';
    const diseasesDetected = diseaseBreakdown.reduce((s, d) => s + d.value, 0);
    const avgConfidence = accuracyTrend.length
        ? (accuracyTrend.reduce((s, a) => s + a.accuracy, 0) / accuracyTrend.length).toFixed(1)
        : '—';
    const totalUsers = userGrowth.reduce((s, u) => s + u.users, 0);

    const TOP_STATS = [
        { label: t('statistics.totalAnalyses'),    value: totalAnalyses.toLocaleString(),       trend: '—', Icon: ScanLine, color: 'green'  },
        { label: t('dashboard.diseasesDetected'),  value: diseasesDetected.toLocaleString(),    trend: '—', Icon: Bug,      color: 'orange' },
        { label: t('statistics.avgConfidence'),    value: avgConfidence === '—' ? '—' : `${avgConfidence}%`, trend: '—', Icon: Target, color: 'teal' },
        { label: t('statistics.activePlants'),     value: totalUsers.toLocaleString(),          trend: '—', Icon: Users,    color: 'blue'   },
    ];

    // plantInfectionRate нема backend endpoint засега — се покрива со /statistics/top-detected-diseases/
    // (по болест, не по растение). Останува empty.
    const plantInfectionRate = [];

    return (
        <div className="statistics-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">{t('statistics.title')}</h1>
                    <p className="page-subtitle">{t('statistics.subtitle')}</p>
                </div>
                <div className="stat-range-tabs">
                    {RANGE_OPTIONS.map(r => (
                        <button
                            key={r.key}
                            className={`range-tab ${range === r.key ? 'range-tab--active' : ''}`}
                            onClick={() => setRange(r.key)}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="dash-stats-grid">
                {TOP_STATS.map(s => <StatCard key={s.label} {...s} />)}
            </div>

            {/* Row 1 */}
            <div className="stat-charts-row">
                <div className="dash-card dash-card--wide">
                    <div className="dash-card-header">
                        <h2 className="dash-card-title">{t('statistics.analysesOverTime')}</h2>
                        <div className="stat-legend">
                            <span className="stat-legend-item stat-legend-item--healthy">{t('statistics.healthy')}</span>
                            <span className="stat-legend-item stat-legend-item--infected">{t('statistics.infected')}</span>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={displayData} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
                            <defs>
                                <linearGradient id="healthyGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%"  stopColor="#5C9E78" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#5C9E78" stopOpacity={0.02} />
                                </linearGradient>
                                <linearGradient id="infectedGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%"  stopColor="#E8924A" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#E8924A" stopOpacity={0.02} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#243028" />
                            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#7A9080' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 12, fill: '#7A9080' }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="healthy"  name={t('statistics.healthy')}  stroke="#5C9E78" strokeWidth={2} fill="url(#healthyGrad)"  dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
                            <Area type="monotone" dataKey="infected" name={t('statistics.infected')} stroke="#E8924A" strokeWidth={2} fill="url(#infectedGrad)" dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="dash-card">
                    <div className="dash-card-header">
                        <h2 className="dash-card-title">{t('statistics.diseaseDistribution')}</h2>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie
                                data={diseaseBreakdown}
                                cx="50%" cy="50%"
                                innerRadius={55} outerRadius={85}
                                paddingAngle={3}
                                dataKey="value"
                            >
                                {diseaseBreakdown.map((entry, i) => (
                                    <Cell key={i} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(val, name) => [`${val} cases`, name]}
                                contentStyle={{ background: '#1E2923', border: '1px solid #243028', borderRadius: 10, fontSize: 13 }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="pie-legend">
                        {diseaseBreakdown.map(d => (
                            <div key={d.name} className="pie-legend-item">
                                <span className="pie-legend-dot" style={{ background: d.color }} />
                                <span className="pie-legend-name">{d.name}</span>
                                <span className="pie-legend-val">{d.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Row 2 */}
            <div className="stat-charts-row">
                <div className="dash-card">
                    <div className="dash-card-header">
                        <h2 className="dash-card-title">{t('statistics.infectionRate')} by Plant</h2>
                        <span className="stat-subtitle-tag">% of analyses flagged</span>
                    </div>
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart
                            data={plantInfectionRate}
                            layout="vertical"
                            margin={{ top: 0, right: 16, left: 10, bottom: 0 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#243028" horizontal={false} />
                            <XAxis type="number" tick={{ fontSize: 11, fill: '#7A9080' }} axisLine={false} tickLine={false} unit="%" />
                            <YAxis dataKey="plant" type="category" tick={{ fontSize: 12, fill: '#7A9080' }} axisLine={false} tickLine={false} width={52} />
                            <Tooltip
                                formatter={val => [`${val}%`, t('statistics.infectionRate')]}
                                contentStyle={{ background: '#1E2923', border: '1px solid #243028', borderRadius: 10, fontSize: 13 }}
                            />
                            <Bar dataKey="rate" radius={[0, 6, 6, 0]}>
                                {plantInfectionRate.map((_, i) => (
                                    <Cell key={i} fill={i % 2 === 0 ? '#5C9E78' : '#7CC49A'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="dash-card dash-card--wide">
                    <div className="dash-card-header">
                        <h2 className="dash-card-title">Model Accuracy Trend</h2>
                        <div className="stat-accuracy-badge">
                            <Award size={13} strokeWidth={2} />
                            Current: {accuracyTrend.length ? `${accuracyTrend[accuracyTrend.length - 1].accuracy.toFixed(1)}%` : '—'}
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={accuracyTrend} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#243028" />
                            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#7A9080' }} axisLine={false} tickLine={false} />
                            <YAxis domain={[88, 96]} tick={{ fontSize: 12, fill: '#7A9080' }} axisLine={false} tickLine={false} unit="%" />
                            <Tooltip content={<AccuracyTooltip />} />
                            <Line
                                type="monotone"
                                dataKey="accuracy"
                                stroke="#7CC49A"
                                strokeWidth={2.5}
                                dot={{ fill: '#7CC49A', r: 4, strokeWidth: 0 }}
                                activeDot={{ r: 6, fill: '#A8D5B5', strokeWidth: 0 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Summary row */}
            <div className="stat-summary-row">
                <div className="dash-card stat-summary-card">
                    <div className="stat-summary-icon stat-summary-icon--green">
                        <ScanLine size={20} strokeWidth={1.8} />
                    </div>
                    <div className="stat-summary-label">Avg / Day</div>
                    <div className="stat-summary-value">10.5</div>
                    <div className="stat-summary-sub">analyses per day</div>
                </div>
                <div className="dash-card stat-summary-card">
                    <div className="stat-summary-icon stat-summary-icon--orange">
                        <AlertTriangle size={20} strokeWidth={1.8} />
                    </div>
                    <div className="stat-summary-label">{t('statistics.infectionRate')}</div>
                    <div className="stat-summary-value">{infectionRate}%</div>
                    <div className="stat-summary-sub">of all analyses</div>
                </div>
                <div className="dash-card stat-summary-card">
                    <div className="stat-summary-icon stat-summary-icon--teal">
                        <Target size={20} strokeWidth={1.8} />
                    </div>
                    <div className="stat-summary-label">Top Disease</div>
                    <div className="stat-summary-value" style={{ fontSize: 18 }}>Leaf Blight</div>
                    <div className="stat-summary-sub">312 detections</div>
                </div>
                <div className="dash-card stat-summary-card">
                    <div className="stat-summary-icon stat-summary-icon--blue">
                        <Calendar size={20} strokeWidth={1.8} />
                    </div>
                    <div className="stat-summary-label">Peak Month</div>
                    <div className="stat-summary-value" style={{ fontSize: 18 }}>October</div>
                    <div className="stat-summary-sub">510 analyses</div>
                </div>
            </div>
        </div>
    );
}