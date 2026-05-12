'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { 
  TrendingUp, 
  DollarSign, 
  Calendar,
  ChevronRight,
  BarChart3,
  Building2,
  PieChart as PieChartIcon
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

export default function GPValuationsAggregate() {
  const { data: valuations, isLoading } = useQuery({
    queryKey: ['portfolio', 'valuations'],
    queryFn: async () => {
      const res = await api.get('/deals/valuations/');
      return res.data;
    }
  });

  if (isLoading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 border-2 border-[#F59F01] border-t-transparent rounded-full animate-spin" />
      <p className="text-text-muted text-xs font-black uppercase tracking-widest">Aggregating Valuations...</p>
    </div>
  );

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-1000 theme-transition">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
         <div>
            <div className="flex items-center gap-2 text-[#F59F01] mb-2">
               <DollarSign size={16} />
               <span className="text-[10px] font-black uppercase tracking-[0.3em]">Valuation Track</span>
            </div>
            <h1 className="text-5xl font-black text-foreground tracking-tighter uppercase">Portfolio Valuations</h1>
            <p className="text-text-muted text-sm mt-2 max-w-md font-medium">Historical fair value tracking and unrealized gain analysis across all funds.</p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2 bg-card border border-border-theme rounded-[2.5rem] overflow-hidden shadow-2xl theme-transition">
            <div className="p-8 border-b border-border-theme bg-foreground/[0.01]">
               <h3 className="text-xs font-black text-foreground uppercase tracking-widest px-2">Recent Valuation Records</h3>
            </div>
            
            <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="border-b border-border-theme text-[10px] font-black text-text-muted/40 uppercase tracking-[0.2em] bg-foreground/[0.02]">
                        <th className="px-8 py-6">Investment</th>
                        <th className="px-8 py-6">Valuation Date</th>
                        <th className="px-8 py-6">Fair Value (NPR)</th>
                        <th className="px-8 py-6">Method</th>
                        <th className="px-8 py-6 text-right">Action</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-border-theme">
                     {valuations?.map((v) => (
                       <tr key={v.id} className="group hover:bg-foreground/[0.02] transition-colors">
                          <td className="px-8 py-6">
                             <div className="flex items-center gap-3">
                                <Building2 size={16} className="text-text-muted/40" />
                                <span className="text-foreground font-bold">{v.investment_name || 'Project ' + v.investment}</span>
                             </div>
                          </td>
                          <td className="px-8 py-6">
                             <span className="text-text-muted text-xs font-medium">{format(new Date(v.valuation_date), 'dd MMM yyyy')}</span>
                          </td>
                          <td className="px-8 py-6">
                             <span className="text-foreground font-mono text-sm font-black">NPR {Number(v.fair_value).toLocaleString()}</span>
                          </td>
                          <td className="px-8 py-6">
                             <span className="px-2 py-0.5 rounded bg-foreground/5 text-text-muted text-[10px] uppercase font-black border border-border-theme">
                                {v.valuation_method}
                             </span>
                          </td>
                          <td className="px-8 py-6 text-right">
                             <Link href={`/gp/deals/${v.project_id || ''}`} className="p-2 text-text-muted/20 hover:text-foreground transition-colors">
                                <ChevronRight size={18} />
                             </Link>
                          </td>
                       </tr>
                     ))}
                  </tbody>
               </table>
               {(!valuations || valuations.length === 0) && (
                 <div className="p-20 text-center space-y-4">
                    <PieChartIcon size={40} className="mx-auto text-text-muted/10" />
                    <p className="text-text-muted/40 text-xs font-bold uppercase tracking-widest">No valuation records found.</p>
                 </div>
               )}
            </div>
         </div>

         <div className="space-y-6">
            <div className="bg-[#F59F01] rounded-[2.5rem] p-8 shadow-2xl shadow-[#F59F01]/20 group hover:scale-[1.02] transition-transform">
               <h3 className="text-ls-primary-fixed font-black text-xs uppercase tracking-widest mb-6">Total Portfolio Value</h3>
               <p className="text-ls-primary-fixed text-4xl font-black tracking-tighter">NPR 1.42B</p>
               <div className="mt-4 flex items-center gap-2 text-ls-primary-fixed/60 font-bold text-xs">
                  <TrendingUp size={16} /> +18.4% vs Cost
               </div>
            </div>

            <div className="bg-card border border-border-theme rounded-[2.5rem] p-8 shadow-xl theme-transition">
               <h3 className="text-text-muted font-black text-[10px] uppercase tracking-widest mb-6 border-b border-border-theme pb-4">Upcoming Revaluations</h3>
               <div className="space-y-4">
                  <RevalItem name="Silicon Himalayas" date="30 June 2026" />
                  <RevalItem name="AgroTech Solutions" date="15 July 2026" />
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}

function RevalItem({ name, date }) {
   return (
      <div className="flex items-center justify-between group cursor-default">
         <div>
            <p className="text-foreground text-sm font-bold group-hover:text-[#F59F01] transition-colors">{name}</p>
            <p className="text-text-muted text-[10px] font-bold uppercase tracking-tighter">{date}</p>
         </div>
         <Calendar size={14} className="text-text-muted/20" />
      </div>
   );
}
