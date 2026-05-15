'use client'

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, FileText, CheckCircle2, Rocket, Download, Upload, X, Loader2 } from 'lucide-react';
import FileUploader from '@/components/portal/FileUploader';
import Link from 'next/link';
import { StatusBadge } from '@/components/portal/PortalShell';
import api from '@/services/api';
import { toast } from 'sonner';
import LOIActionCenter from '@/components/entrepreneur/LOIActionCenter';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';

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

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-12 theme-transition">
      <Loader2 className="w-12 h-12 text-ls-compliment animate-spin opacity-40" />
      <p className="text-text-muted text-[10px] font-bold uppercase tracking-[0.4em] animate-pulse">Synchronizing Venture Dossier...</p>
    </div>
  );

  if (!deal) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-8 text-center px-6">
      <div className="w-20 h-20 border border-red-500/20 flex items-center justify-center text-red-500">
        <FileText size={40} />
      </div>
      <div className="space-y-4">
        <h2 className="text-3xl font-serif font-light text-foreground uppercase tracking-tight">Registry Error</h2>
        <p className="text-text-muted max-w-md mx-auto text-[11px] font-bold uppercase tracking-widest font-serif italic">Submission protocol not found in the institutional ledger.</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-20 max-w-7xl mx-auto theme-transition pb-32 animate-in fade-in duration-1000">
      <Link href="/entrepreneur/dashboard" className="inline-flex items-center gap-6 text-text-muted/40 hover:text-ls-compliment text-[10px] font-bold uppercase tracking-[0.5em] transition-all group">
        <div className="w-8 h-8 border border-border-theme flex items-center justify-center group-hover:border-ls-compliment transition-all">
          <ChevronLeft size={14} />
        </div>
        Back to Pipeline
      </Link>
      
      <LOIActionCenter 
        deal={deal} 
        onUploadContract={() => setShowUpload(true)} 
      />

      <div className="border border-border-theme bg-card theme-transition shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-ls-compliment/5 blur-[120px] rounded-full -mr-48 -mt-48 pointer-events-none" />
        
        {/* Header - Institutional Dossier */}
        <div className="p-12 md:p-20 border-b border-border-theme bg-border-theme/10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-16">
            <div className="space-y-8">
              <div className="flex items-center gap-6">
                 <span className="text-[9px] font-mono text-text-muted/40 tracking-[0.3em] uppercase">DOSSIER-REF: PRJ-{deal.id?.toString().padStart(4, '0')}</span>
                 <StatusBadge status={deal.status} />
              </div>
              <h1 className="text-5xl md:text-8xl font-serif font-light text-foreground tracking-tighter leading-[0.9]">
                {deal.legal_name.split(' ').map((word, i) => i === 0 ? <span key={i}>{word} </span> : <span key={i} className="italic">{word} </span>)}
              </h1>
              <div className="flex flex-wrap items-center gap-10 text-[9px] font-bold uppercase tracking-[0.5em] text-text-muted/60">
                <span className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-ls-compliment" /> {deal.sector}</span>
                <span className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-ls-compliment" /> {deal.deal_type_display}</span>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-3 text-right">
              <p className="text-[9px] text-text-muted uppercase font-bold tracking-[0.5em] opacity-40 font-mono">PRIMARY_STATUS</p>
              <p className="text-ls-compliment font-serif font-light text-4xl italic tracking-tighter uppercase">{deal.status_display}</p>
            </div>
          </div>
        </div>

        {/* Info Grid - Minimalist Archival */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border-theme border-b border-border-theme">
          <div className="p-12 bg-card flex flex-col justify-between space-y-8">
            <p className="text-[9px] text-text-muted uppercase font-bold tracking-[0.5em] opacity-40 font-mono">ALLOCATED_FUND</p>
            <p className="text-2xl font-serif font-light text-foreground tracking-tight uppercase leading-none">{deal.fund_detail?.name ?? 'UNALLOCATED'}</p>
          </div>
          <div className="p-12 bg-card flex flex-col justify-between space-y-8 border-x border-border-theme">
            <p className="text-[9px] text-text-muted uppercase font-bold tracking-[0.5em] opacity-40 font-mono">INGESTION_DATE</p>
            <p className="text-2xl font-serif font-light text-foreground tracking-tight uppercase leading-none font-mono">
              {deal.submitted_at ? new Date(deal.submitted_at).toLocaleDateString() : 'DRAFT_MODE'}
            </p>
          </div>
          <div className="p-12 bg-card flex flex-col justify-between space-y-8">
            <p className="text-[9px] text-text-muted uppercase font-bold tracking-[0.5em] opacity-40 font-mono">VETTING_SYNC</p>
            <div className="space-y-6">
               <div className="flex justify-between items-end">
                  <p className="text-2xl font-serif font-light text-foreground tracking-tight uppercase font-mono">
                    {Math.min(Math.round((deal.form_step_completed / (deal.active_template?.steps?.length || 5)) * 100), 100)}%
                  </p>
               </div>
               <div className="h-px w-full bg-border-theme overflow-hidden relative">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${Math.min((deal.form_step_completed / (deal.active_template?.steps?.length || 5)) * 100, 100)}%` }}
                   className="h-full absolute left-0 top-0 bg-ls-compliment transition-all duration-1000"
                 />
               </div>
            </div>
          </div>
        </div>

        {/* Content Section - High Fidelity Ledger */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-px bg-border-theme">
          <div className="bg-card p-12 md:p-20 space-y-20">
            <section className="space-y-16">
              <h2 className="text-[10px] font-bold text-text-muted flex items-center gap-6 uppercase tracking-[0.6em] border-l-2 border-ls-compliment pl-8">
                Strategic Response Ledger
              </h2>
              <div className="space-y-px bg-border-theme border border-border-theme shadow-xl">
                {deal.form_responses?.map((resp, i) => {
                  const stepTemplate = deal.active_template?.steps?.find(s => s.step_index === resp.step_index);
                  
                  return (
                    <details key={resp.id} className="group bg-card transition-all overflow-hidden">
                      <summary className="p-10 cursor-pointer flex items-center justify-between text-foreground transition-all list-none hover:bg-ls-primary hover:text-ls-white group-open:bg-ls-primary group-open:text-ls-white">
                        <div className="flex items-center gap-10">
                          <div className="w-12 h-12 border border-border-theme flex items-center justify-center text-[10px] group-hover:border-ls-white/20 group-open:border-ls-white/20 font-bold tracking-[0.3em] font-mono">
                            0{resp.step_index + 1}
                          </div>
                          <span className="text-2xl font-serif font-light tracking-tight uppercase">{resp.step_name.replace('_', ' ')}</span>
                        </div>
                        <div className="w-10 h-10 border border-border-theme flex items-center justify-center group-hover:border-ls-white/20 transition-all">
                          <ChevronLeft size={18} className="group-open:-rotate-90 transition-transform text-text-muted group-hover:text-ls-white group-open:text-ls-white" />
                        </div>
                      </summary>
                      
                      <div className="p-12 md:p-16 bg-border-theme/5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-16">
                          {Object.entries(resp.response_data).map(([key, value]) => {
                            const fieldDef = stepTemplate?.fields?.find(f => f.name === key);
                            const label = fieldDef?.label || key.replace('_', ' ').toUpperCase();
                            const isFile = fieldDef?.type === 'file_upload';
                            
                            return (
                              <div key={key} className="space-y-4 group/item">
                                <p className="text-[9px] text-text-muted/40 uppercase tracking-[0.4em] font-bold font-mono">
                                  {label}
                                </p>
                                {isFile ? (
                                   <div className="flex items-center gap-4 text-ls-up text-[10px] font-bold uppercase tracking-[0.3em] border-l-2 border-ls-up pl-6 py-1 bg-ls-up/5">
                                     <CheckCircle2 size={14} />
                                     <span>Ingested_Protocol_Record</span>
                                   </div>
                                ) : (
                                  <p className="text-xl text-foreground break-words leading-relaxed font-serif italic opacity-80">
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
                  <div className="p-24 text-center bg-card">
                    <p className="text-text-muted/30 text-[10px] font-bold uppercase tracking-[0.5em] italic font-serif">Registry items pending institutional audit.</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="bg-border-theme/10 space-y-px">
            {/* Action Center - Briefing Card */}
            <div className="bg-ls-primary text-ls-white p-12 md:p-16 space-y-12 h-full flex flex-col justify-between">
              <div className="space-y-12">
                <h3 className="text-[10px] font-bold text-ls-white/30 uppercase tracking-[0.6em] border-b border-ls-white/10 pb-10 flex items-center justify-between leading-none">
                  Protocol Briefing
                  <Rocket size={16} className="text-ls-compliment" />
                </h3>
                <p className="text-xl font-serif font-light italic leading-relaxed text-ls-white/60">
                  {deal.status === 'SUBMITTED' ? (
                    "Your venture dossier is currently undergoing formal institutional review by our managing partners. You will be notified once the screening sequence is finalized."
                  ) : deal.status === 'SCREENING' ? (
                    "We are currently auditing the strategic alignment of your proposal. Expected response cycle: 5-10 business sequences."
                  ) : (
                    "Monitor this institutional command center for real-time updates on your registry status and compliance window."
                  )}
                </p>
              </div>

              <div className="space-y-12">
                {!deal.submitted_at && (
                  <Link
                    href={`/entrepreneur/submissions/${deal.id}/apply`}
                    className="block w-full text-center bg-ls-compliment text-ls-primary text-[10px] font-bold uppercase tracking-[0.6em] py-8 hover:bg-ls-white transition-all shadow-2xl shadow-ls-compliment/20"
                  >
                    {deal.form_step_completed > 0 ? 'Resume Dossier' : 'Initialize Protocol'}
                  </Link>
                )}

                {/* Vault Section - Archival Snapshot */}
                <div className="space-y-12 pt-12 border-t border-ls-white/10">
                   <h3 className="text-[10px] font-bold text-ls-white/30 uppercase tracking-[0.6em] flex items-center justify-between leading-none">
                     Registry Vault
                     <FileText size={16} />
                   </h3>
                   <div className="space-y-8">
                      {deal.documents?.filter(d => ['LOI', 'LOI_SIGNED', 'SIGNED_CONTRACT', 'LEGAL'].includes(d.category)).map(doc => (
                        <div key={doc.id} className="flex items-center justify-between group/doc">
                          <div className="flex items-center gap-8">
                             <div className="w-12 h-12 border border-ls-white/10 flex items-center justify-center text-ls-white/20 group-hover/doc:text-ls-compliment group-hover/doc:border-ls-compliment transition-all bg-ls-white/5">
                               <FileText size={20} />
                             </div>
                             <div className="flex flex-col space-y-1">
                                <span className="text-[13px] text-ls-white font-serif italic truncate max-w-[180px] group-hover/doc:text-ls-compliment transition-all">{doc.filename}</span>
                                <span className="text-[8px] text-ls-white/20 uppercase font-bold tracking-[0.4em] font-mono">{doc.category_display}</span>
                             </div>
                          </div>
                          <a href={doc.url} target="_blank" rel="noreferrer" className="text-ls-white/20 hover:text-ls-compliment transition-all p-3 border border-transparent hover:border-ls-compliment/20">
                            <Download size={18} />
                          </a>
                        </div>
                      ))}
                      {deal.documents?.filter(d => ['LOI', 'LOI_SIGNED', 'SIGNED_CONTRACT', 'LEGAL'].includes(d.category)).length === 0 && (
                        <p className="text-[9px] text-ls-white/10 uppercase font-bold tracking-[0.5em] italic text-center py-12 border border-dashed border-ls-white/10">No legal records discovered.</p>
                      )}
                   </div>
                   
                   {deal.status === 'LOI_ISSUED' && (
                     <div className="pt-12">
                        {deal.documents?.some(d => d.category === 'LOI_SIGNED') ? (
                          <div className="flex items-start gap-6 p-8 bg-ls-up/5 border border-ls-up/20">
                            <CheckCircle2 size={18} className="text-ls-up flex-shrink-0" />
                            <p className="text-[10px] font-bold text-ls-up uppercase tracking-[0.4em] leading-relaxed">Signed LOI Ingested. Awaiting Institutional Verification.</p>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setShowUpload(true)}
                            className="w-full py-8 bg-ls-compliment text-ls-primary text-[10px] font-bold uppercase tracking-[0.6em] hover:bg-ls-white transition-all shadow-2xl"
                          >
                            <Upload size={18} className="inline mr-4" /> Commit Signed LOI
                          </button>
                        )}
                     </div>
                   )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showUpload && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-8 md:p-16 bg-ls-primary/95 backdrop-blur-3xl animate-in fade-in duration-500">
          <div className="bg-card border border-border-theme p-16 md:p-24 w-full max-w-2xl relative shadow-2xl theme-transition overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-ls-compliment/5 blur-[100px] rounded-full -mr-32 -mt-32 pointer-events-none" />
            
            <button onClick={() => setShowUpload(false)} className="absolute top-12 right-12 text-text-muted/40 hover:text-ls-compliment transition-all p-4 border border-border-theme hover:border-ls-compliment active:scale-95">
              <X size={28} />
            </button>
            <div className="mb-16 space-y-6 text-center">
              <h3 className="text-5xl font-serif font-light text-foreground tracking-tight leading-none uppercase">Execute <span className="italic">Agreement</span></h3>
              <p className="text-xl font-serif font-light italic text-text-muted opacity-60">Commit the finalized institutional instrument to complete this ingestion stage.</p>
            </div>
            <div className="bg-foreground/[0.02] border border-border-theme p-12 shadow-inner">
              <FileUploader 
                projectId={deal.id} 
                category={deal.status === 'LOI_ISSUED' ? 'LOI_SIGNED' : 'SIGNED_CONTRACT'}
                hideCategory={true}
                isEntrepreneur={true}
                isLocal={true}
                uploadUrl={deal.status === 'LOI_ISSUED' ? `/entrepreneur/submissions/${deal.id}/upload-signed-loi/` : `/entrepreneur/submissions/${deal.id}/upload-local/`}
                onSuccess={() => {
                  setShowUpload(false);
                  toast.success(deal.status === 'LOI_ISSUED' ? "Signed LOI ingested successfully" : "Contract ingested successfully");
                  api.get(`/entrepreneur/submissions/${id}/`).then(r => setDeal(r.data));
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

