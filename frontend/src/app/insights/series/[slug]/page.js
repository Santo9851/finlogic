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
    if (slug) load();
  }, [slug]);

  if (loading) return (
    <div className="bg-[#100226] min-h-screen pt-32 flex justify-center">
      <div className="animate-pulse space-y-4 w-full max-w-4xl px-4">
        <div className="h-4 w-24 bg-white/5 rounded" />
        <div className="h-12 w-3/4 bg-white/5 rounded" />
        <div className="h-32 w-full bg-white/5 rounded" />
      </div>
    </div>
  );

  if (error || !series) return (
    <div className="bg-[#100226] min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-white/40 mb-4">Series not found.</p>
        <Link href="/insights/articles" className="text-[#F59F01] font-bold">← Back to Articles</Link>
      </div>
    </div>
  );

  const color = PILLAR_COLORS[series.pillar?.toLowerCase()] || "#F59F01";
  const articles = series.articles || [];
  const completedCount = articles.filter(a => a.is_completed).length;
  const progressPercent = articles.length > 0 ? (completedCount / articles.length) * 100 : 0;

  return (
    <div className="bg-[#100226] text-white min-h-screen pb-24">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#F59F01]/5 blur-[120px] rounded-full -mr-40 -mt-40" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#F59F01]/5 blur-[120px] rounded-full -ml-40 -mb-40" />
        </div>

        <div className="container mx-auto px-4 relative z-10 max-w-5xl text-center">
          <Link href="/insights/articles" className="inline-flex items-center gap-2 text-white/40 hover:text-[#F59F01] text-sm transition-colors mb-8">
            <ArrowLeft size={15} /> Back to Insights
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="inline-block px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6"
              style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}
            >
              Educational Series
            </span>
            <h1 className="text-4xl md:text-6xl font-black mb-8 leading-tight">{series.title}</h1>
            <p className="text-lg md:text-xl text-white/50 max-w-3xl mx-auto leading-relaxed mb-10">
              {series.description}
            </p>

            {/* Progress Bar (Visible if user is logged in) */}
            {user && (
              <div className="max-w-md mx-auto bg-white/5 rounded-2xl p-6 border border-white/5">
                <div className="flex justify-between items-end mb-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Your Progress</span>
                  <span className="text-sm font-black text-[#F59F01]">{completedCount} / {articles.length} Completed</span>
                </div>
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    className="h-full bg-gradient-to-r from-[#F59F01] to-[#F59F01]/50"
                  />
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Article List */}
      <section className="container mx-auto px-4 max-w-4xl">
        <div className="space-y-4">
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
                  className="group block relative p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-[#F59F01]/30 hover:bg-[#F59F01]/5 transition-all"
                >
                  <div className="flex items-center gap-6">
                    {/* Number Circle */}
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 font-black text-lg transition-all
                      ${isCompleted ? 'bg-[#16c784]/20 text-[#16c784]' : 'bg-white/5 text-white/20 group-hover:bg-[#F59F01]/20 group-hover:text-[#F59F01]'}
                    `}>
                      {isCompleted ? <CheckCircle2 size={24} /> : art.article_number}
                    </div>

                    <div className="flex-grow min-w-0">
                      <div className="flex flex-wrap items-center gap-3 mb-1">
                        <h3 className="font-bold text-white group-hover:text-white transition-colors truncate">
                          {art.title}
                        </h3>
                        {art.is_free && (
                          <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-[#16c784]/10 text-[#16c784] border border-[#16c784]/20">
                            Free
                          </span>
                        )}
                        {isLocked && !user && (
                          <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-white/5 text-white/40 border border-white/10 flex items-center gap-1">
                            <Lock size={8} /> Account Required
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-white/30">
                        <span className="flex items-center gap-1.5"><Clock size={12} /> {art.read_time || '5 min read'}</span>
                        {art.pillar && <span className="flex items-center gap-1.5"><BookOpen size={12} /> {art.pillar}</span>}
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      {isLocked && !user ? (
                        <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/20">
                          <Lock size={16} />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#F59F01] flex items-center justify-center text-[#100226] transform group-hover:scale-110 transition-transform">
                          <Play size={16} className="ml-1" />
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
          <div className="mt-16 text-center p-12 rounded-[3rem] bg-gradient-to-b from-white/5 to-transparent border border-white/10">
            <h2 className="text-2xl font-black mb-4">Unlock the Full Series</h2>
            <p className="text-white/50 mb-8 max-w-md mx-auto">
              Join thousands of investors and entrepreneurs gaining an edge with our deep-dive research.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register" className="px-10 py-4 rounded-full bg-[#F59F01] text-[#100226] font-black text-sm hover:scale-105 transition-transform">
                Create Free Account
              </Link>
              <Link href="/auth/login" className="px-10 py-4 rounded-full bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white/10 transition-colors">
                Sign In
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
