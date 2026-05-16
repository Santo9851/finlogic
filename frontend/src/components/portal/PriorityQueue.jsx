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
      const res = await api.get('/deals/projects/?status=SUBMITTED,SCREENING');
      const data = res.data?.results ?? res.data;
      const projectsArray = Array.isArray(data) ? data : [];
      // Sort by days waiting descending
      return projectsArray.sort((a, b) => {
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        return dateA - dateB; // Oldest first = waiting longest
      });
    }
  });

  if (isLoading) return (
    <div className="flex items-center justify-center p-12 border border-border-theme bg-card rounded-xl">
      <Loader2 size={24} className="text-[#F59F01] animate-spin" />
    </div>
  );

  if (error) return (
    <div className="p-6 border border-red-500/20 bg-red-500/5 rounded-xl text-red-600 dark:text-red-400 flex items-center gap-3">
      <AlertCircle size={20} />
      <p className="text-sm font-medium">Failed to load priority queue.</p>
    </div>
  );

  return (
    <div className="rounded-xl border border-border-theme bg-card overflow-hidden theme-transition">
      <div className="p-4 border-b border-border-theme flex items-center justify-between bg-foreground/5">
        <h2 className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-widest">
          <BrainCircuit className="text-[#F59F01]" size={16} /> Deal Pipeline Queue
        </h2>
        <span className="text-[10px] bg-[#F59F01]/10 text-[#F59F01] px-2 py-0.5 rounded-full font-bold border border-[#F59F01]/20">
          {projects.length} ACTION NEEDED
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-text-muted">
          <thead className="text-[10px] text-text-muted/60 uppercase tracking-tighter bg-foreground/[0.02] border-b border-border-theme">
            <tr>
              <th className="px-6 py-3 font-semibold">Company</th>
              <th className="px-6 py-3 font-semibold">Sector</th>
              <th className="px-6 py-3 font-semibold">Days Waiting</th>
              <th className="px-6 py-3 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-theme">
            {projects.map((p) => {
              const days = Math.floor((new Date() - new Date(p.created_at)) / (1000 * 60 * 60 * 24));
              return (
                <tr key={p.id} className="hover:bg-foreground/[0.03] transition-colors group">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-foreground group-hover:text-[#F59F01] transition-colors">{p.legal_name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] bg-foreground/5 px-2 py-0.5 rounded border border-border-theme text-text-muted">
                      {p.sector}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-xs">
                      <Clock size={14} className={days > 3 ? 'text-red-600 dark:text-red-400' : 'text-text-muted/40'} />
                      <span className={days > 3 ? 'text-red-600 dark:text-red-400 font-bold' : ''}>{days} days</span>
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
                <td colSpan="4" className="px-6 py-12 text-center text-text-muted/30 italic">
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
