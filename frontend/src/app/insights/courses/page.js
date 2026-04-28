"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { BookOpen, Clock, Search, X, ChevronRight } from "lucide-react";
import { fetchCourses, normaliseList, PILLAR_LABELS, PILLAR_COLORS } from "@/services/insights";

function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-white/5 rounded-xl ${className}`} />;
}

const LEVELS = ["All", "beginner", "intermediate", "advanced"];
const LEVEL_META = {
  beginner:     { label: "Beginner",     color: "#16c784" },
  intermediate: { label: "Intermediate", color: "#F59F01" },
  advanced:     { label: "Advanced",     color: "#f43f5e" },
};

function CourseCard({ course }) {
  const level = LEVEL_META[course.level?.toLowerCase()] || { label: course.level || "Course", color: "#F59F01" };
  const pillarColor = PILLAR_COLORS[course.pillar?.toLowerCase()] || "#3A3153";

  return (
    <Link href={`/insights/courses/${course.slug}`}
      className="group flex flex-col rounded-2xl overflow-hidden border border-white/5 hover:border-white/20 bg-[#0D0120] hover:bg-[#130225] transition-all hover:-translate-y-1.5 shadow-lg"
    >
      {/* Image */}
      <div className="relative h-52 overflow-hidden">
        {course.featured_image ? (
          <img
            src={course.featured_image}
            alt={course.title}
            className="w-full h-full object-cover brightness-75 group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${pillarColor}22, #100226)` }}>
            <BookOpen size={48} className="text-white/15" />
          </div>
        )}
        {/* Level badge overlay */}
        <div className="absolute top-4 left-4">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
            style={{ background: `${level.color}22`, color: level.color, border: `1px solid ${level.color}40` }}
          >
            {level.label}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-6">
        {course.pillar && (
          <span className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: pillarColor }}>
            {PILLAR_LABELS[course.pillar.toLowerCase()] || course.pillar}
          </span>
        )}
        <h3 className="font-bold text-white text-lg leading-snug mb-2 flex-1 group-hover:text-[#F59F01] transition-colors">
          {course.title}
        </h3>
        <p className="text-white/50 text-sm line-clamp-3 mb-5">{course.description}</p>

        <div className="flex items-center justify-between pt-4 border-t border-white/5 text-xs text-white/30">
          <span className="flex items-center gap-1.5">
            <BookOpen size={12} /> {course.module_count || "—"} modules
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={12} /> {course.duration_hours}h total
          </span>
          <span className="flex items-center gap-1 text-[#F59F01]/70 font-bold group-hover:text-[#F59F01] transition-colors">
            Start <ChevronRight size={12} />
          </span>
        </div>
      </div>
    </Link>
  );
}

function CourseSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden border border-white/5 bg-[#0D0120]">
      <Skeleton className="h-52 rounded-none" />
      <div className="p-6 space-y-3">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
        <div className="pt-2 flex justify-between">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
}

export default function CoursesListPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [level, setLevel]     = useState("");
  const debRef = useRef(null);

  useEffect(() => {
    clearTimeout(debRef.current);
    debRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await fetchCourses({ search, level });
        setCourses(normaliseList(data));
      } catch {
        setCourses([]);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(debRef.current);
  }, [search, level]);

  return (
    <div className="bg-[#100226] text-white min-h-screen">
      {/* Header */}
      <section className="pt-32 pb-14 relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)", backgroundSize: "40px 40px" }}
        />
        <div className="absolute top-0 left-1/3 w-[500px] h-[300px] bg-[#16c784]/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="inline-block px-3 py-1 rounded-full bg-[#16c784]/10 border border-[#16c784]/20 text-[#16c784] text-xs font-bold uppercase tracking-widest mb-4">
            Finlogic Campus
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-3">Learning Paths</h1>
          <p className="text-white/50 text-lg max-w-2xl mb-8">
            Proprietary courses designed to prepare founders and investors for institutional capital and sustainable scale.
          </p>

          {/* Search */}
          <div className="flex flex-col md:flex-row gap-4 mb-5">
            <div className="relative flex-1 max-w-xl">
              <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search courses, topics, skills…"
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#16c784]/40 transition-all"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
                  <X size={15} />
                </button>
              )}
            </div>
          </div>

          {/* Level filter */}
          <div className="flex flex-wrap gap-2">
            {LEVELS.map(l => {
              const active = (l === "All" && !level) || l === level;
              const meta = LEVEL_META[l] || { color: "#F59F01" };
              return (
                <button
                  key={l}
                  onClick={() => setLevel(l === "All" ? "" : l)}
                  className="px-4 py-1.5 rounded-full text-xs font-bold transition-all border"
                  style={{
                    background: active ? `${meta.color}20` : "transparent",
                    borderColor: active ? `${meta.color}50` : "rgba(255,255,255,0.08)",
                    color: active ? meta.color : "rgba(255,255,255,0.4)",
                  }}
                >
                  {l === "All" ? "All Levels" : (meta.label || l)}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4 lg:px-8">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => <CourseSkeleton key={i} />)}
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-32 text-white/30">
              <BookOpen size={40} className="mx-auto mb-4 opacity-40" />
              <h3 className="text-xl font-bold mb-2">No courses found</h3>
              <p className="text-sm">Try adjusting your search or level filter.</p>
              <button onClick={() => { setSearch(""); setLevel(""); }}
                className="mt-6 px-6 py-2 rounded-full border border-white/10 text-sm hover:bg-white/5 transition-colors"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {courses.map((c, i) => (
                  <motion.div key={c.id || c.slug} layout
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i < 6 ? i * 0.07 : 0 }}
                  >
                    <CourseCard course={c} />
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 border-t border-white/5 text-center">
        <div className="container mx-auto px-4 lg:px-8 max-w-2xl">
          <h2 className="text-2xl font-bold mb-3">Looking for customized workshops?</h2>
          <p className="text-white/50 mb-8">Bespoke training sessions for portfolio companies and partner institutions.</p>
          <Link href="/contact"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full border border-[#F59F01] text-[#F59F01] font-bold hover:bg-[#F59F01] hover:text-[#100226] transition-all text-sm"
          >
            Contact Advisory Team <ChevronRight size={14} />
          </Link>
        </div>
      </section>
    </div>
  );
}
