import { useState } from 'react';
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
import './Statistics.css';

const MONTHLY_ANALYSES = [
    { month: 'Jan', analyses: 130, healthy: 54,  infected: 76  },
    { month: 'Feb', analyses: 168, healthy: 71,  infected: 97  },
    { month: 'Mar', analyses: 220, healthy: 98,  infected: 122 },
    { month: 'Apr', analyses: 305, healthy: 140, infected: 165 },
    { month: 'May', analyses: 288, healthy: 133, infected: 155 },
    { month: 'Jun', analyses: 430, healthy: 204, infected: 226 },
    { month: 'Jul', analyses: 325, healthy: 158, infected: 167 },
    { month: 'Aug', analyses: 475, healthy: 231, infected: 244 },
    { month: 'Sep', analyses: 390, healthy: 187, infected: 203 },
    { month: 'Oct', analyses: 510, healthy: 252, infected: 258 },
    { month: 'Nov', analyses: 460, healthy: 218, infected: 242 },
    { month: 'Dec', analyses: 346, healthy: 160, infected: 186 },
];

const DISEASE_BREAKDOWN = [
    { name: 'Leaf Blight',      value: 312, color: '#5C9E78' },
    { name: 'Powdery Mildew',   value: 198, color: '#7CC49A' },
    { name: 'Root Rot',         value: 164, color: '#E8924A' },
    { name: 'Rust Disease',     value: 127, color: '#F5C87A' },
    { name: 'Bacterial Blight', value: 98,  color: '#7AB8F5' },
    { name: 'Mosaic Virus',     value: 74,  color: '#C084FC' },
];

const PLANT_INFECTION_RATE = [
    { plant: 'Tomato',  rate: 68 },
    { plant: 'Potato',  rate: 54 },
    { plant: 'Grape',   rate: 47 },
    { plant: 'Corn',    rate: 38 },
    { plant: 'Apple',   rate: 31 },
    { plant: 'Pepper',  rate: 26 },
    { plant: 'Wheat',   rate: 22 },
    { plant: 'Rose',    rate: 19 },
];

const ACCURACY_TREND = [
    { month: 'Jan', accuracy: 89.2 },
    { month: 'Feb', accuracy: 90.1 },
    { month: 'Mar', accuracy: 91.4 },
    { month: 'Apr', accuracy: 91.8 },
    { month: 'May', accuracy: 92.3 },
    { month: 'Jun', accuracy: 93.0 },
    { month: 'Jul', accuracy: 92.7 },
    { month: 'Aug', accuracy: 93.5 },
    { month: 'Sep', accuracy: 93.9 },
    { month: 'Oct', accuracy: 94.2 },
    { month: 'Nov', accuracy: 94.5 },
    { month: 'Dec', accuracy: 94.7 },
];

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

    const RANGE_OPTIONS = [
        { key: 'last6',  label: t('statistics.last6months')  || t('statistics.last7days') },
        { key: 'last12', label: t('statistics.last12months') },
        { key: 'year',   label: t('statistics.last3months')  },
    ];

    const TOP_STATS = [
        { label: t('statistics.totalAnalyses'),    value: '3,847', trend: '+18.2%', Icon: ScanLine, color: 'green'  },
        { label: t('dashboard.diseasesDetected'),  value: '973',   trend: '+11.4%', Icon: Bug,      color: 'orange' },
        { label: t('statistics.avgConfidence'),    value: '92.8%', trend: '+3.6%',  Icon: Target,   color: 'teal'   },
        { label: t('statistics.activePlants'),     value: '1,234', trend: '+8.2%',  Icon: Users,    color: 'blue'   },
    ];

    const displayData = range === 'last6'
        ? MONTHLY_ANALYSES.slice(-6)
        : MONTHLY_ANALYSES;

    const totalAnalyses = displayData.reduce((s, d) => s + d.analyses, 0);
    const totalInfected = displayData.reduce((s, d) => s + d.infected, 0);
    const infectionRate = ((totalInfected / totalAnalyses) * 100).toFixed(1);

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
                                data={DISEASE_BREAKDOWN}
                                cx="50%" cy="50%"
                                innerRadius={55} outerRadius={85}
                                paddingAngle={3}
                                dataKey="value"
                            >
                                {DISEASE_BREAKDOWN.map((entry, i) => (
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
                        {DISEASE_BREAKDOWN.map(d => (
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
                            data={PLANT_INFECTION_RATE}
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
                                {PLANT_INFECTION_RATE.map((_, i) => (
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
                            Current: 94.7%
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={ACCURACY_TREND} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
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