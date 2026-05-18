"use client";

/**
 * Public Wisdom Hub – Sector Research Reports
 *
 * Displays published sector research reports in an elegant card layout.
 * Accessible without authentication.
 */
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight, BookOpen, Search, Clock, Calendar,
  BarChart3, ChevronDown, Sparkles, Building2, Globe,
} from "lucide-react";
import { useTheme } from "next-themes";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const SECTOR_ICONS = {
  Hydropower: "⚡",
  Banking: "🏦",
  Manufacturing: "🏭",
  Tourism: "✈️",
  IT: "💻",
  Agriculture: "🌾",
  Infrastructure: "🏗️",
  Health: "🏥",
  Education: "🎓",
  Retail: "🛍️",
  "Real Estate": "🏘️",
  Fintech: "📱",
  Other: "📊",
};

const SECTOR_GRADIENTS = {
  Hydropower: "from-blue-600/20 to-cyan-600/20",
  Banking: "from-emerald-600/20 to-teal-600/20",
  Manufacturing: "from-orange-600/20 to-amber-600/20",
  Tourism: "from-purple-600/20 to-violet-600/20",
  IT: "from-indigo-600/20 to-blue-600/20",
  Agriculture: "from-lime-600/20 to-green-600/20",
  Infrastructure: "from-stone-600/20 to-zinc-600/20",
  Health: "from-rose-600/20 to-pink-600/20",
  Education: "from-sky-600/20 to-blue-600/20",
  Retail: "from-fuchsia-600/20 to-pink-600/20",
  "Real Estate": "from-amber-600/20 to-yellow-600/20",
  Fintech: "from-violet-600/20 to-purple-600/20",
  Other: "from-gray-600/20 to-slate-600/20",
};

