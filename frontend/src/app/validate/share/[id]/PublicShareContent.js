'use client'

import { 
  Zap, 
  Sparkles, 
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Globe
} from 'lucide-react';
import Link from 'next/link';
import FinlogicLogo from '@/components/FinlogicLogo';

export default function PublicShareContent({ data }) {
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

  const getSummary = (text) => {
    if (!text) return "";
    const cleanText = text.split('\n')[0].trim(); // Get first paragraph
    return cleanText.length > 250 ? cleanText.substring(0, 250) + "..." : cleanText;
  };

  return (
    <div className="min-h-screen bg-[#05010d] flex items-center justify-center p-4 selection:bg-ls-compliment selection:text-ls-primary">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-ls-compliment/5 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-ls-primary/20 blur-[150px] rounded-full" />
      </div>

      <div className="w-full max-w-2xl relative z-10">
        <div className="bg-[#100226] border border-white/10 rounded-[3rem] p-10 lg:p-16 shadow-[0_48px_96px_-24px_rgba(0,0,0,0.5)] relative overflow-hidden group">
          {/* Branded Watermark */}
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none transition-transform duration-[3s] group-hover:scale-110 group-hover:rotate-12">
            <Zap className="w-64 h-64 text-ls-compliment" />
          </div>

          <div className="relative z-10 space-y-12">
            {/* Logo & Category */}
            <div className="flex items-center justify-between">
              <div className="bg-white p-2 rounded-xl">
                 <FinlogicLogo size={32} darkBg={false} />
              </div>
              <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-ls-compliment bg-ls-compliment/10 px-4 py-2 rounded-full border border-ls-compliment/20">
                 <Globe size={12} /> Institutional Insight
              </div>
            </div>

            {/* Title & Verdict */}
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-text-muted opacity-40">The Sovereign Venture Architect Presents</p>
                <h1 className="text-4xl lg:text-5xl font-black tracking-tight text-white uppercase leading-none">Business Idea Validation</h1>
              </div>
              
              <div className={`inline-flex items-center gap-4 px-10 py-5 rounded-[2rem] border-2 shadow-[0_0_40px_-10px] transition-all duration-700 ${getVerdictStyles(data.verdict)}`}>
                 {data.verdict === 'VIABLE' ? <CheckCircle2 size={32} /> : <AlertTriangle size={32} />}
                 <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Architect's Verdict</span>
                    <span className="text-3xl font-black tracking-tighter leading-none mt-1">{data.verdict}</span>
                 </div>
              </div>
            </div>

            {/* Excerpt */}
            <div className="relative">
              <div className="absolute -left-6 top-0 bottom-0 w-1 bg-ls-compliment/30 rounded-full" />
              <p className="text-lg lg:text-xl text-white/70 italic leading-relaxed font-medium">
                "{getSummary(data.excerpt)}"
              </p>
            </div>

            {/* Footer / CTA */}
            <div className="pt-12 border-t border-white/5 space-y-8">
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
      </div>
    </div>
  );
}
