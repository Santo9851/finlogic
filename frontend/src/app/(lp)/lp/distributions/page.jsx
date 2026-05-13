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
    <div className="h-[60vh] flex flex-col items-center justify-center theme-transition">
      <Loader2 size={32} className="text-ls-secondary animate-spin mb-4" />
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted/40">Fetching Distribution Records...</span>
    </div>
  );

  const totalDist = distributions?.reduce((acc, d) => acc + parseFloat(d.amount_npr), 0) || 0;

  return (
    <div className="space-y-8 pb-20 theme-transition animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">Distributions</h1>
          <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mt-1">Institutional record of capital returns and dividend distributions.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          label="Total Distributed" 
          value={`NPR ${(totalDist / 1e7).toFixed(2)} Cr`} 
          icon={() => <PieChart size={18} />} 
          color="#16c784" 
        />
      </div>

      <div className="bg-card border border-border-theme rounded-[2rem] overflow-hidden shadow-2xl theme-transition">
        <div className="p-8 border-b border-border-theme/50 flex items-center justify-between bg-foreground/[0.01]">
          <h3 className="text-sm font-black text-foreground flex items-center gap-3 uppercase tracking-widest">
            Distribution Ledger
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-[10px] text-text-muted/40 font-black uppercase tracking-[0.2em] border-b border-border-theme/50">
                <th className="px-8 py-5">Value Date</th>
                <th className="px-8 py-5">Instrument / Fund</th>
                <th className="px-8 py-5">Categorization</th>
                <th className="px-8 py-5 text-right">Net Amount (NPR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-theme/30">
              {distributions?.map((dist) => (
                <tr key={dist.id} className="hover:bg-foreground/[0.02] transition-colors group">
                  <td className="px-8 py-6 text-foreground/80 font-mono text-xs">
                    {new Date(dist.distribution_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })}
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-foreground font-black uppercase tracking-tight text-sm">{dist.fund_name}</p>
                    <p className="text-[10px] text-text-muted/40 font-black uppercase tracking-widest mt-0.5">Asset Registry Code: {dist.id?.substring(0,8)}</p>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-[9px] font-black bg-foreground/[0.03] border border-border-theme px-3 py-1 rounded-full text-text-muted/60 uppercase tracking-widest shadow-inner">
                      {dist.distribution_type_display}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tighter">
                      NPR {(parseFloat(dist.amount_npr) / 1e7).toFixed(3)} Cr
                    </span>
                  </td>
                </tr>
              ))}
              {(!distributions || distributions.length === 0) && (
                <tr>
                  <td colSpan="4" className="px-8 py-20 text-center text-text-muted/20 font-black uppercase tracking-[0.3em] italic">
                    No institutional distributions identified.
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
