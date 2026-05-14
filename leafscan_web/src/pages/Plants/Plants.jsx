import { useState, useEffect, useRef } from 'react';
import {
    Plus, Search, X, Pencil, Trash2,
    ChevronUp, ChevronDown, AlertTriangle,
    Leaf, MapPin, Sun, Tag, FileText
} from 'lucide-react';
import { useLang } from '../../context/LanguageContext';
import { plantsAPI } from '../../services/api';
import './Plants.css';

// ── Helpers ───────────────────────────────────────────────────────────────────
const BASE_MEDIA_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:8000';

const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${BASE_MEDIA_URL}${path}`;
};

// ── Constants ─────────────────────────────────────────────────────────────────
const TYPE_OPTIONS = ['CROP', 'FRUIT', 'VEGETABLE', 'HERB', 'FLOWER', 'TREE', 'ORNAMENTAL', 'OTHER'];

const EMPTY_FORM = {
    name: '', scientific_name: '', type: 'VEGETABLE',
    description: '', growing_season: '', growing_region: '',
};

const TYPE_COLORS = {
    CROP:       'type--crop',
    FRUIT:      'type--fruit',
    VEGETABLE:  'type--vegetable',
    HERB:       'type--herb',
    FLOWER:     'type--flower',
    TREE:       'type--tree',
    ORNAMENTAL: 'type--ornamental',
    OTHER:      'type--other',
};

function TypeBadge({ type }) {
    return (
        <span className={`type-badge ${TYPE_COLORS[type] || 'type--other'}`}>
      {type}
    </span>
    );
}

// ── Detail modal ──────────────────────────────────────────────────────────────
function DetailModal({ plant, onEdit, onClose, t }) {
    if (!plant) return null;

    const imgUrl = getImageUrl(plant.image);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>

                <div className="modal-header">
                    <div className="modal-header-left">
                        <div className="modal-plant-icon">
                            <Leaf size={20} strokeWidth={1.8} color="var(--green-light)" />
                        </div>
                        <div>
                            <h3 className="modal-title">{plant.name}</h3>
                            <div className="modal-meta">
                                <span className="modal-scientific">{plant.scientific_name}</span>
                                <span className="modal-dot">·</span>
                                <TypeBadge type={plant.type} />
                            </div>
                        </div>
                    </div>
                    <button className="modal-close" onClick={onClose}>
                        <X size={18} strokeWidth={2} />
                    </button>
                </div>

                <div className="modal-body">

                    {/* Image preview */}
                    {imgUrl && (
                        <div className="img-preview-wrap">
                            <img src={imgUrl} alt={plant.name} className="img-preview" />
                        </div>
                    )}

                    <div className="detail-row">
                        <div className="detail-item">
                            <div className="detail-label">
                                <Sun size={13} strokeWidth={1.8} /> Growing Season
                            </div>
                            <div className="detail-value">{plant.growing_season || '—'}</div>
                        </div>
                        <div className="detail-item">
                            <div className="detail-label">
                                <MapPin size={13} strokeWidth={1.8} /> {t('plants.region')}
                            </div>
                            <div className="detail-value">{plant.growing_region || '—'}</div>
                        </div>
                    </div>

                    <div className="detail-section">
                        <div className="detail-section-title">
                            <FileText size={13} strokeWidth={1.8} /> {t('plants.description')}
                        </div>
                        <p className="detail-text">{plant.description}</p>
                    </div>

                </div>

                <div className="modal-footer">
                    <button className="btn btn--secondary" onClick={onClose}>
                        {t('common.close')}
                    </button>
                    <button className="btn btn--primary" onClick={() => onEdit(plant)}>
                        <Pencil size={14} strokeWidth={1.8} /> {t('common.edit')}
                    </button>
                </div>

            </div>
        </div>
    );
}

// ── Form modal ────────────────────────────────────────────────────────────────
function FormModal({ plant, onSave, onClose, t }) {
    const isEdit = !!plant?.id;
    const fileInputRef = useRef(null);

    const [form, setForm] = useState(
        isEdit
            ? {
                name:           plant.name            || '',
                scientific_name:plant.scientific_name || '',
                type:           plant.type            || 'VEGETABLE',
                description:    plant.description     || '',
                growing_season: plant.growing_season  || '',
                growing_region: plant.growing_region  || '',
            }
            : { ...EMPTY_FORM }
    );

    const [imageFile,    setImageFile]    = useState(null);
    const [imagePreview, setImagePreview] = useState(getImageUrl(plant?.image));
    const [errors,       setErrors]       = useState({});

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleImageChange = (e) => {
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
        if (!form.name.trim())        e.name        = t('plants.plantName') + ' is required';
        if (!form.description.trim()) e.description = t('plants.description') + ' is required';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSave = () => {
        if (!validate()) return;

        const formData = new FormData();
        formData.append('name',            form.name);
        formData.append('scientific_name', form.scientific_name);
        formData.append('type',            form.type);
        formData.append('description',     form.description);
        formData.append('growing_season',  form.growing_season);
        formData.append('growing_region',  form.growing_region);

        if (imageFile) {
            formData.append('image', imageFile);
        }

        onSave({ id: plant?.id, formData });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>

                <div className="modal-header">
                    <h3 className="modal-title">
                        {isEdit ? t('plants.editTitle') : t('plants.addTitle')}
                    </h3>
                    <button className="modal-close" onClick={onClose}>
                        <X size={18} strokeWidth={2} />
                    </button>
                </div>

                <div className="modal-body">

                    {/* Name + Scientific name */}
                    <div className="form-row">
                        <div className="form-field">
                            <label className="form-label">{t('plants.plantName')} *</label>
                            <input
                                className={`form-input ${errors.name ? 'form-input--error' : ''}`}
                                value={form.name}
                                onChange={e => set('name', e.target.value)}
                                placeholder="e.g. Tomato"
                            />
                            {errors.name && <span className="form-error">{errors.name}</span>}
                        </div>
                        <div className="form-field">
                            <label className="form-label">
                                {t('plants.scientificName')}{' '}
                                <span className="form-optional">({t('diseases.optional')})</span>
                            </label>
                            <input
                                className="form-input"
                                value={form.scientific_name}
                                onChange={e => set('scientific_name', e.target.value)}
                                placeholder="e.g. Solanum lycopersicum"
                            />
                        </div>
                    </div>

                    {/* Type */}
                    <div className="form-field">
                        <label className="form-label">{t('common.type')} *</label>
                        <select
                            className="form-input"
                            value={form.type}
                            onChange={e => set('type', e.target.value)}
                        >
                            {TYPE_OPTIONS.map(tp => (
                                <option key={tp} value={tp}>{tp}</option>
                            ))}
                        </select>
                    </div>

                    {/* Growing season + region */}
                    <div className="form-row">
                        <div className="form-field">
                            <label className="form-label">Growing Season</label>
                            <input
                                className="form-input"
                                value={form.growing_season}
                                onChange={e => set('growing_season', e.target.value)}
                                placeholder="e.g. Spring - Summer"
                            />
                        </div>
                        <div className="form-field">
                            <label className="form-label">{t('plants.region')}</label>
                            <input
                                className="form-input"
                                value={form.growing_region}
                                onChange={e => set('growing_region', e.target.value)}
                                placeholder="e.g. Mediterranean"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div className="form-field">
                        <label className="form-label">{t('plants.description')} *</label>
                        <textarea
                            className={`form-input form-textarea ${errors.description ? 'form-input--error' : ''}`}
                            value={form.description}
                            onChange={e => set('description', e.target.value)}
                            rows={3}
                        />
                        {errors.description && <span className="form-error">{errors.description}</span>}
                    </div>

                    {/* Image upload */}
                    <div className="form-field">
                        <label className="form-label">
                            {t('plants.image')}{' '}
                            <span className="form-optional">({t('diseases.optional')})</span>
                        </label>

                        {imagePreview ? (
                            <div className="img-preview-wrap">
                                <img src={imagePreview} alt="preview" className="img-preview" />
                                <button className="img-remove" onClick={handleRemoveImage}>
                                    <X size={13} strokeWidth={2} /> {t('common.delete')}
                                </button>
                            </div>
                        ) : (
                            <div
                                className="img-upload-zone"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <span className="img-upload-icon">🖼️</span>
                                <span className="img-upload-text">Click to upload image</span>
                                <span className="img-upload-sub">PNG, JPG, WEBP up to 5MB</span>
                            </div>
                        )}

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="img-upload-input"
                            onChange={handleImageChange}
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

// ── Delete modal ──────────────────────────────────────────────────────────────
function DeleteModal({ plant, onConfirm, onCancel, t }) {
    if (!plant) return null;
    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-box modal-box--sm" onClick={e => e.stopPropagation()}>
                <div className="modal-warn-icon">
                    <AlertTriangle size={26} color="var(--red)" strokeWidth={1.8} />
                </div>
                <h3 className="modal-warn-title">{t('plants.deleteTitle')}</h3>
                <p className="modal-warn-desc">
                    {t('plants.deleteDesc')} <strong>{plant.name}</strong>? {t('plants.deleteWarn')}
                </p>
                <div className="modal-warn-actions">
                    <button className="btn btn--secondary" onClick={onCancel}>{t('common.cancel')}</button>
                    <button className="btn btn--danger"    onClick={onConfirm}>{t('common.delete')}</button>
                </div>
            </div>
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Plants() {
    const { t } = useLang();

    const [plants,  setPlants]  = useState([]);
    const [loading, setLoading] = useState(true);

    const [search,     setSearch]     = useState('');
    const [filterType, setFilterType] = useState('ALL');
    const [sortKey,    setSortKey]    = useState('name');
    const [sortDir,    setSortDir]    = useState('asc');

    const [modal,    setModal]    = useState(null);
    const [selected, setSelected] = useState(null);

    // ── Fetch ──────────────────────────────────────────────────────────────────
    useEffect(() => { fetchPlants(); }, []);

    const fetchPlants = async () => {
        try {
            setLoading(true);
            const response = await plantsAPI.getAll();
            setPlants(response.data);
        } catch (error) {
            console.error('Failed to fetch plants:', error);
        } finally {
            setLoading(false);
        }
    };

    // ── Save ───────────────────────────────────────────────────────────────────
    const handleSave = async ({ id, formData }) => {
        try {
            if (id) {
                await plantsAPI.partialUpdate(id, formData);
            } else {
                await plantsAPI.create(formData);
            }
            await fetchPlants();
            setModal(null);
            setSelected(null);
        } catch (error) {
            console.error('Save failed:', error);
        }
    };

    // ── Delete ─────────────────────────────────────────────────────────────────
    const handleDelete = async () => {
        try {
            await plantsAPI.delete(selected.id);
            await fetchPlants();
            setModal(null);
            setSelected(null);
        } catch (error) {
            console.error('Delete failed:', error);
        }
    };

    // ── Filter & sort ──────────────────────────────────────────────────────────
    const filtered = plants
        .filter(p => {
            const q = search.toLowerCase();
            const matchSearch =
                p.name?.toLowerCase().includes(q) ||
                p.scientific_name?.toLowerCase().includes(q);
            const matchType = filterType === 'ALL' || p.type === filterType;
            return matchSearch && matchType;
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

    // ── Loading ────────────────────────────────────────────────────────────────
    if (loading) return <div>Loading plants...</div>;

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div className="plants-page">

            <div className="page-header">
                <div>
                    <h1 className="page-title">{t('plants.title')}</h1>
                    <p className="page-subtitle">{plants.length} {t('plants.subtitle')}</p>
                </div>
                <button
                    className="btn btn--primary"
                    onClick={() => { setSelected(null); setModal('form'); }}
                >
                    <Plus size={16} strokeWidth={2.2} /> {t('plants.addBtn')}
                </button>
            </div>

            <div className="dis-filters">
                <div className="dis-search">
                    <Search size={15} color="var(--text-muted)" strokeWidth={1.8} />
                    <input
                        className="dis-search-input"
                        placeholder={t('plants.searchPlaceholder')}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    {search && (
                        <button className="dis-search-clear" onClick={() => setSearch('')}>
                            <X size={14} strokeWidth={2} />
                        </button>
                    )}
                </div>

                <select
                    className="dis-select"
                    value={filterType}
                    onChange={e => setFilterType(e.target.value)}
                >
                    <option value="ALL">{t('plants.allTypes')}</option>
                    {TYPE_OPTIONS.map(tp => (
                        <option key={tp} value={tp}>{tp}</option>
                    ))}
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
                            <th className="sortable" onClick={() => toggleSort('scientific_name')}>
                                {t('plants.scientificName')} <SortIcon col="scientific_name" />
                            </th>
                            <th className="sortable" onClick={() => toggleSort('type')}>
                                {t('common.type')} <SortIcon col="type" />
                            </th>
                            <th className="sortable" onClick={() => toggleSort('growing_region')}>
                                {t('plants.region')} <SortIcon col="growing_region" />
                            </th>
                            <th>{t('common.actions')}</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filtered.length === 0 ? (
                            <tr><td colSpan={5}>
                                <div className="dis-empty">
                                    <div className="dis-empty-icon">🌿</div>
                                    <div className="dis-empty-title">{t('plants.noPlantsTitle')}</div>
                                    <div className="dis-empty-sub">{t('plants.noPlantsSub')}</div>
                                </div>
                            </td></tr>
                        ) : filtered.map(p => (
                            <tr
                                key={p.id}
                                className="dis-row"
                                onClick={() => { setSelected(p); setModal('detail'); }}
                            >
                                <td>
                                    <div className="plant-name-cell">
                                        <div className="plant-icon-sm">
                                            <Leaf size={14} strokeWidth={1.8} color="var(--green-light)" />
                                        </div>
                                        <span className="dis-name">{p.name}</span>
                                    </div>
                                </td>
                                <td className="plant-scientific">{p.scientific_name}</td>
                                <td><TypeBadge type={p.type} /></td>
                                <td className="plant-region">{p.growing_region || '—'}</td>
                                <td onClick={e => e.stopPropagation()}>
                                    <div className="dis-actions">
                                        <button
                                            className="dis-action-btn dis-action-btn--edit"
                                            onClick={() => { setSelected(p); setModal('form'); }}
                                            title={t('common.edit')}
                                        >
                                            <Pencil size={15} strokeWidth={1.8} />
                                        </button>
                                        <button
                                            className="dis-action-btn dis-action-btn--delete"
                                            onClick={() => { setSelected(p); setModal('delete'); }}
                                            title={t('common.delete')}
                                        >
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
                <DetailModal
                    plant={selected} t={t}
                    onEdit={p => { setSelected(p); setModal('form'); }}
                    onClose={() => { setModal(null); setSelected(null); }}
                />
            )}
            {modal === 'form' && (
                <FormModal
                    plant={selected} t={t}
                    onSave={handleSave}
                    onClose={() => { setModal(null); setSelected(null); }}
                />
            )}
            {modal === 'delete' && (
                <DeleteModal
                    plant={selected} t={t}
                    onConfirm={handleDelete}
                    onCancel={() => { setModal(null); setSelected(null); }}
                />
            )}

        </div>
    );
}
