import { useState, useEffect, useRef } from 'react';
import {
    Plus,
    Search,
    Pencil,
    Trash2,
    X,
    Leaf,
    FileText,
    Activity,
    ImageIcon,
} from 'lucide-react';

import { useLang } from '../../context/LanguageContext';
import { diseasesAPI } from '../../services/api';

import './Diseases.css';

// ── Constants ────────────────────────────────────────────────────────────────
const SEVERITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH'];
const CATEGORY_OPTIONS = ['FUNGAL', 'BACTERIAL', 'VIRAL', 'OTHER'];

const EMPTY_FORM = {
    name: '',
    category: 'FUNGAL',
    severity: 'MEDIUM',
    description: '',
    symptoms: '',
    image_description: '',
};

// ── Severity badge ───────────────────────────────────────────────────────────
function SeverityBadge({ severity, t }) {

    const cls = {
        LOW:    'badge--low',
        MEDIUM: 'badge--medium',
        HIGH:   'badge--high',
    };

    const labels = {
        LOW:    t('diseases.low'),
        MEDIUM: t('diseases.medium'),
        HIGH:   t('diseases.high'),
    };

    return (
        <span className={`sev-badge ${cls[severity] || ''}`}>
            {labels[severity] || severity}
        </span>
    );
}

// ── Detail modal ─────────────────────────────────────────────────────────────
function DetailModal({ disease, onEdit, onClose, t }) {

    if (!disease) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>

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

                    {/* Image preview */}
                    {disease.image && (
                        <div className="img-preview-wrap">
                            <img
                                src={disease.image}
                                alt={disease.image_description || disease.name}
                                className="img-preview"
                            />
                        </div>
                    )}

                    <div className="detail-section">
                        <div className="detail-section-title">
                            <FileText size={14} strokeWidth={1.8} />
                            Description
                        </div>
                        <p className="detail-text">{disease.description}</p>
                    </div>

                    <div className="detail-section">
                        <div className="detail-section-title">
                            <Activity size={14} strokeWidth={1.8} />
                            {t('diseases.symptoms')}
                        </div>
                        <p className="detail-text">{disease.symptomes || disease.symptoms}</p>
                    </div>

                    {disease.image_description && (
                        <div className="detail-section">
                            <div className="detail-section-title">
                                <ImageIcon size={14} strokeWidth={1.8} />
                                Image Description
                            </div>
                            <p className="detail-text">{disease.image_description}</p>
                        </div>
                    )}

                </div>

                <div className="modal-footer">
                    <button className="btn btn--secondary" onClick={onClose}>
                        {t('common.close')}
                    </button>
                    <button className="btn btn--primary" onClick={() => onEdit(disease)}>
                        <Pencil size={14} strokeWidth={1.8} />
                        {t('common.edit')}
                    </button>
                </div>

            </div>
        </div>
    );
}

