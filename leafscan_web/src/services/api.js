import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Origin за media фајлови (без `/api`): нпр. `http://localhost:8000`.
const BACKEND_ORIGIN = BASE_URL.replace(/\/api\/?$/, '');

/**
 * Враќа клик-бабилен URL за media path што бил вратен од backend.
 * Backend може да врати: full URL ('http://...'), apsoluten path ('/media/...'),
 * или relative path ('media/plants/foo.jpg'). Сите се нормализираат.
 */
export function resolveMediaUrl(path) {
    if (!path || typeof path !== 'string') return null;
    if (/^https?:\/\//i.test(path))  return path;
    if (path.startsWith('/'))        return `${BACKEND_ORIGIN}${path}`;
    return `${BACKEND_ORIGIN}/${path}`;
}

// Намерно не поставуваме default Content-Type — за да axios auto-detect-uje:
//   • plain object → application/json (auto-stringified)
//   • FormData     → multipart/form-data со точен boundary
// Со fixed Content-Type, FormData uploads пукаа тивко на серверот.
const api = axios.create({
    baseURL: BASE_URL,
});

// ─────────────────────────────────────────────────────────────────────────────
// Token storage
// Уште се чува `ls_token` (access) и `ls_user` за компатибилност со AuthContext.
// Refresh токенот е нов — го чуваме одделно за да можеме автоматски да го обновуваме access.
// ─────────────────────────────────────────────────────────────────────────────
export const tokenStorage = {
    getAccess:  () => localStorage.getItem('ls_token'),
    getRefresh: () => localStorage.getItem('ls_refresh'),
    setBoth: (access, refresh) => {
        if (access)  localStorage.setItem('ls_token', access);
        if (refresh) localStorage.setItem('ls_refresh', refresh);
    },
    setAccess: (access) => localStorage.setItem('ls_token', access),
    clear: () => {
        localStorage.removeItem('ls_token');
        localStorage.removeItem('ls_refresh');
        localStorage.removeItem('ls_user');
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// Request interceptor — додава Authorization: Bearer <access>
// ─────────────────────────────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
    const token = tokenStorage.getAccess();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// ─────────────────────────────────────────────────────────────────────────────
// Response interceptor — на 401 пробуваме refresh + retry.
// Ако и refresh падне, ги бришеме токените и редиректираме на /login.
// ─────────────────────────────────────────────────────────────────────────────
let refreshPromise = null;

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const original = error.config;
        const status   = error.response?.status;

        if (status !== 401 || !original || original._retry) {
            return Promise.reject(error);
        }
        // Не правиме refresh за самиот refresh ендпоинт (би влегле во бесконечен loop).
        if (original.url && original.url.includes('/jwt-auth/refresh/')) {
            tokenStorage.clear();
            if (typeof window !== 'undefined') window.location.href = '/login';
            return Promise.reject(error);
        }

        original._retry = true;
        const refresh = tokenStorage.getRefresh();
        if (!refresh) {
            tokenStorage.clear();
            if (typeof window !== 'undefined') window.location.href = '/login';
            return Promise.reject(error);
        }

        try {
            // Споделуваме една refresh promise меѓу повеќе паралелни 401-и.
            refreshPromise = refreshPromise || axios.post(
                `${BASE_URL}/jwt-auth/refresh/`,
                { refresh },
                { headers: { 'Content-Type': 'application/json' } },
            );
            const r = await refreshPromise;
            refreshPromise = null;

            const newAccess = r.data?.access;
            if (!newAccess) throw new Error('No access in refresh response');
            tokenStorage.setAccess(newAccess);
            original.headers.Authorization = `Bearer ${newAccess}`;
            return api(original);
        } catch (e) {
            refreshPromise = null;
            tokenStorage.clear();
            if (typeof window !== 'undefined') window.location.href = '/login';
            return Promise.reject(e);
        }
    },
);

// ─────────────────────────────────────────────────────────────────────────────
// Auth — /api/jwt-auth/
// ─────────────────────────────────────────────────────────────────────────────
export const authAPI = {
    // POST { email, password } → { access, refresh, user? }
    login:          (data) => api.post('/jwt-auth/login/', data),
    // POST { email, username, password, ... } → { access, refresh, user? }
    register:       (data) => api.post('/jwt-auth/register/', data),
    // POST { refresh } → { access }
    refresh:        (refresh) => api.post('/jwt-auth/refresh/', { refresh }),
    // POST { refresh } → blacklist refresh
    logout:         (refresh) => api.post('/jwt-auth/logout/', { refresh }),
    // GET → current user info
    me:             () => api.get('/jwt-auth/me/'),
    // POST { old_password, new_password }
    changePassword: (data) => api.post('/jwt-auth/change-password/', data),
    // POST { email, new_password }
    resetPassword:  (data) => api.post('/jwt-auth/reset-password/', data),
};

// ─────────────────────────────────────────────────────────────────────────────
// Users — /api/users/  (admin only)
// ─────────────────────────────────────────────────────────────────────────────
export const usersAPI = {
    getAll:       ()        => api.get('/users/'),
    getById:      (id)      => api.get(`/users/${id}/`),
    create:       (data)    => api.post('/users/', data),
    update:       (id, data)=> api.patch(`/users/${id}/`, data),
    delete:       (id)      => api.delete(`/users/${id}/`),
    getAnalyses:  (id)      => api.get(`/users/${id}/analyses/`),
};

// ─────────────────────────────────────────────────────────────────────────────
// Plants — /api/plants/
// ─────────────────────────────────────────────────────────────────────────────
export const plantsAPI = {
    getAll:           ()                 => api.get('/plants/'),
    getById:          (id)               => api.get(`/plants/${id}/`),
    create:           (data)             => api.post('/plants/', data),
    update:           (id, data)         => api.put(`/plants/${id}/`, data),
    patch:            (id, data)         => api.patch(`/plants/${id}/`, data),
    delete:           (id)               => api.delete(`/plants/${id}/`),
    getTopDiseases:   (id)               => api.get(`/plants/${id}/top-diseases/`),
    addDisease:       (id, disease_id)   => api.post(`/plants/${id}/diseases/`, { disease_id }),
    removeDisease:    (id, disease_id)   => api.delete(`/plants/${id}/diseases/${disease_id}/`),
};

// ─────────────────────────────────────────────────────────────────────────────
// Diseases — /api/diseases/
// ─────────────────────────────────────────────────────────────────────────────
export const diseasesAPI = {
    getAll:         ()              => api.get('/diseases/'),
    getById:        (id)            => api.get(`/diseases/${id}/`),
    create:         (data)          => api.post('/diseases/', data),
    update:         (id, data)      => api.put(`/diseases/${id}/`, data),
    patch:          (id, data)      => api.patch(`/diseases/${id}/`, data),
    delete:         (id)            => api.delete(`/diseases/${id}/`),
    getTopPlants:   (id)            => api.get(`/diseases/${id}/top-plants/`),
    getTreatments:  (id)            => api.get(`/diseases/${id}/treatments/`),
    addPlant:       (id, plant_id)  => api.post(`/diseases/${id}/plants/`, { plant_id }),
    removePlant:    (id, plant_id)  => api.delete(`/diseases/${id}/plants/${plant_id}/`),
};

// ─────────────────────────────────────────────────────────────────────────────
// Treatments — /api/treatments/
// ─────────────────────────────────────────────────────────────────────────────
export const treatmentsAPI = {
    getAll:         ()                  => api.get('/treatments/'),
    getById:        (id)                => api.get(`/treatments/${id}/`),
    create:         (data)              => api.post('/treatments/', data),
    update:         (id, data)          => api.put(`/treatments/${id}/`, data),
    patch:          (id, data)          => api.patch(`/treatments/${id}/`, data),
    delete:         (id)                => api.delete(`/treatments/${id}/`),
    addDisease:     (id, disease_id)    => api.post(`/treatments/${id}/diseases/`, { disease_id }),
    removeDisease:  (id, disease_id)    => api.delete(`/treatments/${id}/diseases/${disease_id}/`),
};

// ─────────────────────────────────────────────────────────────────────────────
// Analyses — /api/analyses/
// ─────────────────────────────────────────────────────────────────────────────
export const analysesAPI = {
    // ⭐ Upload слика за AI скенирање. `file` е File објект (од <input type="file" />).
    scan: (file, extraFields = {}) => {
        const form = new FormData();
        form.append('image', file);
        Object.entries(extraFields).forEach(([k, v]) => form.append(k, v));
        return api.post('/analyses/scan/', form);
    },
    getAll:               (params)   => api.get('/analyses/', { params }),  // admin
    getById:              (id)       => api.get(`/analyses/${id}/`),
    delete:               (id)       => api.delete(`/analyses/${id}/`),
    getMy:                ()         => api.get('/analyses/my/'),
    getMyRecent:          ()         => api.get('/analyses/my/recent/'),
    getMySummary:         ()         => api.get('/analyses/my/summary/'),
    exportAllPdf:         ()         => api.get('/analyses/export/pdf/',         { responseType: 'blob' }),
    getReportPdf:         (id)       => api.get(`/analyses/${id}/report/pdf/`,    { responseType: 'blob' }),
    generateTreatments:   (id)       => api.post(`/analyses/${id}/generate-treatments/`),
};

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard — /api/dashboard/  (admin only) — за главната Dashboard страница.
// ─────────────────────────────────────────────────────────────────────────────
export const dashboardAPI = {
    overview:            () => api.get('/dashboard/overview/'),
    summary:             () => api.get('/dashboard/summary/'),
    monthlyTrend:        () => api.get('/dashboard/monthly-trend/'),
    diseaseDistribution: () => api.get('/dashboard/disease-distribution/'),
    recentAnalyses:      () => api.get('/dashboard/recent-analyses/'),
    topDetectedDiseases: () => api.get('/dashboard/top-detected-diseases/'),
};

// ─────────────────────────────────────────────────────────────────────────────
// Statistics — /api/statistics/  (admin only)
// ─────────────────────────────────────────────────────────────────────────────
export const statisticsAPI = {
    overview:           () => api.get('/statistics/overview/'),
    analysesByMonth:    () => api.get('/statistics/analyses-by-month/'),
    diseasesByCategory: () => api.get('/statistics/diseases-by-category/'),
    userGrowth:         () => api.get('/statistics/user-growth/'),
    detectionAccuracy:  () => api.get('/statistics/detection-accuracy/'),
    topDetectedDiseases:() => api.get('/statistics/top-detected-diseases/'),
};

// Legacy alias за стариот код кој користел `statsAPI.getDashboard()`.
export const statsAPI = {
    getDashboard: () => dashboardAPI.overview(),
};

export default api;
