import React, { useState } from 'react';
import { FileText, FileSearch, CheckCircle2, Download, ExternalLink, Loader2, X, Upload } from 'lucide-react';
import FileUploader from '@/components/portal/FileUploader';
import AnalysisStepper from '@/components/deals/AnalysisStepper';

export default function DataRoomTab({ 
  deal, 
  onView, 
  onExtract, 
  isExtracting, 
  onRedFlagScan, 
  onRefresh 
}) {
  const [showUpload, setShowUpload] = useState(false);
  const documents = deal.documents || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-black text-white tracking-tight">Data Room</h3>
          <p className="text-white/40 text-sm mt-1">Manage project documents and trigger AI extractions</p>
        </div>
        <div className="flex gap-4">
           <div className="bg-white/5 border border-white/10 px-6 py-2 rounded-2xl flex items-center gap-3">
              <div className="text-right">
                 <p className="text-[10px] text-white/20 uppercase font-black">Completeness</p>
                 <span className="text-lg font-black text-[#10b981]">{deal.data_room_completeness}%</span>
              </div>
              <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-[#10b981]" style={{ width: `${deal.data_room_completeness}%` }} />
              </div>
           </div>
           <button 
             onClick={() => setShowUpload(true)}
             className="px-6 py-3 bg-[#F59F01] text-black rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-[#F59F01]/20"
           >
             Upload Document
           </button>
        </div>
      
      {deal.analysis_progress && Object.keys(deal.analysis_progress).length > 0 && (
        <AnalysisStepper progress={deal.analysis_progress} />
      )}
      </div>

      {showUpload && (
        <div className="bg-white/5 border border-[#F59F01]/20 rounded-3xl p-8 relative animate-in zoom-in-95 duration-300">
          <button 
            onClick={() => setShowUpload(false)}
            className="absolute top-6 right-6 text-white/20 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
          <div className="max-w-md">
            <h4 className="text-white font-bold mb-4 flex items-center gap-2">
              <Upload size={18} className="text-[#F59F01]" /> Add New Document
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
        {documents.map((doc) => (
          <div key={doc.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center justify-between group hover:border-white/20 transition-all">
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white/20 group-hover:text-[#F59F01] transition-colors">
                <FileText size={24} />
              </div>
              <div>
                <h4 className="text-white font-bold text-sm">{doc.filename}</h4>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-[10px] text-white/30 font-black uppercase tracking-widest">{doc.category_display}</span>
                  <span className="text-[10px] text-white/20 font-medium">{(doc.file_size / 1024 / 1024).toFixed(2)} MB</span>
                  <span className="text-[10px] text-white/20 font-medium">{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Analysis actions only available in SCREENING or later */}
              {['SCREENING', 'AI_REVIEW_NEEDED', 'GP_APPROVED', 'SHORTLISTED', 'VIDEO_PITCH', 'DUE_DILIGENCE', 'TERM_SHEET', 'CLOSED'].includes(deal.status) && (
                <>
                  {(() => {
                    const isFinancial = ['FINANCIAL', 'FINANCIALS', 'FINANCIAL_REPORT', 'AUDITED_FINANCIALS'].includes(doc.category?.toUpperCase());
                    if (!isFinancial && doc.category?.toUpperCase().includes('FIN')) {
                      console.log('Document suspected to be financial but not matched:', doc.filename, doc.category);
                    }
                    return isFinancial;
                  })() && (
                    <button 
                      onClick={() => onExtract(doc.id)}
                      disabled={isExtracting || deal.extracted_financials?.some(f => f.source_document === doc.id)}
                      className="px-4 py-2 bg-[#F59F01]/10 text-[#F59F01] border border-[#F59F01]/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#F59F01] hover:text-black transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {isExtracting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : deal.extracted_financials?.some(f => f.source_document === doc.id) ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <FileSearch className="w-3.5 h-3.5" />
                      )}
                      {deal.extracted_financials?.some(f => f.source_document === doc.id) ? 'Extracted' : 'AI Extract'}
                    </button>
                  )}
                  
                  {['LEGAL', 'CONTRACTS', 'LOAN_DOCS'].includes(doc.category?.toUpperCase()) && (
                    <button 
                      onClick={() => onRedFlagScan(doc.id)}
                      className="px-4 py-2 bg-white/5 text-white/60 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2"
                    >
                      <CheckCircle2 size={14} />
                      Legal Scan
                    </button>
                  )}
                </>
              )}
              
              <button 
                onClick={() => onView(doc.file_key)}
                className="p-3 bg-white/5 text-white/20 hover:text-white rounded-xl transition-all"
              >
                <ExternalLink size={18} />
              </button>
            </div>
          </div>
        ))}

        {documents.length === 0 && !showUpload && (
          <div className="py-20 text-center bg-white/5 border border-dashed border-white/10 rounded-3xl">
             <p className="text-white/20 italic text-sm">No documents uploaded yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
