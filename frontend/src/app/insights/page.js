"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight, BookOpen, Video, FileText, Bookmark,
  Search, Clock, User, Calendar, Play, ChevronRight, Sparkles,
} from "lucide-react";
import { fetchArticles, fetchCourses, fetchWebinars, fetchFeaturedArticle, normaliseList, PILLAR_COLORS } from "@/services/insights";

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

// ─── Main page ────────────────────────────────────────────────────────────────
export default function InsightsLandingPage() {
  const [featured, setFeatured]   = useState(null);
  const [articles, setArticles]   = useState([]);
  const [courses, setCourses]     = useState([]);
  const [webinars, setWebinars]   = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [feat, art, crs, web] = await Promise.all([
          fetchFeaturedArticle(),
          fetchArticles({ ordering: "-published_at" }),
          fetchCourses(),
          fetchWebinars(),
        ]);
        setFeatured(feat);
        setArticles(normaliseList(art).slice(1, 5)); // skip featured
        setCourses(normaliseList(crs).slice(0, 4));
        setWebinars(normaliseList(web).slice(0, 4));
      } catch {
        // fallback to empty — pages handle their own data
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="bg-[#100226] text-white min-h-screen pb-24">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-16 overflow-hidden">
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
            className="text-5xl md:text-7xl font-black mb-6 leading-none tracking-tight"
          >
            The <span className="text-[#F59F01]">Wisdom</span> Hub
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-xl text-white/60 max-w-2xl mx-auto mb-14"
          >
            Proprietary research, educational courses and exclusive webinars — where visionary thinking meets rigorous analysis.
          </motion.p>

          {/* Category nav */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="grid grid-cols-2 gap-4 max-w-xl mx-auto"
          >
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link key={cat.name} href={cat.link}
                  className="group p-5 rounded-2xl flex flex-col items-center justify-center text-center bg-white/3 border border-white/8 hover:border-white/20 hover:-translate-y-1 transition-all"
                  style={{ "--cat-color": cat.color }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-all group-hover:scale-110"
                    style={{ background: `${cat.color}18`, color: cat.color }}
                  >
                    <Icon size={18} />
                  </div>
                  <h3 className="font-bold text-sm mb-1" style={{ color: cat.color }}>{cat.name}</h3>
                  <p className="text-[11px] text-white/40">{cat.desc}</p>
                </Link>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── Featured article ──────────────────────────────────────────────── */}
      <section className="py-8">
        <div className="container mx-auto px-4 lg:px-8">
          <FeaturedHero article={featured} loading={loading} />
        </div>
      </section>

      {/* ── Latest articles ───────────────────────────────────────────────── */}
      {(loading || articles.length > 0) && (
        <section className="py-16">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold">Latest Insights</h2>
                <p className="text-white/40 text-sm mt-1">Emerging trends and timeless principles</p>
              </div>
              <Link href="/insights/articles" className="flex items-center gap-1 text-sm font-bold text-[#F59F01] hover:text-white transition-colors">
                View All <ArrowRight size={15} />
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {articles.map((a, i) => (
                  <motion.div key={a.id || a.slug} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                    <SmallArticleCard article={a} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Webinars ──────────────────────────────────────────────────────── */}
      {(loading || webinars.length > 0) && (
        <section className="py-16 border-y border-white/5 bg-white/[0.02]">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold">Live & On-Demand</h2>
                <p className="text-white/40 text-sm mt-1">Sessions with industry experts</p>
              </div>
              <Link href="/insights/webinars" className="flex items-center gap-1 text-sm font-bold text-[#0B6EC3] hover:text-white transition-colors">
                View All <ArrowRight size={15} />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
            ) : (
              <div className="space-y-3">
                {webinars.map((w, i) => (
                  <motion.div key={w.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
                    <WebinarCard webinar={w} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Courses ─── HIDDEN until campus is ready ──────────────────────────
      {(loading || courses.length > 0) && (
        <section className="py-16">
          ...
        </section>
      )}
      ────────────────────────────────────────────────────────────────────── */}


      {/* ── No content state ─────────────────────────────────────────────── */}
      {!loading && !featured && articles.length === 0 && webinars.length === 0 && (
        <div className="text-center py-32 text-white/30">
          <Sparkles size={40} className="mx-auto mb-4 opacity-30" />
          <h3 className="text-xl font-bold mb-2">Content coming soon</h3>
          <p className="text-sm">Publish articles, courses and webinars from the admin panel.</p>
        </div>
      )}
    </div>
  );
}
