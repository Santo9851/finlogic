'use client'

/**
 * components/portal/PortalShell.jsx
 * Shared loading / unauthorised states for all portal layouts.
 */
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export function PortalLoader() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center theme-transition gap-12">
      <div className="w-12 h-12 border border-ls-compliment/20 border-t-ls-compliment animate-spin" />
      <p className="text-ls-compliment text-[10px] font-bold tracking-[0.5em] uppercase animate-pulse">Syncing Registry Hub</p>
    </div>
  );
}

export function PortalGuard({ children, allowedRoles }) {
  const { user, authLoading, hasAnyRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
      if (!user) router.replace('/auth/login');
      else if (allowedRoles && !hasAnyRole(allowedRoles)) router.replace('/');
    }
  }, [user, authLoading, router, allowedRoles, hasAnyRole]);

  if (authLoading) return <PortalLoader />;
  if (!user) return null;
  if (allowedRoles && !hasAnyRole(allowedRoles)) return null;
  return children;
}

/** Metric card used in dashboards */
export function MetricCard({ label, value, sub, icon: Icon, color = '#F59F01', trend, href }) {
  const content = (
    <div className={`border border-border-theme bg-card p-10 flex flex-col justify-between space-y-10 group hover:bg-ls-primary transition-all duration-500 theme-transition overflow-hidden relative ${href ? 'cursor-pointer' : ''}`}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-text-muted group-hover:text-ls-white/40 uppercase tracking-[0.4em] transition-colors">{label}</span>
        {Icon && (
          <span className="text-ls-compliment opacity-60 group-hover:opacity-100 transition-all">
            <Icon size={20} />
          </span>
        )}
      </div>
      
      <div className="space-y-4">
        <p className="text-4xl font-serif font-light text-foreground group-hover:text-ls-white transition-colors tracking-tight">{value}</p>
        <div className="flex items-center justify-between">
           {sub && <p className="text-[9px] font-serif italic text-text-muted group-hover:text-ls-white/20 transition-colors">{sub}</p>}
           {trend !== undefined && (
             <p className={`text-[10px] font-bold uppercase tracking-widest ${trend >= 0 ? 'text-ls-up' : 'text-red-500'}`}>
               {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
             </p>
           )}
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

/** Status badge - Linear High Contrast */
export function StatusBadge({ status }) {
  const map = {
    PENDING_SUBMISSION: { label: 'Pending Submission', color: '#64748b' },
    SUBMITTED: { label: 'Submitted', color: '#0B6EC3' },
    SCREENING: { label: 'Screening', color: '#F59F01' },
    IC_REVIEW: { label: 'IC Review', color: '#F59F01' },
    TERM_SHEET: { label: 'Term Sheet', color: '#F59F01' },
    LOI_ISSUED: { label: 'LOI Issued', color: '#F59F01' },
    CONTRACT_SIGNED: { label: 'Contract Signed', color: '#16c784' },
    CAPITAL_CALLED: { label: 'Capital Called', color: '#8b5cf6' },
    CLOSED: { label: 'Closed', color: '#16c784' },
    DECLINED: { label: 'Declined', color: '#ef4444' },
    RAISING: { label: 'Raising', color: '#0B6EC3' },
    INVESTING: { label: 'Investing', color: '#16c784' },
    HARVESTING: { label: 'Harvesting', color: '#F59F01' },
  };
  const cfg = map[status] || { label: status, color: '#64748b' };
  
  return (
    <span className="inline-flex items-center px-4 py-1.5 bg-border-theme/20 border-l-2 text-[9px] font-bold uppercase tracking-[0.2em] theme-transition"
          style={{ borderLeftColor: cfg.color, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}
