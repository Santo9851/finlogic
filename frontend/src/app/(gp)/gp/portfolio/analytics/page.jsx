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
      <p className="text-text-muted text-xs font-black uppercase tracking-widest">Loading Portfolio Data...</p>
    </div>
  );

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-1000 theme-transition">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
         <div>
            <div className="flex items-center gap-2 text-[#F59F01] mb-2">
               <TrendingUp size={16} />
               <span className="text-[10px] font-black uppercase tracking-[0.3em]">Monitoring & Control</span>
            </div>
            <h1 className="text-5xl font-black text-foreground tracking-tighter uppercase">Portfolio Performance</h1>
            <p className="text-text-muted text-sm mt-2 max-w-md font-medium">Consolidated monthly KPIs and variance analysis for all invested companies.</p>
         </div>
         <div className="flex gap-4">
            <button className="bg-card border border-border-theme px-6 py-4 rounded-3xl text-center shadow-xl hover:bg-foreground/5 transition-all group theme-transition">
               <p className="text-[10px] font-black text-text-muted/40 uppercase tracking-[0.2em] mb-1">Export Aggregated</p>
               <div className="flex items-center justify-center gap-2 text-foreground font-bold">
                  <FileSpreadsheet size={16} className="text-emerald-500" /> Excel
               </div>
            </button>
         </div>
      </div>

      {/* KPI Table */}
      <div className="bg-card border border-border-theme rounded-[2.5rem] overflow-hidden shadow-2xl theme-transition">
         <div className="p-8 border-b border-border-theme flex items-center justify-between bg-foreground/[0.01]">
            <h3 className="text-xs font-black text-foreground uppercase tracking-widest">Recent Monthly Submissions</h3>
            <div className="flex items-center gap-4">
               <button className="flex items-center gap-2 px-4 py-2 bg-foreground/5 border border-border-theme rounded-full text-[10px] font-black text-foreground uppercase tracking-widest hover:bg-foreground/10 transition-all">
                  <Filter size={14} /> Filter Companies
               </button>
            </div>
         </div>
         
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="border-b border-border-theme text-[10px] font-black text-text-muted/40 uppercase tracking-[0.2em] bg-foreground/[0.02]">
                     <th className="px-8 py-6">Company</th>
                     <th className="px-8 py-6">Period</th>
                     <th className="px-8 py-6">Revenue (NPR)</th>
                     <th className="px-8 py-6">EBITDA</th>
                     <th className="px-8 py-6">Headcount</th>
                     <th className="px-8 py-6">Status</th>
                     <th className="px-8 py-6 text-right">Action</th>
                   </tr>
               </thead>
               <tbody className="divide-y divide-border-theme">
                  {reports?.map((report) => (
                    <tr key={report.id} className="group hover:bg-foreground/[0.02] transition-colors">
                       <td className="px-8 py-6">
                          <span className="text-foreground font-bold">{report.project_legal_name}</span>
                       </td>
                       <td className="px-8 py-6">
                          <span className="text-text-muted text-xs font-medium">{format(new Date(report.reporting_period), 'MMM yyyy')}</span>
                       </td>
                       <td className="px-8 py-6">
                          <div className="flex flex-col">
                             <span className="text-foreground font-mono text-sm font-black">{(report.revenue / 1000000).toFixed(1)}M</span>
                             <span className="text-[9px] text-emerald-600 dark:text-emerald-500 font-black uppercase">+12% vs. Proj</span>
                          </div>
                       </td>
                       <td className="px-8 py-6">
                          <span className={`text-sm font-mono font-black ${report.ebitda < 0 ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-500'}`}>
                             {(report.ebitda / 1000000).toFixed(1)}M
                          </span>
                       </td>
                       <td className="px-8 py-6">
                          <div className="flex items-center gap-2 text-text-muted font-bold">
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
                              className="px-4 py-2 bg-emerald-500 text-ls-primary-fixed rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                            >
                               Mark Reviewed
                            </button>
                          ) : (
                            <button className="p-2 text-text-muted/20 hover:text-foreground transition-colors">
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
                 <BarChart3 size={40} className="mx-auto text-text-muted/10" />
                 <p className="text-text-muted/40 text-xs font-bold uppercase tracking-widest">No KPI reports submitted yet.</p>
              </div>
            )}
         </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const configs = {
    DRAFT: { color: 'text-text-muted/40', bg: 'bg-foreground/5', icon: Clock },
    SUBMITTED: { color: 'text-[#F59F01]', bg: 'bg-[#F59F01]/10', icon: AlertCircle },
    REVIEWED: { color: 'text-emerald-600 dark:text-emerald-500', bg: 'bg-emerald-500/10', icon: CheckCircle2 }
  };
  const config = configs[status] || configs.DRAFT;
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${config.bg} ${config.color} text-[9px] font-black uppercase tracking-widest border border-current/10`}>
       <Icon size={10} /> {status}
    </div>
  );
}
