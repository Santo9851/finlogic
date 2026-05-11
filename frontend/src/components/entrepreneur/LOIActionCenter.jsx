import React from 'react';
import { FileText, Download, Upload, CheckCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export default function LOIActionCenter({ deal, onUploadContract }) {
  const loiDoc = deal.documents?.find(d => d.category === 'LOI');
  const signedContract = deal.documents?.find(d => d.category === 'SIGNED_CONTRACT' || d.category === 'LOI_SIGNED');

  if (!loiDoc && deal.status !== 'LOI_ISSUED' && deal.status !== 'CONTRACT_SIGNED') return null;

  return (
    <div className="bg-[#F59F01]/5 border border-[#F59F01]/20 rounded-[40px] p-10 mb-12 relative overflow-hidden group">
      {/* Background Decorative Element */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#F59F01]/10 blur-[100px] rounded-full -mr-32 -mt-32 group-hover:bg-[#F59F01]/20 transition-all duration-1000" />
      
      <div className="relative flex flex-col md:flex-row items-center justify-between gap-12">
        <div className="flex-1 space-y-6">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-[#F59F01]/10 rounded-full border border-[#F59F01]/20">
            <ShieldCheck size={16} className="text-[#F59F01]" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#F59F01]">New Offer Received</span>
          </div>
          
          <h2 className="text-4xl font-black text-white leading-tight">
            Review your Letter of Intent & <br/> Finalize Partnership
          </h2>
          
          <p className="text-white/40 max-w-xl text-lg leading-relaxed">
            Finlogic Capital has issued a formal Letter of Intent. Please review the terms, download the LOI, and upload your signed contract to move to the final closing stage.
          </p>

          <div className="flex flex-wrap gap-4 pt-4">
            {loiDoc && (
              <a 
                href={loiDoc.url} 
                target="_blank" 
                rel="noreferrer"
                className="px-8 py-4 bg-white text-black rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-3 hover:scale-105 transition-all shadow-xl shadow-white/10"
              >
                <FileText size={18} />
                View LOI PDF
              </a>
            )}
            
            {signedContract ? (
              <div className="px-8 py-4 bg-[#10b981]/20 text-[#10b981] rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-3 border border-[#10b981]/30">
                <CheckCircle size={18} />
                {deal.documents?.find(d => d.category === 'LOI_SIGNED') ? 'LOI Uploaded' : 'Contract Uploaded'}
              </div>
            ) : (
              <button 
                onClick={onUploadContract}
                className="px-8 py-4 bg-transparent border border-white/20 text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-3 hover:bg-white/5 transition-all"
              >
                <Upload size={18} />
                {deal.status === 'LOI_ISSUED' ? 'Upload Signed LOI' : 'Upload Signed Contract'}
              </button>
            )}
          </div>
        </div>

        {/* Visual Card */}
        <div className="w-full md:w-80 h-96 bg-white/[0.03] border border-white/10 rounded-[32px] p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#F59F01]/5 to-transparent opacity-50" />
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-[#F59F01] flex items-center justify-center text-black mb-6 shadow-lg shadow-[#F59F01]/20">
              <FileText size={32} />
            </div>
            <h3 className="text-white font-bold text-xl mb-2">Deal Terms</h3>
            <div className="space-y-4 mt-6">
              <div className="pb-4 border-b border-white/5">
                <p className="text-[10px] text-white/20 uppercase font-black tracking-widest mb-1">Status</p>
                <p className="text-white font-bold">{deal.status_display}</p>
              </div>
              <div>
                <p className="text-[10px] text-white/20 uppercase font-black tracking-widest mb-1">Documents Needed</p>
                <p className="text-white/60 text-xs">Signed Share Subscription Agreement & Shareholders' Agreement</p>
              </div>
            </div>
          </div>
          
          <div className="relative pt-6 flex items-center justify-between text-[#F59F01]">
            <span className="text-[10px] font-black uppercase tracking-widest">Awaiting Action</span>
            <ArrowRight size={20} className="animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
