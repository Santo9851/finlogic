"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Lock, CheckCircle2, ArrowRight } from "lucide-react";

export default function Cliffhanger({ teaserBullets, title, seriesSlug, ctaType = "register" }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative mt-12 p-8 md:p-12 rounded-[2.5rem] bg-[#0D0120] border border-[#F59F01]/20 overflow-hidden shadow-2xl"
    >
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#F59F01]/5 blur-[100px] rounded-full -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#F59F01]/5 blur-[100px] rounded-full -ml-20 -mb-20" />

      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#F59F01]/10 border border-[#F59F01]/20 flex items-center justify-center mb-6 shadow-lg shadow-[#F59F01]/5">
          <Lock className="text-[#F59F01]" size={28} />
        </div>

        <h3 className="text-2xl md:text-3xl font-black text-white mb-4">
          Want to finish reading <br/>
          <span className="text-[#F59F01]">"{title}"</span>?
        </h3>

        <p className="text-white/60 max-w-lg mb-10 leading-relaxed">
          This article is part of an exclusive series. Create a free account to unlock deeper insights and the remaining chapters.
        </p>

        {teaserBullets && teaserBullets.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl text-left mb-12">
            {teaserBullets.map((bullet, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * i }}
                className="flex items-start gap-3 p-4 rounded-2xl bg-white/5 border border-white/5"
              >
                <CheckCircle2 size={18} className="text-[#F59F01] flex-shrink-0 mt-0.5" />
                <span className="text-sm text-white/80 font-medium leading-snug">{bullet}</span>
              </motion.div>
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          {ctaType === "register" ? (
            <Link 
              href={`/auth/register?redirect=/insights/articles/${seriesSlug}`}
              className="px-10 py-4 rounded-full bg-[#F59F01] text-[#100226] font-black text-sm hover:scale-105 transition-transform flex items-center justify-center gap-2"
            >
              Unlock Full Article <ArrowRight size={16} />
            </Link>
          ) : (
            <Link 
              href="/investors"
              className="px-10 py-4 rounded-full bg-[#F59F01] text-[#100226] font-black text-sm hover:scale-105 transition-transform flex items-center justify-center gap-2"
            >
              Subscribe to Read <ArrowRight size={16} />
            </Link>
          )}
          
          <Link 
            href="/auth/login"
            className="px-10 py-4 rounded-full bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white/10 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
