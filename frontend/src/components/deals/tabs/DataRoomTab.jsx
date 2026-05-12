import React, { useState } from 'react';
import { FileText, FileSearch, CheckCircle2, Download, ExternalLink, Loader2, X, Upload, AlertTriangle } from 'lucide-react';
import FileUploader from '@/components/portal/FileUploader';
import AnalysisStepper from '@/components/deals/AnalysisStepper';

export default function DataRoomTab({ 
  deal, 
  onView, 
  onExtract, 
  isExtracting, 
  onRedFlagScan, 
  onRefresh,
  onDelete
}) {
  const [showUpload, setShowUpload] = useState(false);
  const documents = deal.documents || [];

  const isDuplicate = (doc) => {
    return documents.filter(d => 
      d.id !== doc.id && 
      d.filename === doc.filename && 
      Math.abs(d.file_size - doc.file_size) < 100
    ).length > 0;
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 theme-transition">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h3 className="text-3xl font-black text-foreground tracking-tight uppercase">Data Room</h3>
          <p className="text-text-muted text-sm mt-1 font-medium">Manage project documents and trigger AI extractions</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
           <div className="bg-card border border-border-theme px-6 py-3 rounded-2xl flex items-center gap-4 shadow-lg">
              <div className="text-right">
                 <p className="text-[10px] text-text-muted uppercase font-black tracking-widest">Completeness</p>
                 <span className="text-xl font-black text-emerald-600 dark:text-emerald-500">{deal.data_room_completeness}%</span>
              </div>
              <div className="w-16 h-2 bg-foreground/5 rounded-full overflow-hidden border border-border-theme/50 shadow-inner">
                 <div className="h-full bg-emerald-500" style={{ width: `${deal.data_room_completeness}%` }} />
              </div>
           </div>
           <button 
             onClick={() => setShowUpload(true)}
             className="px-8 py-4 bg-[#F59F01] text-ls-primary-fixed rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-[#F59F01]/20 active:scale-95"
           >
             Upload Document
           </button>
        </div>
      </div>
      
      {deal.analysis_progress && Object.keys(deal.analysis_progress).length > 0 && (
        <AnalysisStepper progress={deal.analysis_progress} />
      )}

      {showUpload && (
        <div className="bg-card border border-[#F59F01]/30 rounded-[2rem] p-10 relative animate-in zoom-in-95 duration-300 shadow-2xl">
          <button 
            onClick={() => setShowUpload(false)}
            className="absolute top-8 right-8 text-text-muted/40 hover:text-foreground transition-all p-2 hover:bg-foreground/5 rounded-xl"
          >
            <X size={20} />
          </button>
          <div className="max-w-md">
            <h4 className="text-foreground font-black text-lg mb-6 flex items-center gap-3 uppercase tracking-tight">
              <Upload size={22} className="text-[#F59F01]" /> Add New Document
            </h4>
            <FileUploader 
              projectId={deal.id} 
              onSuccess={() => {
                onRefresh?.();
                setShowUpload(false);
              }} 
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {documents.map((doc) => {
          const duplicate = isDuplicate(doc);
          return (
            <div key={doc.id} className={`bg-card border ${duplicate ? 'border-orange-500/50 bg-orange-500/5' : 'border-border-theme'} rounded-[2rem] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 group hover:border-[#F59F01]/30 transition-all shadow-lg hover:shadow-2xl theme-transition`}>
              <div className="flex items-center gap-6">
                <div className={`w-14 h-14 rounded-2xl bg-foreground/5 border border-border-theme flex items-center justify-center ${duplicate ? 'text-orange-600 dark:text-orange-500' : 'text-text-muted/20'} group-hover:text-[#F59F01] group-hover:bg-[#F59F01]/5 transition-all relative shadow-inner`}>
                  <FileText size={28} />
                  {duplicate && (
                    <div className="absolute -top-1.5 -right-1.5 bg-orange-600 dark:bg-orange-500 text-white rounded-full p-1 shadow-lg" title="Potential Duplicate Found">
                      <AlertTriangle size={10} />
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h4 className="text-foreground font-black text-base tracking-tight">{doc.filename}</h4>
                    {duplicate && (
                      <span className="text-[8px] font-black bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-500 px-2 py-0.5 rounded-full uppercase tracking-widest border border-orange-500/20">
                        Duplicate Candidate
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1.5">
                    <span className="text-[10px] text-text-muted font-black uppercase tracking-widest">{doc.category_display}</span>
                    <span className="w-1 h-1 rounded-full bg-text-muted/20" />
                    <span className="text-[10px] text-text-muted/40 font-bold">{(doc.file_size / 1024 / 1024).toFixed(2)} MB</span>
                    <span className="w-1 h-1 rounded-full bg-text-muted/20" />
                    <span className="text-[10px] text-text-muted/40 font-bold">{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 ml-auto sm:ml-0">
                {['SCREENING', 'IC_REVIEW', 'TERM_SHEET', 'LOI_ISSUED', 'CONTRACT_SIGNED', 'CAPITAL_CALLED', 'CLOSED'].includes(deal.status) && (
                  <>
                    {(() => {
                      const isFinancial = ['FINANCIAL', 'FINANCIALS', 'FINANCIAL_REPORT', 'AUDITED_FINANCIALS'].includes(doc.category?.toUpperCase());
                      return isFinancial;
                    })() && (
                      <button 
                        onClick={() => onExtract(doc.id)}
                        disabled={isExtracting || deal.extracted_financials?.some(f => f.source_document === doc.id)}
                        className="px-4 py-2.5 bg-[#F59F01]/5 text-[#F59F01] border border-[#F59F01]/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#F59F01] hover:text-ls-primary-fixed transition-all flex items-center gap-2 disabled:opacity-50 shadow-sm"
                      >
                        {isExtracting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" size={14} />
                        ) : deal.extracted_financials?.some(f => f.source_document === doc.id) ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" size={14} />
                        ) : (
                          <FileSearch className="w-3.5 h-3.5" size={14} />
                        )}
                        {deal.extracted_financials?.some(f => f.source_document === doc.id) ? 'Extracted' : 'AI Extract'}
                      </button>
                    )}
                    
                    {['LEGAL', 'CONTRACTS', 'LOAN_DOCS'].includes(doc.category?.toUpperCase()) && (
                      <button 
                        onClick={() => onRedFlagScan(doc.id)}
                        className="px-4 py-2.5 bg-foreground/5 text-text-muted border border-border-theme rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-foreground/10 hover:text-foreground transition-all flex items-center gap-2 shadow-sm"
                      >
                        <CheckCircle2 size={14} className="text-emerald-500" />
                        Legal Scan
                      </button>
                    )}
                  </>
                )}
                
                <button 
                  onClick={() => onView(doc.file_key)}
                  className="p-3 bg-foreground/5 text-text-muted/40 hover:text-ls-primary-fixed hover:bg-[#0B6EC3] border border-border-theme rounded-xl transition-all shadow-sm"
                  title="View Document"
                >
                  <ExternalLink size={18} />
                </button>

                <button 
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete ${doc.filename}? This action is irreversible.`)) {
                      onDelete?.(doc.id);
                    }
                  }}
                  className="p-3 bg-foreground/5 text-text-muted/40 hover:text-white hover:bg-rose-500 border border-border-theme rounded-xl transition-all shadow-sm"
                  title="Delete Document"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          );
        })}

        {documents.length === 0 && !showUpload && (
          <div className="py-20 text-center bg-card border border-dashed border-border-theme rounded-[2rem] shadow-inner theme-transition">
             <p className="text-text-muted font-bold uppercase tracking-widest text-[10px] opacity-40 italic">No documents uploaded yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
