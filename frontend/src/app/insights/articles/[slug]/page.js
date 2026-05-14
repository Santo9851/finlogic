
"use client";

import { useState, useEffect, useRef, useCallback, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft, Clock, User, Calendar, Linkedin, Twitter,
  Link2, List, X, ChevronLeft, ChevronRight, Download, Lock, CheckCircle2,
} from "lucide-react";
import { 
  fetchArticle, 
  fetchArticles, 
  fetchSeriesDetail,
  completeArticle,
  normaliseList, 
  PILLAR_LABELS, 
  PILLAR_COLORS 
} from "@/services/insights";
import ArticleTOC, { extractHeadings, injectHeadingIds } from "@/components/ArticleTOC";
import Cliffhanger from "@/components/insights/Cliffhanger";
import { useAuth } from "@/lib/AuthContext";
import { useTheme } from "next-themes";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.finlogiccapital.com";

function Skeleton({ className = "" }) {
  return <div className={`animate-pulse dark:bg-ls-white/5 bg-ls-primary/5 rounded-none ${className}`} />;
}

function ReadingProgress({ color }) {
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
    <div className="fixed top-0 left-0 w-full h-[4px] bg-foreground/[0.05] z-[60]">
      <motion.div className="h-full" style={{ width: `${p}%`, backgroundColor: color }} />
    </div>
  );
}

