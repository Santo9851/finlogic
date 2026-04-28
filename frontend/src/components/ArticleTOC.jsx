"use client";
import { useState, useEffect, useRef } from "react";
import { BookOpen, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function extractHeadings(html) {
  if (typeof window === "undefined") return [];
  const doc = new DOMParser().parseFromString(html, "text/html");
  const nodes = doc.querySelectorAll("h2, h3, h4");
  return Array.from(nodes).map((el, i) => ({
    id: `heading-${i}`,
    text: el.textContent.trim(),
    level: parseInt(el.tagName[1]),
  }));
}

// Inject IDs into rendered DOM headings after content mounts
export function injectHeadingIds(containerRef) {
  if (!containerRef?.current) return;
  const headings = containerRef.current.querySelectorAll("h2, h3, h4");
  headings.forEach((el, i) => { el.id = `heading-${i}`; });
}

export default function ArticleTOC({ headings, accentColor = "#F59F01" }) {
  const [activeId, setActiveId] = useState(null);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!headings.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter(e => e.isIntersecting);
        if (visible.length) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );
    headings.forEach(h => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [headings]);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (!headings.length) return null;

  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors"
      >
        <span className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/50">
          <BookOpen size={12} style={{ color: accentColor }} /> In This Article
        </span>
        <motion.div animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronRight size={14} className="text-white/30" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-0.5">
              {headings.map((h) => {
                const isActive = activeId === h.id;
                return (
                  <button
                    key={h.id}
                    onClick={() => scrollTo(h.id)}
                    className={`w-full text-left py-1.5 px-3 rounded-lg text-xs leading-snug transition-all flex items-start gap-2 group
                      ${h.level === 2 ? "font-bold" : "pl-6 font-normal"}
                      ${isActive ? "text-white bg-white/5" : "text-white/40 hover:text-white/70 hover:bg-white/3"}`}
                    style={isActive ? { color: accentColor } : {}}
                  >
                    {h.level === 2 && (
                      <span className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0 transition-all"
                        style={{ background: isActive ? accentColor : "rgba(255,255,255,0.2)" }}
                      />
                    )}
                    {h.level >= 3 && (
                      <span className="w-px h-3 mt-0.5 flex-shrink-0 transition-all"
                        style={{ background: isActive ? accentColor : "rgba(255,255,255,0.1)" }}
                      />
                    )}
                    <span className="flex-1">{h.text}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
