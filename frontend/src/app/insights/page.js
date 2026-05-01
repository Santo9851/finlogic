"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight, BookOpen, Video, FileText, Bookmark,
  Search, Clock, User, Calendar, Play, ChevronRight, Sparkles,
} from "lucide-react";
import { fetchArticles, fetchCourses, fetchWebinars, fetchSeriesList, fetchFeaturedArticle, normaliseList, PILLAR_COLORS } from "@/services/insights";

// ─── Skeleton loader ─────────────────────────────────────────────────────────
function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-white/5 rounded-lg ${className}`} />;
}

// ─── Pill badge ───────────────────────────────────────────────────────────────
function PillarBadge({ pillar }) {
  const color = PILLAR_COLORS[pillar?.toLowerCase()] || "#F59F01";
  return (
    <span
      className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"
      style={{ background: `${color}18`, color }}
    >
      {pillar || "Insight"}
    </span>
  );
}

// ─── Hero featured article ────────────────────────────────────────────────────
function FeaturedHero({ article, loading }) {
  if (loading) {
    return (
      <div className="relative w-full rounded-[2rem] overflow-hidden">
        <Skeleton className="w-full aspect-[21/9] rounded-[2rem]" />
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
      className="relative block w-full rounded-[2rem] overflow-hidden group"
    >
      <div className="absolute inset-0 bg-gradient-to-t from-[#100226] via-[#100226]/70 to-transparent z-10" />
      {article.featured_image ? (
        <img
          src={article.featured_image}
          alt={article.title}
          className="w-full aspect-video md:aspect-[21/9] object-cover brightness-75 group-hover:scale-105 transition-transform duration-700"
        />
      ) : (
        <div className="w-full aspect-video md:aspect-[21/9] bg-gradient-to-br from-[#3A3153] to-[#100226]" />
      )}
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#100226]/40 via-transparent to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 z-20">
        <div className="flex items-center gap-3 mb-4">
          <span className="px-3 py-1 rounded-full bg-[#F59F01] text-[#100226] text-xs font-black uppercase tracking-widest">
            Featured Research
          </span>
          {article.read_time && (
            <span className="text-white/60 text-sm flex items-center gap-1">
              <Clock size={13} /> {article.read_time}
            </span>
          )}
        </div>
        <h2 className="text-3xl md:text-5xl font-bold mb-4 max-w-4xl group-hover:text-[#F59F01] transition-colors leading-tight">
          {article.title}
        </h2>
        <p className="text-lg text-white/70 max-w-3xl mb-6 line-clamp-2">{article.excerpt}</p>
        <div className="flex items-center gap-6 text-sm text-white/50">
          {article.author_name && (
            <span className="flex items-center gap-1.5 text-white/70 font-medium">
              <User size={14} /> {article.author_name}
            </span>
          )}
          {displayDate && <span className="flex items-center gap-1.5"><Calendar size={14} /> {displayDate}</span>}
        </div>
        <div className="mt-6 flex items-center font-bold text-[#F59F01] text-sm">
          Read Full Paper <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-2 transition-transform" />
        </div>
      </div>
    </Link>
  );
}

// ─── Small article card ───────────────────────────────────────────────────────
function SmallArticleCard({ article }) {
  const displayDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "";
  return (
    <Link
      href={`/insights/articles/${article.slug}`}
      className="group flex gap-4 p-4 rounded-2xl border border-white/5 hover:border-[#F59F01]/30 hover:bg-[#F59F01]/5 transition-all"
    >
      {article.featured_image && (
        <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
          <img src={article.featured_image} alt={article.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <PillarBadge pillar={article.pillar} />
        <h3 className="text-sm font-bold text-white mt-1.5 line-clamp-2 group-hover:text-[#F59F01] transition-colors leading-snug">
          {article.title}
        </h3>
        <p className="text-xs text-white/40 mt-1">{displayDate} · {article.read_time}</p>
      </div>
    </Link>
  );
}

// ─── Course card ──────────────────────────────────────────────────────────────
function CourseCard({ course }) {
  const levelColors = { beginner: "#16c784", intermediate: "#F59F01", advanced: "#f43f5e" };
  const color = levelColors[course.level?.toLowerCase()] || "#F59F01";
  return (
    <Link href={`/insights/courses/${course.slug}`}
      className="group relative flex flex-col rounded-2xl overflow-hidden border border-white/5 hover:border-white/20 bg-[#0D0120] hover:bg-[#160330] transition-all hover:-translate-y-1"
    >
      {course.featured_image ? (
        <div className="h-44 overflow-hidden">
          <img src={course.featured_image} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-75" />
        </div>
      ) : (
        <div className="h-44 bg-gradient-to-br from-[#3A3153] to-[#100226] flex items-center justify-center">
          <BookOpen size={40} className="text-white/20" />
        </div>
      )}
      <div className="p-5 flex flex-col flex-1">
        <span className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color }}>{course.level}</span>
        <h3 className="font-bold text-white text-base leading-snug mb-2 flex-1 group-hover:text-[#F59F01] transition-colors">
          {course.title}
        </h3>
        <p className="text-white/50 text-xs line-clamp-2 mb-4">{course.description}</p>
        <div className="flex items-center justify-between text-xs text-white/40 border-t border-white/5 pt-3">
          <span className="flex items-center gap-1"><BookOpen size={12} /> {course.module_count || "—"} modules</span>
          <span className="flex items-center gap-1"><Clock size={12} /> {course.duration_hours}h</span>
        </div>
      </div>
    </Link>
  );
}

// ─── Webinar card ─────────────────────────────────────────────────────────────
function WebinarCard({ webinar }) {
  const date = webinar.scheduled_at ? new Date(webinar.scheduled_at) : null;
  const isPast = date && date < new Date();
  const displayDate = date ? date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
  const displayTime = date ? date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "";

  return (
    <div className="group p-5 rounded-2xl border border-white/5 hover:border-[#F59F01]/20 bg-[#0D0120] hover:bg-[#160330] transition-all flex gap-4 items-start">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isPast ? "bg-white/5" : "bg-[#F59F01]/10"}`}>
        {isPast ? <Play size={20} className="text-white/30" /> : <Video size={20} className="text-[#F59F01]" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          {!isPast && <span className="flex items-center gap-1 text-[10px] font-black text-[#16c784] uppercase tracking-widest"><span className="w-1.5 h-1.5 rounded-full bg-[#16c784] animate-pulse inline-block" /> Live</span>}
          {isPast && webinar.recording_url && <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Recording Available</span>}
        </div>
        <h3 className="font-bold text-white text-sm leading-snug group-hover:text-[#F59F01] transition-colors mb-1">
          {webinar.title}
        </h3>
        <p className="text-white/40 text-xs mb-2">{webinar.speaker}</p>
        <div className="flex items-center gap-4 text-xs text-white/30">
          {displayDate && <span className="flex items-center gap-1"><Calendar size={11} /> {displayDate}</span>}
          {displayTime && !isPast && <span>{displayTime} NPT</span>}
        </div>
      </div>
      {!isPast && webinar.registration_url && (
        <a href={webinar.registration_url} target="_blank" rel="noopener noreferrer"
          className="flex-shrink-0 px-4 py-2 rounded-full bg-[#F59F01] text-[#100226] text-xs font-black hover:bg-[#F59F01]/80 transition-colors"
        >
          Register
        </a>
      )}
      {isPast && webinar.recording_url && (
        <a href={webinar.recording_url} target="_blank" rel="noopener noreferrer"
          className="flex-shrink-0 px-4 py-2 rounded-full border border-white/10 text-white/50 text-xs font-bold hover:border-white/30 hover:text-white transition-colors flex items-center gap-1"
        >
          <Play size={11} /> Watch
        </a>
      )}
    </div>
  );
}

