
import React from 'react';
import { 
  ShieldCheck, FileText, Landmark, AlertCircle, 
  ChevronLeft, CheckCircle2 
} from 'lucide-react';
import Link from 'next/link';

export default function RegulatoryPage({ params }) {
  const { id } = params;

  const checklist = [
    { category: 'FDI / FITTA', items: [
      { id: 1, label: 'FITTA Approval for Investment', status: 'pending', required: true },
      { id: 2, label: 'Automatic Route Eligibility Check', status: 'completed', required: true },
      { id: 3, label: 'DOI Intimation for Share Transfer', status: 'pending', required: false }
    ]},
    { category: 'NRB Compliance', items: [
      { id: 4, label: 'NRB Foreign Exchange Approval', status: 'pending', required: true },
      { id: 5, label: '7-Day Notification to NRB', status: 'pending', required: true }
    ]},
    { category: 'Company / SEBON', items: [
      { id: 6, label: 'OCR Share Lagat Update', status: 'pending', required: true },
      { id: 7, label: 'SEBON Private Placement Filing', status: 'completed', required: true }
    ]}
  ];

  return (
    <div className="min-h-screen bg-background text-foreground p-8 lg:p-12 font-sans theme-transition">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="flex items-center justify-between">
           <Link href={`/gp/deals/${id}`} className="flex items-center gap-2 text-text-muted hover:text-[#F59F01] transition-colors text-[10px] font-black uppercase tracking-[0.2em]">
              <ChevronLeft size={16} /> Back to Deal Overview
           </Link>
           <div className="bg-[#F59F01]/10 border border-[#F59F01]/20 px-4 py-2 rounded-full flex items-center gap-2 backdrop-blur-sm">
              <ShieldCheck size={14} className="text-[#F59F01]" />
              <span className="text-[10px] font-black text-[#F59F01] uppercase tracking-[0.2em]">Regulatory Mode</span>
           </div>
        </div>

        <div className="space-y-4">
           <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-[0.9]">Nepal <span className="text-[#F59F01]">Regulatory</span> Checklist</h1>
           <p className="text-text-muted text-sm max-w-2xl font-medium leading-relaxed">
              Compliance tracking for Foreign Direct Investment (FDI) and Private Equity regulations in Nepal. Managed by the IC Compliance Desk.
           </p>
        </div>

        {/* Checklist Grid */}
        <div className="grid grid-cols-1 gap-8">
           {checklist.map((section, idx) => (
             <div key={idx} className="bg-card border border-border-theme rounded-[2.5rem] overflow-hidden shadow-2xl theme-transition">
                <div className="bg-foreground/[0.03] px-8 py-5 border-b border-border-theme">
                   <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] opacity-60">{section.category}</h3>
                </div>
                <div className="p-8 space-y-8">
                   {section.items.map(item => (
                     <div key={item.id} className="flex items-center justify-between group">
                        <div className="flex items-center gap-6">
                           <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all shadow-inner ${item.status === 'completed' ? 'bg-[#10b981]/10 text-[#10b981]' : 'bg-foreground/5 text-text-muted'}`}>
                              {item.status === 'completed' ? <CheckCircle2 size={20} /> : <FileText size={20} />}
                           </div>
                           <div className="space-y-1">
                              <p className="text-base font-bold text-foreground group-hover:text-[#F59F01] transition-colors leading-tight">{item.label}</p>
                              {item.required && <span className="text-[9px] font-black text-red-500 uppercase tracking-widest bg-red-500/5 px-2 py-0.5 rounded-full border border-red-500/10">Mandatory</span>}
                           </div>
                        </div>
                        <div className="flex items-center gap-6">
                           <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full ${item.status === 'completed' ? 'text-[#10b981] bg-[#10b981]/10' : 'text-[#F59F01] bg-[#F59F01]/10'}`}>
                              {item.status}
                           </span>
                           <button className="p-3 bg-foreground/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-all hover:bg-foreground/10 border border-border-theme">
                              <Landmark size={16} className="text-text-muted" />
                           </button>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
           ))}
        </div>

        {/* Warning Footer */}
        <div className="bg-red-500/[0.03] border border-red-500/20 p-8 rounded-[2.5rem] flex gap-6 items-start shadow-xl">
           <AlertCircle className="text-red-500 shrink-0 mt-1" size={28} />
           <p className="text-red-500/70 text-xs leading-relaxed font-medium italic">
              Non-compliance with NRB or FITTA regulations can lead to significant penalties and restriction on profit repatriation. Ensure all documents are physically verified by legal counsel before final IC sign-off.
           </p>
        </div>

      </div>
    </div>
  );
}