// ── Form modal ───────────────────────────────────────────────────────────────
function FormModal({ disease, onSave, onClose, t }) {

    const isEdit = !!disease?.id;
    const fileInputRef = useRef(null);

    const [form, setForm] = useState(
        isEdit
            ? {
                name:              disease.name              || '',
                category:          disease.category          || 'FUNGAL',
                severity:          disease.severity          || 'MEDIUM',
                description:       disease.description       || '',
                symptoms:          disease.symptoms          || '',
                image_description: disease.image_description || '',
            }
            : { ...EMPTY_FORM }
    );

    const [imageFile,    setImageFile]    = useState(null);
    const [imagePreview, setImagePreview] = useState(disease?.image || null);
    const [errors,       setErrors]       = useState({});

    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const validate = () => {
        const e = {};
        if (!form.name.trim())        e.name        = 'Name is required';
        if (!form.description.trim()) e.description = 'Description is required';
        if (!form.symptoms.trim())    e.symptoms    = 'Symptoms are required';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSave = () => {
        if (!validate()) return;

        const formData = new FormData();
        formData.append('name',              form.name);
        formData.append('category',          form.category);
        formData.append('severity',          form.severity);
        formData.append('description',       form.description);
        formData.append('symptomes', form.symptoms);
        formData.append('image_description', form.image_description);

        if (imageFile) {
            formData.append('image', imageFile);
        }

        onSave({ id: disease?.id, formData });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>

                <div className="modal-header">
                    <h3 className="modal-title">
                        {isEdit ? t('diseases.editTitle') : t('diseases.addTitle')}
                    </h3>
                    <button className="modal-close" onClick={onClose}>
                        <X size={18} strokeWidth={2} />
                    </button>
                </div>

                <div className="modal-body">

                    {/* Name */}
                    <div className="form-field">
                        <label className="form-label">{t('diseases.diseaseName')}</label>
                        <input
                            className={`form-input ${errors.name ? 'form-input--error' : ''}`}
                            value={form.name}
                            onChange={(e) => set('name', e.target.value)}
                        />
                        {errors.name && <span className="form-error">{errors.name}</span>}
                    </div>

                    {/* Category + Severity */}
                    <div className="form-row">

                        <div className="form-field">
                            <label className="form-label">{t('diseases.diseaseCategory')}</label>
                            <select
                                className="form-input"
                                value={form.category}
                                onChange={(e) => set('category', e.target.value)}
                            >
                                {CATEGORY_OPTIONS.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-field">
                            <label className="form-label">{t('diseases.severity')}</label>
                            <select
                                className="form-input"
                                value={form.severity}
                                onChange={(e) => set('severity', e.target.value)}
                            >
                                {SEVERITY_OPTIONS.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>

                    </div>

                    {/* Description */}
                    <div className="form-field">
                        <label className="form-label">Description</label>
                        <textarea
                            className={`form-input form-textarea ${errors.description ? 'form-input--error' : ''}`}
                            rows={3}
                            value={form.description}
                            onChange={(e) => set('description', e.target.value)}
                        />
                        {errors.description && <span className="form-error">{errors.description}</span>}
                    </div>

                    {/* Symptoms */}
                    <div className="form-field">
                        <label className="form-label">Symptoms</label>
                        <textarea
                            className={`form-input form-textarea ${errors.symptoms ? 'form-input--error' : ''}`}
                            rows={3}
                            value={form.symptoms}
                            onChange={(e) => set('symptoms', e.target.value)}
                        />
                        {errors.symptoms && <span className="form-error">{errors.symptoms}</span>}
                    </div>

                    {/* Image upload */}
                    <div className="form-field">
                        <label className="form-label">
                            Image
                            <span className="form-optional">(optional)</span>
                        </label>

                        {imagePreview ? (
                            <div className="img-preview-wrap">
                                <img src={imagePreview} alt="preview" className="img-preview" />
                                <button className="img-remove" onClick={handleRemoveImage}>
                                    <X size={12} /> Remove
                                </button>
                            </div>
                        ) : (
                            <div
                                className="img-upload-zone"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <span className="img-upload-icon">🖼️</span>
                                <span className="img-upload-text">Click to upload image</span>
                                <span className="img-upload-sub">PNG, JPG, WEBP up to 10MB</span>
                            </div>
                        )}

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="img-upload-input"
                            onChange={handleFileChange}
                        />
                    </div>

                    {/* Image description */}
                    <div className="form-field">
                        <label className="form-label">
                            Image Description
                            <span className="form-optional">(optional)</span>
                        </label>
                        <textarea
                            className="form-input form-textarea"
                            rows={2}
                            value={form.image_description}
                            onChange={(e) => set('image_description', e.target.value)}
                        />
                    </div>

                </div>

                <div className="modal-footer">
                    <button className="btn btn--secondary" onClick={onClose}>
                        {t('common.cancel')}
                    </button>
                    <button className="btn btn--primary" onClick={handleSave}>
                        {t('common.save')}
                    </button>
                </div>

            </div>
        </div>
    );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function Diseases() {

    const { t } = useLang();

    const [diseases, setDiseases] = useState([]);
    const [loading,  setLoading]  = useState(true);

    const [search,    setSearch]    = useState('');
    const [filterSev, setFilterSev] = useState('ALL');
    const [filterCat, setFilterCat] = useState('ALL');

    const [sortKey, setSortKey] = useState('name');
    const [sortDir, setSortDir] = useState('asc');

    const [modal,    setModal]    = useState(null);
    const [selected, setSelected] = useState(null);

    // ── Fetch ────────────────────────────────────────────────────────────────
    useEffect(() => { fetchDiseases(); }, []);

    const fetchDiseases = async () => {
        try {
            setLoading(true);
            const response = await diseasesAPI.getAll();
            setDiseases(response.data);
        } catch (error) {
            console.error('Failed to fetch diseases:', error);
        } finally {
            setLoading(false);
        }
    };

    // ── Save ─────────────────────────────────────────────────────────────────
    const handleSave = async ({ id, formData }) => {
        try {
            if (id) {
                await diseasesAPI.partialUpdate(id, formData);
            } else {
                await diseasesAPI.create(formData);
            }
            await fetchDiseases();
            setModal(null);
            setSelected(null);
        } catch (error) {
            console.error('Save failed:', error);
        }
    };

    // ── Delete ───────────────────────────────────────────────────────────────
    const handleDelete = async (id) => {
        try {
            await diseasesAPI.delete(id);
            await fetchDiseases();
        } catch (error) {
            console.error('Delete failed:', error);
        }
    };

    // ── Filter & sort ────────────────────────────────────────────────────────
    const filtered = diseases
        .filter((d) => {
            const q = search.toLowerCase();
            return (
                (d.name?.toLowerCase().includes(q) || d.category?.toLowerCase().includes(q)) &&
                (filterSev === 'ALL' || d.severity === filterSev) &&
                (filterCat === 'ALL' || d.category === filterCat)
            );
        })
        .sort((a, b) => {
            const av = a[sortKey] || '';
            const bv = b[sortKey] || '';
            return sortDir === 'asc'
                ? String(av).localeCompare(String(bv))
                : String(bv).localeCompare(String(av));
        });

    const toggleSort = (key) => {
        if (sortKey === key) {
            setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
    };

    // ── Loading ──────────────────────────────────────────────────────────────
    if (loading) return <div>Loading diseases...</div>;

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="diseases-page">

            <div className="page-header">
                <div>
                    <h1 className="page-title">{t('diseases.title')}</h1>
                    <p className="page-subtitle">{diseases.length} diseases</p>
                </div>
                <button
                    className="btn btn--primary"
                    onClick={() => { setSelected(null); setModal('form'); }}
                >
                    <Plus size={16} />
                    {t('diseases.addBtn')}
                </button>
            </div>

            <div className="dis-filters">

                <div className="dis-search">
                    <Search size={15} />
                    <input
                        className="dis-search-input"
                        placeholder="Search diseases..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <select
                    className="dis-select"
                    value={filterSev}
                    onChange={(e) => setFilterSev(e.target.value)}
                >
                    <option value="ALL">All Severity</option>
                    {SEVERITY_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>

                <select
                    className="dis-select"
                    value={filterCat}
                    onChange={(e) => setFilterCat(e.target.value)}
                >
                    <option value="ALL">All Categories</option>
                    {CATEGORY_OPTIONS.map((c) => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>

            </div>

            <div className="dis-card">
                <div className="dis-table-wrap">
                    <table className="dis-table">

                        <thead>
                        <tr>
                            <th className="sortable" onClick={() => toggleSort('name')}>Name</th>
                            <th className="sortable" onClick={() => toggleSort('category')}>Category</th>
                            <th className="sortable" onClick={() => toggleSort('severity')}>Severity</th>
                            <th>Actions</th>
                        </tr>
                        </thead>

                        <tbody>
                        {filtered.map((d) => (
                            <tr
                                key={d.id}
                                className="dis-row"
                                onClick={() => { setSelected(d); setModal('detail'); }}
                            >
                                <td className="dis-name">{d.name}</td>
                                <td className="dis-category">{d.category}</td>
                                <td><SeverityBadge severity={d.severity} t={t} /></td>
                                <td>
                                    <div className="dis-actions">

                                        <button
                                            className="dis-action-btn dis-action-btn--edit"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelected(d);
                                                setModal('form');
                                            }}
                                        >
                                            <Pencil size={14} />
                                        </button>

                                        <button
                                            className="dis-action-btn dis-action-btn--delete"
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                await handleDelete(d.id);
                                            }}
                                        >
                                            <Trash2 size={14} />
                                        </button>

                                    </div>
                                </td>
                            </tr>
                        ))}

                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={4}>
                                    <div className="dis-empty">
                                        <span className="dis-empty-icon">🌿</span>
                                        <span className="dis-empty-title">No diseases found</span>
                                        <span className="dis-empty-sub">Try adjusting your search or filters</span>
                                    </div>
                                </td>
                            </tr>
                        )}
                        </tbody>

                    </table>
                </div>
            </div>

            {modal === 'form' && (
                <FormModal
                    disease={selected}
                    onSave={handleSave}
                    onClose={() => { setModal(null); setSelected(null); }}
                    t={t}
                />
            )}

            {modal === 'detail' && (
                <DetailModal
                    disease={selected}
                    onEdit={(d) => { setSelected(d); setModal('form'); }}
                    onClose={() => { setModal(null); setSelected(null); }}
                    t={t}
                />
            )}

        </div>
    );
}

