import { useState, useEffect } from 'react';
import { Search, X, Eye, Trash2, Download, ChevronUp, ChevronDown, AlertTriangle, FileText, Activity, Leaf, UserCircle } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { analysesAPI } from '../../services/api';
import { useLang } from '../../context/LanguageContext';
import './AnalysisHistory.css';

function ResultBadge({ result, t }) {
    const isHealthy = result === 'HEALTHY';
    return (
        <span className={`result-badge ${isHealthy ? 'result-badge--healthy' : 'result-badge--infected'}`}>
            {isHealthy ? t('analyses.healthy') : t('analyses.infected')}
        </span>
    );
}

function DetailModal({ analysis, onClose, t }) {
    if (!analysis) return null;
    const isHealthy = analysis.result_label === 'HEALTHY';
    const confidence = analysis.confidence ? `${(analysis.confidence * 100).toFixed(1)}%` : '—';
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="modal-header-left">
                        <div className={`modal-icon ${isHealthy ? 'modal-icon--healthy' : 'modal-icon--infected'}`}>
                            <Leaf size={20} strokeWidth={1.8} />
                        </div>
                        <div>
                            <h3 className="modal-title">{analysis.analysis_key}</h3>
                            <div className="modal-meta">
                                <span className="modal-date"> {analysis.created_at?.slice(0,10)}</span>
                                <span className="modal-dot">·</span>
                                <ResultBadge result={analysis.result_label} t={t} />
                            </div>
                        </div>
                    </div>
                    <button className="modal-close" onClick={onClose}><X size={18} strokeWidth={2} /></button>
                </div>
                <div className="modal-body">
                    <div className="detail-row">
                        <div className="detail-item">
                            <div className="detail-label"><Leaf size={13} strokeWidth={1.8} /> {t('analyses.plant')}</div>
                            <div className="detail-value">{analysis.plant_name || analysis.plant?.name || '—'}</div>
                        </div>
                        <div className="detail-item">
                            <div className="detail-label"><Activity size={13} strokeWidth={1.8} /> {t('analyses.disease')}</div>
                            <div className="detail-value">{analysis.disease_name || analysis.disease?.name || ('— ' + t('analyses.healthy'))}</div>
                        </div>
                    </div>
                    <div className="detail-row">
                        <div className="detail-item">
                            <div className="detail-label"><FileText size={13} strokeWidth={1.8} /> {t('analyses.confidence')}</div>
                            <div className="detail-value detail-value--accent">{confidence}</div>
                        </div>
                        <div className="detail-item">
                            <div className="detail-label"><FileText size={13} strokeWidth={1.8} /> {t('analyses.result')}</div>
                            <div className="detail-value"><ResultBadge result={analysis.result_label} t={t} /></div>
                        </div>
                    </div>
                    <div className="confidence-bar-wrap">
                        <div className="confidence-bar-label">
                            <span>{t('analyses.aiConfidence')}</span>
                            <span>{confidence}</span>
                        </div>
                        <div className="confidence-bar-track">
                            <div className={`confidence-bar-fill ${isHealthy ? 'confidence-bar-fill--healthy' : 'confidence-bar-fill--infected'}`}
                                 style={{ width: `${analysis.confidence ? analysis.confidence * 100 : 0}%` }} />
                        </div>
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn btn--secondary" onClick={onClose}>{t('common.close')}</button>
                </div>
            </div>
        </div>
    );
}

function DeleteModal({ analysis, onConfirm, onCancel, deleting, t }) {
    if (!analysis) return null;
    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-box modal-box--sm" onClick={e => e.stopPropagation()}>
                <div className="modal-warn-icon"><AlertTriangle size={26} color="var(--red)" strokeWidth={1.8} /></div>
                <h3 className="modal-warn-title">{t('analyses.deleteTitle')}</h3>
                <p className="modal-warn-desc">{t('analyses.deleteDesc')} <strong>{analysis.analysis_key}</strong>? {t('analyses.deleteWarn')}</p>
                <div className="modal-warn-actions">
                    <button className="btn btn--secondary" onClick={onCancel}>{t('common.cancel')}</button>
                    <button className="btn btn--danger" onClick={onConfirm} disabled={deleting}>{deleting ? 'Deleting…' : t('common.delete')}</button>
                </div>
            </div>
        </div>
    );
}

