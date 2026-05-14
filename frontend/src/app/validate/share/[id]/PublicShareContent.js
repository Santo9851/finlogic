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
import remarkGfm from 'remark-gfm';
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
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center p-4 py-20 lg:p-12 selection:bg-ls-compliment selection:text-ls-primary theme-transition">
      {/* Theme Toggle for Public Viewers */}
      <div className="fixed top-6 right-6 z-[60]">
        <ThemeToggle />
      </div>

      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-ls-compliment/5 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-ls-primary/20 blur-[150px] rounded-full" />
      </div>

      <div className="w-full max-w-4xl relative z-10 space-y-12">
        {/* Hero Section */}
        <div className="bg-card border border-border-theme rounded-[3rem] p-10 lg:p-16 shadow-2xl relative overflow-hidden group">
          {/* Branded Watermark */}
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none transition-transform duration-[3s] group-hover:scale-110 group-hover:rotate-12">
            <Zap className="w-64 h-64 text-ls-compliment" />
          </div>

          <div className="relative z-10 space-y-12">
            {/* Logo & Category */}
            <div className="flex items-center justify-between">
              <FinlogicLogo size={36} darkBg={isDark} />
              <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-ls-compliment bg-ls-compliment/10 px-4 py-2 rounded-full border border-ls-compliment/20 backdrop-blur-sm">
                 <Globe size={12} /> Institutional Insight
              </div>
            </div>

            {/* Title & Verdict */}
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-text-muted opacity-40 uppercase">The Sovereign Venture Architect Presents</p>
                <h1 className="text-4xl lg:text-5xl font-black tracking-tight text-foreground uppercase leading-none">Strategic Validation</h1>
              </div>
              
              <div className={`inline-flex items-center gap-4 px-10 py-5 rounded-[2rem] border-2 shadow-[0_0_40px_-10px] transition-all duration-700 ${getVerdictStyles(data.verdict)}`}>
                 {data.verdict === 'VIABLE' ? <CheckCircle2 size={32} /> : <AlertTriangle size={32} />}
                 <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Architect's Verdict</span>
                    <span className="text-3xl font-black tracking-tighter leading-none mt-1">{data.verdict}</span>
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* Full Report Content */}
        <div className="prose dark:prose-invert article-body max-w-none prose-headings:font-black prose-headings:tracking-tight prose-p:text-text-muted prose-p:leading-relaxed prose-li:text-text-muted prose-strong:text-ls-compliment bg-card border border-border-theme rounded-[3rem] p-10 lg:p-20 shadow-2xl">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {data.report?.replace(/\*This AI-generated educational analysis is provided by Finlogic Capital\. It does not constitute investment advice, a solicitation to invest, or any guarantee of future funding\.\*/g, '').trim()}
          </ReactMarkdown>
        </div>

        {/* Footer / CTA */}
        <div className="w-full max-w-2xl mx-auto pt-12 space-y-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
             <div className="text-[9px] font-black uppercase tracking-[0.3em] text-text-muted/40">
                Validated on {new Date(data.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
             </div>
             <Link 
                href="/validate"
                className="flex items-center gap-3 bg-ls-compliment text-ls-primary px-10 py-4 rounded-full font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-xl shadow-ls-compliment/20 group"
             >
                Validate Your Own Idea
                <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
             </Link>
          </div>

          {/* Disclaimer */}
          <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2rem] text-center">
             <p className="text-[9px] text-text-muted/40 uppercase leading-relaxed tracking-widest">
                This is an AI-generated educational analysis by Finlogic Capital. 
                It does not constitute investment advice, a solicitation to invest, or any guarantee of funding.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
