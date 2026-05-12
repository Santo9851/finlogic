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
import { fetchSeriesList, fetchWisdomHubDashboard, PILLAR_COLORS } from "@/services/insights";

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
        setSeriesList(list);
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
    <div className="bg-background min-h-screen pt-32 px-4 flex justify-center theme-transition">
      <div className="w-full max-w-4xl space-y-4 animate-pulse">
        <div className="h-10 w-48 bg-foreground/5 rounded-full" />
        <div className="h-64 bg-foreground/5 rounded-[3rem]" />
        <div className="h-64 bg-foreground/5 rounded-[3rem]" />
      </div>
    </div>
  );

  // Map progress from dashboard data to series list
  const mergedSeries = seriesList.map(s => {
    const inProgress = dashboardData?.in_progress_series.find(ips => ips.slug === s.slug);
    if (inProgress) return inProgress;
    
    return {
      ...s,
      completed_count: 0,
      total_count: s.total_articles,
      progress_percent: 0
    };
  });

  return (
    <div className="bg-background text-foreground min-h-screen pb-24 theme-transition">
      <div className="container mx-auto px-4 pt-32 max-w-5xl">
        
        <Link href="/wisdom-hub" className="inline-flex items-center gap-2 text-text-muted hover:text-[#F59F01] text-sm transition-colors mb-10 font-bold uppercase tracking-widest">
          <ArrowLeft size={15} /> Back to Library
        </Link>

        <header className="mb-16">
          <div className="flex items-center gap-3 mb-4 text-[#F59F01] text-[10px] font-black uppercase tracking-[0.2em]">
            <BookOpen size={14} /> Knowledge Hub
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">Series Directory</h1>
          <p className="text-text-muted max-w-2xl leading-relaxed text-lg font-medium">
            Browse our curated series on venture capital, growth equity, and private market dynamics.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                  className="group block p-8 rounded-[2.5rem] bg-background border border-border-theme hover:border-[#F59F01]/30 transition-all h-full flex flex-col shadow-xl hover:shadow-2xl theme-transition"
                >
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border shadow-sm"
                          style={{ background: `${color}10`, color, borderColor: `${color}30` }}>
                      {series.pillar}
                    </span>
                    <LayoutGrid size={18} className="text-text-muted/20 group-hover:text-[#F59F01] transition-colors" />
                  </div>

                  <h3 className="text-2xl font-black text-foreground mb-4 group-hover:text-[#F59F01] transition-colors">
                    {series.title}
                  </h3>
                  <p className="text-sm text-text-muted leading-relaxed mb-10 flex-grow line-clamp-2 font-medium">
                    {series.description}
                  </p>

                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <div className="text-[10px] font-black uppercase tracking-widest text-text-muted/40">
                        {isFinished ? "Completed" : isStarted ? "In Progress" : "Not Started"}
                      </div>
                      <div className="text-sm font-black text-[#F59F01]">
                        {series.progress_percent}%
                      </div>
                    </div>
                    <div className="h-2 w-full bg-foreground/5 rounded-full overflow-hidden border border-border-theme/50">
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: `${series.progress_percent}%` }}
                        className="h-full bg-gradient-to-r from-[#F59F01] to-[#F59F01]/50"
                      />
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-text-muted/60">
                        {series.total_count} Modules
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-[#F59F01] group-hover:gap-2 transition-all">
                        {isStarted ? "Continue" : "Start Learning"} <ChevronRight size={12} />
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
