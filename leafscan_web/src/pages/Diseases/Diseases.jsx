import { useState } from 'react';
import {
    Plus, Search, Pencil, Trash2,
    ChevronUp, ChevronDown, X, AlertTriangle,
    Leaf, Thermometer, FileText, Activity
} from 'lucide-react';
import { useLang } from '../../context/LanguageContext';
import './Diseases.css';

// ── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_DISEASES = [
    {
        id: 1, name: 'Early Blight', category: 'FUNGAL', severity: 'MEDIUM',
        description: 'Early blight is a common fungal disease caused by Alternaria solani. It primarily affects tomatoes and potatoes, causing significant yield loss if left untreated.',
        symptoms: 'Dark brown spots with concentric rings on older leaves. Yellowing around the spots followed by leaf drop. Stems may show dark lesions near soil level.',
    },
    {
        id: 2, name: 'Powdery Mildew', category: 'FUNGAL', severity: 'LOW',
        description: 'Powdery mildew is a fungal disease appearing as white or grey powdery spots on leaf surfaces. It thrives in warm, dry conditions with high humidity at night.',
        symptoms: 'White powdery coating on leaf surfaces. Leaves may curl, yellow and drop prematurely. Affects young shoots and buds.',
    },
    {
        id: 3, name: 'Root Rot', category: 'FUNGAL', severity: 'HIGH',
        description: 'Root rot is caused by overwatering and poor drainage, leading to fungal infection of the root system. It can kill plants quickly if not treated.',
        symptoms: 'Wilting despite adequate moisture. Yellowing leaves, stunted growth, dark mushy roots. Plant collapse in severe cases.',
    },
    {
        id: 4, name: 'Rust Disease', category: 'FUNGAL', severity: 'MEDIUM',
        description: 'Rust is a fungal disease causing orange or brown pustules on leaf undersides. It spreads rapidly in moist, cool conditions via wind-dispersed spores.',
        symptoms: 'Orange, yellow or brown powdery pustules on leaf undersides. Premature leaf drop and reduced plant vigour.',
    },
    {
        id: 5, name: 'Bacterial Blight', category: 'BACTERIAL', severity: 'HIGH',
        description: 'Bacterial blight is caused by Pseudomonas syringae and affects a wide range of plants. It spreads rapidly in cool, wet conditions.',
        symptoms: 'Water-soaked lesions that turn brown. Dark streaks on stems. Wilting of shoots and blossoms in spring.',
    },
    {
        id: 6, name: 'Mosaic Virus', category: 'VIRAL', severity: 'MEDIUM',
        description: 'Mosaic virus is a plant disease caused by various viruses that create mosaic-like patterns on leaves. It is spread by aphids and infected tools.',
        symptoms: 'Mosaic pattern of light and dark green on leaves. Leaf distortion, curling, and stunted growth. Reduced fruit quality.',
    },
];

const SEVERITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH'];
const CATEGORY_OPTIONS = ['FUNGAL', 'BACTERIAL', 'VIRAL', 'OTHER'];
const EMPTY_FORM = { name: '', category: 'FUNGAL', severity: 'MEDIUM', description: '', symptoms: '', image: null, image_description: '' };

// ── Severity badge ────────────────────────────────────────────────────────────
function SeverityBadge({ severity, t }) {
    const cls = { LOW: 'badge--low', MEDIUM: 'badge--medium', HIGH: 'badge--high' };
    const labels = {
        LOW:    t('diseases.low'),
        MEDIUM: t('diseases.medium'),
        HIGH:   t('diseases.high'),
    };
    return <span className={`sev-badge ${cls[severity] || ''}`}>{labels[severity] || severity}</span>;
}

