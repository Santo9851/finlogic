'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { 
  ShieldAlert, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  FileText,
  Mail,
  ChevronRight,
  Search
} from 'lucide-react';
import { format } from 'date-fns';

export default function ComplianceDashboard() {
  const { data: deadlines, isLoading } = useQuery({
    queryKey: ['compliance', 'sebon-deadlines'],
    queryFn: async () => {
      const res = await api.get('/compliance/sebon-deadlines/');
      return res.data;
    }
  });

  if (isLoading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 border-2 border-[#F59F01] border-t-transparent rounded-full animate-spin" />
      <p className="text-white/40 text-xs font-black uppercase tracking-widest">Loading Regulatory Calendar...</p>
    </div>
  );

  const getRAGStatus = (dueDate, status) => {
    if (status === 'SUBMITTED') return 'Green';
    const diff = new Date(dueDate) - new Date();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return 'Red';
    if (days <= 7) return 'Yellow';
    return 'Blue';
  };

  const statusColors = {
    Green: 'bg-[#10b981]',
    Yellow: 'bg-[#F59F01]',
    Red: 'bg-red-500',
    Blue: 'bg-blue-500'
  };

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
         <div>
            <div className="flex items-center gap-2 text-[#F59F01] mb-2">
               <ShieldAlert size={16} />
               <span className="text-[10px] font-black uppercase tracking-[0.3em]">Regulatory Oversight</span>
            </div>
            <h1 className="text-5xl font-black text-white tracking-tighter uppercase">Nepal Compliance</h1>
            <p className="text-white/40 text-sm mt-2 max-w-md">Mandatory SEBON, NRB, and FITTA reporting deadlines and tracking for all managed funds.</p>
         </div>
         <div className="flex gap-4">
            <div className="bg-white/5 border border-white/10 px-6 py-4 rounded-3xl text-center shadow-2xl">
               <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Active Deadlines</p>
               <div className="text-3xl font-black text-white tabular-nums">{deadlines?.filter(d => d.status !== 'SUBMITTED').length || 0}</div>
            </div>
            <div className="bg-white/5 border border-white/10 px-6 py-4 rounded-3xl text-center shadow-2xl">
               <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Upcoming (7d)</p>
               <div className="text-3xl font-black text-[#F59F01] tabular-nums">
                  {deadlines?.filter(d => getRAGStatus(d.due_date, d.status) === 'Yellow').length || 0}
               </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Main Timeline */}
         <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
               <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest">SEBON Filing Timeline</h3>
                  <div className="relative">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                     <input 
                       placeholder="Filter filings..." 
                       className="bg-black/40 border border-white/10 rounded-full py-1.5 pl-9 pr-4 text-[10px] text-white focus:outline-none focus:border-[#F59F01]/50 w-48 transition-all"
                     />
                  </div>
               </div>
               
               <div className="divide-y divide-white/5">
                  {deadlines?.map((deadline) => {
                    const rag = getRAGStatus(deadline.due_date, deadline.status);
                    return (
                      <div key={deadline.id} className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
                         <div className="flex items-center gap-6">
                            <div className={`w-1.5 h-12 rounded-full ${statusColors[rag]}`} />
                            <div className="space-y-1">
                               <h4 className="text-white font-bold text-sm">{deadline.title}</h4>
                               <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-1.5 text-white/30 text-[10px] font-bold">
                                     <Calendar size={12} />
                                     Due: {format(new Date(deadline.due_date), 'MMM dd, yyyy')}
                                  </div>
                                  {deadline.status === 'SUBMITTED' && (
                                    <div className="flex items-center gap-1.5 text-[#10b981] text-[10px] font-bold">
                                       <CheckCircle2 size={12} />
                                       Filed {format(new Date(deadline.submitted_at), 'MMM dd')}
                                    </div>
                                  )}
                               </div>
                            </div>
                         </div>
                         <div className="flex items-center gap-4">
                            <button className="p-2 text-white/20 hover:text-[#F59F01] transition-colors">
                               <Mail size={18} />
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-white uppercase tracking-widest hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100">
                               Upload Proof <ChevronRight size={14} />
                            </button>
                         </div>
                      </div>
                    );
                  })}
                  {(!deadlines || deadlines.length === 0) && (
                    <div className="p-20 text-center space-y-4">
                       <FileText size={40} className="mx-auto text-white/10" />
                       <p className="text-white/20 text-xs font-bold">No active filing deadlines detected.</p>
                    </div>
                  )}
               </div>
            </div>
         </div>

         {/* Sidebar: Resources & Alerts */}
         <div className="space-y-8">
            <div className="bg-[#F59F01]/5 border border-[#F59F01]/20 p-8 rounded-3xl space-y-6">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#F59F01] flex items-center justify-center text-black">
                     <AlertTriangle size={20} />
                  </div>
                  <div>
                     <h4 className="text-white font-black text-sm uppercase tracking-tighter">Compliance Alert</h4>
                     <p className="text-[#F59F01] text-[10px] font-bold uppercase tracking-widest">Immediate Action</p>
                  </div>
               </div>
               <p className="text-white/60 text-xs leading-relaxed">
                  FITTA amendments for Q1 2026 require additional disclosure of beneficial ownership for all foreign investors in the Growth Fund.
               </p>
               <button className="w-full py-3 bg-[#F59F01] text-black rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#F59F01]/20 hover:scale-[1.02] transition-all">
                  Read Amendment Memo
               </button>
            </div>

            <div className="bg-white/5 border border-white/10 p-8 rounded-3xl space-y-6 shadow-2xl">
               <h4 className="text-xs font-black text-white uppercase tracking-widest border-b border-white/5 pb-4">Nepal Regulatory Refs</h4>
               <div className="space-y-4">
                  <RefLink title="SEBON Specialized Investment Fund Rules" />
                  <RefLink title="NRB Foreign Exchange Manual" />
                  <RefLink title="FITTA Implementation Guidelines" />
                  <RefLink title="Department of Industry (DoI) Portal" />
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}

function RefLink({ title }) {
  return (
    <a href="#" className="flex items-center justify-between group hover:bg-white/5 p-2 rounded-lg transition-colors">
       <span className="text-[10px] text-white/40 group-hover:text-white transition-colors">{title}</span>
       <ChevronRight size={14} className="text-white/10 group-hover:text-[#F59F01]" />
    </a>
  );
}
