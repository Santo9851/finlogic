"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
  BookOpen, 
  CheckCircle2, 
  Download, 
  Award, 
  ArrowRight, 
  Clock,
  ChevronRight,
  Library,
  Star,
  Sparkles
} from "lucide-react";
import { fetchWisdomHubDashboard, PILLAR_COLORS } from "@/services/insights";
import { useAuth } from "@/lib/AuthContext";

export default function WisdomHubDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const dashboardData = await fetchWisdomHubDashboard();
        setData(dashboardData);
      } catch (e) {
        console.error("Failed to load dashboard", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return (
    <div className="bg-background min-h-screen pt-40 px-4 flex justify-center theme-transition">
      <div className="w-full max-w-6xl space-y-12">
        <Skeleton className="h-20 w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    </div>
  );

  if (!data) return (
    <div className="bg-background min-h-screen pt-32 px-4 text-center theme-transition">
      <p className="text-text-muted">Failed to load your registry. Please try again.</p>
    </div>
  );

  const { stats, in_progress_series, continue_learning, recent_completions } = data;

  return (
    <div className="bg-background text-foreground min-h-screen pb-32 theme-transition selection:bg-ls-compliment/30 font-sans">
      <div className="container mx-auto px-4 lg:px-8 pt-40 max-w-6xl">
        
        {/* Welcome Header - Institutional Style */}
        <header className="mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4 text-ls-compliment text-[10px] font-bold uppercase tracking-[0.5em]">
              <Library size={14} /> Intelligence Registry
            </div>
            <h1 className="text-5xl md:text-7xl font-serif font-light leading-tight">
              Welcome back, <span className="italic text-ls-compliment">{user?.first_name || "Reader"}</span>
            </h1>
            <div className="flex flex-col md:flex-row md:items-center gap-8 pt-4 border-t border-border-theme">
               <p className="text-xl text-text-muted max-w-2xl font-light font-serif italic">
                 "Knowledge is the only currency that appreciates in a volatile market."
               </p>
               <div className="h-10 w-px bg-border-theme hidden md:block" />
               <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
                 Last Verified: <span className="text-foreground">{new Date().toLocaleDateString()}</span>
               </div>
            </div>
          </motion.div>
        </header>

        {/* Stats Grid - Metadata Blocks */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border-theme border border-border-theme mb-24">
          <StatCard icon={<BookOpen size={20} />} label="Articles Read" value={stats.total_completed} />
          <StatCard icon={<Clock size={20} />} label="Days in Hub" value={stats.joined_days} />
          <StatCard icon={<Award size={20} />} label="Unit Status" value="Institutional" />
          <StatCard icon={<Star size={20} />} label="Venture Literacy" value={`${Math.round(stats.total_completed * 1.5)}%`} />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-20">
          
          {/* Main Column */}
          <main className="space-y-24">
            
            {/* Continue Learning - Strategic Briefing */}
            {continue_learning && (
              <section>
                <div className="mb-10 border-b border-border-theme pb-6 flex items-center justify-between">
                   <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-ls-compliment">Active Briefing</h3>
                   <span className="text-[9px] font-mono opacity-40">ITEM-REF: 0{continue_learning.article_number}</span>
                </div>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="group relative p-12 bg-ls-primary text-ls-white overflow-hidden border border-ls-compliment/20"
                >
                  <div className="relative z-10 space-y-8">
                    <div className="space-y-4">
                      <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-ls-compliment">
                        Chapter {continue_learning.article_number} // {continue_learning.series_title}
                      </span>
                      <h2 className="text-4xl md:text-5xl font-serif font-light leading-tight group-hover:text-ls-compliment transition-colors">
                        {continue_learning.title}
                      </h2>
                    </div>
                    
                    <Link 
                      href={`/insights/articles/${continue_learning.slug}`}
                      className="inline-flex items-center gap-6 px-12 py-5 bg-ls-compliment text-ls-primary font-bold text-[10px] uppercase tracking-[0.3em] hover:bg-ls-white transition-all"
                    >
                      Resume Briefing <ArrowRight size={14} />
                    </Link>
                  </div>
                  <Sparkles className="absolute right-12 top-1/2 -translate-y-1/2 text-ls-compliment/10 w-40 h-40" />
                </motion.div>
              </section>
            )}

            {/* Ongoing Series */}
            {in_progress_series.length > 0 && (
              <section>
                <div className="mb-10 border-b border-border-theme pb-6 flex items-center justify-between">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-ls-compliment">Knowledge Sequences</h3>
                  <Link href="/wisdom-hub/series" className="text-[10px] font-bold text-text-muted hover:text-ls-compliment tracking-widest uppercase transition-colors">Registry View</Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border-theme border border-border-theme">
                  {in_progress_series.map(series => (
                    <SeriesProgressCard key={series.id} series={series} />
                  ))}
                </div>
              </section>
            )}

            {/* Resources - Minimalist Ledger */}
            <section>
              <div className="mb-10 border-b border-border-theme pb-6 flex items-center justify-between">
                   <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-ls-compliment">Asset Vault</h3>
                </div>
              <div className="bg-card border border-border-theme p-16 text-center">
                <div className="w-16 h-16 border border-border-theme flex items-center justify-center mx-auto mb-6">
                  <Download className="text-ls-compliment opacity-40" size={20} />
                </div>
                <p className="text-sm font-serif italic text-text-muted">Digital assets and whitepapers will be logged here upon completion.</p>
              </div>
            </section>

          </main>

          {/* Sidebar - The Ledger */}
          <aside className="space-y-16">
            
            {/* Recent Activity */}
            <section>
              <div className="mb-8 border-b border-border-theme pb-4">
                 <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-text-muted">Recent Ledger</h4>
              </div>
              <div className="space-y-8">
                {recent_completions.length > 0 ? recent_completions.map((c, i) => (
                  <div key={i} className="group border-l border-border-theme pl-6 space-y-2">
                    <span className="text-[9px] font-mono opacity-30 block">LOG-ENTRY 0{i+1}</span>
                    <h5 className="text-lg font-serif font-light text-foreground group-hover:text-ls-compliment transition-colors">
                      <Link href={`/insights/articles/${c.slug}`}>{c.title}</Link>
                    </h5>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
                      Status: <span className="text-ls-up">Archived</span>
                    </p>
                  </div>
                )) : (
                  <p className="text-xs text-text-muted italic">Registry is currently empty.</p>
                )}
              </div>
            </section>

            {/* Certificates - Formal Block */}
            <section className="p-10 bg-ls-primary/5 border border-ls-compliment/10 relative overflow-hidden">
              <Award className="text-ls-compliment mb-6 opacity-40" size={24} />
              <h4 className="text-xl font-serif font-light mb-4 text-foreground">Certifications</h4>
              <p className="text-sm text-text-muted mb-8 leading-relaxed font-serif italic">
                Verified credentials will appear here once the required sequences are mastered.
              </p>
              <button disabled className="w-full py-4 border border-border-theme text-text-muted text-[10px] font-bold uppercase tracking-widest cursor-not-allowed">
                0 Pending
              </button>
            </section>

          </aside>

        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="p-8 bg-card flex flex-col justify-between space-y-6 theme-transition group hover:bg-ls-primary transition-all">
      <div className="text-ls-compliment opacity-60 group-hover:opacity-100 transition-opacity">
        {icon}
      </div>
      <div>
        <div className="text-3xl font-serif font-light text-foreground group-hover:text-ls-white mb-2">{value}</div>
        <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-text-muted group-hover:text-ls-white/40">{label}</div>
      </div>
    </div>
  );
}

function SeriesProgressCard({ series }) {
  const color = PILLAR_COLORS[series.pillar?.toLowerCase()] || "#F59F01";
  return (
    <Link href={`/insights/series/${series.slug}`} className="group block p-10 bg-card hover:bg-ls-primary transition-all theme-transition">
      <div className="flex items-center justify-between mb-8">
        <span className="text-[9px] font-bold uppercase tracking-[0.3em] border-l-2 pl-3"
              style={{ borderLeftColor: color }}>
          {series.pillar}
        </span>
        <ChevronRight size={16} className="text-text-muted group-hover:text-ls-compliment transition-all" />
      </div>
      <h4 className="text-2xl font-serif font-light text-foreground group-hover:text-ls-white mb-10 line-clamp-2 leading-tight">{series.title}</h4>
      
      <div className="space-y-4">
        <div className="flex justify-between text-[9px] font-bold uppercase tracking-[0.3em]">
          <span className="text-text-muted group-hover:text-ls-white/40">Mastery</span>
          <span className="text-ls-compliment">{series.completed_count} / {series.total_count}</span>
        </div>
        <div className="h-0.5 w-full bg-border-theme group-hover:bg-ls-white/10 overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${series.progress_percent}%` }}
            className="h-full bg-ls-compliment"
          />
        </div>
      </div>
    </Link>
  );
}

function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-foreground/5 rounded-none ${className}`} />;
}
