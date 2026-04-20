'use client'

/**
 * (gp)/dashboard/page.jsx
 * GP Staff Dashboard — metric cards + priority deal queue.
 */
import { useQuery } from '@tanstack/react-query';
import {
  Briefcase, Users, TrendingUp, Clock,
  AlertTriangle, CheckCircle, Eye,
} from 'lucide-react';
import { MetricCard, StatusBadge } from '@/components/portal/PortalShell';
import api from '@/services/api';
import Link from 'next/link';
import PriorityQueue from '@/components/portal/PriorityQueue';

export default function GPDashboardPage() {
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['deals', 'projects'],
    queryFn: async () => {
      const res = await api.get('/deals/projects/?page_size=100');
      return res.data?.results ?? res.data ?? [];
    }
  });

  const count = (s) => projects.filter((d) => d.status === s).length;

  const metrics = [
    { label: 'Total Deals', value: projects.length, icon: Briefcase, color: '#F59F01' },
    { label: 'Submitted', value: count('SUBMITTED'), icon: Clock, color: '#0B6EC3' },
    { label: 'Due Diligence', value: count('DUE_DILIGENCE'), icon: TrendingUp, color: '#16c784' },
    { label: 'Need AI Review', value: count('AI_REVIEW_NEEDED'), icon: AlertTriangle, color: '#ea3943' },
  ];

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">GP Dashboard</h1>
          <p className="text-white/40 text-sm mt-1">Real-time Private Equity pipeline metrics</p>
        </div>
        <div className="hidden sm:block text-right">
          <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Network Status</p>
          <div className="flex items-center gap-2 text-[#16c784] text-xs font-bold mt-1">
            <div className="w-2 h-2 rounded-full bg-[#16c784] animate-pulse" />
            Operational
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <MetricCard key={m.label} {...m} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Priority Queue Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Priority Deal Queue</h2>
              <p className="text-xs text-white/30">Deals requiring immediate attention or AI screening</p>
            </div>
            <Link
              href="/gp/deals"
              className="text-[#F59F01] text-xs font-bold uppercase tracking-widest hover:underline flex items-center gap-1"
            >
              Full Pipeline →
            </Link>
          </div>
          
          <PriorityQueue />
        </div>
      </div>
    </div>
  );
}
