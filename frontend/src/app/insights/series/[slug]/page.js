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
    <div className="bg-background min-h-screen pt-40 flex justify-center theme-transition">
      <div className="animate-pulse space-y-12 w-full max-w-5xl px-4">
        <div className="h-10 w-48 bg-foreground/5" />
        <div className="h-32 w-3/4 bg-foreground/5" />
        <div className="h-80 w-full bg-foreground/5 border border-border-theme" />
      </div>
    </div>
  );

  if (error || !series) return (
    <div className="bg-background min-h-screen flex items-center justify-center theme-transition">
      <div className="text-center space-y-10">
        <div className="w-24 h-24 border border-border-theme flex items-center justify-center mx-auto opacity-20">
          <BookOpen size={40} />
        </div>
        <div className="space-y-6">
          <p className="text-text-muted font-bold uppercase tracking-[0.4em] text-[10px]">Sequence Registry Error</p>
          <Link href="/insights" className="text-ls-compliment font-bold uppercase tracking-[0.4em] text-[10px] border-b border-ls-compliment pb-2">Back to Intelligence Hub</Link>
        </div>
      </div>
    </div>
  );

  const color = PILLAR_COLORS[series.pillar?.toLowerCase()] || "#F59F01";
  const articles = series.articles || [];
  const completedCount = articles.filter(a => a.is_completed).length;
  const progressPercent = articles.length > 0 ? (completedCount / articles.length) * 100 : 0;

  return (
    <div className="bg-background text-foreground min-h-screen pb-32 theme-transition selection:bg-ls-compliment/30 font-sans">
      
      {/* Hero Section - Institutional Dossier */}
      <section className="relative pt-40 pb-24 border-b border-border-theme">
        <div className="container mx-auto px-4 lg:px-8 relative z-10 max-w-6xl">
          
          <Link href="/insights" className="inline-flex items-center gap-4 text-text-muted hover:text-ls-compliment text-[10px] font-bold uppercase tracking-[0.4em] transition-all mb-16">
            <ArrowLeft size={14} /> Back to Registry
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-20 items-end">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="flex items-center gap-4 text-ls-compliment text-[10px] font-bold uppercase tracking-[0.5em]">
                <BookOpen size={14} /> Knowledge Sequence Registry
              </div>
              <h1 className="text-5xl md:text-8xl font-serif font-light leading-[1.1] tracking-tight">
                {series.title.split(' ').map((word, i) => i === 0 ? <span key={i}>{word} </span> : <span key={i} className="italic">{word} </span>)}
              </h1>
              <p className="text-xl md:text-2xl text-text-muted max-w-3xl leading-relaxed font-serif font-light italic">
                {series.description}
              </p>
            </motion.div>

            {/* Progress Minimalist Frame */}
            {user && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card border border-border-theme p-10 space-y-8 theme-transition shadow-2xl relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-ls-compliment/5 blur-[40px] rounded-full -mr-12 -mt-12 pointer-events-none" />
                <div className="flex justify-between items-end text-[9px] font-bold uppercase tracking-[0.3em]">
                  <span className="text-text-muted group-hover:text-ls-white/40">Sequence Ingestion</span>
                  <span className="text-ls-compliment">{completedCount} / {articles.length} Units</span>
                </div>
                <div className="h-0.5 w-full bg-border-theme group-hover:bg-ls-white/10 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    className="h-full bg-ls-compliment shadow-[0_0_12px_rgba(245,159,1,0.3)] transition-all duration-1000"
                  />
                </div>
                <div className="text-[9px] font-bold text-text-muted/40 uppercase tracking-widest text-center">
                  Registry Status: {progressPercent === 100 ? "Mastery Achieved" : "Synchronizing..."}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Article List - Archival Sequence Ledger */}
      <section className="container mx-auto px-4 lg:px-8 max-w-6xl mt-24">
        <div className="grid grid-cols-1 gap-px bg-border-theme border border-border-theme">
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
                  className="group block relative p-12 bg-card hover:bg-ls-primary transition-all theme-transition"
                >
                  <div className="flex items-center gap-12">
                    {/* Number Unit */}
                    <div className={`w-16 h-16 border flex items-center justify-center flex-shrink-0 font-serif text-2xl transition-all
                      ${isCompleted ? 'bg-ls-up/10 text-ls-up border-ls-up/20' : 'bg-foreground/5 text-text-muted/20 border-border-theme group-hover:bg-ls-white/10 group-hover:text-ls-compliment group-hover:border-ls-white/20'}
                    `}>
                      {isCompleted ? <CheckCircle2 size={32} /> : i + 1}
                    </div>

                    <div className="flex-grow min-w-0 space-y-4">
                      <div className="flex flex-wrap items-center gap-6">
                        <h3 className="text-2xl md:text-3xl font-serif font-light text-foreground group-hover:text-ls-white transition-colors leading-tight">
                          {art.title}
                        </h3>
                        {art.is_free && (
                          <span className="text-[9px] font-bold uppercase tracking-[0.3em] px-4 py-1.5 border border-ls-up/20 text-ls-up shadow-sm">
                            Open Access
                          </span>
                        )}
                        {isLocked && !user && (
                          <span className="text-[9px] font-bold uppercase tracking-[0.3em] px-4 py-1.5 border border-border-theme group-hover:border-ls-white/20 text-text-muted/40 group-hover:text-ls-white/40 flex items-center gap-3">
                            <Lock size={12} /> Institutional Credential Required
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-8 text-[9px] font-bold uppercase tracking-[0.4em] text-text-muted/40 group-hover:text-ls-white/20">
                        <span className="flex items-center gap-3"><Clock size={14} /> {art.read_time || '5 MIN READ'}</span>
                        <span className="text-ls-compliment group-hover:text-ls-white/40 opacity-40">LEDGER-ID: 0{art.id}</span>
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      {isLocked && !user ? (
                        <div className="w-14 h-14 border border-border-theme group-hover:border-ls-white/20 flex items-center justify-center text-text-muted/20 bg-foreground/[0.02]">
                          <Lock size={20} />
                        </div>
                      ) : (
                        <div className="w-14 h-14 bg-ls-compliment group-hover:bg-ls-white flex items-center justify-center text-ls-primary shadow-xl shadow-ls-compliment/10 transform transition-all active:scale-95">
                          <Play size={24} className="ml-1 fill-current" />
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Footer CTA - Institutional Enrollment */}
        {!user && (
          <div className="mt-32 p-20 border border-border-theme bg-card text-center relative overflow-hidden theme-transition">
            <div className="absolute top-0 right-0 w-64 h-64 bg-ls-compliment/5 blur-[80px] rounded-full -mr-20 -mt-20 opacity-50" />
            
            <div className="relative z-10 space-y-10">
              <h2 className="text-4xl md:text-5xl font-serif font-light text-foreground tracking-tight leading-tight uppercase">
                Unlock the Full <span className="italic">Sequence</span>
              </h2>
              <p className="text-xl text-text-muted max-w-xl mx-auto leading-relaxed font-serif font-light italic">
                Enlist alongside institutional wealth managers and elite founders to gain full access to our deep-market strategic dossiers.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
                <Link href="/auth/register" className="px-12 py-6 bg-ls-compliment text-ls-primary font-bold text-[10px] uppercase tracking-[0.5em] hover:bg-ls-white transition-all shadow-xl">
                  Enlist for Access
                </Link>
                <Link href="/auth/login" className="px-12 py-6 border border-border-theme text-foreground font-bold text-[10px] uppercase tracking-[0.5em] hover:bg-ls-primary hover:text-ls-white transition-all">
                  Credential Sign-In
                </Link>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
