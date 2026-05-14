'use client'

import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { Loader2, PieChart } from 'lucide-react';
import { MetricCard } from '@/components/portal/PortalShell';
import { useTheme } from 'next-themes';

export default function LPDistributions() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { data: distributions, isLoading } = useQuery({
    queryKey: ['lp', 'distributions'],
    queryFn: async () => {
      const res = await api.get('/deals/lp/distributions/');
      return res.data;
    }
  });

  if (isLoading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-12 theme-transition">
      <Loader2 className="w-12 h-12 text-ls-compliment animate-spin opacity-40" />
      <p className="text-text-muted text-[10px] font-bold uppercase tracking-[0.4em] animate-pulse">Syncing Yield Ledger...</p>
    </div>
  );

  const totalDist = distributions?.reduce((acc, d) => acc + parseFloat(d.amount_npr), 0) || 0;

  return (
    <div className="space-y-20 animate-in fade-in duration-1000 pb-32 max-w-7xl mx-auto">
      {/* Header - Institutional Yield */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 border-b border-border-theme pb-12">
        <div className="space-y-6">
          <div className="flex items-center gap-4 text-ls-compliment text-[10px] font-bold uppercase tracking-[0.5em]">
            <PieChart size={14} /> Institutional Yield Ledger
          </div>
          <h1 className="text-5xl md:text-7xl font-serif font-light text-foreground tracking-tight leading-tight">
            Strategic <span className="italic">Returns</span>
          </h1>
          <p className="text-xl text-text-muted font-serif font-light italic max-w-xl">
            A comprehensive archival record of capital returns, dividend distributions, and institutional yield realization.
          </p>
        </div>
        <div className="flex items-center gap-6 px-10 py-5 bg-border-theme/20 border border-border-theme shadow-sm transition-all hover:bg-border-theme/40">
           <div className="space-y-1 text-right">
             <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.3em]">Registry Identifier</p>
             <p className="text-[9px] text-text-muted/40 font-bold uppercase tracking-widest font-mono">YLD-2075-X</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-border-theme border border-border-theme">
        <div className="bg-card p-10 group hover:bg-ls-primary transition-all duration-700 overflow-hidden relative">
          <div className="flex items-center justify-between mb-10">
            <div className="text-ls-compliment opacity-40 group-hover:opacity-100 group-hover:text-ls-white/40 transition-all">
              <PieChart size={24} />
            </div>
            <span className="text-[8px] font-mono opacity-20 group-hover:opacity-40 tracking-widest uppercase text-text-muted group-hover:text-ls-white">Metric: TOTAL_YIELD</span>
          </div>
          <div className="space-y-4">
            <p className="text-[9px] font-bold text-text-muted group-hover:text-ls-white/30 uppercase tracking-[0.5em]">Aggregate Yield</p>
            <h3 className="text-5xl font-serif font-light text-foreground group-hover:text-ls-white transition-all tracking-tight tabular-nums">
              रू {(totalDist / 1e7).toFixed(2)}<span className="text-2xl ml-1">Cr</span>
            </h3>
            <p className="text-base font-serif italic text-text-muted/40 group-hover:text-ls-white/20 transition-all pt-2">Capital Returns Disbursed</p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border-theme shadow-2xl theme-transition overflow-hidden">
        <div className="px-12 py-10 border-b border-border-theme flex items-center justify-between bg-border-theme/10">
          <h3 className="text-[10px] font-bold text-text-muted flex items-center gap-4 uppercase tracking-[0.5em]">
             Transaction Sequence Registry
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-border-theme/5 border-b border-border-theme">
                <th className="px-12 py-8 text-[10px] font-bold text-text-muted uppercase tracking-[0.5em]">Value Date</th>
                <th className="px-12 py-8 text-[10px] font-bold text-text-muted uppercase tracking-[0.5em]">Asset / Instrument</th>
                <th className="px-12 py-8 text-[10px] font-bold text-text-muted uppercase tracking-[0.5em]">Categorization</th>
                <th className="px-12 py-8 text-[10px] font-bold text-text-muted uppercase tracking-[0.5em] text-right">Yield Ingestion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-theme">
              {distributions?.map((dist, i) => (
                <tr key={dist.id} className="hover:bg-ls-primary group transition-all duration-500 cursor-pointer">
                  <td className="px-12 py-10">
                    <span className="text-base font-serif italic text-text-muted group-hover:text-ls-white/60 transition-all">
                      {new Date(dist.distribution_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })}
                    </span>
                  </td>
                  <td className="px-12 py-10">
                    <div className="space-y-2">
                      <p className="text-xl font-serif font-light text-foreground group-hover:text-ls-white transition-all uppercase tracking-tight">{dist.fund_name}</p>
                      <p className="text-[9px] text-text-muted/40 group-hover:text-ls-white/20 font-bold uppercase tracking-[0.3em] font-mono">SEQ-{dist.id?.substring(0,8).toUpperCase()}</p>
                    </div>
                  </td>
                  <td className="px-12 py-10">
                    <span className="text-[9px] font-bold border border-border-theme group-hover:border-ls-white/20 px-5 py-2 text-text-muted group-hover:text-ls-white/40 uppercase tracking-[0.4em] shadow-inner transition-all">
                      {dist.distribution_type_display}
                    </span>
                  </td>
                  <td className="px-12 py-10 text-right">
                    <span className="text-2xl font-serif font-light text-ls-up group-hover:text-ls-compliment transition-all tabular-nums">
                      रू {(parseFloat(dist.amount_npr) / 1e7).toFixed(3)}<span className="text-sm ml-1 opacity-60">Cr</span>
                    </span>
                  </td>
                </tr>
              ))}
              {(!distributions || distributions.length === 0) && (
                <tr>
                  <td colSpan="4" className="px-12 py-32 text-center">
                    <div className="space-y-6 opacity-20">
                      <PieChart size={40} className="mx-auto text-text-muted" />
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.5em] italic">No distribution records identified in archival sequence.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
