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

  // 1. Fetch user's project (assuming one project per entrepreneur for simplicity)
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['portfolio', 'my-project'],
    queryFn: async () => {
      const res = await api.get('/deals/projects/');
      return res.data[0]; // Get the first project assigned to them
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

  if (projectLoading) return <div className="h-screen flex items-center justify-center text-white/40 font-black uppercase tracking-widest">Loading Portal...</div>;

  if (!project) return (
    <div className="h-screen flex flex-col items-center justify-center text-center p-8 space-y-4">
       <AlertCircle size={48} className="text-[#F59F01]" />
       <h1 className="text-2xl font-black text-white uppercase">No Active Investment</h1>
       <p className="text-white/40 max-w-md">Your account is not currently linked to an active portfolio company. Please contact your GP representative.</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto py-6 md:py-12 px-4 md:px-6 space-y-8 md:space-y-12 animate-in fade-in duration-1000">
       {/* Header */}
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 md:gap-6">
             <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-[#F59F01] shadow-2xl">
                <Building2 size={24} className="md:w-8 md:h-8" />
             </div>
             <div>
                <h1 className="text-2xl md:text-4xl font-black text-white tracking-tighter uppercase">{project.legal_name}</h1>
                <p className="text-white/40 text-[10px] md:text-xs font-bold uppercase tracking-widest mt-1">Portfolio Performance Portal</p>
             </div>
          </div>
          <div className="bg-[#10b981]/10 border border-[#10b981]/20 px-4 py-2 rounded-full flex items-center gap-2 self-start md:self-center">
             <div className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
             <span className="text-[9px] font-black text-[#10b981] uppercase tracking-widest">Active Investment</span>
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
          {/* Submission Form */}
          <div className="lg:col-span-2 space-y-8">
             <div className="bg-white/5 border border-white/10 rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-10 shadow-2xl space-y-8">
                <div>
                   <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-tight mb-2">Monthly Reporting</h3>
                   <p className="text-white/40 text-xs leading-relaxed">Submit your financial and operational KPIs for the previous month by the 5th business day.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Reporting Period</label>
                      <input 
                        type="date"
                        value={formData.reporting_period}
                        onChange={(e) => setFormData({ ...formData, reporting_period: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm focus:border-[#F59F01] outline-none transition-all"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Headcount (FTE)</label>
                      <div className="relative">
                         <Users className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                         <input 
                           type="number"
                           placeholder="e.g. 45"
                           value={formData.headcount}
                           onChange={(e) => setFormData({ ...formData, headcount: e.target.value })}
                           className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-white text-sm focus:border-[#F59F01] outline-none transition-all"
                         />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Gross Revenue (NPR)</label>
                      <div className="relative">
                         <TrendingUp className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                         <input 
                           type="number"
                           placeholder="e.g. 15000000"
                           value={formData.revenue}
                           onChange={(e) => setFormData({ ...formData, revenue: e.target.value })}
                           className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-white text-sm focus:border-[#F59F01] outline-none transition-all"
                         />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">EBITDA (NPR)</label>
                      <div className="relative">
                         <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                         <input 
                           type="number"
                           placeholder="e.g. 2500000"
                           value={formData.ebitda}
                           onChange={(e) => setFormData({ ...formData, ebitda: e.target.value })}
                           className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-white text-sm focus:border-[#F59F01] outline-none transition-all"
                         />
                      </div>
                   </div>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Net Cash Burn (NPR)</label>
                   <input 
                     type="number"
                     placeholder="Enter 0 if cash flow positive"
                     value={formData.cash_burn}
                     onChange={(e) => setFormData({ ...formData, cash_burn: e.target.value })}
                     className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm focus:border-[#F59F01] outline-none transition-all"
                   />
                </div>

                <button 
                  onClick={() => submitKpiMutation.mutate(formData)}
                  disabled={submitKpiMutation.isLoading}
                  className="w-full py-5 bg-[#F59F01] text-black rounded-3xl text-sm font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-[#F59F01]/20 flex items-center justify-center gap-3 disabled:opacity-50"
                >
                   {submitKpiMutation.isLoading ? 'Submitting...' : <><Send size={18} /> Submit KPI Report</>}
                </button>
             </div>
          </div>

          {/* Sidebar: History & Guidelines */}
          <div className="space-y-8">
             <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
                <h4 className="text-xs font-black text-white uppercase tracking-widest border-b border-white/5 pb-4 flex items-center gap-2">
                   <Clock size={14} className="text-[#F59F01]" /> Submission History
                </h4>
                <div className="space-y-4">
                   {project.kpi_reports?.slice(0, 3).map((report) => (
                     <div key={report.id} className="flex items-center justify-between group cursor-pointer hover:bg-white/5 p-2 rounded-xl transition-all">
                        <div>
                           <p className="text-white text-[10px] font-bold uppercase">{new Date(report.reporting_period).toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
                           <p className="text-white/20 text-[9px] font-black uppercase">{report.status}</p>
                        </div>
                        <FileText size={16} className="text-white/20 group-hover:text-[#F59F01] transition-colors" />
                     </div>
                   ))}
                   {(!project.kpi_reports || project.kpi_reports.length === 0) && (
                     <p className="text-white/20 text-[10px] italic">No previous submissions found.</p>
                   )}
                </div>
             </div>

             <div className="bg-black/40 border border-white/10 rounded-3xl p-8 space-y-4">
                <h4 className="text-xs font-black text-white uppercase tracking-widest">Need Help?</h4>
                <p className="text-white/40 text-xs leading-relaxed">
                   If you need to revise a submitted report or have technical issues, please contact the Finlogic support team at <span className="text-[#F59F01]">portfolio@finlogic.com.np</span>
                </p>
             </div>
          </div>
       </div>
    </div>
  );
}
