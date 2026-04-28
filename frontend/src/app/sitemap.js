/**
 * Next.js App Router sitemap — auto-served at /sitemap.xml
 * Dynamic article/course slugs are fetched from the API at build/ISR time.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.finlogiccapital.com";
const API_BASE  = process.env.NEXT_PUBLIC_API_URL  || "http://backend:8000/api";

async function fetchSlugs(endpoint) {
  try {
    const res = await fetch(`${API_BASE}/${endpoint}/`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    const items = Array.isArray(data) ? data : (data.results || []);
    return items.map(i => i.slug).filter(Boolean);
  } catch {
    return [];
  }
}

export default async function sitemap() {
  const [articleSlugs, courseSlugs] = await Promise.all([
    fetchSlugs("insights/articles"),
    fetchSlugs("insights/courses"),
  ]);

  const now = new Date().toISOString();

  const staticPages = [
    { url: SITE_URL,                        lastModified: now, changeFrequency: "monthly",  priority: 1.0 },
    { url: `${SITE_URL}/about`,             lastModified: now, changeFrequency: "monthly",  priority: 0.8 },
    { url: `${SITE_URL}/philosophy`,        lastModified: now, changeFrequency: "monthly",  priority: 0.7 },
    { url: `${SITE_URL}/contact`,           lastModified: now, changeFrequency: "yearly",   priority: 0.6 },
    { url: `${SITE_URL}/investors`,         lastModified: now, changeFrequency: "monthly",  priority: 0.8 },
    { url: `${SITE_URL}/entrepreneurs`,     lastModified: now, changeFrequency: "monthly",  priority: 0.8 },
    { url: `${SITE_URL}/portfolio`,         lastModified: now, changeFrequency: "monthly",  priority: 0.7 },
    { url: `${SITE_URL}/insights`,          lastModified: now, changeFrequency: "weekly",   priority: 0.9 },
    { url: `${SITE_URL}/insights/articles`, lastModified: now, changeFrequency: "daily",    priority: 0.9 },
    { url: `${SITE_URL}/insights/courses`,  lastModified: now, changeFrequency: "weekly",   priority: 0.8 },
    { url: `${SITE_URL}/insights/webinars`, lastModified: now, changeFrequency: "weekly",   priority: 0.8 },
  ];

  const articlePages = articleSlugs.map(slug => ({
    url:              `${SITE_URL}/insights/articles/${slug}`,
    lastModified:     now,
    changeFrequency:  "monthly",
    priority:         0.85,
  }));

  const coursePages = courseSlugs.map(slug => ({
    url:             `${SITE_URL}/insights/courses/${slug}`,
    lastModified:    now,
    changeFrequency: "monthly",
    priority:        0.75,
  }));

  return [...staticPages, ...articlePages, ...coursePages];
}
