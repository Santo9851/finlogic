import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { FileText, Download, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
// Note: html2pdf is typically loaded via script tag or dynamic import in this project
// We'll assume it's available globally or handled by the parent if needed, 
// but for modularity, let's keep the logic.

export default function MemoTab({ deal, onGenerate, onSave, onFinalize, isGenerating }) {
  const memo = deal.latest_memo;
  const [activeSection, setActiveSection] = useState('executive_summary');

  if (!memo) {
    return (
      <div className="py-20 text-center bg-white/5 border border-white/10 rounded-3xl space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center text-[#F59F01]/20 mx-auto border border-white/5">
          <FileText size={40} />
        </div>
        <div className="max-w-md mx-auto px-6">
           <h3 className="text-white font-bold text-lg mb-2">Draft Investment Memo</h3>
           <p className="text-white/40 text-sm mb-8 leading-relaxed">
             Use DeepSeek R1 to synthesize all project data into a professional 8-section investment committee memo.
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
    { id: 'due_diligence', name: 'Due Diligence Findings' },
    { id: 'investment_recommendation', name: 'Recommendation' },
  ];

  const handleExport = () => {
    if (typeof window !== 'undefined' && window.html2pdf) {
      const element = document.getElementById('memo-content');
      const opt = {
        margin: 1,
        filename: `Memo_${deal.legal_name}_v${memo.version}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };
      window.html2pdf().set(opt).from(element).save();
    } else {
      console.error('html2pdf not loaded');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
       {/* Sidebar */}
       <div className="space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl">
             <div className="flex items-center justify-between mb-6">
                <h4 className="text-xs font-black text-white uppercase tracking-widest">Sections</h4>
                <span className="text-[10px] font-bold text-white/20">v{memo.version} {memo.status}</span>
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
             {memo.status !== 'FINAL' && (
               <button 
                 onClick={() => onFinalize(memo.id)}
                 className="w-full py-3 bg-[#10b981] text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-[#10b981]/20"
               >
                 Finalize Memo
               </button>
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
                   <p className="text-[10px] font-black text-[#F59F01] uppercase tracking-widest">Version {memo.version}</p>
                   <p className="text-[10px] text-white/20 mt-1 font-mono">{format(new Date(memo.created_at), 'yyyy-MM-dd')}</p>
                </div>
             </div>

             <MemoSection 
               key={activeSection}
               title={sections.find(s => s.id === activeSection)?.name}
               content={memo.content[activeSection]} 
               onSave={(newContent) => {
                  const updated = { ...memo.content, [activeSection]: newContent };
                  onSave({ memoId: memo.id, content: updated });
               }}
               isReadOnly={memo.status === 'FINAL'}
             />
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
  }, [title, content]); // Re-initialize when title or content changes (though key prop handles this mostly)

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
       <h3 className="text-xl font-black text-white/80 uppercase tracking-tight border-l-4 border-[#F59F01] pl-4">{title}</h3>
       <div className="prose prose-invert max-w-none prose-p:text-white/60 prose-p:leading-relaxed prose-headings:text-white prose-strong:text-[#F59F01]">
          <EditorContent editor={editor} className="min-h-[300px] focus:outline-none" />
       </div>
    </div>
  );
}
