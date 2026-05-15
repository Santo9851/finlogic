'use client';

import { motion } from 'framer-motion';
import { ShieldAlert, ArrowLeft, Mail } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from 'next-themes';

export default function PendingApprovalPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-8 theme-transition">
      {/* Background elements */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#F59F01 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full relative z-10"
      >
        <div className="bg-card border border-border-theme p-12 lg:p-16 text-center space-y-12 shadow-2xl">
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-full bg-ls-compliment/10 flex items-center justify-center text-ls-compliment border border-ls-compliment/20">
              <ShieldAlert size={40} />
            </div>
          </div>

          <div className="space-y-6">
            <h1 className="text-4xl font-serif font-light tracking-tight">Access <span className="italic">Pending</span></h1>
            <p className="text-text-muted leading-relaxed font-serif italic text-lg">
              "Institutional excellence requires rigorous verification. Your application is currently under review by our governance committee."
            </p>
          </div>

          <div className="p-8 border border-border-theme bg-foreground/[0.02] space-y-4 text-left">
            <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-ls-compliment">
              <Mail size={14} /> Contact Registry
            </div>
            <p className="text-xs text-text-muted">
              For urgent inquiries or to provide additional documentation, please contact our intelligence unit at:
            </p>
            <p className="text-sm font-bold text-foreground">compliance@finlogiccapital.com</p>
          </div>

          <div className="pt-8">
            <Link 
              href="/"
              className="inline-flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.4em] text-text-muted hover:text-ls-compliment transition-all"
            >
              <ArrowLeft size={16} /> Return to Public Portal
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