function RelatedCard({ article }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const defaultAccent = "#F59F01";
  const color = PILLAR_COLORS[article.pillar?.toLowerCase()] || defaultAccent;
  const date = article.published_at
    ? new Date(article.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "";

  return (
    <Link href={`/insights/articles/${article.slug}`}
      className={`group flex gap-6 p-6 rounded-none border dark:border-ls-white/5 border-ls-primary/5 hover:border-ls-compliment/30 hover:bg-ls-compliment/[0.02] transition-all theme-transition shadow-sm`}
    >
      {article.featured_image && (
        <div className="w-24 h-24 rounded-none overflow-hidden flex-shrink-0 border dark:border-ls-white/5 border-ls-primary/5 shadow-inner">
          <img src={article.featured_image} alt={article.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
        </div>
      )}
      <div className="min-w-0 space-y-2">
        <span className="text-[9px] font-bold uppercase tracking-[0.4em]" style={{ color }}>{article.pillar}</span>
        <h4 className="font-serif font-light dark:text-[#f8fafc] text-[#100226] text-sm leading-snug group-hover:text-ls-compliment transition-colors line-clamp-2">{article.title}</h4>
        <p className="dark:text-ls-white/20 text-ls-primary/30 text-[9px] font-mono uppercase tracking-[0.2em]">{date}</p>
      </div>
    </Link>
  );
}

function MobileTOC({ headings, accentColor, open, onClose, articleRef }) {
  const scrollTo = (id) => { 
    onClose();
    setTimeout(() => {
      let el = document.getElementById(id);
      if (!el) {
        const headingIndex = parseInt(id.split('-')[1]);
        const articleDiv = articleRef.current;
        if (articleDiv) {
          const allHeadings = articleDiv.querySelectorAll('h2, h3, h4');
          el = allHeadings[headingIndex];
        }
      }
      if (el) {
        const yOffset = -120; 
        const y = el.getBoundingClientRect().top + window.scrollY + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }, 350);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-background/80 backdrop-blur-xl" />
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30 }}
            className="relative w-full bg-card border-t border-border-theme rounded-t-[3rem] p-10 max-h-[85vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-8">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted">Table of Contents</span>
              <button onClick={onClose} className="p-3 rounded-2xl bg-foreground/5 hover:bg-foreground/10 transition-all border border-border-theme"><X size={20} className="text-text-muted" /></button>
            </div>
            <div className="space-y-2">
              {headings.map(h => (
                <button 
                  key={h.id} 
                  onClick={() => scrollTo(h.id)}
                  className={`block w-full text-left py-4 px-6 rounded-2xl transition-all active:scale-[0.98]
                    ${h.level >= 3 ? "pl-12 text-text-muted text-xs font-medium" : "font-black text-foreground text-sm uppercase tracking-tight hover:bg-foreground/[0.03]"}`}
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

export default function ArticleDetailPage({ params }) {
  const { slug } = use(params);
  const { user } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  
  const [article, setArticle]     = useState(null);
  const [seriesData, setSeriesData] = useState(null);
  const [related, setRelated]     = useState([]);
  const [headings, setHeadings]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(false);
  const [copied, setCopied]       = useState(false);
  const [tocOpen, setTocOpen]     = useState(false);
  const [completing, setCompleting] = useState(false);
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
        if (art?.series_info?.slug) {
          const series = await fetchSeriesDetail(art.series_info.slug);
          setSeriesData(series);
        }
        const all = normaliseList(others).filter(a => a.slug !== slug);
        const samePillar = all.filter(a => a.pillar === art.pillar);
        setRelated([...samePillar, ...all.filter(a => a.pillar !== art.pillar)].slice(0, 3));
        if (art?.full_content) setHeadings(extractHeadings(art.full_content));
      } catch { setError(true); }
      finally { setLoading(false); }
    }
    if (slug) { window.scrollTo(0, 0); load(); }
  }, [slug]);

  useEffect(() => {
    if (!loading && article?.full_content) {
      document.title = `${article.title} | Finlogic Capital`;
      requestAnimationFrame(() => injectHeadingIds(articleRef));
    }
  }, [loading, article]);

  const handleComplete = async () => {
    if (!user || completing || article.is_completed) return;
    setCompleting(true);
    try {
      await completeArticle(slug);
      setArticle(prev => ({ ...prev, is_completed: true }));
    } catch (e) { console.error("Failed to mark article as completed", e); }
    finally { setCompleting(false); }
  };

  const getSeriesNav = () => {
    if (!seriesData || !article?.article_number) return { prev: null, next: null };
    const articles = seriesData.articles || [];
    const sorted = [...articles].sort((a, b) => a.article_number - b.article_number);
    const idx = sorted.findIndex(a => a.slug === slug);
    return {
      prev: idx > 0 ? sorted[idx - 1] : null,
      next: idx < sorted.length - 1 ? sorted[idx + 1] : null
    };
  };

  const { prev, next } = getSeriesNav();
  const accentColor = isDark ? "#F59F01" : "#0B6EC3";
  const color = PILLAR_COLORS[article?.pillar?.toLowerCase()] || accentColor;
  const displayDate = article?.published_at
    ? new Date(article.published_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "";

  const handleCopy = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };
  const shareX = () => article && window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(window.location.href)}`, "_blank");
  const shareLI = () => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, "_blank");

  if (error) return (
    <div className="dark:bg-[#100226] bg-[#fdf6ff] dark:text-[#f8fafc] text-[#100226] min-h-screen flex items-center justify-center theme-transition relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none dark:opacity-[0.03] opacity-[0.08] z-0">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#F59F01 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>
      <div className="relative z-10 text-center p-20 border dark:border-ls-white/10 border-ls-primary/10 dark:bg-[#100226] bg-white shadow-2xl max-w-2xl">
        <h3 className="text-4xl font-serif font-light mb-6 uppercase tracking-tight">Intelligence <br /> Not Found</h3>
        <p className="dark:text-ls-white/40 text-ls-primary/40 mb-12 font-serif italic text-lg">The requested research paper is no longer in the public registry or is restricted for internal review.</p>
        <Link href="/insights/articles" className="inline-block px-12 py-5 bg-ls-compliment text-ls-primary text-[10px] font-bold uppercase tracking-[0.4em] hover:bg-ls-primary hover:text-white transition-all">← Return to Catalog</Link>
      </div>
    </div>
  );

  return (
    <div className="dark:bg-[#100226] bg-[#fdf6ff] dark:text-[#f8fafc] text-[#100226] min-h-screen theme-transition selection:bg-ls-compliment/30 relative overflow-hidden">
      {/* Institutional Background Grid */}
      <div className="fixed inset-0 pointer-events-none dark:opacity-[0.03] opacity-[0.08] z-0">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#F59F01 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
      </div>

      <ReadingProgress color={accentColor} />

      {/* Mobile TOC floating button */}
      {!loading && headings.length > 0 && (
        <button onClick={() => setTocOpen(true)}
          className={`lg:hidden fixed bottom-8 right-8 z-[90] flex items-center gap-3 px-8 py-5 rounded-none border dark:border-ls-white/10 border-ls-primary/10 dark:bg-[#100226] bg-white text-ls-compliment font-bold text-[10px] uppercase tracking-[0.4em] shadow-2xl active:scale-95 transition-all`}
        >
          <List size={18} strokeWidth={3} /> Contents
        </button>
      )}
      
      <MobileTOC 
        headings={headings} 
        accentColor={color} 
        open={tocOpen} 
        onClose={() => setTocOpen(false)} 
        articleRef={articleRef}
      />

      <div className="container mx-auto px-4 lg:px-12 pt-40 pb-40 max-w-7xl relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-16">
          <Link href="/insights/articles" className="inline-flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.4em] dark:text-ls-white/40 text-ls-primary/40 hover:text-ls-compliment transition-all">
            <ArrowLeft size={16} /> Back to Catalog
          </Link>
          
          {!loading && article?.series_info && (
            <div className="flex items-center gap-6 px-8 py-3 border dark:border-ls-white/10 border-ls-primary/10 dark:bg-ls-white/5 bg-ls-primary/5 text-[10px] font-bold uppercase tracking-[0.4em]">
              <Link href={`/insights/series/${article.series_info.slug}`} className="dark:text-ls-white/40 text-ls-primary/40 hover:text-ls-compliment transition-all">
                {article.series_info.title}
              </Link>
              <div className="w-px h-4 bg-ls-compliment/20" />
              <span className="text-ls-compliment">Chapter {article.article_number}</span>
            </div>
          )}
        </div>

        <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-20 items-start">

          <article className="min-w-0">
            {loading ? (
              <div className="space-y-6 mb-12">
                <Skeleton className="h-6 w-32" /><Skeleton className="h-20 w-full" /><Skeleton className="h-10 w-4/5" />
              </div>
            ) : (
              <header className="mb-24">
                <div className="flex items-center gap-6 mb-12">
                  <span className="inline-block px-6 py-2 border text-[10px] font-bold uppercase tracking-[0.4em]"
                    style={{ borderColor: `${color}30`, background: `${color}05`, color }}
                  >
                    {PILLAR_LABELS[article.pillar?.toLowerCase()] || article.pillar}
                  </span>
                  {article.is_completed && (
                    <span className="inline-flex items-center gap-2 px-6 py-2 border border-emerald-500/20 bg-emerald-500/5 text-emerald-500 text-[10px] font-bold uppercase tracking-[0.4em]">
                      <CheckCircle2 size={12} /> Completed Analysis
                    </span>
                  )}
                </div>
                
                <h1 className="text-5xl md:text-8xl font-serif font-light leading-[1.1] tracking-tight mb-12 dark:text-[#f8fafc] text-[#100226]">{article.title}</h1>
                
                {article.excerpt && (
                  <p className="text-2xl md:text-3xl dark:text-ls-white/60 text-ls-primary/60 leading-relaxed mb-16 border-l-2 pl-12 font-serif font-light italic" style={{ borderColor: `${color}30` }}>
                    {article.excerpt}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-between border-y dark:border-ls-white/10 border-ls-primary/10 py-10 gap-8">
                  <div className="flex flex-wrap items-center gap-12 text-[10px] font-bold uppercase tracking-[0.3em]">
                    <span className="flex items-center gap-4 dark:text-[#f8fafc] text-[#100226]">
                      <User size={16} className="dark:text-ls-white/20 text-ls-primary/20" /> {article.author_name || "Research Team"}
                    </span>
                    {displayDate && <span className="flex items-center gap-4 dark:text-ls-white/40 text-ls-primary/40"><Calendar size={16} className="opacity-40" /> {displayDate}</span>}
                    {article.read_time && <span className="flex items-center gap-4 dark:text-ls-white/40 text-ls-primary/40"><Clock size={16} className="opacity-40" /> {article.read_time}</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={shareLI} className="p-3 rounded-2xl bg-foreground/5 hover:bg-[#0B6EC3]/10 hover:text-[#0B6EC3] transition-all text-text-muted"><Linkedin size={18} /></button>
                    <button onClick={shareX} className="p-3 rounded-2xl bg-foreground/5 hover:bg-[#F59F01]/10 hover:text-[#F59F01] transition-all text-text-muted"><Twitter size={18} /></button>
                    <button onClick={handleCopy} className="relative p-3 rounded-2xl bg-foreground/5 hover:bg-foreground/10 transition-all text-text-muted">
                      <Link2 size={18} />
                      {copied && <span className="absolute -top-10 left-1/2 -translate-x-1/2 text-[10px] bg-foreground text-background px-3 py-1 rounded-full font-black uppercase tracking-widest whitespace-nowrap shadow-2xl">Link Copied</span>}
                    </button>
                  </div>
                </div>
              </header>
            )}

            {loading ? <Skeleton className="w-full aspect-video rounded-[3rem] mb-16" /> :
              article?.featured_image && (
                <div className="w-full aspect-video rounded-[3rem] overflow-hidden mb-20 shadow-[0_48px_96px_-24px_rgba(0,0,0,0.25)] border border-border-theme/50">
                  <img src={article.featured_image} alt={article.title} className="w-full h-full object-cover" />
                </div>
              )
            }

            <div className="max-w-4xl">
              {loading ? (
                <div className="space-y-6">
                  {[...Array(12)].map((_, i) => <Skeleton key={i} className={`h-4 ${i % 5 === 4 ? "w-2/3" : "w-full"}`} />)}
                </div>
              ) : article?.access_level === "cliffhanger" ? (
                <div className="space-y-12">
                  <div className="article-body opacity-40 select-none pointer-events-none mask-fade-bottom scale-[0.98] origin-top blur-[1px]">
                    {article.snippet && <div dangerouslySetInnerHTML={{ __html: article.snippet }} />}
                  </div>
                  <Cliffhanger 
                    title={article.title}
                    teaserBullets={article.teaser_bullets}
                    seriesSlug={article.slug}
                    ctaType={user ? "subscribe" : "register"}
                  />
                </div>
              ) : article?.full_content ? (
                <>
                  <motion.div ref={articleRef} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}
                    className="article-body font-serif leading-[1.9] text-xl lg:text-2xl dark:text-ls-white/80 text-ls-primary/80 selection:bg-ls-compliment/20"
                    dangerouslySetInnerHTML={{ __html: article.full_content }}
                  />

                  {user && !article.is_completed && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}
                      className={`mt-24 p-12 rounded-[3rem] ${isDark ? 'bg-[#16c784]/5' : 'bg-ls-secondary/5'} border border-emerald-500/20 flex flex-col items-center text-center shadow-2xl theme-transition`}
                    >
                      <div className="w-20 h-20 rounded-[2rem] bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-8 shadow-inner">
                         <CheckCircle2 size={44} strokeWidth={3} />
                      </div>
                      <h4 className="text-3xl font-black text-foreground mb-4 uppercase tracking-tight">Institutional Milestone</h4>
                      <p className="text-text-muted mb-10 text-lg font-medium max-w-md">Mark this intelligence module as completed to update your curriculum progress.</p>
                      <button 
                        onClick={handleComplete}
                        disabled={completing}
                        className={`px-12 py-5 rounded-2xl ${isDark ? 'bg-[#16c784]' : 'bg-[#0B6EC3]'} text-white text-xs font-black uppercase tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50`}
                      >
                        {completing ? "Archiving..." : "Mark as Completed"}
                      </button>
                    </motion.div>
                  )}

                  {article.tools && article.tools.length > 0 && (
                    <div className="mt-32">
                      <h3 className="text-2xl font-black uppercase tracking-tighter mb-12 flex items-center gap-4">
                        <Download size={28} className={isDark ? "text-[#F59F01]" : "text-[#0B6EC3]"} /> Intelligence Resources
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {article.tools.map(tool => {
                          const hasAccess = !tool.requires_subscription || (user && (user.roles?.includes('investor') || user.roles?.includes('admin')));
                          return (
                            <div key={tool.id} className="p-8 rounded-[2rem] bg-card border border-border-theme hover:border-foreground/20 transition-all group shadow-lg">
                              <div className="flex justify-between items-center mb-6">
                                <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'bg-[#F59F01]/10 text-[#F59F01]' : 'bg-[#0B6EC3]/10 text-[#0B6EC3]'} px-3 py-1 rounded-full`}>
                                  {tool.file_type}
                                </span>
                                {!hasAccess && <Lock size={16} className="text-text-muted opacity-40" />}
                              </div>
                              <h4 className="font-black text-foreground text-lg mb-3 group-hover:text-[#F59F01] transition-colors uppercase tracking-tight leading-tight">{tool.title}</h4>
                              <p className="text-text-muted text-sm mb-8 line-clamp-2 font-medium opacity-60">{tool.description}</p>
                              
                              {hasAccess ? (
                                <a href={tool.file} download className="inline-flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-foreground hover:text-[#F59F01] transition-all">
                                  <Download size={14} /> Download Asset
                                </a>
                              ) : (
                                <Link href="/investors" className="inline-flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#F59F01] hover:underline">
                                  Unlock Intelligence
                                </Link>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              ) : <p className="text-text-muted text-center py-32 font-medium italic opacity-40">Intelligence content encrypted or unavailable.</p>}
            </div>
          </article>

          <aside className="hidden lg:block sticky top-32 space-y-12">
            {!loading && headings.length > 0 && <ArticleTOC headings={headings} accentColor={accentColor} />}
            
            {!loading && (
              <div className="p-8 rounded-[2.5rem] bg-card border border-border-theme space-y-6 shadow-xl">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted/40 mb-2">Annotation Guide</h4>
                {[
                  { cls: "callout-data",    label: "Critical Data", color: "#F59F01" },
                  { cls: "callout-key",     label: "Strategic Pillar",  color: "#16c784" },
                  { cls: "callout-insight", label: "Thesis Insight",  color: "#a855f7" },
                  { cls: "callout-quote",   label: "Key Quote",    color: "var(--foreground)" },
                ].map(({ cls, label, color: c }) => (
                  <div key={cls} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-text-muted/60">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-inner" style={{ background: c }} />
                    {label}
                  </div>
                ))}
              </div>
            )}

            {related.length > 0 && (
              <div className="space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted/40">Contextual Intelligence</h4>
                <div className="space-y-4">{related.map(a => <RelatedCard key={a.id} article={a} />)}</div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
