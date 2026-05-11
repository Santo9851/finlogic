
import React from 'react';
import { 
  ShieldCheck, FileText, Landmark, AlertCircle, 
  ChevronLeft, CheckCircle2, Clock 
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
    <div className="min-h-screen bg-[#050505] text-white p-8 lg:p-12 font-sans">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="flex items-center justify-between">
           <Link href={`/gp/deals/${id}`} className="flex items-center gap-2 text-white/40 hover:text-[#F59F01] transition-colors text-xs font-bold uppercase tracking-widest">
              <ChevronLeft size={16} /> Back to Deal
           </Link>
           <div className="bg-[#F59F01]/10 border border-[#F59F01]/20 px-4 py-2 rounded-full flex items-center gap-2">
              <ShieldCheck size={14} className="text-[#F59F01]" />
              <span className="text-[10px] font-black text-[#F59F01] uppercase tracking-widest">Regulatory Mode</span>
           </div>
        </div>

        <div className="space-y-2">
           <h1 className="text-4xl font-black tracking-tighter uppercase">Nepal Regulatory Checklist</h1>
           <p className="text-white/40 text-sm max-w-2xl">
              Compliance tracking for Foreign Direct Investment (FDI) and Private Equity regulations in Nepal.
           </p>
        </div>

        {/* Checklist Grid */}
        <div className="grid grid-cols-1 gap-8">
           {checklist.map((section, idx) => (
             <div key={idx} className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                <div className="bg-white/5 px-8 py-4 border-b border-white/10">
                   <h3 className="text-xs font-black text-white/60 uppercase tracking-widest">{section.category}</h3>
                </div>
                <div className="p-8 space-y-6">
                   {section.items.map(item => (
                     <div key={item.id} className="flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                           <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.status === 'completed' ? 'bg-[#10b981]/10 text-[#10b981]' : 'bg-white/5 text-white/20'}`}>
                              {item.status === 'completed' ? <CheckCircle2 size={16} /> : <FileText size={16} />}
                           </div>
                           <div className="space-y-0.5">
                              <p className="text-sm font-bold text-white/80 group-hover:text-white transition-colors">{item.label}</p>
                              {item.required && <span className="text-[8px] font-black text-red-500/60 uppercase tracking-widest">Mandatory</span>}
                           </div>
                        </div>
                        <div className="flex items-center gap-4">
                           <span className={`text-[9px] font-black uppercase tracking-widest ${item.status === 'completed' ? 'text-[#10b981]' : 'text-[#F59F01]'}`}>
                              {item.status}
                           </span>
                           <button className="p-2 bg-white/5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-white/10">
                              <Landmark size={14} className="text-white/40" />
                           </button>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
           ))}
        </div>

        {/* Warning Footer */}
        <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-3xl flex gap-4">
           <AlertCircle className="text-red-500 shrink-0" size={24} />
           <p className="text-red-500/80 text-xs leading-relaxed italic">
              Non-compliance with NRB or FITTA regulations can lead to significant penalties and restriction on profit repatriation. Ensure all documents are physically verified by legal counsel.
           </p>
        </div>

      </div>
    </div>
  );
}
