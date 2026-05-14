import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});

// Праќа JWT токен со секој request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('ls_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// ── JWT Auth ──────────────────────────────────────────────────────────────────
export const jwtAPI = {
    register:       (data) => api.post('/jwt-auth/register/', data),
    login:          (data) => api.post('/jwt-auth/login/', data),
    refresh:        (data) => api.post('/jwt-auth/refresh/', data),   // refresh token во body
    logout:         (data) => api.post('/jwt-auth/logout/', data),    // refresh token во body
    me:             ()     => api.get('/jwt-auth/me/'),
    changePassword: (data) => api.post('/jwt-auth/change-password/', data),
    resetPassword:  (data) => api.post('/jwt-auth/reset-password/', data),
};

// ── Users (Admin only) ────────────────────────────────────────────────────────
export const usersAPI = {
    getAll:      ()         => api.get('/users/'),
    getById:     (id)       => api.get(`/users/${id}/`),
    create:      (data)     => api.post('/users/', data),
    update:      (id, data) => api.patch(`/users/${id}/`, data),
    delete:      (id)       => api.delete(`/users/${id}/`),
    getAnalyses: (id) => api.get(`/users/${id}/analyses/`),
};


// ── Plants ────────────────────────────────────────────────────────────────────
export const plantsAPI = {
    getAll:        ()              => api.get('/plants/'),
    getById:       (id)            => api.get(`/plants/${id}/`),
    create:        (data)          => api.post('/plants/', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    update:        (id, data)      => api.put(`/plants/${id}/`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    partialUpdate: (id, data)      => api.patch(`/plants/${id}/`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    delete:        (id)            => api.delete(`/plants/${id}/`),
    getTopDiseases:(id)            => api.get(`/plants/${id}/top-diseases/`),
    addDisease:    (id, data)      => api.post(`/plants/${id}/diseases/`, data),
    removeDisease: (id, diseaseId) => api.delete(`/plants/${id}/diseases/${diseaseId}/`),
};


// ── Diseases ──────────────────────────────────────────────────────────────────
export const diseasesAPI = {
    getAll:        ()              => api.get('/diseases/'),
    getById:       (id)            => api.get(`/diseases/${id}/`),
    create:        (data)          => api.post('/diseases/', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    update:        (id, data)      => api.put(`/diseases/${id}/`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    partialUpdate: (id, data)      => api.patch(`/diseases/${id}/`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    delete:        (id)            => api.delete(`/diseases/${id}/`),
    getTopPlants:  (id)            => api.get(`/diseases/${id}/top-plants/`),
    getTreatments: (id)            => api.get(`/diseases/${id}/treatments/`),
    addPlant:      (id, data)      => api.post(`/diseases/${id}/plants/`, data),
    removePlant:   (id, plantId)   => api.delete(`/diseases/${id}/plants/${plantId}/`),
};


// ── Treatments ────────────────────────────────────────────────────────────────
export const treatmentsAPI = {
    getAll:        ()               => api.get('/treatments/'),
    getById:       (id)             => api.get(`/treatments/${id}/`),
    create:        (data)           => api.post('/treatments/', data),
    update:        (id, data)       => api.put(`/treatments/${id}/`, data),
    partialUpdate: (id, data)       => api.patch(`/treatments/${id}/`, data),
    delete:        (id)             => api.delete(`/treatments/${id}/`),
    addDisease:    (id, data)       => api.post(`/treatments/${id}/diseases/`, data),
    removeDisease: (id, diseaseId)  => api.delete(`/treatments/${id}/diseases/${diseaseId}/`),
};

// ── Analyses ──────────────────────────────────────────────────────────────────
export const analysesAPI = {
    scan:               (data) => api.post('/analyses/scan/', data),
    getAll:             ()     => api.get('/analyses/'),
    getById:            (id)   => api.get(`/analyses/${id}/`),
    delete:             (id)   => api.delete(`/analyses/${id}/`),
    getMy:              ()     => api.get('/analyses/my/'),
    getMyRecent:        ()     => api.get('/analyses/my/recent/'),
    getMySummary:       ()     => api.get('/analyses/my/summary/'),
    exportPdf:          ()     => api.get('/analyses/export/pdf/', { responseType: 'blob' }),
    exportReport:       (id)   => api.get(`/analyses/${id}/report/pdf/`, { responseType: 'blob' }),
    generateTreatments: (id)   => api.post(`/analyses/${id}/generate-treatments/`),
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const dashboardAPI = {
    getOverview:            () => api.get('/dashboard/overview/'),
    getSummary:             () => api.get('/dashboard/summary/'),
    getMonthlyTrend:        () => api.get('/dashboard/monthly-trend/'),
    getDiseaseDistribution: () => api.get('/dashboard/disease-distribution/'),
    getRecentAnalyses:      () => api.get('/dashboard/recent-analyses/'),
    getTopDetectedDiseases: () => api.get('/dashboard/top-detected-diseases/'),
};

// ── Statistics (Admin only) ───────────────────────────────────────────────────
export const statisticsAPI = {
    getOverview:            () => api.get('/statistics/overview/'),
    getAnalysesByMonth:     () => api.get('/statistics/analyses-by-month/'),
    getDiseasesByCategory:  () => api.get('/statistics/diseases-by-category/'),
    getUserGrowth:          () => api.get('/statistics/user-growth/'),
    getDetectionAccuracy:   () => api.get('/statistics/detection-accuracy/'),
    getTopDetectedDiseases: () => api.get('/statistics/top-detected-diseases/'),
};

export default api;