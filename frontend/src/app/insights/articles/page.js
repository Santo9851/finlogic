"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Search, X, Clock, User, Calendar, ChevronDown } from "lucide-react";
import { fetchArticles, normaliseList, PILLAR_LABELS, PILLAR_COLORS } from "@/services/insights";
import { useTheme } from "next-themes";

function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-foreground/5 rounded-xl ${className}`} />;
}

const PILLARS = ["All", "vision", "growth", "leadership", "insight", "partnership"];

function ArticleCard({ article, isDark }) {
  const color = PILLAR_COLORS[article.pillar?.toLowerCase()] || (isDark ? "#F59F01" : "#0B6EC3");
  const displayDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "";

  return (
    <Link href={`/insights/articles/${article.slug}`}
      className="group flex flex-col rounded-2xl overflow-hidden border border-border-theme hover:border-foreground/15 bg-card hover:bg-foreground/[0.02] transition-all hover:-translate-y-1 shadow-sm hover:shadow-xl theme-transition"
    >
      <div className="h-48 overflow-hidden bg-foreground/[0.03]">
        {article.featured_image ? (
          <img src={article.featured_image} alt={article.title}
            className="w-full h-full object-cover brightness-90 group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-foreground/[0.05] to-foreground/[0.02] flex items-center justify-center text-4xl">📰</div>
        )}
      </div>
      <div className="p-6 flex flex-col flex-1">
        <span className="inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] mb-4"
          style={{ background: `${color}15`, color }}
        >
          {PILLAR_LABELS[article.pillar?.toLowerCase()] || article.pillar}
        </span>
        <h3 className="font-black text-foreground text-lg leading-snug mb-3 flex-1 group-hover:text-ls-compliment transition-colors uppercase tracking-tight">
          {article.title}
        </h3>
        <p className="text-text-muted text-sm line-clamp-2 mb-6 font-medium leading-relaxed">{article.excerpt}</p>
        <div className="flex items-center justify-between text-[10px] text-text-muted/40 border-t border-border-theme pt-4 font-black uppercase tracking-widest">
          <span className="flex items-center gap-2">
            <User size={12} className="opacity-40" />
            <span>{article.author_name || "Institutional Research"}</span>
          </span>
          <div className="flex items-center gap-4">
            {displayDate && <span className="flex items-center gap-1.5"><Calendar size={12} /> {displayDate}</span>}
            {article.read_time && <span className="flex items-center gap-1.5 text-ls-compliment"><Clock size={12} /> {article.read_time}</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}

function ArticleCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden border border-border-theme bg-card">
      <Skeleton className="h-48 rounded-none" />
      <div className="p-6 space-y-4">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
      </div>
    </div>
  );
}

export default function ArticlesListPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
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

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load(true), 400);
    return () => clearTimeout(debounceRef.current);
  }, [search, pillar, ordering]);

  return (
    <div className="bg-background text-foreground min-h-screen theme-transition">
      {/* Header */}
      <section className="pt-32 pb-16 relative overflow-hidden border-b border-border-theme">
        <div className="absolute inset-0 pointer-events-none bg-abstract-gradient opacity-10" />
        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className={`inline-block px-4 py-1.5 rounded-full ${isDark ? 'bg-ls-compliment/10 border-ls-compliment/20 text-ls-compliment' : 'bg-ls-secondary/10 border-ls-secondary/20 text-ls-secondary'} text-[10px] font-black uppercase tracking-[0.3em] mb-6 backdrop-blur-md border`}>
            Research & Intelligence
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-4 leading-none uppercase tracking-tighter">Institutional <span className={isDark ? 'text-ls-compliment' : 'text-ls-secondary'}>Research</span></h1>
          <p className="text-text-muted text-lg max-w-2xl mb-12 font-medium leading-relaxed">
            Proprietary market intelligence, deep-tech research, and strategic essays on Private Equity across South Asia.
          </p>

          {/* Search + Filter bar */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* Search */}
            <div className="relative flex-1">
              <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted/30" />
              <input
                ref={searchRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search research papers, thesis, or authors…"
                className="w-full pl-12 pr-12 py-4 rounded-2xl bg-foreground/[0.03] border border-border-theme text-foreground placeholder:text-text-muted/20 text-sm outline-none focus:border-ls-compliment/50 focus:bg-foreground/[0.05] transition-all shadow-inner font-medium"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted/30 hover:text-foreground transition-colors">
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Ordering */}
            <div className="relative min-w-[200px]">
              <select
                value={ordering}
                onChange={e => setOrdering(e.target.value)}
                className="w-full pl-6 pr-12 py-4 rounded-2xl bg-foreground/[0.03] border border-border-theme text-text-muted text-xs font-black uppercase tracking-widest focus:outline-none focus:border-ls-compliment/50 appearance-none cursor-pointer shadow-inner"
              >
                <option value="-published_at" className="bg-background">Chronological Order</option>
                <option value="published_at" className="bg-background">Oldest Archive</option>
                <option value="title" className="bg-background">Lexicographical (A-Z)</option>
              </select>
              <ChevronDown size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-text-muted/30 pointer-events-none" />
            </div>
          </div>

          {/* Pillar filter pills */}
          <div className="flex flex-wrap gap-3 mt-8">
            {PILLARS.map(p => {
              const active = (p === "All" && !pillar) || p === pillar;
              const color = p === "All" ? (isDark ? "#F59F01" : "#0B6EC3") : (PILLAR_COLORS[p.toLowerCase()] || (isDark ? "#F59F01" : "#0B6EC3"));
              return (
                <button
                  key={p}
                  onClick={() => setPillar(p === "All" ? "" : p)}
                  className="px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all border shadow-sm"
                  style={{
                    background: active ? `${color}15` : "transparent",
                    borderColor: active ? `${color}40` : "var(--card-border)",
                    color: active ? color : "var(--text-muted)",
                    opacity: active ? 1 : 0.6
                  }}
                >
                  {p === "All" ? "All Frameworks" : (PILLAR_LABELS[p.toLowerCase()] || p)}
                </button>
              );
            })}
          </div>

          {totalCount !== null && (
            <p className="text-text-muted/40 text-[9px] font-black uppercase tracking-[0.3em] mt-8">{totalCount} Intelligent record{totalCount !== 1 ? "s" : ""} cataloged</p>
          )}
        </div>
      </section>

      {/* Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4 lg:px-8">
          {loading && articles.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {[...Array(6)].map((_, i) => <ArticleCardSkeleton key={i} />)}
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-40 bg-card border border-border-theme border-dashed rounded-[3rem] shadow-inner">
              <Search size={48} className="mx-auto mb-6 opacity-10 text-foreground" />
              <h3 className="text-2xl font-black mb-3 uppercase tracking-tight">No records discovered</h3>
              <p className="text-text-muted max-w-sm mx-auto font-medium">The specified criteria did not match any cataloged research papers.</p>
              <button onClick={() => { setSearch(""); setPillar(""); }} className="mt-8 px-8 py-3 rounded-xl border border-border-theme text-[10px] font-black uppercase tracking-widest hover:bg-foreground/5 transition-all active:scale-95 shadow-lg">
                Clear System Constraints
              </button>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {articles.map((article, i) => (
                  <motion.div
                    key={article.id || article.slug}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i < 6 ? i * 0.05 : 0 }}
                  >
                    <ArticleCard article={article} isDark={isDark} />
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}

          {/* Load more */}
          {hasMore && !loading && (
            <div className="text-center mt-20">
              <button
                onClick={() => { setPage(p => p + 1); load(false); }}
                className="px-12 py-4 rounded-2xl border border-border-theme text-[10px] font-black uppercase tracking-[0.3em] hover:bg-foreground/5 hover:border-foreground/20 transition-all shadow-xl active:scale-95"
              >
                Access Further Research
              </button>
            </div>
          )}

          {loading && articles.length > 0 && (
            <div className="flex justify-center mt-20">
              <div className="w-8 h-8 rounded-full border-4 border-ls-compliment border-t-transparent animate-spin" />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
