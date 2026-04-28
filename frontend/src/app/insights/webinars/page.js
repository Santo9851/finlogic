"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Video, Play, Calendar, Clock, User, Search, X } from "lucide-react";
import { fetchWebinars, normaliseList } from "@/services/insights";

function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-white/5 rounded-xl ${className}`} />;
}

function WebinarRow({ webinar, isPast }) {
  const date = webinar.scheduled_at ? new Date(webinar.scheduled_at) : null;
  const displayDate = date
    ? date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
    : "";
  const displayTime = date
    ? date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    : "";
  const durationH = Math.floor((webinar.duration_minutes || 60) / 60);
  const durationM = (webinar.duration_minutes || 60) % 60;
  const durationStr = durationH ? `${durationH}h ${durationM ? durationM + "m" : ""}`.trim() : `${durationM}m`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`group flex flex-col md:flex-row gap-5 p-6 rounded-2xl border transition-all
        ${isPast
          ? "border-white/5 bg-white/[0.02] hover:bg-white/[0.04]"
          : "border-[#F59F01]/15 bg-[#F59F01]/[0.04] hover:bg-[#F59F01]/[0.07] animate-pulse-orange"
        }`}
    >
      {/* Icon */}
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${isPast ? "bg-white/5" : "bg-[#F59F01]/15"}`}>
        {isPast
          ? <Play size={24} className="text-white/30" />
          : <Video size={24} className="text-[#F59F01]" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          {!isPast && (
            <span className="flex items-center gap-1 text-[10px] font-black text-[#16c784] uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16c784] animate-pulse inline-block" /> Upcoming
            </span>
          )}
          {isPast && webinar.recording_url && (
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest px-2 py-0.5 rounded-full border border-white/10">
              On-Demand
            </span>
          )}
          {webinar.pillar && (
            <span className="text-[10px] font-bold text-[#F59F01]/70 uppercase tracking-widest">{webinar.pillar}</span>
          )}
        </div>
        <h3 className="font-bold text-white text-lg leading-snug group-hover:text-[#F59F01] transition-colors mb-1">
          {webinar.title}
        </h3>
        {webinar.description && (
          <p className="text-white/50 text-sm line-clamp-2 mb-3">{webinar.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-4 text-xs text-white/30">
          {webinar.speaker && (
            <span className="flex items-center gap-1 text-white/50">
              <User size={12} /> {webinar.speaker}
            </span>
          )}
          {displayDate && (
            <span className="flex items-center gap-1">
              <Calendar size={12} /> {displayDate}
            </span>
          )}
          {displayTime && !isPast && (
            <span className="flex items-center gap-1">
              <Clock size={12} /> {displayTime} NPT
            </span>
          )}
          {durationStr && (
            <span className="flex items-center gap-1">
              <Clock size={12} /> {durationStr}
            </span>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="flex items-center md:items-start flex-shrink-0">
        {!isPast && webinar.registration_url && (
          <a
            href={webinar.registration_url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 rounded-full bg-[#F59F01] text-[#100226] text-sm font-black hover:bg-[#F59F01]/80 transition-colors"
          >
            Register Free
          </a>
        )}
        {isPast && webinar.recording_url && (
          <a
            href={webinar.recording_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/10 text-white/60 text-sm font-bold hover:border-white/30 hover:text-white transition-colors"
          >
            <Play size={14} /> Watch
          </a>
        )}
      </div>
    </motion.div>
  );
}

function WebinarSkeleton() {
  return (
    <div className="flex gap-5 p-6 rounded-2xl border border-white/5">
      <Skeleton className="w-14 h-14 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

export default function WebinarsListPage() {
  const [upcoming, setUpcoming] = useState([]);
  const [past, setPast]         = useState([]);
  const [search, setSearch]     = useState("");
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [upRes, pastRes] = await Promise.all([
          fetchWebinars({ upcoming: true, search }),
          fetchWebinars({ past: true, search }),
        ]);
        setUpcoming(normaliseList(upRes));
        setPast(normaliseList(pastRes));
      } catch {
        setUpcoming([]); setPast([]);
      } finally {
        setLoading(false);
      }
    }
    const t = setTimeout(load, 350);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <div className="bg-[#100226] text-white min-h-screen">
      {/* Hero */}
      <section className="pt-32 pb-16 relative overflow-hidden border-b border-white/5">
        <div className="absolute top-0 right-0 w-[700px] h-[400px] bg-[#0B6EC3]/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="inline-block px-3 py-1 rounded-full bg-[#0B6EC3]/15 border border-[#0B6EC3]/30 text-[#0B6EC3] text-xs font-bold uppercase tracking-widest mb-4">
            Live & Recorded Events
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-3">Webinars & Masterclasses</h1>
          <p className="text-white/50 text-lg max-w-2xl mb-8">
            Join our partners and industry experts for live discussions on market trends, investment frameworks, and sustainable growth.
          </p>

          {/* Search */}
          <div className="relative max-w-xl">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search webinars, speakers, topics…"
              className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#0B6EC3]/50 transition-all"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
                <X size={15} />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Upcoming */}
      <section className="py-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center gap-3 mb-8">
            <h2 className="text-2xl font-bold">Upcoming Live Events</h2>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#16c784]/10 border border-[#16c784]/20 text-[#16c784] text-xs font-black uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16c784] animate-pulse" />
              Register Now
            </span>
          </div>

          {loading ? (
            <div className="space-y-4">{[...Array(2)].map((_, i) => <WebinarSkeleton key={i} />)}</div>
          ) : upcoming.length === 0 ? (
            <div className="py-16 text-center text-white/30 border border-white/5 rounded-2xl">
              <Video size={32} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No upcoming events scheduled{search ? " matching your search" : ""}</p>
              <p className="text-sm mt-1">Check back soon or explore our on-demand library below.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcoming.map(w => <WebinarRow key={w.id} webinar={w} isPast={false} />)}
            </div>
          )}
        </div>
      </section>

      {/* Past / On-Demand */}
      <section className="py-16 border-t border-white/5 bg-white/[0.01]">
        <div className="container mx-auto px-4 lg:px-8">
          <h2 className="text-2xl font-bold mb-2">On-Demand Library</h2>
          <p className="text-white/40 text-sm mb-8">Access our archive of past masterclasses and panel discussions.</p>

          {loading ? (
            <div className="space-y-4">{[...Array(4)].map((_, i) => <WebinarSkeleton key={i} />)}</div>
          ) : past.length === 0 ? (
            <div className="py-16 text-center text-white/30 border border-white/5 rounded-2xl">
              <Play size={32} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No recordings available{search ? " matching your search" : ""}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {past.map(w => <WebinarRow key={w.id} webinar={w} isPast />)}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
