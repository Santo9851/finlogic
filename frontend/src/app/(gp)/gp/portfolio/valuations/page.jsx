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
      // In a real app, this might be a dedicated aggregate endpoint.
      // For now, we use the router registered one which might be a list of all records.
      const res = await api.get('/deals/valuations/');
      return res.data;
    }
  });

  if (isLoading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 border-2 border-[#F59F01] border-t-transparent rounded-full animate-spin" />
      <p className="text-white/40 text-xs font-black uppercase tracking-widest">Aggregating Valuations...</p>
    </div>
  );

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
         <div>
            <div className="flex items-center gap-2 text-[#F59F01] mb-2">
               <DollarSign size={16} />
               <span className="text-[10px] font-black uppercase tracking-[0.3em]">Valuation Track</span>
            </div>
            <h1 className="text-5xl font-black text-white tracking-tighter uppercase">Portfolio Valuations</h1>
            <p className="text-white/40 text-sm mt-2 max-w-md">Historical fair value tracking and unrealized gain analysis across all funds.</p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-white/5 bg-white/[0.02]">
               <h3 className="text-xs font-black text-white uppercase tracking-widest">Recent Valuation Records</h3>
            </div>
            
            <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="border-b border-white/5 text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">
                        <th className="px-8 py-6">Investment</th>
                        <th className="px-8 py-6">Valuation Date</th>
                        <th className="px-8 py-6">Fair Value (NPR)</th>
                        <th className="px-8 py-6">Method</th>
                        <th className="px-8 py-6 text-right">Action</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                     {valuations?.map((v) => (
                       <tr key={v.id} className="group hover:bg-white/[0.02] transition-colors">
                          <td className="px-8 py-6">
                             <div className="flex items-center gap-3">
                                <Building2 size={16} className="text-white/20" />
                                <span className="text-white font-bold">{v.investment_name || 'Project ' + v.investment}</span>
                             </div>
                          </td>
                          <td className="px-8 py-6">
                             <span className="text-white/40 text-xs">{format(new Date(v.valuation_date), 'dd MMM yyyy')}</span>
                          </td>
                          <td className="px-8 py-6">
                             <span className="text-white font-mono text-sm">NPR {Number(v.fair_value).toLocaleString()}</span>
                          </td>
                          <td className="px-8 py-6">
                             <span className="px-2 py-0.5 rounded bg-white/5 text-white/40 text-[10px] uppercase font-bold border border-white/5">
                                {v.valuation_method}
                             </span>
                          </td>
                          <td className="px-8 py-6 text-right">
                             <Link href={`/gp/deals/${v.project_id || ''}`} className="p-2 text-white/20 hover:text-white transition-colors">
                                <ChevronRight size={18} />
                             </Link>
                          </td>
                       </tr>
                     ))}
                  </tbody>
               </table>
               {(!valuations || valuations.length === 0) && (
                 <div className="p-20 text-center space-y-4">
                    <PieChartIcon size={40} className="mx-auto text-white/10" />
                    <p className="text-white/20 text-xs font-bold">No valuation records found.</p>
                 </div>
               )}
            </div>
         </div>

         <div className="space-y-6">
            <div className="bg-[#F59F01] rounded-[2.5rem] p-8 shadow-2xl shadow-[#F59F01]/20">
               <h3 className="text-black font-black text-xs uppercase tracking-widest mb-6">Total Portfolio Value</h3>
               <p className="text-black text-4xl font-black tracking-tighter">NPR 1.42B</p>
               <div className="mt-4 flex items-center gap-2 text-black/60 font-bold text-xs">
                  <TrendingUp size={16} /> +18.4% vs Cost
               </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8">
               <h3 className="text-white/40 font-black text-[10px] uppercase tracking-widest mb-6 border-b border-white/5 pb-4">Upcoming Revaluations</h3>
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
      <div className="flex items-center justify-between">
         <div>
            <p className="text-white text-sm font-bold">{name}</p>
            <p className="text-white/30 text-[10px] font-bold uppercase tracking-tighter">{date}</p>
         </div>
         <Calendar size={14} className="text-white/20" />
      </div>
   );
}