export default function PublicSectorReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSector, setFilterSector] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterSector) params.append("sector", filterSector);
      const res = await fetch(`${API_BASE}/insights/sector-reports/?${params}`);
      const data = await res.json();
      setReports(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.error("Failed to load sector reports:", err);
    } finally {
      setLoading(false);
    }
  }, [filterSector]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const uniqueSectors = [...new Set(reports.map((r) => r.sector))];

  return (
    <div className="bg-background text-foreground min-h-screen pb-32 theme-transition font-sans">
      {/* Hero Section */}
      <section className="relative pt-40 pb-24 bg-ls-primary text-ls-white overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-br from-ls-compliment/20 via-transparent to-transparent" />
          <div className="absolute top-20 right-20 w-96 h-96 bg-ls-compliment/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-10 left-10 w-64 h-64 bg-ls-compliment/3 rounded-full blur-[80px]" />
        </div>

        <div className="container mx-auto px-4 lg:px-8 relative z-10 text-center space-y-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm font-bold uppercase tracking-[0.4em] text-ls-compliment"
          >
            Market Intelligence · Research Division
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-8xl font-serif font-light leading-tight"
          >
            Sector Research
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-ls-white/60 max-w-3xl mx-auto font-light leading-relaxed"
          >
            AI-powered institutional research reports analyzing Nepal's key investment sectors.
            Quarterly analysis of market dynamics, regulatory landscapes, and investment opportunities.
          </motion.p>

          {/* Filter Chips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-3 pt-8"
          >
            <button
              onClick={() => setFilterSector("")}
              className={`px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.3em] transition-all duration-300 border
                ${!filterSector
                  ? "border-ls-compliment text-ls-compliment bg-ls-compliment/10"
                  : "border-ls-white/10 text-ls-white/40 hover:text-ls-white hover:border-ls-white/30"
                }`}
            >
              All Sectors
            </button>
            {uniqueSectors.map((s) => (
              <button
                key={s}
                onClick={() => setFilterSector(s === filterSector ? "" : s)}
                className={`px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.3em] transition-all duration-300 border flex items-center gap-2
                  ${filterSector === s
                    ? "border-ls-compliment text-ls-compliment bg-ls-compliment/10"
                    : "border-ls-white/10 text-ls-white/40 hover:text-ls-white hover:border-ls-white/30"
                  }`}
              >
                <span>{SECTOR_ICONS[s] || "📊"}</span>
                {s}
              </button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Reports Grid */}
      <div className="container mx-auto px-4 lg:px-8 mt-20">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse bg-foreground/5 rounded-lg h-72"
              />
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-32 border border-dashed border-border-theme">
            <BookOpen size={56} className="mx-auto mb-8 text-text-muted/10" />
            <h3 className="text-3xl font-serif font-light mb-4">
              No Published Reports
            </h3>
            <p className="text-text-muted text-lg font-light">
              Sector research reports will appear here once published by our
              investment team.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0">
            {reports.map((report, idx) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group border border-border-theme p-10 hover:bg-ls-primary hover:text-ls-white transition-all duration-500 cursor-pointer relative overflow-hidden"
                onClick={() =>
                  setExpandedId(expandedId === report.id ? null : report.id)
                }
              >
                {/* Gradient overlay */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${SECTOR_GRADIENTS[report.sector] || "from-gray-600/10 to-slate-600/10"} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                />

                <div className="relative z-10 space-y-6">
                  {/* Sector & Quarter */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{SECTOR_ICONS[report.sector] || "📊"}</span>
                      <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-ls-compliment">
                        {report.sector_display}
                      </span>
                    </div>
                    <span className="text-[9px] font-mono text-text-muted/40 group-hover:text-ls-white/40 uppercase tracking-widest">
                      {report.quarter_label}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl font-serif font-light leading-tight group-hover:text-ls-compliment transition-colors">
                    {report.title}
                  </h3>

                  {/* Summary */}
                  <p className="text-sm text-text-muted group-hover:text-ls-white/60 line-clamp-3 font-light leading-relaxed">
                    {report.summary}
                  </p>

                  {/* Footer */}
                  <div className="pt-6 flex items-center justify-between border-t border-border-theme group-hover:border-ls-white/10 transition-colors">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted/40 group-hover:text-ls-white/40 flex items-center gap-2">
                      <Calendar size={12} />
                      {new Date(report.report_date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                      })}
                    </span>
                    <ArrowRight
                      size={18}
                      className="text-ls-compliment transition-transform group-hover:translate-x-2"
                    />
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedId === report.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="relative z-10 mt-8 pt-8 border-t border-border-theme group-hover:border-ls-white/10"
                  >
                    <div className="prose prose-sm max-w-none text-foreground/80 group-hover:text-ls-white/70 font-light leading-relaxed">
                      <div
                        dangerouslySetInnerHTML={{
                          __html: report.content
                            ? report.content
                                .replace(/^### (.+)$/gm, "<h4>$1</h4>")
                                .replace(/^## (.+)$/gm, "<h3>$1</h3>")
                                .replace(/^# (.+)$/gm, "<h2>$1</h2>")
                                .replace(/\n/g, "<br/>")
                            : "<p>Content loading...</p>",
                        }}
                      />
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 lg:px-8 mt-32">
        <div className="border border-border-theme p-16 md:p-24 text-center space-y-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-ls-compliment/5 via-transparent to-transparent" />
          <div className="relative z-10 space-y-8">
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-ls-compliment">
              Institutional Access
            </span>
            <h2 className="text-4xl md:text-5xl font-serif font-light">
              Get Full Research Access
            </h2>
            <p className="text-text-muted text-lg font-light max-w-2xl mx-auto leading-relaxed">
              Request institutional access to our complete research library,
              including private deal memos, quarterly fund reports, and
              proprietary valuation models.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-3 px-10 py-5 bg-ls-primary text-ls-white text-[11px] font-bold uppercase tracking-[0.3em] hover:opacity-90 transition-all"
            >
              Request Access
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
