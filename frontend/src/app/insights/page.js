"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight, BookOpen, Video, FileText,
  Search, Clock, User, Calendar, Play, Sparkles,
} from "lucide-react";
import { fetchArticles, fetchCourses, fetchWebinars, fetchSeriesList, fetchFeaturedArticle, normaliseList, PILLAR_COLORS } from "@/services/insights";
import { useTheme } from "next-themes";

function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-foreground/5 rounded-lg ${className}`} />;
}

function PillarBadge({ pillar }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";
  const defaultColor = isDark ? "#F59F01" : "#0B6EC3";
  const color = PILLAR_COLORS[pillar?.toLowerCase()] || defaultColor;
  return (
    <span
      className="inline-block border-l-2 pl-3 py-0 text-[9px] font-bold uppercase tracking-[0.3em] text-text-muted"
      style={{ borderLeftColor: color }}
    >
      {pillar || "Insight"}
    </span>
  );
}

function FeaturedHero({ article, loading, isDark }) {
  if (loading) {
    return (
      <div className="relative w-full rounded-none overflow-hidden">
        <Skeleton className="w-full aspect-[21/9]" />
      </div>
    );
  }
  if (!article) return null;

  const displayDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "";

  return (
    <Link
      href={`/insights/articles/${article.slug}`}
      className="relative block w-full overflow-hidden group theme-transition border border-border-theme"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12">
         <div className="lg:col-span-7 aspect-video lg:aspect-auto overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-1000 relative">
            {article.featured_image ? (
              <img
                src={article.featured_image}
                alt={article.title}
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full bg-ls-primary flex items-center justify-center">
                 <Sparkles className="w-20 h-20 text-ls-compliment opacity-20" />
              </div>
            )}
            <div className="absolute bottom-0 left-0 bg-ls-primary/80 backdrop-blur-md p-4">
               <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-ls-white/60">Registry Ref: INS-{article.id?.toString().padStart(4, '0')}</span>
            </div>
         </div>
         <div className="lg:col-span-5 p-12 md:p-20 flex flex-col justify-center space-y-8 bg-card group-hover:bg-ls-primary group-hover:text-ls-white transition-colors">
            <div className="space-y-6">
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-ls-compliment">Foundational Research</span>
              <h2 className="text-4xl md:text-6xl font-serif font-light leading-tight">
                {article.title}
              </h2>
              <p className="text-xl text-text-muted group-hover:text-ls-white/60 line-clamp-3 font-light leading-relaxed">
                {article.excerpt}
              </p>
            </div>
            
            <div className="pt-6 flex items-center justify-between border-t border-border-theme group-hover:border-ls-white/10 transition-colors">
               <div className="flex items-center space-x-6 text-[10px] font-bold uppercase tracking-widest text-text-muted group-hover:text-ls-white/40">
                  <span className="flex items-center gap-2"><User size={14} /> {article.author_name}</span>
                  <span className="flex items-center gap-2"><Clock size={14} /> {article.read_time}</span>
               </div>
               <ArrowRight className="w-6 h-6 text-ls-compliment transition-transform group-hover:translate-x-2" />
            </div>
         </div>
      </div>
    </Link>
  );
}

function SmallArticleCard({ article, isDark }) {
  const displayDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "";

  return (
    <Link
      href={`/insights/articles/${article.slug}`}
      className="group flex flex-col space-y-6 border border-border-theme p-10 hover:bg-ls-primary hover:text-ls-white transition-all duration-500"
    >
      <div className="space-y-4">
        <div className="flex justify-between items-center">
           <PillarBadge pillar={article.pillar} />
           <span className="text-[9px] font-mono opacity-40 group-hover:text-ls-white/40">REF-{article.id?.toString().padStart(3, '0')}</span>
        </div>
        <h3 className="text-2xl font-serif font-light leading-tight group-hover:text-ls-compliment transition-colors">
          {article.title}
        </h3>
        <p className="text-sm text-text-muted group-hover:text-ls-white/60 line-clamp-2 font-light leading-relaxed">
          {article.excerpt}
        </p>
      </div>
      <div className="pt-4 flex items-center justify-between border-t border-border-theme group-hover:border-ls-white/10 transition-colors">
         <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted group-hover:text-ls-white/40">{article.read_time}</span>
         <ArrowRight size={18} className="text-ls-compliment transition-transform group-hover:translate-x-2" />
      </div>
    </Link>
  );
}

function SeriesCard({ series, isDark }) {
  return (
    <Link href={`/insights/series/${series.slug}`}
      className="group flex flex-col border border-border-theme p-12 hover:bg-ls-primary hover:text-ls-white transition-all duration-500"
    >
      <div className="space-y-6 flex-1">
        <div className="flex items-center gap-4">
          <PillarBadge pillar={series.pillar} />
          <span className="text-[9px] font-bold text-text-muted uppercase tracking-[0.4em] group-hover:text-ls-white/40">Seq-ID: 0{series.id}</span>
        </div>
        <h3 className="text-3xl font-serif font-light leading-tight">
          {series.title}
        </h3>
        <p className="text-text-muted group-hover:text-ls-white/60 text-lg line-clamp-3 leading-relaxed font-light">
          {series.description}
        </p>
      </div>
      <div className="mt-12 flex items-center justify-between pt-8 border-t border-border-theme group-hover:border-ls-white/10">
        <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-text-muted group-hover:text-ls-white/40">
          <span className="flex items-center gap-2"><FileText size={14} /> {series.article_count} Units</span>
          <span className="flex items-center gap-2"><Clock size={14} /> Self-Paced</span>
        </div>
        <ArrowRight size={20} className="text-ls-compliment transition-transform group-hover:translate-x-2" />
      </div>
    </Link>
  );
}

function FilterTabs({ activeTab, setActiveTab, isDark }) {
  const tabs = [
    { id: 'all', label: 'All Intelligence' },
    { id: 'articles', label: 'Research Papers' },
    { id: 'sector-reports', label: 'Sector Research', href: '/insights/sector-reports' },
    { id: 'series', label: 'Learning Series' },
    { id: 'courses', label: 'Institutional Courses' },
    { id: 'webinars', label: 'Recorded Sessions' },
  ];

  return (
    <div className="flex flex-wrap justify-center gap-6 mb-16 border-b border-border-theme pb-8">
      {tabs.map((tab) => (
        tab.href ? (
          <Link
            key={tab.id}
            href={tab.href}
            className="text-[10px] font-bold uppercase tracking-[0.3em] transition-all duration-300 pb-2 border-b-2 border-transparent text-text-muted hover:text-ls-primary"
          >
            {tab.label}
          </Link>
        ) : (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`text-[10px] font-bold uppercase tracking-[0.3em] transition-all duration-300 pb-2 border-b-2 ${activeTab === tab.id
            ? 'border-ls-compliment text-ls-compliment font-bold'
            : 'border-transparent text-text-muted hover:text-ls-primary'
            }`}
        >
          {tab.label}
        </button>
        )
      ))}
    </div>
  );
}

export default function InsightsLandingPage() {
  const [featured, setFeatured] = useState(null);
  const [articles, setArticles] = useState([]);
  const [series, setSeries] = useState([]);
  const [courses, setCourses] = useState([]);
  const [webinars, setWebinars] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [activePillar, setActivePillar] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const pillarParam = activePillar === 'all' ? '' : activePillar;
      const [feat, art, ser, crs, web] = await Promise.all([
        fetchFeaturedArticle(),
        fetchArticles({ search: searchQuery, pillar: pillarParam, ordering: "-published_at" }),
        fetchSeriesList(),
        fetchCourses({ search: searchQuery, pillar: pillarParam }),
        fetchWebinars({ search: searchQuery }),
      ]);
      setFeatured(feat);
      setArticles(normaliseList(art));
      setSeries(normaliseList(ser));
      setCourses(normaliseList(crs));
      setWebinars(normaliseList(web));
    } catch (err) {
      console.error("Failed to load insights:", err);
    } finally {
      setLoading(false);
    }
  }, [activePillar, searchQuery]);

  useEffect(() => { loadData(); }, [loadData]);

  const showArticles = activeTab === 'all' || activeTab === 'articles';
  const showSeries = activeTab === 'all' || activeTab === 'series';
  const showWebinars = activeTab === 'all' || activeTab === 'webinars';
  const showCourses = activeTab === 'all' || activeTab === 'courses';

  const pillars = ['all', 'vision', 'growth', 'leadership', 'insight', 'partnership'];

  return (
    <div className="bg-background text-foreground min-h-screen pb-32 theme-transition selection:bg-ls-compliment/30 font-sans">

      {/* Hero Section */}
      <section className="relative pt-40 pb-24 bg-ls-primary text-ls-white">
        <div className="absolute inset-0 z-0 opacity-20 grayscale mix-blend-luminosity">
          <img src="/images/redesign/insight.png" className="w-full h-full object-cover" alt="Insights Hero" />
          <div className="absolute inset-0 bg-ls-primary/80" />
        </div>
        
        <div className="container mx-auto px-4 lg:px-8 relative z-10 text-center space-y-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-sm font-bold uppercase tracking-[0.4em] text-ls-compliment"
          >
            Market Intelligence & Wisdom
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-6xl md:text-9xl font-serif font-light leading-tight"
          >
            The Wisdom Hub
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-xl md:text-2xl text-ls-white/70 max-w-3xl mx-auto font-light leading-relaxed"
          >
            Proprietary investment frameworks, institutional analysis, and strategic learning sequences for the global frontier investor.
          </motion.p>

          {/* Search Box - Minimalist */}
          <div className="max-w-4xl mx-auto pt-10">
            <div className="relative group">
              <input
                type="text"
                placeholder="Search Intelligence..."
                className="w-full bg-transparent border-b border-ls-white/20 py-6 text-2xl font-serif font-light outline-none focus:border-ls-compliment transition-all placeholder:text-ls-white/20 text-ls-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 text-ls-white/20 group-focus-within:text-ls-compliment transition-colors" />
            </div>
            
            <div className="flex flex-wrap justify-center gap-6 mt-8">
              {pillars.map((p) => (
                <button
                  key={p}
                  onClick={() => setActivePillar(p)}
                  className={`text-[10px] font-bold uppercase tracking-[0.3em] transition-all duration-300 ${activePillar === p
                    ? 'text-ls-compliment'
                    : 'text-ls-white/40 hover:text-ls-white'
                    }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 lg:px-8 mt-24">
        
        <FilterTabs activeTab={activeTab} setActiveTab={setActiveTab} isDark={isDark} />

        {/* Featured Hero */}
        {/* Featured Hero - Only on 'All Intelligence' dashboard */}
        {activeTab === 'all' && !searchQuery && activePillar === 'all' && (
          <div className="mb-32">
            <FeaturedHero article={featured} loading={loading} isDark={isDark} />
          </div>
        )}

        <div className="space-y-32">
          {/* Series Section */}
          {showSeries && (series.length > 0 || loading) && (
            <section>
              <div className="mb-16 border-b border-border-theme pb-10">
                  <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-ls-compliment">Educational Paths</span>
                  <h2 className="text-5xl font-serif font-light mt-4">Learning Series</h2>
              </div>
              {loading ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-80" />)}
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 border-collapse">
                  {series.map((s) => <SeriesCard key={s.id} series={s} isDark={isDark} />)}
                </div>
              )}
            </section>
          )}

          {/* Articles Section */}
          {showArticles && (articles.length > 0 || loading) && (
            <section>
              <div className="mb-16 border-b border-border-theme pb-10 flex justify-between items-end">
                <div className="space-y-4">
                  <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-ls-compliment">Direct Research</span>
                  <h2 className="text-5xl font-serif font-light mt-4">Research Papers</h2>
                </div>
                <Link href="/insights/articles" className="text-xs font-bold uppercase tracking-[0.3em] text-ls-primary border-b border-ls-primary pb-1">View Full Catalog</Link>
              </div>
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-40" />)}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border-theme">
                  {articles.filter(a => a.id !== featured?.id).map((a) => <SmallArticleCard key={a.id} article={a} isDark={isDark} />)}
                </div>
              )}
            </section>
          )}

          {/* Webinars Section */}
          {showWebinars && (webinars.length > 0 || loading) && (
            <section>
              <div className="mb-16 border-b border-border-theme pb-10">
                  <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-ls-compliment">Visual Wisdom</span>
                  <h2 className="text-5xl font-serif font-light mt-4">Recorded Sessions</h2>
              </div>
              {loading ? (
                <div className="space-y-6">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32" />)}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-px bg-border-theme">
                  {webinars.map((w) => (
                    <div key={w.id} className="group p-12 bg-card hover:bg-ls-primary hover:text-ls-white transition-all flex flex-col md:flex-row gap-12 items-center">
                      <div className="w-16 h-16 border border-border-theme flex items-center justify-center flex-shrink-0 group-hover:border-ls-white/20">
                        <Play size={24} className="text-ls-compliment" />
                      </div>
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-text-muted group-hover:text-ls-white/40">
                           <span>{new Date(w.scheduled_at).toLocaleDateString()}</span>
                           <span className="h-1 w-1 bg-ls-compliment rounded-full" />
                           <span>{w.speaker}</span>
                        </div>
                        <h3 className="text-3xl font-serif font-light leading-tight">{w.title}</h3>
                      </div>
                      {w.recording_url && (
                        <a href={w.recording_url} target="_blank" className="border border-ls-primary px-10 py-6 text-[10px] font-bold uppercase tracking-[0.3em] group-hover:bg-ls-white group-hover:text-ls-primary transition-all">
                          Stream Analysis
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        {/* Empty State */}
        {!loading && articles.length === 0 && series.length === 0 && courses.length === 0 && webinars.length === 0 && (
          <div className="text-center py-48 border border-dashed border-border-theme">
            <Search size={64} className="mx-auto mb-10 text-text-muted/20" />
            <h3 className="text-3xl font-serif font-light mb-4">No intelligence found</h3>
            <p className="text-text-muted text-lg font-light">Adjust your criteria or explore our featured research above.</p>
            <button
              onClick={() => { setSearchQuery(''); setActivePillar('all'); setActiveTab('all'); }}
              className="mt-12 text-xs font-bold uppercase tracking-[0.3em] text-ls-primary border-b border-ls-primary pb-1"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