export default function AnalysisHistory() {
    const location   = useLocation();
    const navigate   = useNavigate();
    const { t }      = useLang();
    const userFilter = location.state?.userId   || null;
    const userName   = location.state?.userName || null;

    const [analyses, setAnalyses] = useState([]);
    const [loading,  setLoading]  = useState(true);
    const [search,   setSearch]   = useState('');
    const [filter,   setFilter]   = useState('ALL');
    const [sortKey,  setSortKey]  = useState('id');
    const [sortDir,  setSortDir]  = useState('desc');
    const [modal,    setModal]    = useState(null);
    const [selected, setSelected] = useState(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => { loadAnalyses(); }, []);

    const loadAnalyses = async () => {
        try {
            const res = await analysesAPI.getAll();
            setAnalyses(res.data);
        } catch (err) {
            console.error('Load analyses error:', err);
        } finally {
            setLoading(false);
        }
    };

    const filtered = analyses
        .filter(a => {
            const q = search.toLowerCase();
            const plantName   = a.plant_name   || a.plant?.name   || '';
            const diseaseName = a.disease_name || a.disease?.name || '';
            const matchSearch = (a.analysis_key || '').toLowerCase().includes(q) ||
                plantName.toLowerCase().includes(q) ||
                diseaseName.toLowerCase().includes(q);
            const matchFilter =
                filter === 'ALL'      ? true :
                    filter === 'HEALTHY'  ? a.result_label === 'HEALTHY' :
                        filter === 'INFECTED' ? a.result_label === 'INFECTED' : true;
            const matchUser = userFilter ? a.user_id === userFilter : true;
            return matchSearch && matchFilter && matchUser;
        })
        .sort((a, b) => {
            let av = a[sortKey], bv = b[sortKey];
            if (sortKey === 'plant')      { av = a.plant_name || ''; bv = b.plant_name || ''; }
            if (sortKey === 'disease')    { av = a.disease_name || ''; bv = b.disease_name || ''; }
            if (sortKey === 'confidence') { av = a.confidence || 0; bv = b.confidence || 0; }
            if (typeof av === 'number') return sortDir === 'asc' ? av - bv : bv - av;
            return sortDir === 'asc' ? String(av||'').localeCompare(String(bv||'')) : String(bv||'').localeCompare(String(av||''));
        });

    const toggleSort = key => {
        if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortKey(key); setSortDir('asc'); }
    };

    const SortIcon = ({ col }) => sortKey !== col
        ? <ChevronUp size={12} style={{ opacity: 0.25 }} />
        : sortDir === 'asc' ? <ChevronUp size={12} color="var(--green-light)" /> : <ChevronDown size={12} color="var(--green-light)" />;

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await analysesAPI.delete(selected.id);
            setAnalyses(p => p.filter(a => a.id !== selected.id));
            setModal(null); setSelected(null);
        } catch (err) {
            console.error('Delete error:', err);
        } finally {
            setDeleting(false);
        }
    };

    const handleExport = async () => {
        try {
            const res = await analysesAPI.exportPdf();
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a   = document.createElement('a');
            a.href    = url;
            a.download = 'analyses_report.pdf';
            a.click();
        } catch (err) {
            console.error('Export error:', err);
        }
    };

    const healthyCount  = analyses.filter(a => a.result_label === 'HEALTHY').length;
    const infectedCount = analyses.filter(a => a.result_label === 'INFECTED').length;

    if (loading) return <div className="dash-loading">Loading analyses...</div>;

    return (
        <div className="analysis-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">{t('analyses.title')}</h1>
                    <p className="page-subtitle">{t('analyses.subtitle')}</p>
                </div>
                <button className="btn btn--primary" onClick={handleExport}>
                    <Download size={16} strokeWidth={1.8} /> {t('analyses.exportBtn')}
                </button>
            </div>

            {userFilter && (
                <div className="user-filter-banner">
                    <UserCircle size={16} strokeWidth={1.8} />
                    <span>{t('analyses.showingFor')} <strong>{userName}</strong></span>
                    <button className="user-filter-clear" onClick={() => navigate('/analyses', { replace: true })}>
                        {t('analyses.clearFilter')}
                    </button>
                </div>
            )}

            <div className="analysis-stats">
                <div className="analysis-stat"><span className="analysis-stat-val">{analyses.length}</span><span className="analysis-stat-label">{t('common.total')}</span></div>
                <div className="analysis-stat analysis-stat--healthy"><span className="analysis-stat-val">{healthyCount}</span><span className="analysis-stat-label">{t('analyses.healthy')}</span></div>
                <div className="analysis-stat analysis-stat--infected"><span className="analysis-stat-val">{infectedCount}</span><span className="analysis-stat-label">{t('analyses.infected')}</span></div>
            </div>

            <div className="dis-filters">
                <div className="dis-search">
                    <Search size={15} color="var(--text-muted)" strokeWidth={1.8} />
                    <input className="dis-search-input" placeholder={t('analyses.searchPlaceholder')}
                           value={search} onChange={e => setSearch(e.target.value)} />
                    {search && <button className="dis-search-clear" onClick={() => setSearch('')}><X size={14} strokeWidth={2} /></button>}
                </div>
                <div className="filter-tabs">
                    {[{ val:'ALL', label:t('analyses.allResults') }, { val:'HEALTHY', label:t('analyses.healthy') }, { val:'INFECTED', label:t('analyses.infected') }].map(f => (
                        <button key={f.val} className={`filter-tab ${filter === f.val ? 'filter-tab--active' : ''}`} onClick={() => setFilter(f.val)}>{f.label}</button>
                    ))}
                </div>
                <span className="dis-count">{filtered.length} {t('analyses.results')}</span>
            </div>

            <div className="dis-card">
                <div className="dis-table-wrap">
                    <table className="dis-table">
                        <thead>
                        <tr>
                            <th className="sortable" onClick={() => toggleSort('analysis_key')}>{t('analyses.id')} <SortIcon col="analysis_key" /></th>
                            <th className="sortable" onClick={() => toggleSort('plant')}>{t('analyses.plant')} <SortIcon col="plant" /></th>
                            <th className="sortable" onClick={() => toggleSort('disease')}>{t('analyses.disease')} <SortIcon col="disease" /></th>
                            <th className="sortable" onClick={() => toggleSort('confidence')}>{t('analyses.confidence')} <SortIcon col="confidence" /></th>
                            <th className="sortable" onClick={() => toggleSort('created_at')}>{t('common.date')} <SortIcon col="created_at" /></th>
                            <th className="sortable" onClick={() => toggleSort('result_label')}>{t('analyses.result')} <SortIcon col="result_label" /></th>
                            <th>{t('common.actions')}</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filtered.length === 0 ? (
                            <tr><td colSpan={7}>
                                <div className="dis-empty">
                                    <div className="dis-empty-icon">🔬</div>
                                    <div className="dis-empty-title">{t('analyses.noAnalyses')}</div>
                                    <div className="dis-empty-sub">{t('analyses.noAnalysesSub')}</div>
                                </div>
                            </td></tr>
                        ) : filtered.map(a => (
                            <tr key={a.id} className="dis-row" onClick={() => { setSelected(a); setModal('detail'); }}>
                                <td className="analysis-key">{a.analysis_key}</td>
                                <td className="dis-name">{a.plant_name || a.plant?.name || '—'}</td>
                                <td className="analysis-disease">{a.disease_name || a.disease?.name || <span className="analysis-healthy-dash">—</span>}</td>
                                <td className="analysis-confidence">{a.confidence ? `${(a.confidence * 100).toFixed(1)}%` : '—'}</td>
                                <td className="analysis-date">{a.created_at?.slice(0,10)}</td>
                                <td><ResultBadge result={a.result_label} t={t} /></td>
                                <td onClick={e => e.stopPropagation()}>
                                    <div className="dis-actions">
                                        <button className="dis-action-btn dis-action-btn--edit" onClick={() => { setSelected(a); setModal('detail'); }} title="View"><Eye size={15} strokeWidth={1.8} /></button>
                                        <button className="dis-action-btn dis-action-btn--delete" onClick={() => { setSelected(a); setModal('delete'); }} title="Delete"><Trash2 size={15} strokeWidth={1.8} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {modal === 'detail' && <DetailModal analysis={selected} t={t} onClose={() => { setModal(null); setSelected(null); }} />}
            {modal === 'delete' && <DeleteModal analysis={selected} t={t} onConfirm={handleDelete} onCancel={() => { setModal(null); setSelected(null); }} deleting={deleting} />}
        </div>
    );
}
