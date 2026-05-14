'use client'

import { 
  Zap, 
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Globe
} from 'lucide-react';
import Link from 'next/link';
import FinlogicLogo from '@/components/FinlogicLogo';
import ReactMarkdown from 'react-markdown';
// import remarkGfm from 'remark-gfm';
import ThemeToggle from '@/components/ThemeToggle';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';

export default function PublicShareContent({ data }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    setMounted(true);
  }, []);

  const getVerdictStyles = (verdict) => {
    switch (verdict) {
      case 'VIABLE':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-emerald-500/10';
      case 'DEAD ON ARRIVAL':
        return 'bg-ls-secondary/10 text-ls-secondary border-ls-secondary/20 shadow-ls-secondary/10';
      default:
        return 'bg-ls-compliment/10 text-ls-compliment border-ls-compliment/20 shadow-ls-compliment/10';
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen dark:bg-[#100226] bg-[#fdf6ff] dark:text-[#f8fafc] text-[#100226] flex flex-col items-center p-4 py-24 lg:p-12 selection:bg-ls-compliment selection:text-ls-primary theme-transition relative overflow-hidden">
      {/* Institutional Background Grid */}
      <div className="fixed inset-0 pointer-events-none dark:opacity-[0.03] opacity-[0.08] z-0">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#F59F01 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      {/* Theme Toggle for Public Viewers */}
      <div className="fixed top-8 right-8 z-[60]">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-4xl relative z-10 space-y-16">
        {/* Institutional Dossier Header */}
        <div className="dark:bg-[#100226] bg-white border dark:border-ls-white/10 border-ls-primary/10 p-12 lg:p-20 shadow-2xl relative overflow-hidden group">
          {/* Branded Watermark */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02] pointer-events-none transition-transform duration-[5s] group-hover:scale-110">
            <Zap className="w-[800px] h-[800px] text-ls-compliment" />
          </div>

          <div className="relative z-10 space-y-16">
            {/* Logo & Registry Label */}
            <div className="flex items-center justify-between border-b border-ls-white/10 pb-10">
              <FinlogicLogo size={48} darkBg={true} variant="full" />
              <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.4em] text-ls-compliment bg-ls-compliment/5 px-6 py-3 border border-ls-compliment/20">
                 <Globe size={14} /> Public Registry Access
              </div>
            </div>

            {/* Title & Verdict */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-end">
              <div className="space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-ls-compliment opacity-60">Sovereign Venture Architect</p>
                <h1 className="text-5xl lg:text-7xl font-serif font-light tracking-tight leading-none">Strategic <br /> Validation</h1>
              </div>
              
              <div className="flex flex-col items-start lg:items-end gap-6">
                <div className={`inline-flex items-center gap-6 px-12 py-6 border transition-all duration-1000 ${getVerdictStyles(data.verdict)}`}>
                   <div className="text-right">
                      <div className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-50 mb-2">Analysis Verdict</div>
                      <div className="text-4xl font-serif font-light tracking-widest leading-none" style={{ fontFamily: '"Playfair Display", serif' }}>
                        {data.verdict}
                      </div>
                   </div>
                   {data.verdict === 'VIABLE' ? <CheckCircle2 size={40} className="opacity-80" /> : <AlertTriangle size={40} className="opacity-80" />}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Intelligence Content */}
        <div className="dark:bg-[#100226] bg-white border dark:border-ls-white/10 border-ls-primary/10 p-12 lg:p-24 shadow-2xl relative">
          {/* Document Corners */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-ls-compliment/30" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-ls-compliment/30" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-ls-compliment/30" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-ls-compliment/30" />

          <div className="space-y-16">
            {/* Executive Summary for Public View */}
            <div className="p-10 bg-ls-compliment/5 border border-ls-compliment/20 italic text-2xl font-serif font-light dark:text-ls-white/70 text-ls-primary/70 leading-relaxed relative summary-markdown">
              <span className="absolute -top-3 left-8 px-3 dark:bg-[#100226] bg-white text-[10px] font-bold uppercase tracking-[0.4em] text-ls-compliment">Architect's Strategic Summary</span>
              <ReactMarkdown>
                {data.excerpt || (data.polished_report ? data.polished_report.substring(0, 500) + "..." : "Analyzing the core strategic vectors of this venture vision...")}
              </ReactMarkdown>
            </div>

            <div className="article-body selection:bg-ls-compliment/20">
              <ReactMarkdown>
                {data.polished_report?.replace(/\*This AI-generated educational analysis is provided by Finlogic Capital\. It does not constitute investment advice, a solicitation to invest, or any guarantee of future funding\.\*/g, '').trim()}
              </ReactMarkdown>
            </div>
          </div>
        </div>

        {/* Footer / CTA */}
        <div className="w-full max-w-3xl mx-auto pt-20 space-y-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-10">
             <div className="space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-[0.4em] text-ls-compliment/60">Registry Reference</div>
                <div className="text-xs font-mono text-ls-white/30 uppercase tracking-[0.2em]">
                  Validated: {new Date(data.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
             </div>
             <Link 
                href="/validate"
                className="flex items-center gap-4 bg-ls-compliment text-ls-primary px-12 py-5 font-bold text-xs uppercase tracking-[0.3em] transition-all hover:bg-ls-white hover:text-ls-primary active:scale-95 shadow-2xl shadow-ls-compliment/10 group"
             >
                Initiate New Validation
                <ChevronRight size={18} className="transition-transform group-hover:translate-x-2" />
             </Link>
          </div>

          {/* Institutional Disclaimer */}
          <div className="p-10 border border-ls-white/5 bg-ls-white/[0.01] text-center">
             <p className="text-[10px] text-ls-white/20 uppercase leading-loose tracking-[0.25em] max-w-2xl mx-auto">
                This document is a confidential AI-generated strategic analysis produced by the Finlogic Sovereign Venture Architect. 
                It does not constitute financial, legal, or investment advice, nor does it represent a guarantee of institutional funding.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
