import React from 'react';
import { FileText, Download, Upload, CheckCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { useTheme } from 'next-themes';

export default function LOIActionCenter({ deal, onUploadContract }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  
  const loiDoc = deal.documents?.find(d => d.category === 'LOI');
  const signedContract = deal.documents?.find(d => d.category === 'SIGNED_CONTRACT' || d.category === 'LOI_SIGNED');

  if (!loiDoc && deal.status !== 'LOI_ISSUED' && deal.status !== 'CONTRACT_SIGNED') return null;

  return (
    <div className="bg-[#F59F01]/5 border border-[#F59F01]/20 rounded-[40px] p-10 mb-12 relative overflow-hidden group theme-transition">
      {/* Background Decorative Element */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#F59F01]/10 blur-[100px] rounded-full -mr-32 -mt-32 group-hover:bg-[#F59F01]/20 transition-all duration-1000" />
      
      <div className="relative flex flex-col md:flex-row items-center justify-between gap-12">
        <div className="flex-1 space-y-6">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-[#F59F01]/10 rounded-full border border-[#F59F01]/20">
            <ShieldCheck size={16} className="text-[#F59F01]" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#F59F01]">New Offer Received</span>
          </div>
          
          <h2 className="text-4xl font-black text-foreground leading-tight uppercase tracking-tighter">
            Review your Letter of Intent & <br/> Finalize Partnership
          </h2>
          
          <p className="text-text-muted max-w-xl text-lg leading-relaxed font-medium">
            Finlogic Capital has issued a formal Letter of Intent. Please review the terms, download the LOI, and upload your signed contract to move to the final closing stage.
          </p>

          <div className="flex flex-wrap gap-4 pt-4">
            {loiDoc && (
              <a 
                href={loiDoc.url} 
                target="_blank" 
                rel="noreferrer"
                className="px-8 py-4 bg-foreground text-background rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-3 hover:scale-105 transition-all shadow-xl shadow-foreground/10"
              >
                <FileText size={18} />
                View LOI PDF
              </a>
            )}
            
            {signedContract ? (
              <div className="px-8 py-4 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-3 border border-emerald-500/30">
                <CheckCircle size={18} />
                {deal.documents?.find(d => d.category === 'LOI_SIGNED') ? 'LOI Uploaded' : 'Contract Uploaded'}
              </div>
            ) : (
              <button 
                onClick={onUploadContract}
                className="px-8 py-4 bg-transparent border border-border-theme text-foreground rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-3 hover:bg-foreground/5 transition-all"
              >
                <Upload size={18} />
                {deal.status === 'LOI_ISSUED' ? 'Upload Signed LOI' : 'Upload Signed Contract'}
              </button>
            )}
          </div>
        </div>

        {/* Visual Card */}
        <div className="w-full md:w-80 h-96 bg-card border border-border-theme rounded-[32px] p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden theme-transition">
          <div className="absolute inset-0 bg-gradient-to-br from-[#F59F01]/5 to-transparent opacity-50" />
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-[#F59F01] flex items-center justify-center text-ls-primary-fixed mb-6 shadow-lg shadow-[#F59F01]/20">
              <FileText size={32} strokeWidth={2.5} />
            </div>
            <h3 className="text-foreground font-black uppercase tracking-tight text-xl mb-2">Deal Terms</h3>
            <div className="space-y-4 mt-6">
              <div className="pb-4 border-b border-border-theme">
                <p className="text-[10px] text-text-muted/60 uppercase font-black tracking-widest mb-1">Status</p>
                <p className="text-foreground font-bold">{deal.status_display}</p>
              </div>
              <div>
                <p className="text-[10px] text-text-muted/60 uppercase font-black tracking-widest mb-1">Documents Needed</p>
                <p className="text-text-muted text-xs font-medium">Signed Share Subscription Agreement & Shareholders' Agreement</p>
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

