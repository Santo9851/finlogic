// Server component — provides dynamic metadata for article detail pages
import { generatePageMeta, SITE } from "@/lib/seo";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://backend:8000/api";

async function getArticle(slug) {
  try {
    const res = await fetch(`${API_BASE}/insights/articles/${slug}/`, {
      next: { revalidate: 3600 }, // cache for 1 hour
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const article = await getArticle(params.slug);

  if (!article) {
    return generatePageMeta({
      title: "Article Not Found",
      description: "This article could not be found.",
      path: "/insights/articles",
      noIndex: true,
    });
  }

  const publishedTime = article.published_at || article.created_at;
  const modifiedTime  = article.updated_at || publishedTime;

  return generatePageMeta({
    title:       article.title,
    description: article.excerpt ||
      `Read "${article.title}" — an in-depth ${article.pillar || "insight"} by ${article.author_name || "Finlogic Capital"}.`,
    path:   `/insights/articles/${article.slug}`,
    image:  article.featured_image || `${SITE.url}/og-image.png`,
    type:   "article",
    keywords: [
      article.pillar,
      "Finlogic Capital article",
      "private equity Nepal",
      "emerging market insight",
    ].filter(Boolean),
    article: {
      publishedTime,
      modifiedTime,
      author:  article.author_name || "Finlogic Capital",
      section: article.pillar || "Insights",
    },
  });
}

// Re-export the client page component
export { default } from "./page";
