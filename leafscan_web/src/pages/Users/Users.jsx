import { useState } from 'react';
import {
    Search, X, Trash2, Pencil, Plus,
    ChevronUp, ChevronDown, AlertTriangle,
    UserCircle, Mail, Shield, FlaskConical, Leaf
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../../context/LanguageContext';
import './Users.css';

const MOCK_USERS = [
    { id: 1, name: 'John Doe',      email: 'john@leafscan.ai',  role: 'ADMIN', status: 'ACTIVE',   created: '2026-01-15' },
    { id: 2, name: 'Jane Smith',    email: 'jane@leafscan.ai',  role: 'USER',  status: 'ACTIVE',   created: '2026-01-20' },
    { id: 3, name: 'Mark Johnson',  email: 'mark@leafscan.ai',  role: 'USER',  status: 'INACTIVE', created: '2026-02-01' },
    { id: 4, name: 'Sara Williams', email: 'sara@leafscan.ai',  role: 'USER',  status: 'ACTIVE',   created: '2026-02-14' },
    { id: 5, name: 'Tom Brown',     email: 'tom@leafscan.ai',   role: 'USER',  status: 'ACTIVE',   created: '2026-02-28' },
    { id: 6, name: 'Ana Petrov',    email: 'ana@leafscan.ai',   role: 'ADMIN', status: 'ACTIVE',   created: '2026-03-05' },
    { id: 7, name: 'Ivan Stojan',   email: 'ivan@leafscan.ai',  role: 'USER',  status: 'INACTIVE', created: '2026-03-12' },
    { id: 8, name: 'Maja Hristos',  email: 'maja@leafscan.ai',  role: 'USER',  status: 'ACTIVE',   created: '2026-03-20' },
];

const ROLE_OPTIONS   = ['ADMIN', 'USER'];
const STATUS_OPTIONS = ['ACTIVE', 'INACTIVE'];
const EMPTY_FORM     = { name: '', email: '', role: 'USER', status: 'ACTIVE' };

const USER_ANALYSES = [
    { id: 1,  key: 'AN-2847', userId: 1, plant: 'Tomato',     disease: 'Leaf Blight',    confidence: 94.2, result: 'INFECTED', date: '2026-05-07' },
    { id: 2,  key: 'AN-2846', userId: 2, plant: 'Potato',     disease: null,             confidence: 98.1, result: 'HEALTHY',  date: '2026-05-07' },
    { id: 3,  key: 'AN-2845', userId: 1, plant: 'Corn',       disease: 'Rust Disease',   confidence: 87.5, result: 'INFECTED', date: '2026-05-06' },
    { id: 4,  key: 'AN-2844', userId: 3, plant: 'Grape',      disease: 'Powdery Mildew', confidence: 91.3, result: 'INFECTED', date: '2026-05-06' },
    { id: 5,  key: 'AN-2843', userId: 2, plant: 'Apple',      disease: null,             confidence: 96.7, result: 'HEALTHY',  date: '2026-05-05' },
    { id: 6,  key: 'AN-2842', userId: 4, plant: 'Basil',      disease: 'Root Rot',       confidence: 88.4, result: 'INFECTED', date: '2026-05-05' },
    { id: 7,  key: 'AN-2841', userId: 1, plant: 'Sunflower',  disease: null,             confidence: 99.1, result: 'HEALTHY',  date: '2026-05-04' },
    { id: 8,  key: 'AN-2840', userId: 3, plant: 'Pepper',     disease: 'Mosaic Virus',   confidence: 83.6, result: 'INFECTED', date: '2026-05-04' },
    { id: 9,  key: 'AN-2839', userId: 5, plant: 'Rose',       disease: 'Bacterial Spot', confidence: 90.2, result: 'INFECTED', date: '2026-05-03' },
    { id: 10, key: 'AN-2838', userId: 2, plant: 'Cucumber',   disease: null,             confidence: 97.8, result: 'HEALTHY',  date: '2026-05-03' },
    { id: 11, key: 'AN-2837', userId: 4, plant: 'Wheat',      disease: 'Leaf Blight',    confidence: 85.3, result: 'INFECTED', date: '2026-05-02' },
    { id: 12, key: 'AN-2836', userId: 5, plant: 'Strawberry', disease: null,             confidence: 95.5, result: 'HEALTHY',  date: '2026-05-01' },
];

// ── Badges ────────────────────────────────────────────────────────────────────
function RoleBadge({ role, t }) {
    const label = role === 'ADMIN' ? t('users.admin') : t('users.user');
    return (
        <span className={`role-badge ${role === 'ADMIN' ? 'role-badge--admin' : 'role-badge--user'}`}>
            {label}
        </span>
    );
}

function StatusBadge({ status, t }) {
    const label = status === 'ACTIVE' ? t('users.active') : t('users.inactive');
    return (
        <span className={`status-badge ${status === 'ACTIVE' ? 'status-badge--active' : 'status-badge--inactive'}`}>
            {label}
        </span>
    );
}

// ── Detail modal ──────────────────────────────────────────────────────────────
function DetailModal({ user, onEdit, onClose, t }) {
    if (!user) return null;
    const initial = user.name?.[0]?.toUpperCase() || 'U';
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="modal-header-left">
                        <div className="modal-avatar">{initial}</div>
                        <div>
                            <h3 className="modal-title">{user.name}</h3>
                            <div className="modal-meta">
                                <RoleBadge role={user.role} t={t} />
                                <span className="modal-dot">·</span>
                                <StatusBadge status={user.status} t={t} />
                            </div>
                        </div>
                    </div>
                    <button className="modal-close" onClick={onClose}>
                        <X size={18} strokeWidth={2} />
                    </button>
                </div>
                <div className="modal-body">
                    <div className="detail-row">
                        <div className="detail-item">
                            <div className="detail-label"><Mail size={13} strokeWidth={1.8} /> {t('common.email')}</div>
                            <div className="detail-value">{user.email}</div>
                        </div>
                        <div className="detail-item">
                            <div className="detail-label"><Shield size={13} strokeWidth={1.8} /> {t('users.role')}</div>
                            <div className="detail-value"><RoleBadge role={user.role} t={t} /></div>
                        </div>
                    </div>
                    <div className="detail-row">
                        <div className="detail-item">
                            <div className="detail-label"><UserCircle size={13} strokeWidth={1.8} /> {t('common.status')}</div>
                            <div className="detail-value"><StatusBadge status={user.status} t={t} /></div>
                        </div>
                        <div className="detail-item">
                            <div className="detail-label">📅 {t('users.joined')}</div>
                            <div className="detail-value">{user.created}</div>
                        </div>
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn btn--secondary" onClick={onClose}>{t('common.close')}</button>
                    <button className="btn btn--primary" onClick={() => onEdit(user)}>
                        <Pencil size={14} strokeWidth={1.8} /> {t('common.edit')}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Form modal ────────────────────────────────────────────────────────────────
function FormModal({ user, onSave, onClose, t }) {
    const isEdit = !!user?.id;
    const [form, setForm] = useState(
        isEdit
            ? { name: user.name, email: user.email, role: user.role, status: user.status }
            : { ...EMPTY_FORM }
    );
    const [errors, setErrors] = useState({});
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const validate = () => {
        const e = {};
        if (!form.name.trim())  e.name  = t('common.name') + ' is required';
        if (!form.email.trim()) e.email = t('common.email') + ' is required';
        else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email format';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">{isEdit ? t('users.title') : t('users.addBtn')}</h3>
                    <button className="modal-close" onClick={onClose}><X size={18} strokeWidth={2} /></button>
                </div>
                <div className="modal-body">
                    <div className="form-field">
                        <label className="form-label">{t('profile.fullName')} *</label>
                        <input className={`form-input ${errors.name ? 'form-input--error' : ''}`}
                               value={form.name} onChange={e => set('name', e.target.value)}
                               placeholder="e.g. John Doe" />
                        {errors.name && <span className="form-error">{errors.name}</span>}
                    </div>
                    <div className="form-field">
                        <label className="form-label">{t('common.email')} *</label>
                        <input className={`form-input ${errors.email ? 'form-input--error' : ''}`}
                               type="email" value={form.email} onChange={e => set('email', e.target.value)}
                               placeholder="e.g. john@leafscan.ai" />
                        {errors.email && <span className="form-error">{errors.email}</span>}
                    </div>
                    <div className="form-row">
                        <div className="form-field">
                            <label className="form-label">{t('users.role')} *</label>
                            <select className="form-input" value={form.role} onChange={e => set('role', e.target.value)}>
                                {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                        <div className="form-field">
                            <label className="form-label">{t('common.status')} *</label>
                            <select className="form-input" value={form.status} onChange={e => set('status', e.target.value)}>
                                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                    {!isEdit && (
                        <div className="form-field">
                            <label className="form-label">{t('login.passwordLabel')} *</label>
                            <input className="form-input" type="password" placeholder="Temporary password" />
                            <span className="form-hint">User will be asked to change on first login.</span>
                        </div>
                    )}
                </div>
                <div className="modal-footer">
                    <button className="btn btn--secondary" onClick={onClose}>{t('common.cancel')}</button>
                    <button className="btn btn--primary" onClick={() => {
                        if (validate()) onSave({ ...user, ...form });
                    }}>
                        {isEdit ? t('common.save') : t('users.addBtn')}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Analyses modal ────────────────────────────────────────────────────────────
function AnalysesModal({ user, onClose, t }) {
    if (!user) return null;
    const analyses = USER_ANALYSES.filter(a => a.userId === user.id);
    const initial  = user.name?.[0]?.toUpperCase() || 'U';

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box modal-box--wide" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="modal-header-left">
                        <div className="modal-avatar">{initial}</div>
                        <div>
                            <h3 className="modal-title">{user.name}</h3>
                            <p className="modal-analyses-sub">{analyses.length} {t('users.analyses')}</p>
                        </div>
                    </div>
                    <button className="modal-close" onClick={onClose}>
                        <X size={18} strokeWidth={2} />
                    </button>
                </div>

                <div className="modal-body modal-body--nopad">
                    {analyses.length === 0 ? (
                        <div className="analyses-empty">
                            <FlaskConical size={36} color="var(--text-muted)" strokeWidth={1.5} />
                            <div className="analyses-empty-title">{t('analyses.noAnalyses')}</div>
                            <div className="analyses-empty-sub">{t('analyses.noAnalysesSub')}</div>
                        </div>
                    ) : (
                        <table className="analyses-table">
                            <thead>
                            <tr>
                                <th>{t('analyses.id')}</th>
                                <th>{t('analyses.plant')}</th>
                                <th>{t('analyses.disease')}</th>
                                <th>{t('analyses.confidence')}</th>
                                <th>{t('common.date')}</th>
                                <th>{t('analyses.result')}</th>
                            </tr>
                            </thead>
                            <tbody>
                            {analyses.map(a => (
                                <tr key={a.id}>
                                    <td className="a-key">{a.key}</td>
                                    <td className="a-plant">
                                        <div className="a-plant-cell">
                                            <Leaf size={13} strokeWidth={1.8} color="var(--green-light)" />
                                            {a.plant}
                                        </div>
                                    </td>
                                    <td className="a-disease">{a.disease || '—'}</td>
                                    <td className="a-confidence">{a.confidence}%</td>
                                    <td className="a-date">{a.date}</td>
                                    <td>
                                            <span className={`a-badge ${a.result === 'HEALTHY' ? 'a-badge--healthy' : 'a-badge--infected'}`}>
                                                {a.result === 'HEALTHY' ? t('analyses.healthy') : t('analyses.infected')}
                                            </span>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="modal-footer">
                    <button className="btn btn--secondary" onClick={onClose}>{t('common.close')}</button>
                </div>
            </div>
        </div>
    );
}

// ── Delete modal ──────────────────────────────────────────────────────────────
function DeleteModal({ user, onConfirm, onCancel, t }) {
    if (!user) return null;
    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-box modal-box--sm" onClick={e => e.stopPropagation()}>
                <div className="modal-warn-icon">
                    <AlertTriangle size={26} color="var(--red)" strokeWidth={1.8} />
                </div>
                <h3 className="modal-warn-title">{t('users.deleteTitle')}</h3>
                <p className="modal-warn-desc">
                    {t('users.deleteDesc')} <strong>{user.name}</strong>? {t('users.deleteWarn')}
                </p>
                <div className="modal-warn-actions">
                    <button className="btn btn--secondary" onClick={onCancel}>{t('common.cancel')}</button>
                    <button className="btn btn--danger" onClick={onConfirm}>{t('common.delete')}</button>
                </div>
            </div>
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Users() {
    const navigate   = useNavigate();
    const { t }      = useLang();
    const [users,    setUsers]    = useState(MOCK_USERS);
    const [search,   setSearch]   = useState('');
    const [filter,   setFilter]   = useState('ALL');
    const [sortKey,  setSortKey]  = useState('id');
    const [sortDir,  setSortDir]  = useState('asc');
    const [modal,    setModal]    = useState(null);
    const [selected, setSelected] = useState(null);

    const filtered = users
        .filter(u => {
            const q = search.toLowerCase();
            const matchSearch = u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
            const matchFilter =
                filter === 'ALL'      ? true :
                    filter === 'ADMIN'    ? u.role   === 'ADMIN'    :
                        filter === 'ACTIVE'   ? u.status === 'ACTIVE'   :
                            filter === 'INACTIVE' ? u.status === 'INACTIVE' : true;
            return matchSearch && matchFilter;
        })
        .sort((a, b) => {
            const av = a[sortKey], bv = b[sortKey];
            if (typeof av === 'number') return sortDir === 'asc' ? av - bv : bv - av;
            return sortDir === 'asc'
                ? String(av).localeCompare(String(bv))
                : String(bv).localeCompare(String(av));
        });

    const toggleSort = key => {
        if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortKey(key); setSortDir('asc'); }
    };

    const SortIcon = ({ col }) => sortKey !== col
        ? <ChevronUp size={12} style={{ opacity: 0.25 }} />
        : sortDir === 'asc'
            ? <ChevronUp size={12} color="var(--green-light)" />
            : <ChevronDown size={12} color="var(--green-light)" />;

    const handleViewAnalyses = (user) => {
        setModal(null); setSelected(null);
        navigate('/analyses', { state: { userId: user.id, userName: user.name } });
    };

    const handleSave = data => {
        if (data.id) setUsers(p => p.map(u => u.id === data.id ? { ...u, ...data } : u));
        else setUsers(p => [...p, { ...data, id: Date.now(), created: new Date().toISOString().slice(0, 10) }]);
        setModal(null); setSelected(null);
    };

    const handleDelete = () => {
        setUsers(p => p.filter(u => u.id !== selected.id));
        setModal(null); setSelected(null);
    };

    const activeCount = users.filter(u => u.status === 'ACTIVE').length;
    const adminCount  = users.filter(u => u.role   === 'ADMIN').length;

    return (
        <div className="users-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">{t('users.title')}</h1>
                    <p className="page-subtitle">{t('users.subtitle')}</p>
                </div>
                <button className="btn btn--primary" onClick={() => { setSelected(null); setModal('form'); }}>
                    <Plus size={16} strokeWidth={2.2} /> {t('users.addBtn')}
                </button>
            </div>

            <div className="analysis-stats">
                <div className="analysis-stat">
                    <span className="analysis-stat-val">{users.length}</span>
                    <span className="analysis-stat-label">{t('common.total')}</span>
                </div>
                <div className="analysis-stat analysis-stat--healthy">
                    <span className="analysis-stat-val">{activeCount}</span>
                    <span className="analysis-stat-label">{t('users.activeUsers')}</span>
                </div>
                <div className="analysis-stat analysis-stat--admin">
                    <span className="analysis-stat-val">{adminCount}</span>
                    <span className="analysis-stat-label">{t('users.admins')}</span>
                </div>
            </div>

            <div className="dis-filters">
                <div className="dis-search">
                    <Search size={15} color="var(--text-muted)" strokeWidth={1.8} />
                    <input className="dis-search-input" placeholder={t('users.searchPlaceholder')}
                           value={search} onChange={e => setSearch(e.target.value)} />
                    {search && (
                        <button className="dis-search-clear" onClick={() => setSearch('')}>
                            <X size={14} strokeWidth={2} />
                        </button>
                    )}
                </div>
                <div className="filter-tabs">
                    {[
                        { val: 'ALL',      label: t('users.allUsers')      },
                        { val: 'ACTIVE',   label: t('users.activeUsers')   },
                        { val: 'INACTIVE', label: t('users.inactiveUsers') },
                        { val: 'ADMIN',    label: t('users.admins')        },
                    ].map(f => (
                        <button key={f.val}
                                className={`filter-tab ${filter === f.val ? 'filter-tab--active' : ''}`}
                                onClick={() => setFilter(f.val)}>
                            {f.label}
                        </button>
                    ))}
                </div>
                <span className="dis-count">{filtered.length} {t('analyses.results')}</span>
            </div>

            <div className="dis-card">
                <div className="dis-table-wrap">
                    <table className="dis-table">
                        <thead>
                        <tr>
                            <th className="sortable" onClick={() => toggleSort('id')}>ID <SortIcon col="id" /></th>
                            <th className="sortable" onClick={() => toggleSort('name')}>{t('common.name')} <SortIcon col="name" /></th>
                            <th className="sortable" onClick={() => toggleSort('email')}>{t('common.email')} <SortIcon col="email" /></th>
                            <th className="sortable" onClick={() => toggleSort('role')}>{t('users.role')} <SortIcon col="role" /></th>
                            <th className="sortable" onClick={() => toggleSort('status')}>{t('common.status')} <SortIcon col="status" /></th>
                            <th className="sortable" onClick={() => toggleSort('created')}>{t('users.joined')} <SortIcon col="created" /></th>
                            <th>{t('common.actions')}</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filtered.length === 0 ? (
                            <tr><td colSpan={7}>
                                <div className="dis-empty">
                                    <div className="dis-empty-icon">👤</div>
                                    <div className="dis-empty-title">{t('users.noUsersTitle')}</div>
                                    <div className="dis-empty-sub">{t('users.noUsersSub')}</div>
                                </div>
                            </td></tr>
                        ) : filtered.map(u => (
                            <tr key={u.id} className="dis-row" onClick={() => { setSelected(u); setModal('detail'); }}>
                                <td className="user-id">#{u.id}</td>
                                <td>
                                    <div className="user-name-cell">
                                        <div className="user-avatar-sm">{u.name[0]}</div>
                                        <span className="dis-name">{u.name}</span>
                                    </div>
                                </td>
                                <td className="user-email">{u.email}</td>
                                <td><RoleBadge role={u.role} t={t} /></td>
                                <td><StatusBadge status={u.status} t={t} /></td>
                                <td className="user-date">{u.created}</td>
                                <td onClick={e => e.stopPropagation()}>
                                    <div className="dis-actions">
                                        <button className="dis-action-btn dis-action-btn--analyses"
                                                onClick={() => { setSelected(u); setModal('analyses'); }}
                                                title={t('users.viewAnalyses')}>
                                            <FlaskConical size={15} strokeWidth={1.8} />
                                        </button>
                                        <button className="dis-action-btn dis-action-btn--edit"
                                                onClick={() => { setSelected(u); setModal('form'); }}
                                                title={t('common.edit')}>
                                            <Pencil size={15} strokeWidth={1.8} />
                                        </button>
                                        <button className="dis-action-btn dis-action-btn--delete"
                                                onClick={() => { setSelected(u); setModal('delete'); }}
                                                title={t('common.delete')}>
                                            <Trash2 size={15} strokeWidth={1.8} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {modal === 'analyses' && <AnalysesModal user={selected} t={t} onClose={() => { setModal(null); setSelected(null); }} />}
            {modal === 'detail'   && <DetailModal   user={selected} t={t} onEdit={u => { setSelected(u); setModal('form'); }} onClose={() => { setModal(null); setSelected(null); }} onViewAnalyses={handleViewAnalyses} />}
            {modal === 'form'     && <FormModal     user={selected} t={t} onSave={handleSave} onClose={() => { setModal(null); setSelected(null); }} />}
            {modal === 'delete'   && <DeleteModal   user={selected} t={t} onConfirm={handleDelete} onCancel={() => { setModal(null); setSelected(null); }} />}
        </div>
    );
}