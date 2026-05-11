import axios from 'axios';

const BASE_URL = 'https://your-api.com/api'; // LATER: замени со вистински URL

const api = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});

// Праќа токен со секој request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('ls_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Auth
export const authAPI = {
    login:  (data) => api.post('/auth/login/', data),
    logout: ()     => api.post('/auth/logout/'),
};

// Diseases
export const diseasesAPI = {
    getAll:  ()        => api.get('/diseases/'),
    getById: (id)      => api.get(`/diseases/${id}/`),
    create:  (data)    => api.post('/diseases/', data),
    update:  (id, data)=> api.patch(`/diseases/${id}/`, data),
    delete:  (id)      => api.delete(`/diseases/${id}/`),
};

// Plants
export const plantsAPI = {
    getAll:  ()        => api.get('/plants/'),
    getById: (id)      => api.get(`/plants/${id}/`),
    create:  (data)    => api.post('/plants/', data),
    update:  (id, data)=> api.patch(`/plants/${id}/`, data),
    delete:  (id)      => api.delete(`/plants/${id}/`),
};

// Users
export const usersAPI = {
    getAll:  ()        => api.get('/users/'),
    getById: (id)      => api.get(`/users/${id}/`),
    create:  (data)    => api.post('/users/', data),
    update:  (id, data)=> api.patch(`/users/${id}/`, data),
    delete:  (id)      => api.delete(`/users/${id}/`),
};

// Analyses
export const analysesAPI = {
    getAll:       ()   => api.get('/analyses/'),
    getByUser:    (id) => api.get(`/analyses/?user_id=${id}`),
    delete:       (id) => api.delete(`/analyses/${id}/`),
};

// Dashboard stats
export const statsAPI = {
    getDashboard: () => api.get('/stats/dashboard/'),
};

export default api;