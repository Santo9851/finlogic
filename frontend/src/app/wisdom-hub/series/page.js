"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
  ArrowLeft, 
  BookOpen, 
  ChevronRight,
  LayoutGrid
} from "lucide-react";
import { fetchSeriesList, fetchWisdomHubDashboard, PILLAR_COLORS, normaliseList } from "@/services/insights";

export default function WisdomHubSeriesPage() {
  const [seriesList, setSeriesList] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [list, dashboard] = await Promise.all([
          fetchSeriesList(),
          fetchWisdomHubDashboard()
        ]);
        setSeriesList(normaliseList(list));
        setDashboardData(dashboard);
      } catch (e) {
        console.error("Failed to load series list", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return (
    <div className="bg-background min-h-screen pt-40 px-4 flex justify-center theme-transition">
      <div className="w-full max-w-5xl space-y-12">
        <div className="h-10 w-48 bg-foreground/5 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border-theme border border-border-theme">
          <div className="h-80 bg-card animate-pulse" />
          <div className="h-80 bg-card animate-pulse" />
        </div>
      </div>
    </div>
  );

  // Map progress from dashboard data to series list
  const inProgressList = normaliseList(dashboardData?.in_progress_series);
  
  const mergedSeries = seriesList.map(s => {
    const inProgress = inProgressList.find(ips => ips.slug === s.slug);
    if (inProgress) return inProgress;
    
    return {
      ...s,
      completed_count: 0,
      total_count: s.total_articles,
      progress_percent: 0
    };
  });

  return (
    <div className="bg-background text-foreground min-h-screen pb-32 theme-transition selection:bg-ls-compliment/30 font-sans">
      <div className="container mx-auto px-4 lg:px-8 pt-40 max-w-5xl">
        
        <Link href="/wisdom-hub" className="inline-flex items-center gap-4 text-text-muted hover:text-ls-compliment text-[10px] font-bold uppercase tracking-[0.4em] transition-all mb-16">
          <ArrowLeft size={14} /> Back to Registry
        </Link>

        <header className="mb-20 space-y-6">
          <div className="flex items-center gap-4 text-ls-compliment text-[10px] font-bold uppercase tracking-[0.5em]">
            <BookOpen size={14} /> Knowledge Sequence Registry
          </div>
          <h1 className="text-5xl md:text-7xl font-serif font-light leading-tight">Series <span className="italic">Directory</span></h1>
          <p className="text-xl text-text-muted max-w-2xl leading-relaxed font-serif font-light italic">
            A curated ledger of venture capital, growth equity, and private market dynamics—architected for institutional mastery.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border-theme border border-border-theme">
          {mergedSeries.map((series, i) => {
            const color = PILLAR_COLORS[series.pillar?.toLowerCase()] || "#F59F01";
            const isStarted = series.progress_percent > 0;
            const isFinished = series.progress_percent === 100;

            return (
              <motion.div
                key={series.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <Link 
                  href={`/insights/series/${series.slug}`}
                  className="group block p-12 bg-card hover:bg-ls-primary transition-all h-full flex flex-col theme-transition"
                >
                  <div className="flex items-center justify-between mb-8">
                    <span className="text-[9px] font-bold uppercase tracking-[0.3em] border-l-2 pl-3"
                          style={{ borderLeftColor: color }}>
                      {series.pillar}
                    </span>
                    <span className="text-[9px] font-mono opacity-30 group-hover:text-ls-white/30 tracking-widest">SEQ-ID: 0{series.id}</span>
                  </div>

                  <h3 className="text-3xl font-serif font-light text-foreground group-hover:text-ls-white mb-6 group-hover:text-ls-compliment transition-colors leading-tight">
                    {series.title}
                  </h3>
                  <p className="text-text-muted group-hover:text-ls-white/60 leading-relaxed mb-12 flex-grow line-clamp-3 font-serif font-light italic">
                    {series.description}
                  </p>

                  <div className="space-y-6">
                    <div className="flex justify-between items-end text-[9px] font-bold uppercase tracking-[0.3em]">
                      <div className="text-text-muted group-hover:text-ls-white/40">
                        Status: <span className={isFinished ? "text-ls-up" : isStarted ? "text-ls-compliment" : ""}>
                          {isFinished ? "Archived" : isStarted ? "Synchronizing" : "Pending Audit"}
                        </span>
                      </div>
                      <div className="text-ls-compliment">
                        {series.progress_percent}%
                      </div>
                    </div>
                    <div className="h-0.5 w-full bg-border-theme group-hover:bg-ls-white/10 overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: `${series.progress_percent}%` }}
                        className="h-full bg-ls-compliment"
                      />
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-text-muted/60 group-hover:text-ls-white/30">
                        {series.total_count} Strategic Units
                      </span>
                      <span className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.3em] text-ls-compliment group-hover:text-ls-white transition-all">
                        {isStarted ? "Resume Sequence" : "Initiate Mastery"} <ChevronRight size={14} />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
