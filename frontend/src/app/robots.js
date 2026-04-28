/**
 * Next.js App Router robots.txt — auto-served at /robots.txt
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.finlogiccapital.com";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/about",
          "/philosophy",
          "/contact",
          "/investors",
          "/entrepreneurs",
          "/portfolio",
          "/insights",
          "/insights/articles",
          "/insights/courses",
          "/insights/webinars",
        ],
        disallow: [
          "/auth/",
          "/gp/",
          "/lp/",
          "/entrepreneur/",
          "/gp-investor/",
          "/portfolio-co/",
          "/admin/",
          "/api/",
          "/invite/",
          "/documents/",
          "/meetings/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host:    SITE_URL,
  };
}
