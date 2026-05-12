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
    <div className="min-h-screen bg-background flex items-center justify-center theme-transition">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-4 border-[#F59F01]/20 border-t-[#F59F01] animate-spin" />
        <p className="text-[#F59F01]/60 text-sm tracking-widest uppercase">Loading portal…</p>
      </div>
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
    <div className={`rounded-xl border border-border-theme bg-card backdrop-blur-sm p-5 flex flex-col gap-3 hover:border-[#F59F01]/20 transition-all theme-transition ${href ? 'cursor-pointer hover:bg-foreground/5' : ''}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-muted uppercase tracking-widest">{label}</span>
        {Icon && (
          <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
            <Icon size={16} style={{ color }} />
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {sub && <p className="text-xs text-text-muted">{sub}</p>}
      {trend !== undefined && (
        <p className={`text-xs font-medium ${trend >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
          {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
        </p>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

/** Status badge */
export function StatusBadge({ status }) {
  const map = {
    PENDING_SUBMISSION: { label: 'Pending Submission', cls: 'bg-foreground/5 text-text-muted' },
    SUBMITTED: { label: 'Submitted', cls: 'bg-blue-500/10 text-blue-700 dark:text-blue-300' },
    SCREENING: { label: 'Screening', cls: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-300' },
    IC_REVIEW: { label: 'IC Review', cls: 'bg-orange-500/10 text-orange-700 dark:text-orange-300' },
    TERM_SHEET: { label: 'Term Sheet', cls: 'bg-amber-500/10 text-amber-700 dark:text-amber-300' },
    LOI_ISSUED: { label: 'LOI Issued', cls: 'bg-[#F59F01]/10 text-[#F59F01]' },
    CONTRACT_SIGNED: { label: 'Contract Signed', cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
    CAPITAL_CALLED: { label: 'Capital Called', cls: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
    CLOSED: { label: 'Closed', cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
    DECLINED: { label: 'Declined', cls: 'bg-red-500/10 text-red-600 dark:text-red-400' },
    RAISING: { label: 'Raising', cls: 'bg-blue-500/10 text-blue-700 dark:text-blue-300' },
    INVESTING: { label: 'Investing', cls: 'bg-green-500/10 text-green-700 dark:text-green-300' },
    HARVESTING: { label: 'Harvesting', cls: 'bg-amber-500/10 text-amber-700 dark:text-amber-300' },
  };
  const cfg = map[status] || { label: status, cls: 'bg-foreground/5 text-text-muted' };
  return (
    <span className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-bold ${cfg.cls} theme-transition`}>
      {cfg.label}
    </span>
  );
}
