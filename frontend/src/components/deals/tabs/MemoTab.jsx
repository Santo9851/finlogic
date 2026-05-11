import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { FileText, Download, Loader2, Upload, CheckCircle2, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

export default function MemoTab({ deal, onGenerate, onSave, onFinalize, onUploadSignedMemo, isGenerating, isUploading }) {
  const memo = deal.latest_memo;
  const [activeSection, setActiveSection] = useState('executive_summary');
  const isProcessing = deal.analysis_progress?.Memo === 'processing';

  if (!memo && !isProcessing) {
    return (
      <div className="py-20 text-center bg-white/5 border border-white/10 rounded-3xl space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center text-[#F59F01]/20 mx-auto border border-white/5">
          <FileText size={40} />
        </div>
        <div className="max-w-md mx-auto px-6">
           <h3 className="text-white font-bold text-lg mb-2">Draft Investment Memo</h3>
           <p className="text-white/40 text-sm mb-8 leading-relaxed">
             Use Gemini to synthesize all project data into a professional 8-section investment committee memo.
           </p>
           <button 
             onClick={onGenerate}
             disabled={isGenerating}
             className="px-8 py-3 bg-[#F59F01] text-black rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-[#F59F01]/20 disabled:opacity-50"
           >
             {isGenerating ? 'Generating Memo Draft...' : 'Generate with AI'}
           </button>
        </div>
      </div>
    );
  }

  const sections = [
    { id: 'executive_summary', name: 'Executive Summary' },
    { id: 'company_overview', name: 'Company Overview' },
    { id: 'market_analysis', name: 'Market & Industry Analysis' },
    { id: 'financial_analysis', name: 'Financial Performance' },
    { id: 'investment_thesis', name: 'Investment Thesis & Value Creation' },
    { id: 'deal_terms', name: 'Deal Structure & Returns Profile' },
    { id: 'risk_assessment', name: 'Key Risks & Mitigations' },
    { id: 'ic_review_findings', name: 'IC Review Findings' },
    { id: 'investment_recommendation', name: 'Recommendation' },
  ];

  const handleExport = () => {
    window.print();
  };

  return (
    <div className="space-y-8 relative">
      {/* Global Print Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden; background: white !important; color: black !important; }
          #memo-content, #memo-content * { visibility: visible; }
          #memo-content { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%; 
            padding: 0 !important; 
            margin: 0 !important;
            background: white !important;
            color: black !important;
            border: none !important;
            box-shadow: none !important;
          }
          .no-print { display: none !important; }
          h2, h3 { color: #F59F01 !important; page-break-after: avoid; }
          .prose { max-width: none !important; color: black !important; }
          .prose p { color: #333 !important; }
          header, footer, aside, button, nav { display: none !important; }
        }
      `}} />

      {isProcessing && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center gap-4 animate-in fade-in duration-500 min-h-[500px]">
           <div className="w-16 h-16 rounded-full border-4 border-[#F59F01]/20 border-t-[#F59F01] animate-spin" />
           <div className="text-center">
              <p className="text-white font-black text-lg uppercase tracking-tight">AI is Drafting Memo</p>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Synthesizing 8 sections of analysis...</p>
           </div>
        </div>
      )}

      <div className={`grid grid-cols-1 lg:grid-cols-4 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ${isProcessing ? 'opacity-20 pointer-events-none' : ''}`}>
       {/* Sidebar */}
       <div className="space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl">
             <div className="flex items-center justify-between mb-6">
                <h4 className="text-xs font-black text-white uppercase tracking-widest">Sections</h4>
                <span className="text-[10px] font-bold text-white/20">v{memo?.version} {memo?.status}</span>
             </div>
             <div className="space-y-1">
                {sections.map(s => (
                  <button 
                    key={s.id}
                    onClick={() => setActiveSection(s.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all ${activeSection === s.id ? 'bg-[#F59F01] text-black' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
                  >
                    {s.name}
                  </button>
                ))}
             </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
             <button 
               onClick={handleExport}
               className="w-full py-3 bg-white/5 border border-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
             >
               <Download size={14} /> Export to PDF
             </button>
             
             {memo?.status === 'DRAFT' && (
                <div className="space-y-3 pt-4 border-t border-white/5">
                  <button 
                    onClick={onGenerate}
                    disabled={isGenerating}
                    className="w-full py-3 bg-white/5 border border-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                  >
                    <Sparkles size={14} className="text-[#F59F01]" /> {isGenerating ? 'Regenerating...' : 'Re-generate with AI'}
                  </button>
                  <button 
                    onClick={() => onFinalize(memo?.id)}
                    className="w-full py-3 bg-[#10b981] text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-[#10b981]/20"
                  >
                    Finalize Memo
                  </button>
                </div>
             )}

             {(memo?.status === 'FINAL' || memo?.status === 'IC_SIGNED') && (
               <div className="pt-4 border-t border-white/5 space-y-3">
                 <p className="text-[10px] font-black text-[#F59F01] uppercase tracking-widest">Regulatory Compliance</p>
                 <p className="text-white/40 text-[10px] leading-relaxed">
                   Upload the physically signed and stamped IC Memo to proceed to the Term Sheet stage.
                 </p>
                 
                 {memo?.status === 'IC_SIGNED' ? (
                   <div className="bg-[#10b981]/10 border border-[#10b981]/20 rounded-xl p-3 flex items-center gap-2">
                     <CheckCircle2 size={16} className="text-[#10b981]" />
                     <span className="text-[10px] font-bold text-[#10b981] uppercase tracking-widest">IC Signed Memo Uploaded</span>
                   </div>
                 ) : (
                   <div className="relative">
                     <input 
                       type="file" 
                       id="signed-memo-upload"
                       className="hidden" 
                       accept=".pdf,.jpg,.jpeg,.png"
                       onChange={(e) => {
                         const file = e.target.files[0];
                         if (file && onUploadSignedMemo) {
                           onUploadSignedMemo(file);
                         }
                       }}
                     />
                     <label 
                       htmlFor="signed-memo-upload"
                       className="w-full py-3 bg-[#F59F01] text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-[#F59F01]/20 cursor-pointer flex items-center justify-center gap-2"
                     >
                       <Upload size={14} /> {isUploading ? 'Uploading...' : 'Upload Signed Copy'}
                     </label>
                   </div>
                 )}
               </div>
             )}
          </div>
       </div>

       {/* Editor Area */}
       <div className="lg:col-span-3 space-y-6">
          <div id="memo-content" className="bg-white/5 border border-white/10 rounded-3xl p-10 shadow-2xl min-h-[600px]">
             <div className="flex items-center justify-between mb-10 border-b border-white/5 pb-6">
                <div>
                   <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Investment Memo</h2>
                   <p className="text-white/40 text-sm mt-1">{deal.legal_name} • Internal Confidential</p>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black text-[#F59F01] uppercase tracking-widest">Version {memo?.version}</p>
                   <p className="text-[10px] text-white/20 mt-1 font-mono">{memo?.created_at ? format(new Date(memo?.created_at), 'yyyy-MM-dd') : ''}</p>
                </div>
             </div>

             <MemoSection 
               key={`${activeSection}-${memo?.version}`}
               title={sections.find(s => s.id === activeSection)?.name}
               content={memo?.content?.[activeSection]} 
               onSave={(newContent) => {
                  const updated = { ...memo?.content, [activeSection]: newContent };
                  onSave({ memoId: memo?.id, content: updated });
               }}
               isReadOnly={memo?.status === 'FINAL'}
             />
          </div>
       </div>
    </div>
   </div>
  );
}

function MemoSection({ title, content, onSave, isReadOnly }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Start drafting...' })
    ],
    content: content || '<p>AI drafting failed to generate content for this section.</p>',
    editable: !isReadOnly,
    onBlur: ({ editor }) => {
      onSave(editor.getHTML());
    }
  }, [title, content]); 

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
       <h3 className="text-xl font-black text-white/80 uppercase tracking-tight border-l-4 border-[#F59F01] pl-4">{title}</h3>
       <div className="prose prose-invert max-w-none prose-p:text-white/60 prose-p:leading-relaxed prose-headings:text-white prose-strong:text-[#F59F01]">
          <EditorContent editor={editor} className="min-h-[300px] focus:outline-none" />
       </div>
    </div>
  );
}