// ─── Category nav cards ───────────────────────────────────────────────────────
// Categories shown in the hero nav — Courses & Frameworks hidden until ready
const categories = [
  { name: "Articles", icon: FileText, link: "/insights/articles", desc: "Research & deep-dives", color: "#F59F01" },
  { name: "Webinars", icon: Video, link: "/insights/webinars", desc: "Live & recorded sessions", color: "#0B6EC3" },
  // { name: "Courses", icon: BookOpen, link: "/insights/courses", desc: "Structured learning paths", color: "#16c784" },
  // { name: "Frameworks", icon: Bookmark, link: "/insights/articles?pillar=insight", desc: "Proprietary investment models", color: "#a855f7" },
];

// ─── Filter Tabs ─────────────────────────────────────────────────────────────
function FilterTabs({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'all', label: 'All Knowledge' },
    { id: 'articles', label: 'Research Papers' },
    { id: 'series', label: 'Learning Series' },
    { id: 'courses', label: 'Courses' },
    { id: 'webinars', label: 'Webinars' },
  ];

  return (
    <div className="flex flex-wrap justify-center gap-2 mb-12">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
            activeTab === tab.id
              ? 'bg-[#F59F01] text-[#100226] shadow-lg shadow-[#F59F01]/20'
              : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/5'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ─── Series card ──────────────────────────────────────────────────────────────
function SeriesCard({ series }) {
  const color = PILLAR_COLORS[series.pillar?.toLowerCase()] || "#F59F01";
  return (
    <Link href={`/insights/series/${series.slug}`}
      className="group relative flex flex-col rounded-3xl overflow-hidden border border-white/5 hover:border-[#F59F01]/30 bg-gradient-to-br from-[#1A0B36] to-[#0D0120] transition-all hover:-translate-y-1"
    >
      <div className="p-8">
        <div className="flex items-center gap-2 mb-4">
          <PillarBadge pillar={series.pillar} />
          <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Learning Series</span>
        </div>
        <h3 className="text-2xl font-bold text-white mb-4 leading-tight group-hover:text-[#F59F01] transition-colors">
          {series.title}
        </h3>
        <p className="text-white/50 text-sm mb-8 line-clamp-3 leading-relaxed">
          {series.description}
        </p>
        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs font-bold text-white/40">
            <span className="flex items-center gap-1.5"><FileText size={14} /> {series.article_count} Chapters</span>
            <span className="flex items-center gap-1.5"><Clock size={14} /> Self-paced</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#F59F01]/10 flex items-center justify-center text-[#F59F01] group-hover:bg-[#F59F01] group-hover:text-[#100226] transition-all">
            <ArrowRight size={18} />
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 w-full h-1" style={{ backgroundColor: color }} />
    </Link>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function InsightsLandingPage() {
  const [featured, setFeatured]   = useState(null);
  const [articles, setArticles]   = useState([]);
  const [series, setSeries]       = useState([]);
  const [courses, setCourses]     = useState([]);
  const [webinars, setWebinars]   = useState([]);
  
  const [activeTab, setActiveTab] = useState('all');
  const [activePillar, setActivePillar] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [loading, setLoading]     = useState(true);

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

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Classification logic
  const showArticles = activeTab === 'all' || activeTab === 'articles';
  const showSeries   = activeTab === 'all' || activeTab === 'series';
  const showCourses  = activeTab === 'all' || activeTab === 'courses';
  const showWebinars = activeTab === 'all' || activeTab === 'webinars';

  const pillars = ['all', 'vision', 'growth', 'leadership', 'insight', 'partnership'];

  return (
    <div className="bg-[#100226] text-white min-h-screen pb-24">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-8 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#F59F01]/5 rounded-full blur-[120px]" />
          <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-[#3A3153]/40 rounded-full blur-[100px]" />
        </div>

        <div className="container mx-auto px-4 lg:px-8 relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F59F01]/10 border border-[#F59F01]/20 text-[#F59F01] text-sm font-bold uppercase tracking-widest mb-6"
          >
            <Sparkles size={14} /> Knowledge Center
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-5xl md:text-8xl font-black mb-6 leading-none tracking-tight"
          >
            The <span className="text-[#F59F01]">Wisdom</span> Hub
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-xl text-white/60 max-w-2xl mx-auto mb-14"
          >
            Proprietary research, institutional frameworks, and market analysis for the modern investor.
          </motion.p>

          {/* Search & Global Pillar Filter */}
          <div className="max-w-4xl mx-auto mb-16 space-y-6">
            <div className="relative group">
              <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-white/30 group-focus-within:text-[#F59F01] transition-colors">
                <Search size={22} />
              </div>
              <input 
                type="text"
                placeholder="Search research, series, or courses..."
                className="w-full h-18 bg-white/5 border border-white/10 rounded-3xl pl-16 pr-8 text-lg outline-none focus:border-[#F59F01]/50 focus:bg-white/10 transition-all placeholder:text-white/20 shadow-2xl"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              {pillars.map((p) => (
                <button
                  key={p}
                  onClick={() => setActivePillar(p)}
                  className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest border transition-all ${
                    activePillar === p 
                    ? 'border-[#F59F01] bg-[#F59F01] text-[#100226]' 
                    : 'border-white/10 bg-white/5 text-white/40 hover:border-white/30 hover:text-white'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <FilterTabs activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
      </section>

      {/* ── Main Content Grid ─────────────────────────────────────────────── */}
      <div className="container mx-auto px-4 lg:px-8">
        
        {/* 1. Featured Article (Hero) - Only in 'All' or 'Articles' */}
        {(activeTab === 'all' || activeTab === 'articles') && !searchQuery && activePillar === 'all' && (
          <div className="mb-20">
             <FeaturedHero article={featured} loading={loading} />
          </div>
        )}

        <div className="space-y-24">
          {/* Learning Series Section */}
          {showSeries && (series.length > 0 || loading) && (
            <section>
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h2 className="text-3xl font-bold flex items-center gap-3">
                    <BookOpen className="text-[#F59F01]" /> Learning Series
                  </h2>
                  <p className="text-white/40 mt-2">Structured sequences for mastery</p>
                </div>
              </div>
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64 rounded-3xl" />)}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {series.map((s) => <SeriesCard key={s.id} series={s} />)}
                </div>
              )}
            </section>
          )}

          {/* Standalone Articles Section */}
          {showArticles && (articles.length > 0 || loading) && (
            <section>
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h2 className="text-3xl font-bold flex items-center gap-3">
                    <FileText className="text-[#a855f7]" /> Research Papers
                  </h2>
                  <p className="text-white/40 mt-2">Deep dives and institutional insights</p>
                </div>
                <Link href="/insights/articles" className="text-[#F59F01] font-bold text-sm hover:underline">Explore all papers</Link>
              </div>
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {articles.filter(a => a.id !== featured?.id).map((a) => <SmallArticleCard key={a.id} article={a} />)}
                </div>
              )}
            </section>
          )}

          {/* Courses Section */}
          {showCourses && (courses.length > 0 || loading) && (
            <section className="py-16 border-t border-white/5">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h2 className="text-3xl font-bold flex items-center gap-3">
                    <Sparkles className="text-[#16c784]" /> Structured Courses
                  </h2>
                  <p className="text-white/40 mt-2">Certified learning for professional excellence</p>
                </div>
              </div>
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-80 rounded-2xl" />)}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {courses.map((c) => <CourseCard key={c.id} course={c} />)}
                </div>
              )}
            </section>
          )}

          {/* Webinars Section */}
          {showWebinars && (webinars.length > 0 || loading) && (
            <section className="py-16 border-t border-white/5">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h2 className="text-3xl font-bold flex items-center gap-3">
                    <Video className="text-[#0B6EC3]" /> Live Sessions
                  </h2>
                  <p className="text-white/40 mt-2">Recorded and upcoming expert calls</p>
                </div>
              </div>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
                </div>
              ) : (
                <div className="space-y-4">
                  {webinars.map((w) => <WebinarCard key={w.id} webinar={w} />)}
                </div>
              )}
            </section>
          )}
        </div>

        {/* Empty State */}
        {!loading && articles.length === 0 && series.length === 0 && courses.length === 0 && webinars.length === 0 && (
          <div className="text-center py-40 bg-white/[0.02] rounded-[3rem] border border-dashed border-white/10">
            <Search size={48} className="mx-auto mb-6 text-white/10" />
            <h3 className="text-2xl font-bold mb-2">No matching insights found</h3>
            <p className="text-white/40">Try adjusting your filters or search keywords</p>
            <button 
              onClick={() => { setSearchQuery(''); setActivePillar('all'); setActiveTab('all'); }}
              className="mt-8 text-[#F59F01] font-bold hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
