'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { 
  TrendingUp, 
  Users, 
  BarChart3, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  FileSpreadsheet,
  ChevronRight,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function GPPortfolioDashboard() {
  const queryClient = useQueryClient();
  const { data: reports, isLoading } = useQuery({
    queryKey: ['portfolio', 'kpi-reports'],
    queryFn: async () => {
      const res = await api.get('/portfolio/kpi-reports/');
      return res.data;
    }
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const res = await api.patch(`/portfolio/kpi-reports/${id}/`, { status });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Report reviewed');
      queryClient.invalidateQueries(['portfolio', 'kpi-reports']);
    }
  });

  if (isLoading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 border-2 border-[#F59F01] border-t-transparent rounded-full animate-spin" />
      <p className="text-white/40 text-xs font-black uppercase tracking-widest">Loading Portfolio Data...</p>
    </div>
  );

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
         <div>
            <div className="flex items-center gap-2 text-[#F59F01] mb-2">
               <TrendingUp size={16} />
               <span className="text-[10px] font-black uppercase tracking-[0.3em]">Monitoring & Control</span>
            </div>
            <h1 className="text-5xl font-black text-white tracking-tighter uppercase">Portfolio Performance</h1>
            <p className="text-white/40 text-sm mt-2 max-w-md">Consolidated monthly KPIs and variance analysis for all invested companies.</p>
         </div>
         <div className="flex gap-4">
            <button className="bg-white/5 border border-white/10 px-6 py-4 rounded-3xl text-center shadow-2xl hover:bg-white/10 transition-all group">
               <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Export Aggregated</p>
               <div className="flex items-center justify-center gap-2 text-white font-bold">
                  <FileSpreadsheet size={16} className="text-[#10b981]" /> Excel
               </div>
            </button>
         </div>
      </div>

      {/* KPI Table */}
      <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
         <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <h3 className="text-xs font-black text-white uppercase tracking-widest">Recent Monthly Submissions</h3>
            <div className="flex items-center gap-4">
               <button className="flex items-center gap-2 px-4 py-2 bg-black/40 border border-white/10 rounded-full text-[10px] font-black text-white uppercase tracking-widest">
                  <Filter size={14} /> Filter Companies
               </button>
            </div>
         </div>
         
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="border-b border-white/5 text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">
                     <th className="px-8 py-6">Company</th>
                     <th className="px-8 py-6">Period</th>
                     <th className="px-8 py-6">Revenue (NPR)</th>
                     <th className="px-8 py-6">EBITDA</th>
                     <th className="px-8 py-6">Headcount</th>
                     <th className="px-8 py-6">Status</th>
                     <th className="px-8 py-6 text-right">Action</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                  {reports?.map((report) => (
                    <tr key={report.id} className="group hover:bg-white/[0.02] transition-colors">
                       <td className="px-8 py-6">
                          <span className="text-white font-bold">{report.project_legal_name}</span>
                       </td>
                       <td className="px-8 py-6">
                          <span className="text-white/40 text-xs">{format(new Date(report.reporting_period), 'MMM yyyy')}</span>
                       </td>
                       <td className="px-8 py-6">
                          <div className="flex flex-col">
                             <span className="text-white font-mono text-sm">{(report.revenue / 1000000).toFixed(1)}M</span>
                             <span className="text-[9px] text-[#10b981] font-black uppercase">+12% vs. Proj</span>
                          </div>
                       </td>
                       <td className="px-8 py-6">
                          <span className={`text-sm font-mono ${report.ebitda < 0 ? 'text-red-400' : 'text-[#10b981]'}`}>
                             {(report.ebitda / 1000000).toFixed(1)}M
                          </span>
                       </td>
                       <td className="px-8 py-6">
                          <div className="flex items-center gap-2 text-white/60">
                             <Users size={14} /> {report.headcount}
                          </div>
                       </td>
                       <td className="px-8 py-6">
                          <StatusBadge status={report.status} />
                       </td>
                       <td className="px-8 py-6 text-right">
                          {report.status === 'SUBMITTED' ? (
                            <button 
                              onClick={() => reviewMutation.mutate({ id: report.id, status: 'REVIEWED' })}
                              className="px-4 py-2 bg-[#10b981] text-black rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-[#10b981]/20"
                            >
                               Mark Reviewed
                            </button>
                          ) : (
                            <button className="p-2 text-white/20 hover:text-white transition-colors">
                               <ChevronRight size={18} />
                            </button>
                          )}
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
            {(!reports || reports.length === 0) && (
              <div className="p-20 text-center space-y-4">
                 <BarChart3 size={40} className="mx-auto text-white/10" />
                 <p className="text-white/20 text-xs font-bold">No KPI reports submitted yet.</p>
              </div>
            )}
         </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const configs = {
    DRAFT: { color: 'text-white/40', bg: 'bg-white/5', icon: Clock },
    SUBMITTED: { color: 'text-[#F59F01]', bg: 'bg-[#F59F01]/10', icon: AlertCircle },
    REVIEWED: { color: 'text-[#10b981]', bg: 'bg-[#10b981]/10', icon: CheckCircle2 }
  };
  const config = configs[status] || configs.DRAFT;
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${config.bg} ${config.color} text-[9px] font-black uppercase tracking-widest border border-current/10`}>
       <Icon size={10} /> {status}
    </div>
  );
}
