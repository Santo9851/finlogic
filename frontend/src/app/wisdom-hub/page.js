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
  Star
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
    <div className="bg-[#100226] min-h-screen pt-32 px-4 flex justify-center">
      <div className="w-full max-w-6xl space-y-8">
        <div className="h-20 w-1/3 bg-white/5 animate-pulse rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-40 bg-white/5 animate-pulse rounded-3xl" />
          <div className="h-40 bg-white/5 animate-pulse rounded-3xl" />
          <div className="h-40 bg-white/5 animate-pulse rounded-3xl" />
        </div>
      </div>
    </div>
  );

  if (!data) return (
    <div className="bg-[#100226] min-h-screen pt-32 px-4 text-center">
      <p className="text-white/40">Failed to load your library. Please try again.</p>
    </div>
  );

  const { stats, in_progress_series, continue_learning, recent_completions } = data;

  return (
    <div className="bg-[#100226] text-white min-h-screen pb-24">
      <div className="container mx-auto px-4 pt-32 max-w-6xl">
        
        {/* Welcome Header */}
        <header className="mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center gap-3 mb-4 text-[#F59F01] text-[10px] font-black uppercase tracking-[0.2em]">
              <Library size={14} /> My Library
            </div>
            <h1 className="text-4xl md:text-5xl font-black mb-4">
              Welcome back, <span className="text-[#F59F01]">{user?.first_name || "Reader"}</span>
            </h1>
            <p className="text-white/40 max-w-2xl leading-relaxed">
              Continue where you left off and expand your venture capital expertise. 
              You've completed <span className="text-white font-bold">{stats.total_completed} articles</span> since joining.
            </p>
          </motion.div>
        </header>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <StatCard icon={<CheckCircle2 />} label="Articles Read" value={stats.total_completed} color="#16c784" />
          <StatCard icon={<BookOpen />} label="In Progress" value={stats.in_progress_count} color="#F59F01" />
          <StatCard icon={<Clock />} label="Days Joined" value={stats.joined_days} color="#a855f7" />
          <StatCard icon={<Star />} label="Points" value={stats.total_completed * 10} color="#f43f5e" />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-12">
          
          {/* Main Column */}
          <main className="space-y-16">
            
            {/* Continue Learning */}
            {continue_learning && (
              <section>
                <h3 className="text-xl font-black uppercase tracking-widest mb-6">Continue Learning</h3>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group relative p-8 rounded-[2.5rem] bg-gradient-to-br from-[#F59F01]/10 to-transparent border border-[#F59F01]/20 overflow-hidden"
                >
                  <div className="relative z-10">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#F59F01] mb-3 block">
                      Up Next: Chapter {continue_learning.article_number} in {continue_learning.series_title}
                    </span>
                    <h2 className="text-2xl md:text-3xl font-black mb-6 group-hover:text-[#F59F01] transition-colors">
                      {continue_learning.title}
                    </h2>
                    <Link 
                      href={`/insights/articles/${continue_learning.slug}`}
                      className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-[#F59F01] text-[#100226] font-black text-xs hover:scale-105 transition-transform"
                    >
                      Resume Article <ArrowRight size={14} />
                    </Link>
                  </div>
                  <BookOpen className="absolute right-8 top-1/2 -translate-y-1/2 text-white/5 w-32 h-32" />
                </motion.div>
              </section>
            )}

            {/* In Progress Series */}
            {in_progress_series.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-black uppercase tracking-widest">Ongoing Series</h3>
                  <Link href="/wisdom-hub/series" className="text-xs font-bold text-[#F59F01] hover:underline">View All</Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {in_progress_series.map(series => (
                    <SeriesProgressCard key={series.id} series={series} />
                  ))}
                </div>
              </section>
            )}

            {/* Download History (Empty for now) */}
            <section>
              <h3 className="text-xl font-black uppercase tracking-widest mb-6">Resources & Downloads</h3>
              <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-10 text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <Download className="text-white/20" size={24} />
                </div>
                <p className="text-sm text-white/30">Your download history will appear here.</p>
              </div>
            </section>

          </main>

          {/* Sidebar */}
          <aside className="space-y-12">
            
            {/* Recent Activity */}
            <section>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-6">Recent Activity</h4>
              <div className="space-y-4">
                {recent_completions.length > 0 ? recent_completions.map((c, i) => (
                  <div key={i} className="flex gap-4 group">
                    <div className="w-1.5 h-auto rounded-full bg-[#16c784]/20 group-hover:bg-[#16c784] transition-colors" />
                    <div>
                      <h5 className="text-sm font-bold text-white mb-1 group-hover:text-[#F59F01] transition-colors">
                        <Link href={`/insights/articles/${c.slug}`}>{c.title}</Link>
                      </h5>
                      <p className="text-[10px] text-white/30">
                        Completed in <span className="text-white/50">{c.series_title || "General Insights"}</span>
                      </p>
                    </div>
                  </div>
                )) : (
                  <p className="text-xs text-white/20">No recent activity.</p>
                )}
              </div>
            </section>

            {/* Certificates Placeholder */}
            <section className="p-8 rounded-3xl bg-[#a855f7]/5 border border-[#a855f7]/20">
              <Award className="text-[#a855f7] mb-4" size={28} />
              <h4 className="font-bold text-white mb-2">My Certificates</h4>
              <p className="text-xs text-white/40 mb-6 leading-relaxed">
                Complete a full series to earn a verified certificate of Venture Literacy.
              </p>
              <button disabled className="w-full py-3 rounded-full bg-white/5 text-white/20 text-[10px] font-black uppercase tracking-widest cursor-not-allowed">
                0 Certificates
              </button>
            </section>

          </aside>

        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center gap-5">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" 
           style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-black text-white">{value}</div>
        <div className="text-[10px] font-black uppercase tracking-widest text-white/30">{label}</div>
      </div>
    </div>
  );
}

function SeriesProgressCard({ series }) {
  const color = PILLAR_COLORS[series.pillar?.toLowerCase()] || "#F59F01";
  return (
    <Link href={`/insights/series/${series.slug}`} className="group block p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-[#F59F01]/30 transition-all">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded"
              style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
          {series.pillar}
        </span>
        <ChevronRight size={16} className="text-white/20 group-hover:text-[#F59F01] transform group-hover:translate-x-1 transition-all" />
      </div>
      <h4 className="font-bold text-white mb-6 line-clamp-1">{series.title}</h4>
      
      <div className="space-y-2">
        <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
          <span className="text-white/30">Progress</span>
          <span className="text-[#F59F01]">{series.completed_count} / {series.total_count}</span>
        </div>
        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${series.progress_percent}%` }}
            className="h-full bg-[#F59F01]"
          />
        </div>
      </div>
    </Link>
  );
}
