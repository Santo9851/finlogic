"use client";

import { useState, useEffect, useRef, useCallback, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft, Clock, User, Calendar, Linkedin, Twitter,
  Link2, List, X,
} from "lucide-react";
import { fetchArticle, fetchArticles, normaliseList, PILLAR_LABELS, PILLAR_COLORS } from "@/services/insights";
import ArticleTOC, { extractHeadings, injectHeadingIds } from "@/components/ArticleTOC";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.finlogiccapital.com";

function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-white/5 rounded-lg ${className}`} />;
}

// ── Reading progress bar ────────────────────────────────────────────────────
function ReadingProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const fn = () => {
      const el = document.documentElement;
      setP(el.scrollHeight - el.clientHeight > 0 ? (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100 : 0);
    };
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return (
    <div className="fixed top-0 left-0 w-full h-[3px] bg-white/5 z-[60]">
      <motion.div className="h-full bg-gradient-to-r from-[#F59F01] to-[#F59F01]/50" style={{ width: `${p}%` }} />
    </div>
  );
}

// ── Related article card ────────────────────────────────────────────────────
function RelatedCard({ article }) {
  const color = PILLAR_COLORS[article.pillar?.toLowerCase()] || "#F59F01";
  const date = article.published_at
    ? new Date(article.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "";
  return (
    <Link href={`/insights/articles/${article.slug}`}
      className="group flex gap-3 p-4 rounded-2xl border border-white/5 hover:border-[#F59F01]/20 hover:bg-[#F59F01]/5 transition-all"
    >
      {article.featured_image && (
        <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
          <img src={article.featured_image} alt={article.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        </div>
      )}
      <div className="min-w-0">
        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color }}>{article.pillar}</span>
        <h4 className="font-bold text-white text-xs leading-snug mt-0.5 group-hover:text-[#F59F01] transition-colors line-clamp-2">{article.title}</h4>
        <p className="text-white/30 text-[10px] mt-1">{date}</p>
      </div>
    </Link>
  );
}

// ── Mobile TOC drawer ───────────────────────────────────────────────────────
function MobileTOC({ headings, accentColor, open, onClose }) {
  const scrollTo = (id) => { 
    onClose();
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }); 
    }, 150);
  };
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30 }}
            className="relative w-full bg-[#0D0120] border-t border-white/10 rounded-t-3xl p-6 max-h-[70vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <span className="text-xs font-black uppercase tracking-widest text-white/50">In This Article</span>
              <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/10 transition-colors"><X size={16} className="text-white/50" /></button>
            </div>
            <div className="space-y-1">
              {headings.map(h => (
                <button key={h.id} onClick={() => scrollTo(h.id)}
                  className={`w-full text-left py-2 px-3 rounded-xl text-sm transition-all
                    ${h.level >= 3 ? "pl-7 text-white/50 text-xs" : "font-bold text-white/80"}`}
                >
                  {h.text}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────
export default function ArticleDetailPage({ params }) {
  const { slug } = use(params);
  const [article, setArticle]   = useState(null);
  const [related, setRelated]   = useState([]);
  const [headings, setHeadings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);
  const [copied, setCopied]     = useState(false);
  const [tocOpen, setTocOpen]   = useState(false);
  const articleRef = useRef(null);

  useEffect(() => {
    async function load() {
      setLoading(true); setError(false);
      try {
        const [art, others] = await Promise.all([
          fetchArticle(slug),
          fetchArticles({ ordering: "-published_at" }),
        ]);
        setArticle(art);
        const all = normaliseList(others).filter(a => a.slug !== slug);
        const samePillar = all.filter(a => a.pillar === art.pillar);
        setRelated([...samePillar, ...all.filter(a => a.pillar !== art.pillar)].slice(0, 3));
        if (art?.content) setHeadings(extractHeadings(art.content));
      } catch { setError(true); }
      finally { setLoading(false); }
    }
    if (slug) load();
  }, [slug]);

  // Inject IDs into real DOM after render
  useEffect(() => {
    if (!loading && article?.content) {
      document.title = `${article.title} | Finlogic Capital`;
      requestAnimationFrame(() => injectHeadingIds(articleRef));
    }
  }, [loading, article]);

  const color = PILLAR_COLORS[article?.pillar?.toLowerCase()] || "#F59F01";
  const displayDate = article?.published_at
    ? new Date(article.published_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "";

  const handleCopy = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };
  const shareX = () => article && window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(window.location.href)}`, "_blank");
  const shareLI = () => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, "_blank");

  const articleSchema = article ? {
    "@context": "https://schema.org", "@type": "Article",
    headline: article.title, description: article.excerpt || "",
    image: article.featured_image ? [article.featured_image] : [],
    datePublished: article.published_at || article.created_at,
    dateModified: article.updated_at || article.published_at,
    author: { "@type": "Person", name: article.author_name || "Finlogic Capital" },
    publisher: { "@type": "Organization", name: "Finlogic Capital", logo: { "@type": "ImageObject", url: `${SITE_URL}/og-image.png` } },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/insights/articles/${article?.slug}` },
  } : null;

  if (error) return (
    <div className="bg-[#100226] text-white min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-white/40 mb-4">Article not found.</p>
        <Link href="/insights/articles" className="text-[#F59F01] text-sm font-bold hover:underline">← Back to Articles</Link>
      </div>
    </div>
  );

  return (
    <div className="bg-[#100226] text-white min-h-screen">
      <ReadingProgress />

      {articleSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      )}

      {/* Mobile TOC floating button */}
      {!loading && headings.length > 0 && (
        <button onClick={() => setTocOpen(true)}
          className="lg:hidden fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-[#F59F01] text-[#100226] font-black text-xs shadow-2xl shadow-[#F59F01]/20 hover:scale-105 transition-transform"
        >
          <List size={15} /> Contents
        </button>
      )}
      <MobileTOC headings={headings} accentColor={color} open={tocOpen} onClose={() => setTocOpen(false)} />

      <div className="container mx-auto px-4 lg:px-8 pt-28 pb-24 max-w-6xl">
        <Link href="/insights/articles" className="inline-flex items-center gap-2 text-white/40 hover:text-[#F59F01] text-sm transition-colors mb-10">
          <ArrowLeft size={15} /> Back to Articles
        </Link>

        {/* Three-column layout: [article | toc+related] */}
        <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-14 items-start">

          {/* ── Main content column ─────────────────────────────────────── */}
          <div>
            {/* Header skeleton */}
            {loading ? (
              <div className="space-y-4 mb-10">
                <Skeleton className="h-5 w-24" /><Skeleton className="h-12 w-full" /><Skeleton className="h-8 w-4/5" /><Skeleton className="h-5 w-64" />
              </div>
            ) : (
              <motion.header initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
                <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4"
                  style={{ background: `${color}18`, color }}
                >
                  {PILLAR_LABELS[article.pillar?.toLowerCase()] || article.pillar}
                </span>
                <h1 className="text-3xl md:text-5xl font-black leading-tight mb-5">{article.title}</h1>
                {article.excerpt && (
                  <p className="text-xl text-white/55 leading-relaxed mb-7 border-l-4 pl-5" style={{ borderColor: `${color}60` }}>
                    {article.excerpt}
                  </p>
                )}

                {/* Meta + share row */}
                <div className="flex flex-wrap items-center justify-between border-y border-white/6 py-4 gap-4">
                  <div className="flex flex-wrap items-center gap-5 text-sm">
                    <span className="flex items-center gap-1.5 font-bold text-white">
                      <User size={13} className="text-white/40" /> {article.author_name || "Research Team"}
                    </span>
                    {displayDate && <span className="flex items-center gap-1.5 text-white/40"><Calendar size={12} /> {displayDate}</span>}
                    {article.read_time && <span className="flex items-center gap-1.5 text-white/40"><Clock size={12} /> {article.read_time}</span>}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-white/25 uppercase tracking-widest mr-1">Share</span>
                    <button onClick={shareLI} className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/40 hover:text-white"><Linkedin size={14} /></button>
                    <button onClick={shareX} className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/40 hover:text-white"><Twitter size={14} /></button>
                    <button onClick={handleCopy} className="relative p-2 rounded-full hover:bg-white/10 transition-colors text-white/40 hover:text-white">
                      <Link2 size={14} />
                      {copied && <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] bg-[#F59F01] text-black px-2 py-0.5 rounded font-bold whitespace-nowrap">Copied!</span>}
                    </button>
                  </div>
                </div>
              </motion.header>
            )}

            {/* Featured image */}
            {loading ? <Skeleton className="w-full aspect-video mb-10" /> :
              article?.featured_image && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
                  className="w-full aspect-video rounded-2xl overflow-hidden mb-12 shadow-2xl"
                >
                  <img src={article.featured_image} alt={article.title} className="w-full h-full object-cover" />
                </motion.div>
              )
            }

            {/* Article body */}
            {loading ? (
              <div className="space-y-3">
                {[...Array(10)].map((_, i) => <Skeleton key={i} className={`h-4 ${i % 4 === 3 ? "w-3/5" : "w-full"}`} />)}
              </div>
            ) : article?.content ? (
              <motion.div ref={articleRef} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="article-body"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />
            ) : (
              <p className="text-white/40 text-center py-20">Content not available.</p>
            )}

            {/* Author bio */}
            {!loading && article && (
              <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                className="mt-16 p-6 rounded-2xl flex flex-col sm:flex-row items-center sm:items-start gap-5"
                style={{ background: `${color}08`, border: `1px solid ${color}20` }}
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${color}18`, border: `1px solid ${color}30` }}
                >
                  <User size={22} style={{ color }} />
                </div>
                <div>
                  <h4 className="font-bold text-white mb-1">{article.author_name || "Finlogic Research"}</h4>
                  <p className="text-white/50 text-sm leading-relaxed">
                    Published by the Finlogic Capital Research & Investment Committee — bringing institutional-grade analysis to emerging markets across South Asia.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Mobile related */}
            {related.length > 0 && (
              <div className="lg:hidden mt-14 border-t border-white/5 pt-10">
                <h3 className="text-xl font-bold mb-5">Related Insights</h3>
                <div className="space-y-3">{related.map(a => <RelatedCard key={a.id} article={a} />)}</div>
              </div>
            )}
          </div>

          {/* ── Right sidebar ────────────────────────────────────────────── */}
          <aside className="hidden lg:block sticky top-28 space-y-6">
            {/* Scroll-spy TOC */}
            {!loading && headings.length > 0 && (
              <ArticleTOC headings={headings} accentColor={color} />
            )}
            {loading && <Skeleton className="h-48" />}

            {/* Callout legend card */}
            {!loading && (
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/6 space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Content Blocks Used</h4>
                {[
                  { cls: "callout-data",    label: "Data Point",    color: "#F59F01" },
                  { cls: "callout-key",     label: "Key Takeaway",  color: "#16c784" },
                  { cls: "callout-insight", label: "Deep Insight",  color: "#a855f7" },
                  { cls: "callout-quote",   label: "Pull Quote",    color: "#fff" },
                  { cls: "callout-stat",    label: "Statistic",     color: "#F59F01" },
                ].map(({ cls, label, color: c }) => (
                  <div key={cls} className="flex items-center gap-2 text-xs text-white/40">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c }} />
                    {label}
                  </div>
                ))}
              </div>
            )}

            {/* Related articles */}
            {related.length > 0 && (
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-white/35 mb-3">Related Insights</h4>
                <div className="space-y-3">{related.map(a => <RelatedCard key={a.id} article={a} />)}</div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
