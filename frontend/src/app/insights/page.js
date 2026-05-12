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
  const isDark = resolvedTheme === "dark";
  const defaultColor = isDark ? "#F59F01" : "#0B6EC3";
  const color = PILLAR_COLORS[pillar?.toLowerCase()] || defaultColor;
  return (
    <span
      className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
      style={{ background: `${color}15`, color }}
    >
      {pillar || "Insight"}
    </span>
  );
}

function FeaturedHero({ article, loading, isDark, primaryAccent }) {
  if (loading) {
    return (
      <div className="relative w-full rounded-[3rem] overflow-hidden">
        <Skeleton className="w-full aspect-[21/9] rounded-[3rem]" />
      </div>
    );
  }
  if (!article) return null;

  const displayDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    : "";

  return (
    <Link
      href={`/insights/articles/${article.slug}`}
      className="relative block w-full rounded-[3rem] overflow-hidden group theme-transition shadow-2xl"
    >
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent z-10" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent z-10" />

      {article.featured_image ? (
        <img
          src={article.featured_image}
          alt={article.title}
          className="w-full aspect-video md:aspect-[21/9] object-cover group-hover:scale-105 transition-transform duration-1000 brightness-90 dark:brightness-75"
        />
      ) : (
        <div className="w-full aspect-video md:aspect-[21/9] bg-gradient-to-br from-ls-supporting to-background" />
      )}

      <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-20 z-20">
        <div className="max-w-4xl space-y-6">
          <div className="flex items-center gap-4">
            <span className={`px-4 py-1.5 rounded-full ${isDark ? 'bg-ls-compliment' : 'bg-ls-secondary'} text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl`}>
              Featured Research
            </span>
            {article.read_time && (
              <span className="text-foreground/60 text-xs font-black uppercase tracking-widest flex items-center gap-2 bg-background/50 backdrop-blur-md px-3 py-1 rounded-full border border-border-theme">
                <Clock size={12} /> {article.read_time}
              </span>
            )}
          </div>

          <h2 className={`text-4xl md:text-7xl font-black group-hover:text-ls-compliment transition-colors leading-[0.95] tracking-tighter text-foreground drop-shadow-sm uppercase`}>
            {article.title}
          </h2>

          <p className="text-lg md:text-xl text-text-muted max-w-3xl line-clamp-2 font-medium leading-relaxed">
            {article.excerpt}
          </p>

          <div className="flex flex-wrap items-center gap-8 text-[11px] font-black uppercase tracking-[0.2em] text-text-muted pt-4">
            {article.author_name && (
              <span className="flex items-center gap-3">
                <User size={16} className={isDark ? "text-ls-compliment" : "text-ls-secondary"} /> {article.author_name}
              </span>
            )}
            {displayDate && <span className="flex items-center gap-3"><Calendar size={16} className={isDark ? "text-ls-compliment" : "text-ls-secondary"} /> {displayDate}</span>}

            <div className={`flex items-center gap-2 ${isDark ? 'text-ls-compliment' : 'text-ls-secondary'} group-hover:translate-x-4 transition-transform`}>
              Read Analysis <ArrowRight size={16} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function SmallArticleCard({ article, isDark }) {
  const hoverAccent = isDark ? "hover:border-ls-compliment/50 hover:bg-ls-compliment/5" : "hover:border-ls-secondary/50 hover:bg-ls-secondary/5";
  const textAccent = isDark ? "group-hover:text-ls-compliment" : "group-hover:text-ls-secondary";

  const displayDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "";

  return (
    <Link
      href={`/insights/articles/${article.slug}`}
      className={`group flex gap-6 p-6 rounded-3xl border border-border-theme bg-card ${hoverAccent} transition-all duration-500 theme-transition shadow-lg hover:shadow-2xl`}
    >
      {article.featured_image && (
        <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 shadow-inner">
          <img src={article.featured_image} alt={article.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
        </div>
      )}
      <div className="flex-1 min-w-0 space-y-2">
        <PillarBadge pillar={article.pillar} />
        <h3 className={`text-base font-black text-foreground line-clamp-2 ${textAccent} transition-colors leading-tight uppercase tracking-tight`}>
          {article.title}
        </h3>
        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted/40">{displayDate} &bull; {article.read_time}</p>
      </div>
    </Link>
  );
}

function SeriesCard({ series, isDark }) {
  const accentColor = isDark ? "group-hover:text-ls-compliment" : "group-hover:text-ls-secondary";
  const buttonAccent = isDark ? "group-hover:bg-ls-compliment" : "group-hover:bg-ls-secondary";

  return (
    <Link href={`/insights/series/${series.slug}`}
      className="group relative flex flex-col rounded-[2.5rem] overflow-hidden border border-border-theme bg-card transition-all duration-500 hover:-translate-y-2 theme-transition shadow-xl hover:shadow-3xl"
    >
      <div className="p-10 flex flex-col h-full">
        <div className="flex items-center gap-3 mb-6">
          <PillarBadge pillar={series.pillar} />
          <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] opacity-40">Series</span>
        </div>
        <h3 className={`text-2xl font-black text-foreground mb-4 leading-none ${accentColor} transition-colors uppercase tracking-tighter`}>
          {series.title}
        </h3>
        <p className="text-text-muted text-sm mb-10 line-clamp-3 leading-relaxed font-medium">
          {series.description}
        </p>
        <div className="mt-auto flex items-center justify-between pt-8 border-t border-border-theme">
          <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-text-muted opacity-60">
            <span className="flex items-center gap-2"><FileText size={14} /> {series.article_count} Modules</span>
            <span className="flex items-center gap-2"><Clock size={14} /> Self-paced</span>
          </div>
          <div className={`w-12 h-12 rounded-2xl bg-foreground/5 flex items-center justify-center text-text-muted ${buttonAccent} group-hover:text-white transition-all shadow-inner`}>
            <ArrowRight size={20} />
          </div>
        </div>
      </div>
    </Link>
  );
}

function FilterTabs({ activeTab, setActiveTab, isDark }) {
  const activeBg = isDark ? 'bg-ls-compliment' : 'bg-ls-secondary';
  const activeShadow = isDark ? 'shadow-ls-compliment/20' : 'shadow-ls-secondary/20';

  const tabs = [
    { id: 'all', label: 'All Knowledge' },
    { id: 'articles', label: 'Research Papers' },
    { id: 'series', label: 'Learning Series' },
    { id: 'courses', label: 'Courses' },
    { id: 'webinars', label: 'Webinars' },
  ];

  return (
    <div className="flex flex-wrap justify-center gap-3 mb-16">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${activeTab === tab.id
            ? `${activeBg} text-white ${activeShadow} shadow-2xl scale-105`
            : 'bg-card text-text-muted hover:bg-foreground/5 hover:text-foreground border border-border-theme'
            }`}
        >
          {tab.label}
        </button>
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
  const isDark = resolvedTheme === "dark";
  const primaryAccent = isDark ? "text-ls-compliment" : "text-ls-secondary";

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

  const pillars = ['all', 'vision', 'growth', 'leadership', 'insight', 'partnership'];

  return (
    <div className="bg-background text-foreground min-h-screen pb-32 theme-transition selection:bg-ls-compliment/30">

      {/* Hero Section */}
      <section className="relative pt-36 pb-16 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className={`absolute top-0 left-1/4 w-[800px] h-[800px] ${isDark ? 'bg-ls-compliment/5' : 'bg-ls-secondary/5'} rounded-full blur-[160px] animate-pulse`} />
          <div className={`absolute bottom-0 right-0 w-[600px] h-[600px] ${isDark ? 'bg-ls-supporting/40' : 'bg-ls-secondary/10'} rounded-full blur-[120px]`} />
        </div>

        <div className="container mx-auto px-4 lg:px-8 relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className={`inline-flex items-center gap-3 px-6 py-2 rounded-full ${isDark ? 'bg-ls-compliment/10 border-ls-compliment/20 text-ls-compliment' : 'bg-ls-secondary/10 border-ls-secondary/20 text-ls-secondary'} border text-[10px] font-black uppercase tracking-[0.3em] mb-10 backdrop-blur-sm`}
          >
            <Sparkles size={16} /> Wisdom Hub Research
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-4xl md:text-[9rem] font-black mb-8 leading-[0.85] tracking-tighter text-foreground uppercase"
          >
            The
            <span className={isDark ? "text-ls-compliment" : "text-ls-secondary"}> Wisdom </span>Hub
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-xl md:text-2xl text-text-muted max-w-3xl mx-auto mb-20 font-medium leading-relaxed"
          >
            Proprietary investment frameworks, institutional analysis, and learning sequences for the global investor.
          </motion.p>

          {/* Search & Pillar Filters */}
          <div className="max-w-5xl mx-auto mb-20 space-y-10">
            <div className="relative group shadow-2xl rounded-[2.5rem]">
              <div className={`absolute inset-y-0 left-8 flex items-center pointer-events-none ${isDark ? 'group-focus-within:text-ls-compliment' : 'group-focus-within:text-ls-secondary'} text-text-muted/30 transition-colors`}>
                <Search size={28} strokeWidth={3} />
              </div>
              <input
                type="text"
                placeholder="Search institutional research, series, or courses..."
                className={`w-full h-24 bg-card border border-border-theme rounded-[2.5rem] pl-20 pr-10 text-xl outline-none ${isDark ? 'focus:border-ls-compliment/50' : 'focus:border-ls-secondary/50'} focus:bg-foreground/[0.03] transition-all placeholder:text-text-muted/20 theme-transition text-foreground font-bold shadow-inner`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              {pillars.map((p) => (
                <button
                  key={p}
                  onClick={() => setActivePillar(p)}
                  className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border transition-all duration-300 ${activePillar === p
                    ? `${isDark ? 'border-ls-compliment bg-ls-compliment' : 'border-ls-secondary bg-ls-secondary'} text-white shadow-xl`
                    : 'border-border-theme bg-card text-text-muted/60 hover:border-foreground/20 hover:text-foreground'
                    }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <FilterTabs activeTab={activeTab} setActiveTab={setActiveTab} isDark={isDark} />
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 lg:px-8 max-w-7xl">

        {/* Featured Hero */}
        {(activeTab === 'all' || activeTab === 'articles') && !searchQuery && activePillar === 'all' && (
          <div className="mb-32">
            <FeaturedHero article={featured} loading={loading} isDark={isDark} />
          </div>
        )}

        <div className="space-y-32">
          {/* Series Section */}
          {showSeries && (series.length > 0 || loading) && (
            <section className="animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 border-b border-border-theme pb-10">
                <div>
                  <h2 className="text-4xl font-black flex items-center gap-4 text-foreground uppercase tracking-tighter leading-none">
                    <BookOpen className={isDark ? "text-ls-compliment" : "text-ls-secondary"} size={40} /> Learning Series
                  </h2>
                  <p className="text-text-muted mt-4 text-lg font-medium">Structured sequences for investment mastery</p>
                </div>
              </div>
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-80 rounded-[2.5rem]" />)}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                  {series.map((s) => <SeriesCard key={s.id} series={s} isDark={isDark} />)}
                </div>
              )}
            </section>
          )}

          {/* Articles Section */}
          {showArticles && (articles.length > 0 || loading) && (
            <section className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 border-b border-border-theme pb-10">
                <div>
                  <h2 className="text-4xl font-black flex items-center gap-4 text-foreground uppercase tracking-tighter leading-none">
                    <FileText className="text-rose-500" size={40} /> Research Papers
                  </h2>
                  <p className="text-text-muted mt-4 text-lg font-medium">Deep institutional dives and market analysis</p>
                </div>
                <Link href="/insights/articles" className={`text-[10px] font-black uppercase tracking-[0.2em] px-8 py-3 rounded-2xl border border-border-theme hover:bg-foreground/5 transition-all`}>Explore Catalog</Link>
              </div>
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-40 rounded-[2rem]" />)}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {articles.filter(a => a.id !== featured?.id).map((a) => <SmallArticleCard key={a.id} article={a} isDark={isDark} />)}
                </div>
              )}
            </section>
          )}

          {/* Webinars Section */}
          {showWebinars && (webinars.length > 0 || loading) && (
            <section className="py-20 border-t border-border-theme animate-in fade-in slide-in-from-bottom-8">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
                <div>
                  <h2 className="text-4xl font-black flex items-center gap-4 text-foreground uppercase tracking-tighter leading-none">
                    <Video className="text-ls-secondary" size={40} /> Live Sessions
                  </h2>
                  <p className="text-text-muted mt-4 text-lg font-medium">Recorded expertise and upcoming investor calls</p>
                </div>
              </div>
              {loading ? (
                <div className="space-y-6">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 rounded-3xl" />)}
                </div>
              ) : (
                <div className="space-y-6">
                  {webinars.map((w) => (
                    <div key={w.id} className={`group p-8 rounded-[2rem] border border-border-theme bg-card ${isDark ? 'hover:border-ls-compliment/30' : 'hover:border-ls-secondary/30'} transition-all flex flex-col md:flex-row gap-8 md:items-center theme-transition shadow-lg hover:shadow-2xl`}>
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-ls-compliment/10' : 'bg-ls-secondary/10'} shadow-inner`}>
                        <Play size={28} className={isDark ? 'text-ls-compliment' : 'text-ls-secondary'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-black text-foreground text-xl uppercase tracking-tight mb-2 ${isDark ? 'group-hover:text-ls-compliment' : 'group-hover:text-ls-secondary'} transition-colors leading-none`}>{w.title}</h3>
                        <p className="text-text-muted text-sm font-bold mb-4 opacity-60">{w.speaker}</p>
                        <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-text-muted/40">
                          <span className="flex items-center gap-2"><Calendar size={14} /> {new Date(w.scheduled_at).toLocaleDateString()}</span>
                          <span className="flex items-center gap-2"><Clock size={14} /> Recorded Session</span>
                        </div>
                      </div>
                      {w.recording_url && (
                        <a href={w.recording_url} target="_blank" className={`px-10 py-4 ${isDark ? 'bg-ls-compliment text-ls-primary-fixed shadow-ls-compliment/30' : 'bg-ls-secondary text-white shadow-ls-secondary/30'} rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl hover:scale-105 transition-all active:scale-95 text-center`}>
                          Stream Recording
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
          <div className="text-center py-48 bg-card rounded-[4rem] border border-dashed border-border-theme theme-transition shadow-inner">
            <Search size={64} className="mx-auto mb-10 text-text-muted/20" />
            <h3 className="text-3xl font-black mb-4 text-foreground uppercase tracking-tight">No intelligence found</h3>
            <p className="text-text-muted text-lg font-medium">Adjust your criteria or explore our featured research above.</p>
            <button
              onClick={() => { setSearchQuery(''); setActivePillar('all'); setActiveTab('all'); }}
              className={`mt-12 px-10 py-4 border border-border-theme rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-foreground/5 transition-all`}
            >
              Reset Research Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
