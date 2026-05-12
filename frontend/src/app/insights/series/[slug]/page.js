"use client";

import { useState, useEffect, use } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Play, Lock, CheckCircle2, Clock, BookOpen } from "lucide-react";
import { fetchSeriesDetail, PILLAR_COLORS } from "@/services/insights";
import { useAuth } from "@/lib/AuthContext";

export default function SeriesLandingPage({ params }) {
  const { slug } = use(params);
  const { user } = useAuth();
  const [series, setSeries] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await fetchSeriesDetail(slug);
        setSeries(data);
      } catch (e) {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    if (slug) {
      window.scrollTo(0, 0);
      load();
    }
  }, [slug]);

  if (loading) return (
    <div className="bg-background min-h-screen pt-32 flex justify-center theme-transition">
      <div className="animate-pulse space-y-6 w-full max-w-4xl px-4">
        <div className="h-6 w-24 bg-foreground/5 rounded-full" />
        <div className="h-16 w-3/4 bg-foreground/5 rounded-2xl" />
        <div className="h-48 w-full bg-foreground/5 rounded-[3rem]" />
      </div>
    </div>
  );

  if (error || !series) return (
    <div className="bg-background min-h-screen flex items-center justify-center theme-transition">
      <div className="text-center space-y-6">
        <div className="w-20 h-20 bg-foreground/5 rounded-[2rem] flex items-center justify-center mx-auto border border-border-theme">
          <BookOpen size={32} className="text-text-muted/20" />
        </div>
        <div>
          <p className="text-text-muted font-bold uppercase tracking-widest text-[10px] mb-4">Series not found.</p>
          <Link href="/insights/articles" className="text-[#F59F01] font-black uppercase tracking-widest text-xs hover:underline">← Back to Articles</Link>
        </div>
      </div>
    </div>
  );

  const color = PILLAR_COLORS[series.pillar?.toLowerCase()] || "#F59F01";
  const articles = series.articles || [];
  const completedCount = articles.filter(a => a.is_completed).length;
  const progressPercent = articles.length > 0 ? (completedCount / articles.length) * 100 : 0;

  return (
    <div className="bg-background text-foreground min-h-screen pb-24 theme-transition">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#F59F01]/5 blur-[120px] rounded-full -mr-40 -mt-40 opacity-50" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#0B6EC3]/5 blur-[120px] rounded-full -ml-40 -mb-40 opacity-30" />
        </div>

        <div className="container mx-auto px-4 relative z-10 max-w-5xl text-center">
          <Link href="/insights/articles" className="inline-flex items-center gap-2 text-text-muted hover:text-[#F59F01] text-[10px] font-black uppercase tracking-widest transition-all mb-8">
            <ArrowLeft size={15} /> Back to Insights
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <span className="inline-block px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-sm border"
              style={{ background: `${color}10`, color, borderColor: `${color}20` }}
            >
              Educational Series
            </span>
            <h1 className="text-4xl md:text-7xl font-black mb-8 leading-tight tracking-tight uppercase">{series.title}</h1>
            <p className="text-lg md:text-xl text-text-muted max-w-3xl mx-auto leading-relaxed mb-10 font-medium">
              {series.description}
            </p>

            {/* Progress Bar (Visible if user is logged in) */}
            {user && (
              <div className="max-w-md mx-auto bg-card rounded-[2rem] p-8 border border-border-theme shadow-2xl theme-transition">
                <div className="flex justify-between items-end mb-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted/40">Your Learning Path</span>
                  <span className="text-sm font-black text-[#F59F01]">{completedCount} / {articles.length} Completed</span>
                </div>
                <div className="h-3 w-full bg-foreground/5 rounded-full overflow-hidden border border-border-theme shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    className="h-full bg-gradient-to-r from-[#F59F01] to-[#F59F01]/50 shadow-[0_0_12px_rgba(245,159,1,0.3)]"
                  />
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Article List */}
      <section className="container mx-auto px-4 max-w-4xl">
        <div className="space-y-6">
          {articles.sort((a,b) => a.article_number - b.article_number).map((art, i) => {
            const isLocked = art.access_level === 'cliffhanger';
            const isCompleted = art.is_completed;
            
            return (
              <motion.div
                key={art.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                viewport={{ once: true }}
              >
                <Link 
                  href={`/insights/articles/${art.slug}`}
                  className="group block relative p-6 rounded-[2rem] bg-card border border-border-theme hover:border-[#F59F01]/30 hover:bg-[#F59F01]/5 transition-all shadow-lg hover:shadow-2xl theme-transition"
                >
                  <div className="flex items-center gap-8">
                    {/* Number Circle */}
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 font-black text-xl transition-all border shadow-inner
                      ${isCompleted ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-foreground/5 text-text-muted/20 border-border-theme group-hover:bg-[#F59F01]/20 group-hover:text-[#F59F01] group-hover:border-[#F59F01]/30'}
                    `}>
                      {isCompleted ? <CheckCircle2 size={28} /> : art.article_number}
                    </div>

                    <div className="flex-grow min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-black text-foreground group-hover:text-[#F59F01] transition-colors truncate tracking-tight uppercase">
                          {art.title}
                        </h3>
                        {art.is_free && (
                          <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm">
                            Free
                          </span>
                        )}
                        {isLocked && !user && (
                          <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-foreground/5 text-text-muted/60 border border-border-theme flex items-center gap-1.5 shadow-sm">
                            <Lock size={10} /> Account Required
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-text-muted/40">
                        <span className="flex items-center gap-2"><Clock size={14} /> {art.read_time || '5 min read'}</span>
                        {art.pillar && <span className="flex items-center gap-2"><BookOpen size={14} /> {art.pillar}</span>}
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      {isLocked && !user ? (
                        <div className="w-12 h-12 rounded-2xl border border-border-theme flex items-center justify-center text-text-muted/20 bg-foreground/[0.02]">
                          <Lock size={18} />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-[#F59F01] flex items-center justify-center text-ls-primary-fixed shadow-xl shadow-[#F59F01]/20 transform group-hover:scale-110 transition-all active:scale-95">
                          <Play size={20} className="ml-1 fill-current" />
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Footer CTA */}
        {!user && (
          <div className="mt-20 text-center p-16 rounded-[4rem] bg-card border border-border-theme shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] relative overflow-hidden theme-transition">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#F59F01]/5 blur-[80px] rounded-full -mr-20 -mt-20" />
            
            <div className="relative z-10 space-y-6">
              <h2 className="text-3xl md:text-4xl font-black tracking-tight uppercase">Unlock the Full Series</h2>
              <p className="text-text-muted max-w-md mx-auto leading-relaxed font-medium">
                Join thousands of investors and entrepreneurs gaining an edge with our deep-dive institutional research.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                <Link href="/auth/register" className="px-12 py-5 rounded-[1.5rem] bg-[#F59F01] text-ls-primary-fixed font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-2xl shadow-[#F59F01]/30 active:scale-95">
                  Create Free Account
                </Link>
                <Link href="/auth/login" className="px-12 py-5 rounded-[1.5rem] bg-foreground/5 border border-border-theme text-foreground font-black text-xs uppercase tracking-widest hover:bg-foreground/10 transition-all active:scale-95">
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
