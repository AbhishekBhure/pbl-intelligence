import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// ─── Dashboard ───────────────────────────────────────────────────────────────
export const fetchDashboard = (params) =>
    api.get('/dashboard', { params });

export const fetchMoM = (params) =>
    api.get('/dashboard/mom', { params });

export const fetchFilterOptions = () =>
    api.get('/dashboard/filters');

// ─── Districts & Blocks ──────────────────────────────────────────────────────
export const fetchDistricts = (params) =>
    api.get('/districts', { params });

export const fetchBlocks = (params) =>
    api.get('/districts/blocks', { params });

// ─── Grants ──────────────────────────────────────────────────────────────────
export const fetchGrants = () =>
    api.get('/grants');

export const fetchGrantDetail = (grantId, month) =>
    api.get(`/grants/${grantId}`, { params: { month } });

export const generateNarrative = (grantId, month) =>
    api.post(`/grants/${grantId}/narrative`, { month });

// ─── Review ──────────────────────────────────────────────────────────────────
export const fetchReviewSummary = (params) =>
    api.get('/review/summary', { params });

export default api;