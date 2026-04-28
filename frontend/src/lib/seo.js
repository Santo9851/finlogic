/**
 * Shared SEO utilities for Finlogic Capital
 *
 * Usage (static pages):
 *   export const metadata = generatePageMeta({ title, description, path, image })
 *
 * Usage (dynamic pages):
 *   export async function generateMetadata({ params }) { ... }
 */

const SITE = {
  name:        "Finlogic Capital",
  url:         process.env.NEXT_PUBLIC_SITE_URL || "https://www.finlogiccapital.com",
  description: "Finlogic Capital Limited is a Kathmandu-based private equity firm institutionalising deal origination, evaluation, and capital deployment across Nepal's high-growth sectors.",
  logo:        "/og-image.png",     // fallback OG image at /public/og-image.png
  twitterHandle: "@finlogiccap",
  locale:      "en_US",
};

/**
 * Build a full Next.js `metadata` object.
 *
 * @param {object} opts
 * @param {string}   opts.title       – Page-specific title (no site name)
 * @param {string}   [opts.description]
 * @param {string}   [opts.path]      – Relative canonical path, e.g. "/insights/articles"
 * @param {string}   [opts.image]     – Absolute URL or /public path for OG image
 * @param {string[]} [opts.keywords]
 * @param {string}   [opts.type]      – "website" | "article" (default "website")
 * @param {object}   [opts.article]   – { publishedTime, modifiedTime, author, section }
 * @param {boolean}  [opts.noIndex]   – Pass true for auth / private pages
 */
export function generatePageMeta({
  title,
  description = SITE.description,
  path        = "/",
  image       = SITE.logo,
  keywords    = [],
  type        = "website",
  article     = null,
  noIndex     = false,
} = {}) {
  const fullTitle   = title ? `${title} | ${SITE.name}` : `${SITE.name} | Where Vision Meets Wisdom`;
  const canonical   = `${SITE.url}${path}`;
  const ogImage     = image.startsWith("http") ? image : `${SITE.url}${image}`;

  return {
    metadataBase: new URL(SITE.url),
    title:        fullTitle,
    description,
    keywords: [
      "private equity Nepal",
      "Finlogic Capital",
      "Nepal investment",
      "Kathmandu PE firm",
      "emerging markets",
      ...keywords,
    ].join(", "),

    alternates: { canonical },

    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true, googleBot: { index: true, follow: true } },

    openGraph: {
      type,
      siteName:    SITE.name,
      title:       fullTitle,
      description,
      url:         canonical,
      locale:      SITE.locale,
      images: [{ url: ogImage, width: 1200, height: 630, alt: fullTitle }],
      ...(article && {
        publishedTime: article.publishedTime,
        modifiedTime:  article.modifiedTime,
        authors:       article.author ? [article.author] : [],
        section:       article.section || "Insights",
      }),
    },

    twitter: {
      card:        "summary_large_image",
      site:        SITE.twitterHandle,
      title:       fullTitle,
      description,
      images:      [ogImage],
    },
  };
}

export { SITE };
