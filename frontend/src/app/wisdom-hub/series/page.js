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
    <div className="bg-[#100226] min-h-screen pt-32 px-4 flex justify-center">
      <div className="w-full max-w-4xl space-y-4 animate-pulse">
        <div className="h-10 w-48 bg-white/5 rounded-full" />
        <div className="h-64 bg-white/5 rounded-[3rem]" />
        <div className="h-64 bg-white/5 rounded-[3rem]" />
      </div>
    </div>
  );

  // Map progress from dashboard data to series list
  const mergedSeries = seriesList.map(s => {
    const inProgress = dashboardData?.in_progress_series.find(ips => ips.slug === s.slug);
    if (inProgress) return inProgress;
    
    // Check if fully completed (not in in_progress but user might have completed all)
    // For now, if not in in_progress and not started, progress is 0.
    // In a real app, I'd check completion count properly.
    return {
      ...s,
      completed_count: 0,
      total_count: s.total_articles,
      progress_percent: 0
    };
  });

  return (
    <div className="bg-[#100226] text-white min-h-screen pb-24">
      <div className="container mx-auto px-4 pt-32 max-w-5xl">
        
        <Link href="/wisdom-hub" className="inline-flex items-center gap-2 text-white/40 hover:text-[#F59F01] text-sm transition-colors mb-10">
          <ArrowLeft size={15} /> Back to Library
        </Link>

        <header className="mb-16">
          <div className="flex items-center gap-3 mb-4 text-[#F59F01] text-[10px] font-black uppercase tracking-[0.2em]">
            <BookOpen size={14} /> Knowledge Hub
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-6">Series Directory</h1>
          <p className="text-white/40 max-w-2xl leading-relaxed">
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
                  className="group block p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:border-[#F59F01]/30 hover:bg-[#F59F01]/5 transition-all h-full flex flex-col"
                >
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full"
                          style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
                      {series.pillar}
                    </span>
                    <LayoutGrid size={18} className="text-white/10 group-hover:text-[#F59F01] transition-colors" />
                  </div>

                  <h3 className="text-2xl font-black text-white mb-4 group-hover:text-white transition-colors">
                    {series.title}
                  </h3>
                  <p className="text-sm text-white/40 leading-relaxed mb-10 flex-grow line-clamp-2">
                    {series.description}
                  </p>

                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <div className="text-[10px] font-black uppercase tracking-widest text-white/30">
                        {isFinished ? "Completed" : isStarted ? "In Progress" : "Not Started"}
                      </div>
                      <div className="text-sm font-black text-[#F59F01]">
                        {series.progress_percent}%
                      </div>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: `${series.progress_percent}%` }}
                        className="h-full bg-gradient-to-r from-[#F59F01] to-[#F59F01]/50"
                      />
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/20">
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
