"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Search, X, Clock, User, Calendar, Filter, ChevronDown } from "lucide-react";
import { fetchArticles, normaliseList, PILLAR_LABELS, PILLAR_COLORS } from "@/services/insights";

function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-white/5 rounded-xl ${className}`} />;
}

const PILLARS = ["All", "vision", "growth", "leadership", "insight", "partnership"];

function ArticleCard({ article }) {
  const color = PILLAR_COLORS[article.pillar?.toLowerCase()] || "#F59F01";
  const displayDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "";

  return (
    <Link href={`/insights/articles/${article.slug}`}
      className="group flex flex-col rounded-2xl overflow-hidden border border-white/5 hover:border-white/15 bg-[#0D0120] hover:bg-[#130225] transition-all hover:-translate-y-1"
    >
      <div className="h-48 overflow-hidden bg-[#3A3153]/30">
        {article.featured_image ? (
          <img src={article.featured_image} alt={article.title}
            className="w-full h-full object-cover brightness-80 group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#3A3153] to-[#100226] flex items-center justify-center text-4xl">📰</div>
        )}
      </div>
      <div className="p-5 flex flex-col flex-1">
        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-3"
          style={{ background: `${color}18`, color }}
        >
          {PILLAR_LABELS[article.pillar?.toLowerCase()] || article.pillar}
        </span>
        <h3 className="font-bold text-white text-base leading-snug mb-2 flex-1 group-hover:text-[#F59F01] transition-colors">
          {article.title}
        </h3>
        <p className="text-white/50 text-sm line-clamp-2 mb-4">{article.excerpt}</p>
        <div className="flex items-center justify-between text-xs text-white/30 border-t border-white/5 pt-3">
          <span className="flex items-center gap-1.5">
            <User size={11} />
            <span className="text-white/50">{article.author_name || "Research"}</span>
          </span>
          <div className="flex items-center gap-3">
            {displayDate && <span className="flex items-center gap-1"><Calendar size={11} /> {displayDate}</span>}
            {article.read_time && <span className="flex items-center gap-1"><Clock size={11} /> {article.read_time}</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}

function ArticleCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden border border-white/5 bg-[#0D0120]">
      <Skeleton className="h-48 rounded-none" />
      <div className="p-5 space-y-3">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
      </div>
    </div>
  );
}

export default function ArticlesListPage() {
  const [articles, setArticles]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [pillar, setPillar]         = useState("");
  const [ordering, setOrdering]     = useState("-published_at");
  const [page, setPage]             = useState(1);
  const [hasMore, setHasMore]       = useState(false);
  const [totalCount, setTotalCount] = useState(null);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  const load = useCallback(async (resetPage = true) => {
    setLoading(true);
    try {
      const p = resetPage ? 1 : page;
      const data = await fetchArticles({ search, pillar, ordering, page: p });
      const results = normaliseList(data);
      setArticles(resetPage ? results : prev => [...prev, ...results]);
      if (data && data.count !== undefined) {
        setTotalCount(data.count);
        setHasMore(!!data.next);
      } else {
        setHasMore(false);
      }
      if (resetPage) setPage(1);
    } catch {
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, [search, pillar, ordering, page]);

  // Debounced search
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load(true), 400);
    return () => clearTimeout(debounceRef.current);
  }, [search, pillar, ordering]);

  return (
    <div className="bg-[#100226] text-white min-h-screen">
      {/* Header */}
      <section className="pt-32 pb-12 relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-1/3 w-[500px] h-[300px] bg-[#F59F01]/4 rounded-full blur-[100px]" />
        </div>
        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="inline-block px-3 py-1 rounded-full bg-[#F59F01]/10 border border-[#F59F01]/20 text-[#F59F01] text-xs font-bold uppercase tracking-widest mb-4">
            Research & Analysis
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-3 leading-none">Articles & Research</h1>
          <p className="text-white/50 text-lg max-w-2xl mb-8">
            Market analysis, white papers, and essays on building enduring businesses in emerging markets.
          </p>

          {/* Search + Filter bar */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                ref={searchRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search articles, research, topics…"
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#F59F01]/50 focus:bg-white/8 transition-all"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors">
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Ordering */}
            <div className="relative">
              <select
                value={ordering}
                onChange={e => setOrdering(e.target.value)}
                className="pl-4 pr-8 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm focus:outline-none focus:border-[#F59F01]/50 appearance-none cursor-pointer"
              >
                <option value="-published_at">Newest First</option>
                <option value="published_at">Oldest First</option>
                <option value="title">A → Z</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
            </div>
          </div>

          {/* Pillar filter pills */}
          <div className="flex flex-wrap gap-2 mt-4">
            {PILLARS.map(p => {
              const active = (p === "All" && !pillar) || p === pillar;
              const color = p === "All" ? "#F59F01" : (PILLAR_COLORS[p] || "#F59F01");
              return (
                <button
                  key={p}
                  onClick={() => setPillar(p === "All" ? "" : p)}
                  className="px-4 py-1.5 rounded-full text-xs font-bold transition-all border"
                  style={{
                    background: active ? `${color}22` : "transparent",
                    borderColor: active ? `${color}60` : "rgba(255,255,255,0.08)",
                    color: active ? color : "rgba(255,255,255,0.4)",
                  }}
                >
                  {p === "All" ? "All Pillars" : (PILLAR_LABELS[p] || p)}
                </button>
              );
            })}
          </div>

          {totalCount !== null && (
            <p className="text-white/30 text-xs mt-4">{totalCount} article{totalCount !== 1 ? "s" : ""} found</p>
          )}
        </div>
      </section>

      {/* Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4 lg:px-8">
          {loading && articles.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => <ArticleCardSkeleton key={i} />)}
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-32 text-white/30">
              <Search size={40} className="mx-auto mb-4 opacity-40" />
              <h3 className="text-xl font-bold mb-2">No articles found</h3>
              <p className="text-sm">Try adjusting your search or pillar filter.</p>
              <button onClick={() => { setSearch(""); setPillar(""); }} className="mt-6 px-6 py-2 rounded-full border border-white/10 text-sm hover:bg-white/5 transition-colors">
                Clear filters
              </button>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {articles.map((article, i) => (
                  <motion.div
                    key={article.id || article.slug}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i < 6 ? i * 0.06 : 0 }}
                  >
                    <ArticleCard article={article} />
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}

          {/* Load more */}
          {hasMore && !loading && (
            <div className="text-center mt-12">
              <button
                onClick={() => { setPage(p => p + 1); load(false); }}
                className="px-8 py-3 rounded-full border border-white/20 text-sm font-bold hover:bg-white/5 hover:border-white/40 transition-all"
              >
                Load More Articles
              </button>
            </div>
          )}

          {loading && articles.length > 0 && (
            <div className="flex justify-center mt-12">
              <div className="w-6 h-6 rounded-full border-2 border-[#F59F01] border-t-transparent animate-spin" />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
