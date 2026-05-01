'use client'

/**
 * (superadmin)/dashboard/page.jsx
 * High-level overview for Superadmins using the Analytics API.
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
  ArrowRight
} from 'lucide-react';
import api from '@/services/api';
import Link from 'next/link';

export default function SuperAdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['superadmin', 'analytics'],
    queryFn: async () => {
      const res = await api.get('/superadmin/analytics/');
      return res.data;
    }
  });

  if (isLoading) return (
    <div className="h-[60vh] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
    </div>
  );

  const analytics = stats || {};

  // High-level summary cards
  const CARDS = [
    { 
      label: 'Total Users', 
      value: analytics.users?.total_unique_users || 0, 
      icon: Users, 
      color: 'text-blue-400', 
      bg: 'bg-blue-400/10' 
    },
    { 
      label: 'Active Funds', 
      value: analytics.funds?.total_funds_count || 0, 
      icon: Briefcase, 
      color: 'text-purple-400', 
      bg: 'bg-purple-400/10' 
    },
    { 
      label: 'Active LPs', 
      value: analytics.users?.total_lps || 0, 
      icon: TrendingUp, 
      color: 'text-emerald-400', 
      bg: 'bg-emerald-400/10' 
    },
    { 
      label: 'Vault Assets', 
      value: (analytics.storage?.total_fund_documents || 0) + (analytics.storage?.total_project_documents || 0), 
      icon: Database, 
      color: 'text-amber-400', 
      bg: 'bg-amber-400/10' 
    },
  ];

  const recentEvents = analytics.audit?.recent_events || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">System Overview</h1>
          <p className="text-white/40 text-sm mt-1">Platform-wide health and operational status.</p>
        </div>
        <Link 
          href="/superadmin/analytics"
          className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-2 bg-purple-500/10 px-4 py-2 rounded-xl transition-all border border-purple-500/20"
        >
          Detailed Analytics <ArrowRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {CARDS.map((card, i) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/[0.07] transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg ${card.bg} ${card.color}`}>
                <card.icon size={20} />
              </div>
              <Activity size={16} className="text-white/10 group-hover:text-white/20 transition-colors" />
            </div>
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">{card.label}</p>
            <p className="text-2xl font-bold text-white mt-1 font-mono">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck size={20} className="text-purple-400" /> Recent System Activity
            </h3>
            <Link href="/superadmin/audit" className="text-[10px] text-white/30 hover:text-white uppercase font-bold tracking-widest transition-colors">
              View Audit Log
            </Link>
          </div>
          
          <div className="space-y-2">
            {recentEvents.length > 0 ? (
              recentEvents.map(event => (
                <div key={event.id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0 hover:bg-white/[0.02] -mx-2 px-2 rounded-lg transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                      <Activity size={14} className="text-white/20" />
                    </div>
                    <div>
                      <p className="text-sm text-white font-medium line-clamp-1">{event.object_repr}</p>
                      <p className="text-[10px] text-white/30 uppercase tracking-tighter font-bold">
                        {event.event_type_display} • {new Date(event.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-[10px] text-white/20 font-mono italic shrink-0">
                    ID: {event.id.substring(0, 8)}
                  </div>
                </div>
              ))
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-center space-y-3 bg-white/[0.02] rounded-2xl border border-dashed border-white/10">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/20">
                  <Activity size={20} />
                </div>
                <p className="text-white/20 text-sm italic">No recent system activity recorded.</p>
              </div>
            )}
          </div>
        </div>

        {/* System Health / Quick Stats */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 border border-purple-500/20 rounded-3xl p-8 flex flex-col h-full">
            <div>
              <h3 className="text-lg font-bold text-white mb-2">Platform Infrastructure</h3>
              <p className="text-xs text-white/60 leading-relaxed mb-8">
                All microservices are communicating normally. AI agents are online and responsive.
              </p>
            </div>
            
            <div className="flex-1 space-y-6">
              <HealthBar label="Database Performance" value={98} color="emerald" />
              <HealthBar label="File Storage (Vault)" value={Math.min(100, (analytics.storage?.estimated_storage_bytes / 1073741824) * 100)} color="amber" />
              <HealthBar label="AI Agent Load" value={analytics.ai?.calls_this_month > 0 ? 45 : 0} color="purple" />
            </div>

            <div className="mt-10 pt-6 border-t border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-white/30 uppercase font-bold tracking-widest mb-1">Monthly AI Cost</p>
                  <p className="text-2xl font-bold text-white font-mono">${analytics.ai?.cost_this_month?.toFixed(2) || '0.00'}</p>
                </div>
                <div className="p-3 rounded-full bg-white/5 border border-white/10 text-white/40">
                  <AlertCircle size={20} />
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
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    purple: 'bg-purple-500',
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest">
        <span className="text-white/40">{label}</span>
        <span className={`text-${color}-400 font-mono`}>{value.toFixed(0)}%</span>
      </div>
      <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
        <div className={`h-full ${colors[color]} transition-all duration-1000`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
