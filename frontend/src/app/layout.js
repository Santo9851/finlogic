import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Layout from "@/components/Layout";
import { AuthProvider } from "@/lib/AuthContext";
import QueryProvider from "@/lib/QueryProvider";
import { Toaster } from "sonner";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.finlogiccapital.com";

// ─── Global / root metadata (overridden per-page via generatePageMeta) ────────
export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Finlogic Capital | Where Vision Meets Wisdom",
    template: "%s | Finlogic Capital",
  },
  description:
    "Finlogic Capital Limited is a Kathmandu-based private equity firm institutionalising deal origination, evaluation, and capital deployment across Nepal's high-growth sectors.",
  keywords:
    "private equity Nepal, Finlogic Capital, Nepal investment firm, Kathmandu PE, emerging markets South Asia, venture capital Nepal",
  authors: [{ name: "Finlogic Capital", url: SITE_URL }],
  creator: "Finlogic Capital Limited",
  publisher: "Finlogic Capital Limited",
  formatDetection: { email: false, address: false, telephone: false },

  alternates: { canonical: "/" },

  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },

  openGraph: {
    type:     "website",
    siteName: "Finlogic Capital",
    title:    "Finlogic Capital | Where Vision Meets Wisdom",
    description:
      "Nepal's premier private equity firm — institutionalising deal origination, evaluation, and capital deployment across high-growth emerging sectors.",
    url:    SITE_URL,
    locale: "en_US",
    images: [
      {
        url:    `${SITE_URL}/og-image.png`,
        width:  1200,
        height: 630,
        alt:    "Finlogic Capital — Where Vision Meets Wisdom",
      },
    ],
  },

  twitter: {
    card:        "summary_large_image",
    site:        "@finlogiccap",
    title:       "Finlogic Capital | Where Vision Meets Wisdom",
    description:
      "Nepal's premier private equity firm — institutionalising deal origination and capital deployment across high-growth sectors.",
    images: [`${SITE_URL}/og-image.png`],
  },

  icons: {
    icon:        [{ url: "/favicon.ico" }, { url: "/icon-32.png", sizes: "32x32", type: "image/png" }],
    apple:       [{ url: "/apple-touch-icon.png" }],
    shortcut:    "/favicon.ico",
  },

  manifest: "/manifest.json",

  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "",
  },
};

// ─── Organisation JSON-LD schema ──────────────────────────────────────────────
const orgSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Finlogic Capital Limited",
  url: SITE_URL,
  logo: `${SITE_URL}/og-image.png`,
  description:
    "Finlogic Capital Limited is a Kathmandu-based private equity firm institutionalising deal origination, evaluation, and capital deployment across Nepal's high-growth sectors.",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Kathmandu",
    addressCountry: "NP",
  },
  sameAs: [
    "https://www.linkedin.com/company/finlogiccapital",
    "https://twitter.com/finlogiccap",
  ],
  foundingDate: "2024",
  areaServed: ["NP", "IN", "BD"],
};

// ─── Website JSON-LD schema ───────────────────────────────────────────────────
const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Finlogic Capital",
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/insights/articles?search={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        {/* Preconnect for perf */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://images.unsplash.com" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <QueryProvider>
          <AuthProvider>
            <Layout>{children}</Layout>
          </AuthProvider>
        </QueryProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
