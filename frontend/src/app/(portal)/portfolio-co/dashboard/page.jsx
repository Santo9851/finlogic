'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { 
  Building2, 
  Send, 
  FileText, 
  Clock, 
  TrendingUp, 
  Users, 
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

export default function PortfolioCoDashboard() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    reporting_period: new Date().toISOString().split('T')[0].substring(0, 7) + '-01',
    revenue: '',
    ebitda: '',
    cash_burn: '',
    headcount: ''
  });

  // 1. Fetch user's project
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['portfolio', 'my-project'],
    queryFn: async () => {
      const res = await api.get('/deals/projects/');
      // Filter for active/closed projects if multiple exist, but usually entrepreneurs see their specific portfolio company
      return res.data?.results?.[0] ?? res.data?.[0];
    }
  });

  const submitKpiMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.post(`/portfolio/projects/${project.id}/kpi-reports/`, data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Monthly KPI report submitted successfully');
      queryClient.invalidateQueries(['portfolio', 'kpi-reports']);
      setFormData({
        reporting_period: new Date().toISOString().split('T')[0].substring(0, 7) + '-01',
        revenue: '',
        ebitda: '',
        cash_burn: '',
        headcount: ''
      });
    }
  });

  if (projectLoading) return <div className="h-screen flex items-center justify-center text-text-muted font-black uppercase tracking-widest">Initialising Portal...</div>;

  if (!project) return (
    <div className="h-screen flex flex-col items-center justify-center text-center p-8 space-y-6 theme-transition">
       <AlertCircle size={64} className="text-[#F59F01] opacity-40" />
       <div className="space-y-2">
         <h1 className="text-3xl font-black text-foreground uppercase tracking-tighter">No Active Investment</h1>
         <p className="text-text-muted max-w-md font-medium leading-relaxed">Your account is not currently linked to an active portfolio company in our system. Please contact your GP representative to finalise the onboarding.</p>
       </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto py-12 px-6 space-y-12 animate-in fade-in duration-1000 theme-transition">
       {/* Header */}
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
             <div className="w-16 h-16 rounded-[2rem] bg-card border border-border-theme flex items-center justify-center text-[#F59F01] shadow-2xl shadow-black/5">
                <Building2 size={32} />
             </div>
             <div>
                <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tighter uppercase leading-[0.9]">{project.legal_name}</h1>
                <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.3em] mt-2 opacity-60">Portfolio Performance Portal</p>
             </div>
          </div>
          <div className="bg-[#10b981]/10 border border-[#10b981]/20 px-5 py-2.5 rounded-full flex items-center gap-3 self-start md:self-center shadow-lg shadow-[#10b981]/5">
             <div className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
             <span className="text-[10px] font-black text-[#10b981] uppercase tracking-[0.2em]">Active Growth Phase</span>
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Submission Form */}
          <div className="lg:col-span-2 space-y-8">
             <div className="bg-card border border-border-theme rounded-[3rem] p-10 shadow-2xl space-y-10 theme-transition">
                <div>
                   <h3 className="text-2xl font-black text-foreground uppercase tracking-tight mb-2">Monthly Operational KPI</h3>
                   <p className="text-text-muted text-sm font-medium leading-relaxed">Submit your financial and operational milestones for the previous month to ensure real-time LP transparency.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1 opacity-60">Reporting Period</label>
                      <input 
                        type="date"
                        value={formData.reporting_period}
                        onChange={(e) => setFormData({ ...formData, reporting_period: e.target.value })}
                        className="w-full bg-foreground/[0.03] border border-border-theme rounded-2xl py-4 px-6 text-foreground text-sm font-bold focus:border-[#F59F01] outline-none transition-all shadow-inner"
                      />
                   </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1 opacity-60">Headcount (FTE)</label>
                      <div className="relative">
                         <Users className="absolute left-6 top-1/2 -translate-y-1/2 text-text-muted/20" size={18} />
                         <input 
                           type="number"
                           placeholder="e.g. 45"
                           value={formData.headcount}
                           onChange={(e) => setFormData({ ...formData, headcount: e.target.value })}
                           className="w-full bg-foreground/[0.03] border border-border-theme rounded-2xl py-4 pl-14 pr-6 text-foreground text-sm font-bold focus:border-[#F59F01] outline-none transition-all shadow-inner"
                         />
                      </div>
                   </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1 opacity-60">Gross Revenue (NPR)</label>
                      <div className="relative">
                         <TrendingUp className="absolute left-6 top-1/2 -translate-y-1/2 text-text-muted/20" size={18} />
                         <input 
                           type="number"
                           placeholder="e.g. 15,000,000"
                           value={formData.revenue}
                           onChange={(e) => setFormData({ ...formData, revenue: e.target.value })}
                           className="w-full bg-foreground/[0.03] border border-border-theme rounded-2xl py-4 pl-14 pr-6 text-foreground text-sm font-bold focus:border-[#F59F01] outline-none transition-all shadow-inner"
                         />
                      </div>
                   </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1 opacity-60">EBITDA (NPR)</label>
                      <div className="relative">
                         <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 text-text-muted/20" size={18} />
                         <input 
                           type="number"
                           placeholder="e.g. 2,500,000"
                           value={formData.ebitda}
                           onChange={(e) => setFormData({ ...formData, ebitda: e.target.value })}
                           className="w-full bg-foreground/[0.03] border border-border-theme rounded-2xl py-4 pl-14 pr-6 text-foreground text-sm font-bold focus:border-[#F59F01] outline-none transition-all shadow-inner"
                         />
                      </div>
                   </div>
                </div>

                <div className="space-y-3">
                   <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1 opacity-60">Net Cash Burn (NPR)</label>
                   <input 
                     type="number"
                     placeholder="Enter 0 if cash flow positive"
                     value={formData.cash_burn}
                     onChange={(e) => setFormData({ ...formData, cash_burn: e.target.value })}
                     className="w-full bg-foreground/[0.03] border border-border-theme rounded-2xl py-4 px-6 text-foreground text-sm font-bold focus:border-[#F59F01] outline-none transition-all shadow-inner"
                   />
                </div>

                <button 
                  onClick={() => submitKpiMutation.mutate(formData)}
                  disabled={submitKpiMutation.isLoading}
                  className="w-full py-6 bg-[#F59F01] text-ls-primary-fixed rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-[#F59F01]/20 flex items-center justify-center gap-3 disabled:opacity-50"
                >
                   {submitKpiMutation.isLoading ? 'Committing Report...' : <><Send size={18} strokeWidth={3} /> Submit KPI Report</>}
                </button>
             </div>
          </div>

          {/* Sidebar: History & Guidelines */}
          <div className="space-y-8">
             <div className="bg-card border border-border-theme rounded-[2.5rem] p-8 space-y-8 shadow-xl">
                <h4 className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] border-b border-border-theme pb-5 flex items-center gap-3">
                   <Clock size={16} className="text-[#F59F01]" /> Submission History
                </h4>
                <div className="space-y-4">
                   {project.kpi_reports?.slice(0, 5).map((report) => (
                     <div key={report.id} className="flex items-center justify-between group cursor-pointer hover:bg-foreground/[0.03] p-3 rounded-2xl transition-all border border-transparent hover:border-border-theme">
                        <div>
                           <p className="text-foreground text-xs font-black uppercase tracking-tight">{new Date(report.reporting_period).toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
                           <p className="text-text-muted/40 text-[9px] font-black uppercase tracking-widest mt-1">{report.status}</p>
                        </div>
                        <FileText size={16} className="text-text-muted/20 group-hover:text-[#F59F01] transition-colors" />
                     </div>
                   ))}
                   {(!project.kpi_reports || project.kpi_reports.length === 0) && (
                     <p className="text-text-muted/20 text-[10px] italic font-medium py-4">No previous submissions found.</p>
                   )}
                </div>
             </div>

             <div className="bg-foreground/[0.03] border border-border-theme rounded-[2.5rem] p-8 space-y-6 shadow-inner">
                <h4 className="text-[10px] font-black text-foreground uppercase tracking-[0.3em]">Institutional Support</h4>
                <p className="text-text-muted text-xs leading-relaxed font-medium">
                   If you need to revise a submitted report or have technical issues, please contact the Finlogic support team at <span className="text-[#F59F01] font-bold">portfolio@finlogic.com.np</span>
                </p>
             </div>
          </div>
       </div>
    </div>
  );
}
