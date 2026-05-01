'use client'

/**
 * (superadmin)/dashboard/page.jsx
 * High-level overview for Superadmins.
 */
import { useQuery } from '@tanstack/react-query';
import { 
  Users, 
  Briefcase, 
  Activity, 
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  Loader2
} from 'lucide-react';
import api from '@/services/api';

export default function SuperAdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['superadmin', 'stats'],
    queryFn: async () => {
      // Mocking or fetching actual stats if endpoints were available
      // For now, let's just fetch counts from the list endpoints
      const [usersRes, fundsRes] = await Promise.all([
        api.get('/superadmin/users/'),
        api.get('/superadmin/funds/')
      ]);
      return {
        userCount: usersRes.data?.count ?? usersRes.data?.length ?? 0,
        fundCount: fundsRes.data?.count ?? fundsRes.data?.length ?? 0,
        activeLPs: 42, // Mocked
        pendingApprovals: 5, // Mocked
      };
    }
  });

  if (isLoading) return (
    <div className="h-[60vh] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
    </div>
  );

  const CARDS = [
    { label: 'Total Users', value: stats.userCount, icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Active Funds', value: stats.fundCount, icon: Briefcase, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { label: 'Active LPs', value: stats.activeLPs, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: 'Pending Approvals', value: stats.pendingApprovals, icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">System Overview</h1>
        <p className="text-white/40 text-sm mt-1">Platform-wide statistics and management.</p>
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
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest">{card.label}</p>
            <p className="text-2xl font-bold text-white mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Activity size={20} className="text-purple-400" /> Recent System Activity
          </h3>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                    <ShieldCheck size={14} className="text-white/20" />
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">New fund 'Clean Tech II' created</p>
                    <p className="text-[10px] text-white/30 uppercase tracking-tighter">System Audit • 2 hours ago</p>
                  </div>
                </div>
                <button className="text-[10px] text-purple-400 font-bold hover:underline">VIEW</button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 border border-purple-500/20 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white mb-2">Platform Health</h3>
            <p className="text-sm text-white/60 leading-relaxed">
              All systems are operational. The last automated backup was completed 4 hours ago.
            </p>
          </div>
          
          <div className="mt-8 space-y-4">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-white/60">API Latency</span>
              <span className="text-emerald-400 font-bold">124ms</span>
            </div>
            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full w-[95%]" />
            </div>
            
            <div className="flex justify-between text-xs mb-1 pt-2">
              <span className="text-white/60">Storage Usage</span>
              <span className="text-amber-400 font-bold">68%</span>
            </div>
            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
              <div className="bg-amber-500 h-full w-[68%]" />
            </div>
          </div>

          <button className="w-full mt-8 py-3 bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all border border-white/10">
            System Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
}
