'use client'

/**
 * components/portal/PortalShell.jsx
 * Shared loading / unauthorised states for all portal layouts.
 */
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function PortalLoader() {
  return (
    <div className="min-h-screen bg-[#0a0014] flex items-center justify-center">
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
export function MetricCard({ label, value, sub, icon: Icon, color = '#F59F01', trend }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 flex flex-col gap-3 hover:border-white/20 transition-all">
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/40 uppercase tracking-widest">{label}</span>
        {Icon && (
          <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
            <Icon size={16} style={{ color }} />
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-white/40">{sub}</p>}
      {trend !== undefined && (
        <p className={`text-xs font-medium ${trend >= 0 ? 'text-[#16c784]' : 'text-[#ea3943]'}`}>
          {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
        </p>
      )}
    </div>
  );
}

/** Status badge */
export function StatusBadge({ status }) {
  const map = {
    SUBMITTED: { label: 'Submitted', cls: 'bg-blue-500/20 text-blue-300' },
    SCREENING: { label: 'Screening', cls: 'bg-yellow-500/20 text-yellow-300' },
    AI_REVIEW_NEEDED: { label: 'AI Review', cls: 'bg-purple-500/20 text-purple-300' },
    GP_APPROVED: { label: 'GP Approved', cls: 'bg-green-500/20 text-green-300' },
    SHORTLISTED: { label: 'Shortlisted', cls: 'bg-teal-500/20 text-teal-300' },
    VIDEO_PITCH: { label: 'Video Pitch', cls: 'bg-cyan-500/20 text-cyan-300' },
    DUE_DILIGENCE: { label: 'Due Diligence', cls: 'bg-orange-500/20 text-orange-300' },
    TERM_SHEET: { label: 'Term Sheet', cls: 'bg-amber-500/20 text-amber-300' },
    CLOSED: { label: 'Closed', cls: 'bg-emerald-500/20 text-emerald-300' },
    DECLINED: { label: 'Declined', cls: 'bg-red-500/20 text-red-300' },
    RAISING: { label: 'Raising', cls: 'bg-blue-500/20 text-blue-300' },
    INVESTING: { label: 'Investing', cls: 'bg-green-500/20 text-green-300' },
    HARVESTING: { label: 'Harvesting', cls: 'bg-amber-500/20 text-amber-300' },
  };
  const cfg = map[status] || { label: status, cls: 'bg-white/10 text-white/60' };
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}
