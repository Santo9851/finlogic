'use client'

/**
 * (entrepreneur)/submissions/[id]/page.jsx – Entrepreneur detail view
 */
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, FileText, CheckCircle2, LayoutDashboard, Download, Upload, X } from 'lucide-react';
import FileUploader from '@/components/portal/FileUploader';
import Link from 'next/link';
import { StatusBadge } from '@/components/portal/PortalShell';
import api from '@/services/api';
import { toast } from 'sonner';
import LOIActionCenter from '@/components/entrepreneur/LOIActionCenter';
import { useTheme } from 'next-themes';

export default function EntrepreneurSubmissionDetailPage() {
  const { id } = useParams();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    api.get(`/entrepreneur/submissions/${id}/`)
      .then((r) => setDeal(r.data))
      .catch(() => toast.error('Could not load submission details.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-center py-16 text-text-muted animate-pulse">Loading details…</div>;
  if (!deal) return <div className="text-center py-16 text-rose-500 font-bold uppercase tracking-widest">Submission not found.</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto theme-transition">
      <Link href="/entrepreneur/dashboard" className="flex items-center gap-1.5 text-text-muted hover:text-ls-secondary dark:hover:text-[#F59F01] text-xs font-black uppercase tracking-widest transition-colors">
        <ChevronLeft size={16} /> Back to Dashboard
      </Link>
      
      <LOIActionCenter 
        deal={deal} 
        onUploadContract={() => setShowUpload(true)} 
      />

      <div className="rounded-[2.5rem] border border-border-theme bg-card p-6 md:p-10 space-y-10 shadow-2xl shadow-black/5 theme-transition">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3">
            <h1 className="text-4xl font-black text-foreground uppercase tracking-tight leading-none">{deal.legal_name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-[10px] font-black uppercase tracking-widest text-text-muted">
              <StatusBadge status={deal.status} />
              <span className="bg-foreground/5 px-3 py-1 rounded-full">{deal.sector}</span>
              <span className="opacity-20">•</span>
              <span className="bg-foreground/5 px-3 py-1 rounded-full">{deal.deal_type_display}</span>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2 text-right">
            <p className="text-[10px] text-text-muted uppercase font-black tracking-[0.2em] opacity-40">Current Status</p>
            <p className="text-[#F59F01] font-black text-lg uppercase tracking-tight">{deal.status_display}</p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 py-10 border-y border-border-theme/50">
          <div className="space-y-2">
            <p className="text-[10px] text-text-muted uppercase font-black tracking-widest opacity-40">Target Fund</p>
            <p className="text-foreground font-black uppercase tracking-tight">{deal.fund_detail?.name ?? '—'}</p>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] text-text-muted uppercase font-black tracking-widest opacity-40">Submitted Date</p>
            <p className="text-foreground font-black uppercase tracking-tight">
              {deal.submitted_at ? new Date(deal.submitted_at).toLocaleDateString() : 'Draft'}
            </p>
          </div>
          <div className="space-y-3">
            <p className="text-[10px] text-text-muted uppercase font-black tracking-widest opacity-40">Progress</p>
            <div className="flex items-center gap-4">
              <div className="flex-1 h-2 bg-foreground/5 rounded-full overflow-hidden border border-border-theme/50">
                <div 
                  className="h-full bg-[#F59F01]" 
                  style={{ width: `${Math.min((deal.form_step_completed / (deal.active_template?.steps?.length || 5)) * 100, 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-foreground font-black whitespace-nowrap">
                {Math.min(Math.round((deal.form_step_completed / (deal.active_template?.steps?.length || 5)) * 100), 100)}%
              </p>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="text-xl font-black text-foreground mb-6 flex items-center gap-3 uppercase tracking-tight">
                <div className="w-10 h-10 rounded-xl bg-[#F59F01]/10 flex items-center justify-center text-[#F59F01]">
                  <FileText size={20} />
                </div>
                Form Responses
              </h2>
              <div className="space-y-4">
                {deal.form_responses?.map((resp) => {
                  const stepTemplate = deal.active_template?.steps?.find(s => s.step_index === resp.step_index);
                  
                  return (
                    <details key={resp.id} className="group rounded-[2rem] border border-border-theme bg-foreground/[0.02] hover:bg-foreground/[0.04] transition-all overflow-hidden shadow-sm">
                      <summary className="p-6 cursor-pointer flex items-center justify-between text-foreground transition-colors list-none">
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-full bg-[#F59F01] flex items-center justify-center text-[10px] text-ls-primary-fixed font-black shadow-lg shadow-[#F59F01]/20">
                            {resp.step_index + 1}
                          </div>
                          <span className="font-black tracking-[0.1em] uppercase text-xs">{resp.step_name.replace('_', ' ')}</span>
                        </div>
                        <ChevronLeft size={18} className="group-open:-rotate-90 transition-transform text-text-muted" />
                      </summary>
                      
                      <div className="p-6 pt-0 border-t border-border-theme/50 bg-foreground/[0.01]">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 py-6">
                          {Object.entries(resp.response_data).map(([key, value]) => {
                            const fieldDef = stepTemplate?.fields?.find(f => f.name === key);
                            const label = fieldDef?.label || key.replace('_', ' ').toUpperCase();
                            const isFile = fieldDef?.type === 'file_upload';
                            
                            return (
                              <div key={key} className="space-y-2 group/item">
                                <p className="text-[10px] text-text-muted/60 uppercase tracking-[0.2em] font-black group-hover/item:text-[#F59F01] transition-colors">
                                  {label}
                                </p>
                                {isFile ? (
                                   <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest bg-emerald-500/5 border border-emerald-500/10 px-4 py-2 rounded-xl w-fit">
                                     <CheckCircle2 size={14} />
                                     <span>Document Attached</span>
                                   </div>
                                ) : (
                                  <p className="text-sm text-foreground break-words leading-relaxed font-medium">
                                    {value === true ? 'Yes' : value === false ? 'No' : (value?.toString() || '—')}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </details>
                  );
                })}
                {(!deal.form_responses || deal.form_responses.length === 0) && (
                  <p className="text-text-muted text-sm italic font-medium">No form steps completed yet.</p>
                )}
              </div>
            </section>
          </div>

          <div className="space-y-8">
            <div className="rounded-[2rem] border border-[#F59F01]/20 bg-[#F59F01]/5 p-8 space-y-6 shadow-xl shadow-[#F59F01]/5">
              <h3 className="text-[10px] font-black text-[#F59F01] uppercase tracking-[0.3em]">Institutional Next Steps</h3>
              <p className="text-sm text-text-muted leading-relaxed font-medium">
                {deal.status === 'SUBMITTED' ? (
                  "Your submission is being reviewed by our GP staff. We will notify you once the screening is complete."
                ) : deal.status === 'SCREENING' ? (
                  "We are currently screening your proposal. Expect a response within 5-10 business days."
                ) : (
                  "Follow the dashboard for updates on your application status."
                )}
              </p>
              {!deal.submitted_at && (
                <Link
                  href={`/entrepreneur/submissions/${deal.id}/apply`}
                  className="block w-full text-center bg-[#F59F01] text-ls-primary-fixed text-[10px] font-black uppercase tracking-widest py-4 rounded-2xl hover:scale-[1.02] transition-all shadow-xl shadow-[#F59F01]/20"
                >
                  {deal.form_step_completed > 0 ? 'Resume Submission' : 'Initialize Application'}
                </Link>
              )}
            </div>

            {/* Document Section for Entrepreneur */}
            <div className="rounded-[2rem] border border-border-theme bg-foreground/[0.02] p-8 space-y-6 theme-transition">
               <h3 className="text-[10px] font-black text-foreground uppercase tracking-[0.3em] flex items-center justify-between">
                 Vault Documents
                 <FileText size={16} className="text-[#F59F01]" />
               </h3>
               <div className="space-y-4">
                  {deal.documents?.filter(d => ['LOI', 'LOI_SIGNED', 'SIGNED_CONTRACT', 'LEGAL'].includes(d.category)).map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-4 bg-background rounded-2xl border border-border-theme shadow-sm group hover:border-[#F59F01]/30 transition-all">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center text-[#F59F01] group-hover:bg-[#F59F01]/10 transition-colors">
                           <FileText size={18} />
                         </div>
                         <div className="flex flex-col">
                            <span className="text-xs text-foreground font-black truncate max-w-[120px] uppercase tracking-tight">{doc.filename}</span>
                            <span className="text-[8px] text-text-muted uppercase font-black tracking-widest mt-0.5">{doc.category_display}</span>
                         </div>
                      </div>
                      <a href={doc.url} target="_blank" rel="noreferrer" className="text-text-muted hover:text-[#F59F01] transition-colors p-2 hover:bg-[#F59F01]/5 rounded-lg">
                        <Download size={16} />
                      </a>
                    </div>
                  ))}
                  {deal.documents?.filter(d => ['LOI', 'LOI_SIGNED', 'SIGNED_CONTRACT', 'LEGAL'].includes(d.category)).length === 0 && (
                    <div className="text-center py-6">
                      <p className="text-[10px] text-text-muted uppercase font-black tracking-widest opacity-40">No legal documents yet.</p>
                    </div>
                  )}
               </div>
               
               {deal.status === 'LOI_ISSUED' && (
                 <div className="pt-6 border-t border-border-theme/50">
                    {deal.documents?.some(d => d.category === 'LOI_SIGNED') ? (
                      <div className="flex items-center gap-3 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                          <CheckCircle2 size={16} />
                        </div>
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Signed LOI Received. Awaiting GP Review.</p>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setShowUpload(true)}
                        className="w-full py-4 bg-foreground text-background text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-3 hover:scale-[1.02] shadow-xl"
                      >
                        <Upload size={16} /> Upload Signed LOI
                      </button>
                    )}
                 </div>
               )}
            </div>
          </div>
        </div>
      </div>

      {showUpload && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-card border border-border-theme rounded-[3rem] p-10 w-full max-w-lg relative shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] theme-transition">
            <button onClick={() => setShowUpload(false)} className="absolute top-8 right-8 text-text-muted hover:text-foreground transition-colors p-2 hover:bg-foreground/5 rounded-full">
              <X size={24} />
            </button>
            <div className="mb-8">
              <h3 className="text-3xl font-black text-foreground uppercase tracking-tight leading-none mb-2">Execute Agreement</h3>
              <p className="text-sm text-text-muted font-medium">Upload the finalized, signed document to complete this stage.</p>
            </div>
            <FileUploader 
              projectId={deal.id} 
              category={deal.status === 'LOI_ISSUED' ? 'LOI_SIGNED' : 'SIGNED_CONTRACT'}
              hideCategory={true}
              isEntrepreneur={true}
              isLocal={true}
              uploadUrl={deal.status === 'LOI_ISSUED' ? `/entrepreneur/submissions/${deal.id}/upload-signed-loi/` : `/entrepreneur/submissions/${deal.id}/upload-local/`}
              onSuccess={() => {
                setShowUpload(false);
                toast.success(deal.status === 'LOI_ISSUED' ? "Signed LOI uploaded successfully" : "Contract uploaded successfully");
                // Refresh data
                api.get(`/entrepreneur/submissions/${id}/`).then(r => setDeal(r.data));
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

