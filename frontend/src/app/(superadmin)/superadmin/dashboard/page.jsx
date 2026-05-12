'use client'

/**
 * (superadmin)/dashboard/page.jsx
 * High-fidelity System Intelligence for Superadmins.
 */
import { useQuery } from '@tanstack/react-query';
import { 
  Users, 
  Briefcase, 
  Activity, 
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  Loader2,
  Database,
  ArrowRight,
  ShieldAlert,
  Cpu,
  Network,
  Zap
} from 'lucide-react';
import api from '@/services/api';
import Link from 'next/link';
import { useTheme } from 'next-themes';

export default function SuperAdminDashboard() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  
  const { data: stats, isLoading } = useQuery({
    queryKey: ['superadmin', 'analytics'],
    queryFn: async () => {
      const res = await api.get('/superadmin/analytics/');
      return res.data;
    }
  });

  if (isLoading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-6 theme-transition">
      <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
      <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Initializing System Intelligence...</p>
    </div>
  );

  const analytics = stats || {};

  // High-level summary cards
  const CARDS = [
    { 
      label: 'Unique Identifiers', 
      value: analytics.users?.total_unique_users || 0, 
      icon: Users, 
      color: 'text-blue-500', 
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20'
    },
    { 
      label: 'Institutional Funds', 
      value: analytics.funds?.total_funds_count || 0, 
      icon: Briefcase, 
      color: 'text-purple-500', 
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20'
    },
    { 
      label: 'Active LPs', 
      value: analytics.users?.total_lps || 0, 
      icon: TrendingUp, 
      color: 'text-emerald-500', 
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20'
    },
    { 
      label: 'Neural Assets', 
      value: (analytics.storage?.total_fund_documents || 0) + (analytics.storage?.total_project_documents || 0), 
      icon: Database, 
      color: 'text-amber-500', 
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20'
    },
  ];

  const recentEvents = analytics.audit?.recent_events || [];

  return (
    <div className="space-y-12 theme-transition animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 shadow-inner">
            <Cpu size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">System Command</h1>
            <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mt-2">Platform-Wide Infrastructure Health & Operational Matrix</p>
          </div>
        </div>
        <Link 
          href="/superadmin/analytics"
          className="flex items-center gap-3 px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl active:scale-95 group"
        >
          Neural Analytics <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Metrics Ledger */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {CARDS.map((card, i) => (
          <div key={i} className="bg-card border border-border-theme rounded-[2.5rem] p-8 hover:bg-foreground/[0.02] transition-all group shadow-xl relative overflow-hidden theme-transition">
            <div className="absolute top-0 right-0 w-24 h-24 bg-foreground/5 blur-[40px] rounded-full -mr-12 -mt-12 pointer-events-none opacity-50" />
            <div className="flex items-center justify-between mb-6 relative z-10">
              <div className={`w-12 h-12 rounded-2xl ${card.bg} ${card.color} ${card.border} border flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform`}>
                <card.icon size={24} />
              </div>
              <Activity size={18} className="text-text-muted/10 group-hover:text-purple-500/20 transition-colors" />
            </div>
            <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.3em] ml-1 relative z-10 opacity-60">{card.label}</p>
            <p className="text-3xl font-black text-foreground mt-2 font-mono tracking-tighter relative z-10 tabular-nums">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Audit Stream */}
        <div className="lg:col-span-2 bg-card border border-border-theme rounded-[3rem] p-12 shadow-2xl relative overflow-hidden theme-transition">
          <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 blur-[80px] rounded-full -mr-24 -mt-24 pointer-events-none" />
          
          <div className="flex items-center justify-between mb-10 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 shadow-inner">
                <Network size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black text-foreground uppercase tracking-widest leading-tight">Institutional Audit Stream</h3>
                <p className="text-[9px] text-text-muted font-black uppercase tracking-[0.2em] mt-1 opacity-60">Real-time platform activity & modification logs</p>
              </div>
            </div>
            <Link href="/superadmin/audit" className="text-[10px] text-purple-500 hover:text-purple-400 uppercase font-black tracking-widest transition-colors px-4 py-2 bg-purple-500/5 rounded-xl border border-purple-500/10">
              Enter Registry
            </Link>
          </div>
          
          <div className="space-y-4 relative z-10">
            {recentEvents.length > 0 ? (
              recentEvents.map(event => (
                <div key={event.id} className="flex items-center justify-between p-6 bg-foreground/[0.01] border border-border-theme/50 rounded-[1.5rem] hover:bg-foreground/[0.02] transition-all group/item shadow-sm">
                  <div className="flex items-center gap-6">
                    <div className="w-10 h-10 rounded-xl bg-foreground/5 border border-border-theme flex items-center justify-center group-hover/item:scale-110 transition-transform">
                      <Zap size={18} className="text-text-muted/20 group-hover/item:text-purple-500 transition-colors" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-foreground uppercase tracking-tight group-hover/item:text-purple-500 transition-colors line-clamp-1">{event.object_repr || 'System Mutation'}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[9px] font-black text-purple-500 uppercase tracking-widest bg-purple-500/5 px-2 py-0.5 rounded-md border border-purple-500/10">{event.event_type_display}</span>
                        <span className="text-[9px] text-text-muted/40 font-black uppercase tracking-widest font-mono">
                          {new Date(event.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-[9px] text-text-muted/20 font-mono font-black uppercase tracking-widest hidden sm:block">
                    HEX_{event.id.substring(0, 8).toUpperCase()}
                  </div>
                </div>
              ))
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center gap-6 bg-foreground/[0.01] rounded-[2rem] border-2 border-dashed border-border-theme">
                <div className="w-16 h-16 rounded-full bg-foreground/5 flex items-center justify-center border border-border-theme shadow-inner animate-pulse">
                  <Activity size={32} className="text-text-muted/10" />
                </div>
                <p className="text-text-muted/20 text-[10px] font-black uppercase tracking-[0.3em] italic">No active system signals detected</p>
              </div>
            )}
          </div>
        </div>

        {/* Infrastructure & Intelligence */}
        <div className="space-y-8">
          <div className="bg-card border border-border-theme rounded-[3rem] p-10 flex flex-col shadow-2xl relative overflow-hidden group theme-transition">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/[0.03] to-blue-500/[0.03] pointer-events-none" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-[60px] rounded-full -mr-16 -mt-16 pointer-events-none" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-inner">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-foreground uppercase tracking-widest leading-tight">Infrastructure</h3>
                  <p className="text-[9px] text-text-muted font-black uppercase tracking-[0.2em] mt-1 opacity-60">Distributed Node Performance</p>
                </div>
              </div>
              
              <div className="space-y-10">
                <HealthBar label="Neural Synapse Latency" value={98} color="emerald" />
                <HealthBar label="Vault Allocation" value={Math.min(100, (analytics.storage?.estimated_storage_bytes / 1073741824) * 100) || 12} color="amber" />
                <HealthBar label="Neural Agent Load" value={analytics.ai?.calls_this_month > 0 ? 45 : 12} color="purple" />
              </div>

              <div className="mt-14 pt-10 border-t border-border-theme relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[9px] text-text-muted font-black uppercase tracking-[0.3em] mb-3 opacity-40">Monthly AI Protocol cost</p>
                    <p className="text-3xl font-black text-foreground font-mono tracking-tighter tabular-nums">${analytics.ai?.cost_this_month?.toFixed(2) || '0.00'}</p>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-foreground/5 border border-border-theme flex items-center justify-center text-text-muted/10 shadow-inner group-hover:text-ls-compliment/20 transition-colors">
                    <ShieldAlert size={28} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HealthBar({ label, value, color }) {
  const colors = {
    emerald: 'bg-emerald-500 shadow-emerald-500/30',
    amber: 'bg-amber-500 shadow-amber-500/30',
    purple: 'bg-purple-500 shadow-purple-500/30',
  };

  const textColors = {
    emerald: 'text-emerald-500',
    amber: 'text-amber-500',
    purple: 'text-purple-500',
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.3em]">
        <span className="text-text-muted/60">{label}</span>
        <span className={`${textColors[color]} font-mono`}>{Math.round(value)}%</span>
      </div>
      <div className="w-full bg-foreground/[0.03] h-2.5 rounded-full overflow-hidden shadow-inner border border-border-theme/20">
        <div className={`h-full ${colors[color]} transition-all duration-1000 shadow-lg`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
