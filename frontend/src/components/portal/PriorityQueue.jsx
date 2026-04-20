'use client'

/**
 * PriorityQueue.jsx
 * Widget for GP Dashboard showing deals that need AI review.
 */
import { useQuery } from '@tanstack/react-query';
import { Clock, BrainCircuit, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import api from '@/services/api';
import Link from 'next/link';

export default function PriorityQueue() {
  const { data: projects = [], isLoading, error } = useQuery({
    queryKey: ['deals', 'priority-queue'],
    queryFn: async () => {
      const res = await api.get('/deals/projects/?status=AI_REVIEW_NEEDED');
      const data = res.data?.results ?? res.data ?? [];
      // Sort by days waiting descending
      return data.sort((a, b) => {
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        return dateA - dateB; // Oldest first = waiting longest
      });
    }
  });

  if (isLoading) return (
    <div className="flex items-center justify-center p-12 border border-white/5 bg-white/[0.02] rounded-xl">
      <Loader2 size={24} className="text-[#F59F01] animate-spin" />
    </div>
  );

  if (error) return (
    <div className="p-6 border border-red-500/20 bg-red-500/5 rounded-xl text-red-400 flex items-center gap-3">
      <AlertCircle size={20} />
      <p className="text-sm font-medium">Failed to load priority queue.</p>
    </div>
  );

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
        <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-widest">
          <BrainCircuit className="text-[#F59F01]" size={16} /> AI Review Queue
        </h2>
        <span className="text-[10px] bg-[#F59F01]/10 text-[#F59F01] px-2 py-0.5 rounded-full font-bold border border-[#F59F01]/20">
          {projects.length} ACTION NEEDED
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-white/70">
          <thead className="text-[10px] text-white/30 uppercase tracking-tighter bg-white/[0.01] border-b border-white/5">
            <tr>
              <th className="px-6 py-3 font-semibold">Company</th>
              <th className="px-6 py-3 font-semibold">Sector</th>
              <th className="px-6 py-3 font-semibold">Days Waiting</th>
              <th className="px-6 py-3 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {projects.map((p) => {
              const days = Math.floor((new Date() - new Date(p.created_at)) / (1000 * 60 * 60 * 24));
              return (
                <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-white group-hover:text-[#F59F01] transition-colors">{p.legal_name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded border border-white/5 text-white/50">
                      {p.sector}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-xs">
                      <Clock size={14} className={days > 3 ? 'text-red-400' : 'text-white/30'} />
                      <span className={days > 3 ? 'text-red-400 font-bold' : ''}>{days} days</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link 
                      href={`/gp/deals/${p.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F59F01] hover:underline"
                    >
                      Review Now <ChevronRight size={14} />
                    </Link>
                  </td>
                </tr>
              );
            })}
            {projects.length === 0 && (
              <tr>
                <td colSpan="4" className="px-6 py-12 text-center text-white/20 italic">
                  Queue is clear. No pending AI reviews.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
