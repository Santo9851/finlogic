'use client'

/**
 * (entrepreneur)/dashboard/page.jsx
 * Entrepreneur Portfolio Command — Submission tracking & status.
 */
import { useEffect, useState } from 'react';
import { Rocket, Clock, CheckCircle2, Eye, FileUp, Loader2, ShieldAlert, ChevronRight } from 'lucide-react';
import { StatusBadge } from '@/components/portal/PortalShell';
import api from '@/services/api';
import { toast } from 'sonner';
import Link from 'next/link';
import { useTheme } from 'next-themes';

export default function EntrepreneurDashboardPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/entrepreneur/submissions/')
      .then((r) => setSubmissions(r.data?.results ?? r.data ?? []))
      .catch(() => toast.error('Could not load your submissions.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-6 theme-transition">
      <Loader2 className="w-10 h-10 text-ls-compliment animate-spin" />
      <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Syncing Submission Pipeline...</p>
    </div>
  );

  return (
    <div className="space-y-12 theme-transition animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 rounded-[1.25rem] bg-ls-compliment/10 flex items-center justify-center text-ls-compliment shadow-inner">
            <Rocket size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight uppercase leading-none">Venture Pipeline</h1>
            <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mt-3">Institutional Funding Protocols & Asset Registry</p>
          </div>
        </div>
      </div>

      {/* Submissions List */}
      <div className="grid grid-cols-1 gap-8">
        {submissions.length === 0 ? (
          <div className="rounded-[3rem] border-2 border-dashed border-border-theme bg-card p-24 text-center space-y-8 theme-transition shadow-2xl">
            <div className="w-24 h-24 bg-foreground/5 rounded-full flex items-center justify-center mx-auto border border-border-theme shadow-inner opacity-20">
              <ShieldAlert size={48} />
            </div>
            <div className="space-y-2">
              <p className="text-foreground font-black uppercase tracking-widest text-lg">No Active Protocols</p>
              <p className="text-text-muted/40 text-[10px] font-black uppercase tracking-[0.3em]">You haven't initiated any funding submissions in the current cycle</p>
            </div>
          </div>
        ) : (
          submissions.map((sub) => (
            <div key={sub.id} className="rounded-[3rem] border border-border-theme bg-card p-10 hover:bg-foreground/[0.01] transition-all group shadow-xl hover:shadow-2xl relative overflow-hidden theme-transition">
              <div className="absolute top-0 right-0 w-32 h-32 bg-ls-compliment/5 blur-[60px] rounded-full -mr-16 -mt-16 pointer-events-none" />
              
              <div className="flex flex-col md:flex-row md:items-center gap-10 relative z-10">
                <div className="flex-1 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                    <h3 className="text-3xl font-black text-foreground uppercase tracking-tight group-hover:text-[#F59F01] transition-colors leading-none">
                      {sub.legal_name || 'Restricted Venture Registry'}
                    </h3>
                    <div className="scale-110 origin-left">
                      <StatusBadge status={sub.status} />
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-x-12 gap-y-4">
                    <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-text-muted">
                      <div className="w-9 h-9 rounded-xl bg-foreground/5 flex items-center justify-center text-text-muted/40"><Rocket size={16} /></div>
                      {sub.sector || 'General Sector'}
                    </div>
                    <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-text-muted">
                      <div className="w-9 h-9 rounded-xl bg-foreground/5 flex items-center justify-center text-text-muted/40"><Clock size={16} /></div>
                      {sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString() : 'Draft Protocol'}
                    </div>
                    <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-ls-compliment">
                      <div className="w-9 h-9 rounded-xl bg-ls-compliment/10 flex items-center justify-center text-ls-compliment shadow-inner"><CheckCircle2 size={16} /></div>
                      Phase {sub.form_step_completed} Integration
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <Link
                    href={`/entrepreneur/submissions/${sub.id}`}
                    className="flex items-center gap-3 bg-foreground/5 hover:bg-foreground/10 border border-border-theme text-foreground text-[10px] font-black uppercase tracking-widest px-10 py-5 rounded-2xl transition-all shadow-sm active:scale-95"
                  >
                    <Eye size={20} /> Registry
                  </Link>
                  {!sub.submitted_at && (
                    <Link
                      href={`/entrepreneur/submissions/${sub.id}/apply`}
                      className="flex items-center gap-3 bg-[#F59F01] text-ls-primary-fixed text-[10px] font-black uppercase tracking-widest px-10 py-5 rounded-2xl transition-all shadow-xl shadow-[#F59F01]/20 active:scale-95"
                    >
                      <FileUp size={20} /> {sub.form_step_completed > 0 ? 'Resume Ingestion' : 'Initialize Protocol'}
                    </Link>
                  )}
                </div>
              </div>
              
              {/* Progress System */}
              <div className="mt-12 space-y-4 relative z-10">
                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-[0.2em] text-text-muted/40">
                  <span>Institutional Alignment Progress</span>
                  <span className="text-[#F59F01]">{Math.round(Math.min((sub.form_step_completed / (sub.total_steps || 6)) * 100, 100))}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-foreground/5 overflow-hidden shadow-inner border border-border-theme/20">
                  <div 
                    className="h-full transition-all duration-1000 shadow-lg bg-[#F59F01] shadow-[#F59F01]/10"
                    style={{ width: `${Math.min((sub.form_step_completed / (sub.total_steps || 6)) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

