import React, { useState, useEffect } from 'react';
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
      <div className="py-20 text-center bg-ls-primary/5 dark:bg-white/5 border border-ls-primary/10 dark:border-white/10 rounded-3xl space-y-6 theme-transition">
        <div className="w-20 h-20 rounded-3xl bg-ls-primary/5 dark:bg-white/5 flex items-center justify-center text-[#F59F01]/20 mx-auto border border-ls-primary/5 dark:border-white/5">
          <FileText size={40} />
        </div>
        <div className="max-w-md mx-auto px-6">
          <h3 className="text-ls-primary dark:text-white font-bold text-lg mb-2">Draft Investment Memo</h3>
          <p className="text-ls-primary/40 dark:text-white/40 text-sm mb-8 leading-relaxed">
            Use Gemini to synthesize all project data into a professional 8-section investment committee memo.
          </p>
          <button
            onClick={onGenerate}
            disabled={isGenerating}
            className="px-8 py-3 bg-[#F59F01] text-ls-primary rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-[#F59F01]/20 disabled:opacity-50"
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
    const printWindow = window.open('', '_blank', 'width=900,height=1200');
    if (!printWindow) {
      alert('Pop-up blocked. Please allow pop-ups for this site to export the memo.');
      return;
    }

    const companyName = deal?.legal_name || 'Finlogic Client';
    const dateStr = memo?.created_at ? format(new Date(memo?.created_at), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');

    // Construct sections HTML
    const sectionsHTML = sections.map((s, idx) => `
      <div class="section-container">
         <h2 class="section-title">${s.name}</h2>
         <div class="section-content prose">
            ${memo?.content?.[s.id] || '<p>No content provided for this section.</p>'}
         </div>
      </div>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Investment Memo - ${companyName}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
            background: white; 
            color: #111; 
            line-height: 1.6;
          }
          @page { size: A4 portrait; margin: 20mm; }
          
          .header { 
            border-bottom: 4px solid #F59F01; 
            padding-bottom: 20px; 
            margin-bottom: 40px; 
            display: flex; 
            justify-content: space-between; 
            align-items: flex-end;
          }
          .header h1 { 
            font-size: 28px; 
            font-weight: 900; 
            text-transform: uppercase; 
            letter-spacing: -1px; 
            color: #000;
          }
          .header-meta { text-align: right; font-size: 10px; font-weight: 700; color: #666; text-transform: uppercase; letter-spacing: 1px; }

          .section-container { 
            margin-bottom: 40px; 
          }
          .section-title { 
            font-size: 18px; 
            font-weight: 900; 
            text-transform: uppercase; 
            color: #000; 
            border-left: 6px solid #F59F01; 
            padding-left: 15px; 
            margin-bottom: 20px; 
            letter-spacing: -0.5px;
            page-break-after: avoid;
            break-after: avoid;
          }
          .section-content { font-size: 11pt; color: #333; text-align: justify; }
          .prose p { margin-bottom: 15px; }
          .prose h1, .prose h2, .prose h3 { margin: 20px 0 10px; color: #000; page-break-after: avoid; break-after: avoid; }
          .prose ul, .prose ol { margin-left: 20px; margin-bottom: 15px; }
          .prose li { margin-bottom: 5px; }
          .prose strong { color: #000; }
          
          .footer { 
            border-top: 1px solid #eee; 
            padding-top: 15px; 
            margin-top: 60px; 
            display: flex; 
            justify-content: space-between; 
            font-size: 8px; 
            font-weight: 700; 
            color: #aaa; 
            text-transform: uppercase; 
            letter-spacing: 2px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:15px;transform:scale(0.8);transform-origin:left top;">
              <svg width="44" height="44" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="8" y="8" width="84" height="14" rx="3" fill="#5B2FD4"/>
                <rect x="8" y="8" width="14" height="84" rx="3" fill="#5B2FD4"/>
                <rect x="26" y="60" width="28" height="28" rx="5" fill="#F59F01"/>
              </svg>
              <svg height="36" viewBox="0 0 220 84" fill="none" xmlns="http://www.w3.org/2000/svg" style="overflow:visible;">
                <text x="0" y="30" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="31" letter-spacing="0.5" fill="#3A138A">FINLOGIC</text>
                <text x="0" y="58" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="31" letter-spacing="0.5" fill="#3A138A">CAPITAL</text>
                <text x="1" y="80" font-family="Arial, sans-serif" font-weight="600" font-size="22" letter-spacing="3" fill="#6B3DD4">LIMITED</text>
              </svg>
            </div>
            <h1>Investment Committee Memo</h1>
            <p style="font-size: 12px; font-weight: 700; color: #F59F01; margin-top: 4px;">${companyName}</p>
          </div>
          <div class="header-meta">
            <p>Ref No: ________________________</p>
            <p>Date: ${dateStr}</p>
          </div>
        </div>

        ${sectionsHTML}

        <div class="footer">
          <span>Finlogic Capital Limited • Institutional Governance</span>
          <span>Confidential • Internal Use Only</span>
        </div>

        <script>
          window.addEventListener('afterprint', function() {
            window.close();
          });
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-8 relative theme-transition">
      {isProcessing && (
        <div className="absolute inset-0 z-50 bg-ls-primary/60 dark:bg-black/60 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center gap-4 animate-in fade-in duration-500 min-h-[500px]">
          <div className="w-16 h-16 rounded-full border-4 border-[#F59F01]/20 border-t-[#F59F01] animate-spin" />
          <div className="text-center">
            <p className="text-ls-white font-black text-lg uppercase tracking-tight">AI is Drafting Memo</p>
            <p className="text-ls-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Synthesizing 8 sections of analysis...</p>
          </div>
        </div>
      )}

      <div className={`grid grid-cols-1 lg:grid-cols-4 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ${isProcessing ? 'opacity-20 pointer-events-none' : ''}`}>
        {/* Sidebar */}
        <div className="space-y-4 theme-transition">
          <div className="bg-card border border-border-theme rounded-3xl p-6 shadow-xl theme-transition">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-xs font-black text-ls-primary dark:text-white uppercase tracking-widest">Sections</h4>
              <span className="text-[10px] font-bold text-text-muted">v{memo?.version} {memo?.status}</span>
            </div>
            <div className="space-y-1">
              {sections.map(s => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all ${activeSection === s.id ? 'bg-[#F59F01] text-ls-primary' : 'text-ls-primary/40 dark:text-white/40 hover:bg-ls-primary/5 dark:hover:bg-white/5 hover:text-ls-primary dark:hover:text-white'}`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border-theme rounded-3xl p-6 shadow-xl space-y-4 theme-transition">
            <button
              onClick={handleExport}
              className="w-full py-3 bg-ls-primary/5 dark:bg-white/5 border border-border-theme text-ls-primary dark:text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-ls-primary/10 dark:hover:bg-white/10 transition-all flex items-center justify-center gap-2"
            >
              <Download size={14} /> Export to PDF
            </button>
 
            {memo?.status === 'DRAFT' && (
              <div className="space-y-3 pt-4 border-t border-border-theme">
                <button
                  onClick={onGenerate}
                  disabled={isGenerating}
                  className="w-full py-3 bg-ls-primary/5 dark:bg-white/5 border border-border-theme text-ls-primary dark:text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-ls-primary/10 dark:hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles size={14} className="text-[#F59F01]" /> {isGenerating ? 'Regenerating...' : 'Re-generate with AI'}
                </button>
                <button
                  onClick={() => onFinalize(memo?.id)}
                  className="w-full py-3 bg-[#10b981] text-ls-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-[#10b981]/20"
                >
                  Finalize Memo
                </button>
              </div>
            )}

            {(memo?.status === 'FINAL' || memo?.status === 'IC_SIGNED') && (
              <div className="pt-4 border-t border-ls-primary/5 dark:border-white/5 space-y-3">
                <p className="text-[10px] font-black text-[#F59F01] uppercase tracking-widest">Regulatory Compliance</p>
                <p className="text-ls-primary/40 dark:text-white/40 text-[10px] leading-relaxed">
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
                      className="w-full py-3 bg-[#F59F01] text-ls-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-[#F59F01]/20 cursor-pointer flex items-center justify-center gap-2"
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
        <div className="lg:col-span-3 space-y-6 theme-transition">
          <div id="memo-content" className="bg-card border border-border-theme rounded-3xl p-10 shadow-2xl min-h-[600px] theme-transition">
            <div className="flex items-center justify-between mb-10 border-b border-border-theme pb-6">
              <div>
                <h2 className="text-3xl font-black text-ls-primary dark:text-white uppercase tracking-tighter">Investment Memo</h2>
                <p className="text-text-muted text-sm mt-1">{deal.legal_name} • Internal Confidential</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-[#F59F01] uppercase tracking-widest">Version {memo?.version}</p>
                <p className="text-[10px] text-text-muted mt-1 font-mono">{memo?.created_at ? format(new Date(memo?.created_at), 'yyyy-MM-dd') : ''}</p>
              </div>
            </div>

            <div className="print-only">
              <MemoSection
                key={`${activeSection}-${memo?.version}`}
                title={sections.find(s => s.id === activeSection)?.name}
                content={memo?.content?.[activeSection]}
                onSave={(newContent) => {
                  const updated = { ...memo?.content, [activeSection]: newContent };
                  onSave({ memoId: memo?.id, content: updated });
                }}
                isReadOnly={memo?.status === 'FINAL' || memo?.status === 'IC_SIGNED'}
              />
            </div>
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

  useEffect(() => {
    if (editor && editor.isEditable !== !isReadOnly) {
      editor.setEditable(!isReadOnly);
    }
  }, [isReadOnly, editor]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 theme-transition">
      <h3 className="text-xl font-black text-ls-primary dark:text-white uppercase tracking-tight border-l-4 border-[#F59F01] pl-4">{title}</h3>
      <div className={`prose prose-slate dark:prose-invert max-w-none bg-ls-primary/5 dark:bg-white/5 border border-border-theme rounded-2xl p-6 focus-within:border-[#F59F01]/50 transition-all ${isReadOnly ? 'opacity-80 pointer-events-none' : ''}`}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
