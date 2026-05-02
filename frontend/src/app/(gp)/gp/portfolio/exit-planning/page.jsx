'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { 
  Compass, 
  Target, 
  BarChart3,
  ChevronRight,
  Building2,
  CheckCircle2,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

export default function GPExitPlanningAggregate() {
  const { data: scenarios, isLoading } = useQuery({
    queryKey: ['portfolio', 'exit-scenarios'],
    queryFn: async () => {
      const res = await api.get('/deals/exit-scenarios/');
      return res.data;
    }
  });

  if (isLoading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 border-2 border-[#F59F01] border-t-transparent rounded-full animate-spin" />
      <p className="text-white/40 text-xs font-black uppercase tracking-widest">Mapping Exit Strategies...</p>
    </div>
  );

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
         <div>
            <div className="flex items-center gap-2 text-[#F59F01] mb-2">
               <Compass size={16} />
               <span className="text-[10px] font-black uppercase tracking-[0.3em]">Harvest Strategy</span>
            </div>
            <h1 className="text-5xl font-black text-white tracking-tighter uppercase">Exit Planning</h1>
            <p className="text-white/40 text-sm mt-2 max-w-md">Consolidated exit scenarios, IPO eligibility tracking, and secondary sale opportunities.</p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
         <div className="lg:col-span-3 bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-white/5 bg-white/[0.02]">
               <h3 className="text-xs font-black text-white uppercase tracking-widest">Active Exit Scenarios</h3>
            </div>
            
            <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="border-b border-white/5 text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">
                        <th className="px-8 py-6">Investment</th>
                        <th className="px-8 py-6">Target Date</th>
                        <th className="px-8 py-6">Exit Type</th>
                        <th className="px-8 py-6">Est. Multiple</th>
                        <th className="px-8 py-6">Status</th>
                        <th className="px-8 py-6 text-right">Action</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                     {scenarios?.map((s) => (
                       <tr key={s.id} className="group hover:bg-white/[0.02] transition-colors">
                          <td className="px-8 py-6">
                             <div className="flex items-center gap-3">
                                <Building2 size={16} className="text-white/20" />
                                <span className="text-white font-bold">{s.investment_name || 'Project ' + s.investment}</span>
                             </div>
                          </td>
                          <td className="px-8 py-6">
                             <span className="text-white/40 text-xs">{format(new Date(s.target_exit_date), 'MMM yyyy')}</span>
                          </td>
                          <td className="px-8 py-6">
                             <span className="px-2 py-0.5 rounded bg-white/5 text-white font-bold text-[10px] uppercase border border-white/5">
                                {s.exit_type}
                             </span>
                          </td>
                          <td className="px-8 py-6">
                             <span className="text-[#10b981] font-mono text-sm">{s.estimated_exit_multiple}x</span>
                          </td>
                          <td className="px-8 py-6">
                             <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${s.is_approved_by_ic ? 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20' : 'bg-white/5 text-white/30 border-white/10'}`}>
                                {s.is_approved_by_ic ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                                {s.is_approved_by_ic ? 'IC Approved' : 'Draft'}
                             </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                             <Link href={`/gp/deals/${s.project_id || ''}`} className="p-2 text-white/20 hover:text-white transition-colors">
                                <ChevronRight size={18} />
                             </Link>
                          </td>
                       </tr>
                     ))}
                  </tbody>
               </table>
               {(!scenarios || scenarios.length === 0) && (
                 <div className="p-20 text-center space-y-4">
                    <Target size={40} className="mx-auto text-white/10" />
                    <p className="text-white/20 text-xs font-bold">No active exit scenarios mapped.</p>
                 </div>
               )}
            </div>
         </div>

         <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 h-full">
               <h3 className="text-white/40 font-black text-[10px] uppercase tracking-widest mb-8 border-b border-white/5 pb-4">IPO Pipeline</h3>
               <div className="space-y-6">
                  <IPOCandidate name="Silicon Himalayas" readiness={84} />
                  <IPOCandidate name="AgroTech Solutions" readiness={42} />
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}

function IPOCandidate({ name, readiness }) {
   return (
      <div className="space-y-3">
         <div className="flex items-center justify-between">
            <p className="text-white text-xs font-bold">{name}</p>
            <p className="text-[#10b981] text-[10px] font-black">{readiness}%</p>
         </div>
         <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-[#10b981]" style={{ width: `${readiness}%` }} />
         </div>
      </div>
   );
}