// ── Detail modal ──────────────────────────────────────────────────────────────
function DetailModal({ disease, onEdit, onClose, t }) {
    if (!disease) return null;
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="modal-header-left">
                        <div className="modal-disease-icon">
                            <Leaf size={20} strokeWidth={1.8} color="var(--green-light)" />
                        </div>
                        <div>
                            <h3 className="modal-title">{disease.name}</h3>
                            <div className="modal-meta">
                                <span className="modal-category">{disease.category}</span>
                                <span className="modal-dot">·</span>
                                <SeverityBadge severity={disease.severity} t={t} />
                            </div>
                        </div>
                    </div>
                    <button className="modal-close" onClick={onClose}>
                        <X size={18} strokeWidth={2} />
                    </button>
                </div>

                <div className="modal-body">
                    <div className="detail-section">
                        <div className="detail-section-title">
                            <FileText size={14} strokeWidth={1.8} />
                            {t('common.name')}
                        </div>
                        <p className="detail-text">{disease.description}</p>
                    </div>
                    <div className="detail-section">
                        <div className="detail-section-title">
                            <Activity size={14} strokeWidth={1.8} />
                            {t('diseases.symptoms')}
                        </div>
                        <p className="detail-text">{disease.symptoms}</p>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn btn--secondary" onClick={onClose}>{t('common.close')}</button>
                    <button className="btn btn--primary" onClick={() => onEdit(disease)}>
                        <Pencil size={14} strokeWidth={1.8} /> {t('common.edit')}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Add / Edit modal ──────────────────────────────────────────────────────────
function FormModal({ disease, onSave, onClose, t }) {
    const isEdit = !!disease?.id;
    const [form, setForm] = useState(
        isEdit
            ? { name: disease.name, category: disease.category, severity: disease.severity,
                description: disease.description, symptoms: disease.symptoms,
                image: disease.image || null, image_description: disease.image_description || '' }
            : { ...EMPTY_FORM }
    );
    const [preview, setPreview] = useState(isEdit ? disease.image : null);
    const [errors,  setErrors]  = useState({});
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        set('image', file);
        setPreview(URL.createObjectURL(file));
    };

    const removeImage = () => {
        set('image', null);
        setPreview(null);
    };

    const validate = () => {
        const e = {};
        if (!form.name.trim())        e.name        = t('diseases.diseaseName') + ' *';
        if (!form.description.trim()) e.description = t('common.name') + ' *';
        if (!form.symptoms.trim())    e.symptoms    = t('diseases.symptoms') + ' *';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSave = () => { if (validate()) onSave({ ...disease, ...form }); };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">{isEdit ? t('diseases.editTitle') : t('diseases.addTitle')}</h3>
                    <button className="modal-close" onClick={onClose}><X size={18} strokeWidth={2} /></button>
                </div>
                <div className="modal-body">
                    <div className="form-field">
                        <label className="form-label">{t('diseases.diseaseName')} *</label>
                        <input className={`form-input ${errors.name ? 'form-input--error' : ''}`}
                               value={form.name} onChange={e => set('name', e.target.value)}
                               placeholder="e.g. Leaf Blight" />
                        {errors.name && <span className="form-error">{errors.name}</span>}
                    </div>

                    <div className="form-row">
                        <div className="form-field">
                            <label className="form-label">{t('diseases.diseaseCategory')}</label>
                            <select className="form-input" value={form.category} onChange={e => set('category', e.target.value)}>
                                {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="form-field">
                            <label className="form-label">{t('diseases.severity')}</label>
                            <select className="form-input" value={form.severity} onChange={e => set('severity', e.target.value)}>
                                {SEVERITY_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="form-field">
                        <label className="form-label">{t('common.name')} *</label>
                        <textarea className={`form-input form-textarea ${errors.description ? 'form-input--error' : ''}`}
                                  value={form.description} onChange={e => set('description', e.target.value)} rows={3} />
                        {errors.description && <span className="form-error">{errors.description}</span>}
                    </div>

                    <div className="form-field">
                        <label className="form-label">{t('diseases.symptoms')} *</label>
                        <textarea className={`form-input form-textarea ${errors.symptoms ? 'form-input--error' : ''}`}
                                  value={form.symptoms} onChange={e => set('symptoms', e.target.value)} rows={3} />
                        {errors.symptoms && <span className="form-error">{errors.symptoms}</span>}
                    </div>

                    <div className="form-field">
                        <label className="form-label">
                            {t('diseases.affectedPlants')} <span className="form-optional">({t('diseases.optional')})</span>
                        </label>
                        {preview ? (
                            <div className="img-preview-wrap">
                                <img src={preview} alt="preview" className="img-preview" />
                                <button className="img-remove" onClick={removeImage}>
                                    <X size={13} strokeWidth={2} /> {t('common.delete')}
                                </button>
                            </div>
                        ) : (
                            <label className="img-upload-zone">
                                <input type="file" accept="image/*" className="img-upload-input" onChange={handleImageChange} />
                                <span className="img-upload-icon">🖼️</span>
                                <span className="img-upload-text">Click to upload image</span>
                                <span className="img-upload-sub">PNG, JPG up to 5MB</span>
                            </label>
                        )}
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn btn--secondary" onClick={onClose}>{t('common.cancel')}</button>
                    <button className="btn btn--primary" onClick={handleSave}>{t('common.save')}</button>
                </div>
            </div>
        </div>
    );
}

// ── Delete modal ──────────────────────────────────────────────────────────────
function DeleteModal({ disease, onConfirm, onCancel, t }) {
    if (!disease) return null;
    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-box modal-box--sm" onClick={e => e.stopPropagation()}>
                <div className="modal-warn-icon">
                    <AlertTriangle size={26} color="var(--red)" strokeWidth={1.8} />
                </div>
                <h3 className="modal-warn-title">{t('diseases.deleteTitle')}</h3>
                <p className="modal-warn-desc">
                    {t('diseases.deleteDesc')} <strong>{disease.name}</strong>? {t('diseases.deleteWarn')}
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
export default function Diseases() {
    const { t } = useLang();
    const [diseases,   setDiseases]   = useState(MOCK_DISEASES);
    const [search,     setSearch]     = useState('');
    const [filterSev,  setFilterSev]  = useState('ALL');
    const [filterCat,  setFilterCat]  = useState('ALL');
    const [sortKey,    setSortKey]    = useState('name');
    const [sortDir,    setSortDir]    = useState('asc');
    const [modal,      setModal]      = useState(null);
    const [selected,   setSelected]   = useState(null);

    const filtered = diseases
        .filter(d => {
            const q = search.toLowerCase();
            return (
                (d.name.toLowerCase().includes(q) || d.category.toLowerCase().includes(q)) &&
                (filterSev === 'ALL' || d.severity === filterSev) &&
                (filterCat === 'ALL' || d.category === filterCat)
            );
        })
        .sort((a, b) => {
            const av = a[sortKey] || '', bv = b[sortKey] || '';
            return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
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

    const handleSave = data => {
        if (data.id) setDiseases(p => p.map(d => d.id === data.id ? data : d));
        else         setDiseases(p => [...p, { ...data, id: Date.now() }]);
        setModal(null); setSelected(null);
    };

    const handleDelete = () => {
        setDiseases(p => p.filter(d => d.id !== selected.id));
        setModal(null); setSelected(null);
    };

    const openDetail = d => { setSelected(d); setModal('detail'); };
    const openEdit   = d => { setSelected(d); setModal('form');   };
    const openDelete = d => { setSelected(d); setModal('delete'); };

    return (
        <div className="diseases-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">{t('diseases.title')}</h1>
                    <p className="page-subtitle">{diseases.length} {t('diseases.subtitle')}</p>
                </div>
                <button className="btn btn--primary"
                        onClick={() => { setSelected(null); setModal('form'); }}>
                    <Plus size={16} strokeWidth={2.2} /> {t('diseases.addBtn')}
                </button>
            </div>

            <div className="dis-filters">
                <div className="dis-search">
                    <Search size={15} color="var(--text-muted)" strokeWidth={1.8} />
                    <input className="dis-search-input" placeholder={t('diseases.searchPlaceholder')}
                           value={search} onChange={e => setSearch(e.target.value)} />
                    {search && (
                        <button className="dis-search-clear" onClick={() => setSearch('')}>
                            <X size={14} strokeWidth={2} />
                        </button>
                    )}
                </div>
                <select className="dis-select" value={filterSev} onChange={e => setFilterSev(e.target.value)}>
                    <option value="ALL">{t('diseases.allSeverity')}</option>
                    {SEVERITY_OPTIONS.map(s => (
                        <option key={s} value={s}>
                            {s === 'LOW' ? t('diseases.low') : s === 'MEDIUM' ? t('diseases.medium') : t('diseases.high')}
                        </option>
                    ))}
                </select>
                <select className="dis-select" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
                    <option value="ALL">{t('diseases.allSeverity').replace('Severity', 'Categories').replace('Тежини', 'Категории')}</option>
                    {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <span className="dis-count">{filtered.length} {t('analyses.results')}</span>
            </div>

            <div className="dis-card">
                <div className="dis-table-wrap">
                    <table className="dis-table">
                        <thead>
                        <tr>
                            <th className="sortable" onClick={() => toggleSort('name')}>
                                {t('common.name')} <SortIcon col="name" />
                            </th>
                            <th className="sortable" onClick={() => toggleSort('category')}>
                                {t('diseases.diseaseCategory')} <SortIcon col="category" />
                            </th>
                            <th className="sortable" onClick={() => toggleSort('severity')}>
                                {t('diseases.severity')} <SortIcon col="severity" />
                            </th>
                            <th>{t('common.actions')}</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filtered.length === 0 ? (
                            <tr><td colSpan={4}>
                                <div className="dis-empty">
                                    <div className="dis-empty-icon">🌿</div>
                                    <div className="dis-empty-title">{t('diseases.noDiseasesTitle')}</div>
                                    <div className="dis-empty-sub">{t('diseases.noDiseasesSub')}</div>
                                </div>
                            </td></tr>
                        ) : filtered.map(d => (
                            <tr key={d.id} className="dis-row" onClick={() => openDetail(d)}>
                                <td className="dis-name">{d.name}</td>
                                <td className="dis-category">{d.category}</td>
                                <td><SeverityBadge severity={d.severity} t={t} /></td>
                                <td onClick={e => e.stopPropagation()}>
                                    <div className="dis-actions">
                                        <button className="dis-action-btn dis-action-btn--edit"
                                                onClick={() => openEdit(d)} title={t('common.edit')}>
                                            <Pencil size={15} strokeWidth={1.8} />
                                        </button>
                                        <button className="dis-action-btn dis-action-btn--delete"
                                                onClick={() => openDelete(d)} title={t('common.delete')}>
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

            {modal === 'detail' && (
                <DetailModal disease={selected} t={t} onEdit={d => { setModal('form'); }} onClose={() => { setModal(null); setSelected(null); }} />
            )}
            {modal === 'form' && (
                <FormModal disease={selected} t={t} onSave={handleSave} onClose={() => { setModal(null); setSelected(null); }} />
            )}
            {modal === 'delete' && (
                <DeleteModal disease={selected} t={t} onConfirm={handleDelete} onCancel={() => { setModal(null); setSelected(null); }} />
            )}
        </div>
    );
}