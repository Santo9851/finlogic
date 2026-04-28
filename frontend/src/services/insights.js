import api from './api';

// ─── Articles ────────────────────────────────────────────────────────────────

export async function fetchArticles({ search = '', pillar = '', ordering = '-published_at', page = 1 } = {}) {
  const params = { ordering, page };
  if (search) params.search = search;
  if (pillar) params.pillar = pillar;
  const res = await api.get('/insights/articles/', { params });
  return res.data;
}

export async function fetchArticle(slug) {
  const res = await api.get(`/insights/articles/${slug}/`);
  return res.data;
}

export async function fetchFeaturedArticle() {
  const res = await api.get('/insights/articles/', { params: { featured: '1' } });
  const data = res.data;
  // Handle paginated or plain array
  const results = Array.isArray(data) ? data : (data.results || []);
  return results[0] || null;
}

// ─── Courses ─────────────────────────────────────────────────────────────────

export async function fetchCourses({ search = '', level = '', pillar = '' } = {}) {
  const params = {};
  if (search) params.search = search;
  if (level)  params.level  = level;
  if (pillar) params.pillar = pillar;
  const res = await api.get('/insights/courses/', { params });
  return res.data;
}

export async function fetchCourse(slug) {
  const res = await api.get(`/insights/courses/${slug}/`);
  return res.data;
}

// ─── Webinars ─────────────────────────────────────────────────────────────────

export async function fetchWebinars({ upcoming, past, search = '' } = {}) {
  const params = {};
  if (upcoming) params.upcoming = '1';
  if (past)     params.past     = '1';
  if (search)   params.search   = search;
  const res = await api.get('/insights/webinars/', { params });
  return res.data;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function normaliseList(data) {
  // API may return paginated { results: [...] } or plain []
  if (!data) return [];
  return Array.isArray(data) ? data : (data.results || []);
}

export const PILLAR_LABELS = {
  vision:      'Unconventional Vision',
  growth:      'Wisdom-Backed Growth',
  leadership:  'Leadership Activation',
  insight:     'Deep Insight',
  partnership: 'Harmonious Partnerships',
};

export const PILLAR_COLORS = {
  vision:      '#F59F01',
  growth:      '#16c784',
  leadership:  '#0B6EC3',
  insight:     '#a855f7',
  partnership: '#f43f5e',
};
