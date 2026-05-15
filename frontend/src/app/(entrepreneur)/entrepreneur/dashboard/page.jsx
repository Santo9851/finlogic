'use client'

/**
 * (entrepreneur)/dashboard/page.jsx
 * Entrepreneur Portfolio Command — Submission tracking & status.
 */
import { useEffect, useState } from 'react';
import { Rocket, Clock, CheckCircle2, Eye, FileUp, Loader2, ShieldAlert } from 'lucide-react';
import { StatusBadge } from '@/components/portal/PortalShell';
import api from '@/services/api';
import { toast } from 'sonner';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';

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
    <div className="h-[60vh] flex flex-col items-center justify-center gap-12 theme-transition">
      <Loader2 className="w-12 h-12 text-ls-compliment animate-spin opacity-40" />
      <p className="text-text-muted text-[10px] font-bold uppercase tracking-[0.4em] animate-pulse">Syncing Venture Pipeline...</p>
    </div>
  );

  return (
    <div className="space-y-20 animate-in fade-in duration-1000 max-w-7xl mx-auto pb-32">
      {/* Header - Institutional Command */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 border-b border-border-theme pb-12">
        <div className="space-y-6">
          <div className="flex items-center gap-4 text-ls-compliment text-[10px] font-bold uppercase tracking-[0.5em]">
            <Rocket size={14} /> Venture Command Center
          </div>
          <h1 className="text-5xl md:text-7xl font-serif font-light text-foreground tracking-tight leading-tight">
            Venture <span className="italic">Pipeline</span>
          </h1>
          <p className="text-xl text-text-muted font-serif font-light italic max-w-xl">
            A formal ledger of institutional funding protocols, strategic asset registrations, and venture vetting sequences.
          </p>
        </div>
        <div className="flex items-center gap-6 px-10 py-5 bg-border-theme/20 border border-border-theme shadow-sm">
           <div className="space-y-1 text-right">
             <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.3em]">Protocol Count</p>
             <p className="text-[9px] text-text-muted/40 font-bold uppercase tracking-widest font-mono">ACTIVE_SESSIONS: {submissions.length}</p>
          </div>
        </div>
      </div>

      {/* Submissions List - Architectural Registry */}
      <div className="grid grid-cols-1 gap-16">
        {submissions.length === 0 ? (
          <div className="bg-card border border-border-theme p-32 text-center shadow-2xl">
            <div className="w-20 h-20 border border-border-theme flex items-center justify-center mx-auto mb-10 opacity-20">
              <ShieldAlert size={32} />
            </div>
            <h3 className="text-2xl font-serif font-light text-foreground uppercase tracking-tight">Registry Inactive</h3>
            <p className="text-text-muted/40 text-[10px] font-bold uppercase tracking-[0.4em] mt-4 font-serif italic">No venture protocols initiated in this archival cycle.</p>
          </div>
        ) : (
          submissions.map((sub) => (
            <div key={sub.id} className="bg-card border border-border-theme group hover:bg-ls-primary transition-all duration-700 shadow-2xl overflow-hidden cursor-pointer">
              <div className="p-12 md:p-16">
                <div className="flex flex-col lg:grid lg:grid-cols-[1fr_auto] gap-16 items-start">
                  <div className="space-y-10 flex-1 w-full">
                    <div className="space-y-6">
                       <div className="flex items-center gap-6">
                          <span className="text-[9px] font-mono text-text-muted/30 group-hover:text-ls-white/30 tracking-[0.3em] uppercase">REG_REF: VENT-{sub.id?.toString().padStart(4, '0')}</span>
                          <StatusBadge status={sub.status} />
                       </div>
                       <h3 className="text-5xl font-serif font-light text-foreground group-hover:text-ls-white transition-all uppercase tracking-tight leading-none">
                         {sub.legal_name || 'Restricted Venture Protocol'}
                       </h3>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-16 gap-y-8">
                      <div className="flex items-center gap-4 text-[9px] font-bold uppercase tracking-[0.3em] text-text-muted/40 group-hover:text-ls-white/40 transition-colors">
                        <Rocket size={14} className="text-ls-compliment opacity-40 group-hover:opacity-100" />
                        {sub.sector || 'Strategic Sector'}
                      </div>
                      <div className="flex items-center gap-4 text-[9px] font-bold uppercase tracking-[0.3em] text-text-muted/40 group-hover:text-ls-white/40 transition-colors">
                        <Clock size={14} className="text-ls-compliment opacity-40 group-hover:opacity-100" />
                        INGESTION: {sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString() : 'DRAFT'}
                      </div>
                      <div className="flex items-center gap-4 text-[9px] font-bold uppercase tracking-[0.3em] text-ls-compliment group-hover:text-ls-white transition-colors">
                        <CheckCircle2 size={14} />
                        PHASE: 0{sub.form_step_completed + 1}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row lg:flex-col gap-4 w-full lg:w-72">
                    <Link
                      href={`/entrepreneur/submissions/${sub.id}`}
                      className="flex items-center justify-center gap-4 border border-border-theme group-hover:border-ls-white/20 text-text-muted group-hover:text-ls-white text-[10px] font-bold uppercase tracking-[0.4em] py-6 transition-all bg-border-theme/10 group-hover:bg-transparent"
                    >
                      <Eye size={18} /> Review Dossier
                    </Link>
                    {!sub.submitted_at && (
                      <Link
                        href={`/entrepreneur/submissions/${sub.id}/apply`}
                        className="flex items-center justify-center gap-4 bg-ls-compliment text-ls-primary text-[10px] font-bold uppercase tracking-[0.5em] py-6 hover:bg-ls-white transition-all shadow-xl shadow-ls-compliment/10"
                      >
                        <FileUp size={18} /> {sub.form_step_completed > 0 ? 'Resume Ingestion' : 'Initialize Protocol'}
                      </Link>
                    )}
                  </div>
                </div>
                
                {/* Progress System - Minimalist Track */}
                <div className="mt-16 space-y-4">
                  <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-[0.5em] text-text-muted/30 group-hover:text-ls-white/30 transition-colors font-mono">
                    <span>Institutional Alignment Sync</span>
                    <span className="text-ls-compliment group-hover:text-ls-white">{Math.round(Math.min((sub.form_step_completed / (sub.total_steps || 6)) * 100, 100))}%</span>
                  </div>
                  <div className="h-px w-full bg-border-theme group-hover:bg-ls-white/10 overflow-hidden relative">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((sub.form_step_completed / (sub.total_steps || 6)) * 100, 100)}%` }}
                      className="h-full absolute left-0 top-0 bg-ls-compliment transition-all duration-1000 group-hover:bg-ls-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

