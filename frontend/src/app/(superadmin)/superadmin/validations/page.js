'use client'

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, 
  Loader2,
  Filter,
  FileSearch,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  User,
  Calendar
} from 'lucide-react';
import api from '@/services/api';
import Link from 'next/link';
import { useTheme } from 'next-themes';

export default function SuperAdminValidationsPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [verdictFilter, setVerdictFilter] = useState('all');

  // 1. Fetch Validations
  const { data: validations = [], isLoading } = useQuery({
    queryKey: ['superadmin', 'validations'],
    queryFn: async () => {
      const res = await api.get('/superadmin/validations/');
      return res.data?.results ?? res.data ?? [];
    }
  });

  // 2. Filtering
  const filteredValidations = useMemo(() => {
    return validations.filter(v => {
      const matchesSearch = 
        v.user_email?.toLowerCase().includes(search.toLowerCase()) ||
        v.id?.toLowerCase().includes(search.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
      const matchesVerdict = verdictFilter === 'all' || v.verdict === verdictFilter;
      
      return matchesSearch && matchesStatus && matchesVerdict;
    });
  }, [validations, search, statusFilter, verdictFilter]);

  const getStatusBadge = (v) => {
    switch (v.status) {
      case 'completed':
        return (
          <div className="flex items-center gap-2 text-emerald-500 text-[9px] font-black uppercase tracking-widest bg-emerald-500/5 px-4 py-1.5 rounded-full border border-emerald-500/10">
            <CheckCircle2 size={12} strokeWidth={3} /> {v.verdict || 'COMPLETED'}
          </div>
        );
      case 'processing':
      case 'submitted':
        return (
          <div className="flex items-center gap-2 text-ls-compliment text-[9px] font-black uppercase tracking-widest bg-ls-compliment/5 px-4 py-1.5 rounded-full border border-ls-compliment/10">
            <Clock size={12} strokeWidth={3} className="animate-pulse" /> ANALYZING
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 text-text-muted/40 text-[9px] font-black uppercase tracking-widest bg-foreground/5 px-4 py-1.5 rounded-full border border-border-theme">
            {v.status.toUpperCase()}
          </div>
        );
    }
  };

  if (isLoading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-6 theme-transition">
      <Loader2 className="w-10 h-10 text-ls-compliment animate-spin" />
      <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Scanning Validation Ledger...</p>
    </div>
  );

  return (
    <div className="space-y-12 theme-transition animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-ls-compliment/10 flex items-center justify-center text-ls-compliment shadow-inner">
            <FileSearch size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">Validator Oversight</h1>
            <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mt-2">Institutional Idea Audit & Strategic Sentiment Monitoring</p>
          </div>
        </div>
      </div>

      {/* Filters Ledger */}
      <div className="bg-card border border-border-theme rounded-[2.5rem] p-8 flex flex-col xl:flex-row gap-6 shadow-2xl theme-transition relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-ls-compliment/5 blur-[60px] rounded-full -mr-16 -mt-16 pointer-events-none" />
        
        <div className="relative flex-1 group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-text-muted/20 group-focus-within:text-ls-compliment transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search by user email or validation ID..."
            className="w-full bg-foreground/[0.03] border border-border-theme rounded-2xl pl-16 pr-6 py-4 text-sm text-foreground outline-none focus:border-ls-compliment/40 transition-all font-medium placeholder:text-text-muted/20 shadow-inner"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-foreground/5 flex items-center justify-center text-text-muted/40 shadow-inner">
              <Filter size={20} />
            </div>
            <select 
              className="bg-foreground/[0.03] border border-border-theme rounded-2xl px-6 py-4 text-[9px] font-black uppercase tracking-widest text-foreground outline-none focus:border-ls-compliment/40 transition-all cursor-pointer shadow-inner appearance-none min-w-[160px]"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="processing">Processing</option>
              <option value="draft">Draft</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <select 
            className="bg-foreground/[0.03] border border-border-theme rounded-2xl px-6 py-4 text-[9px] font-black uppercase tracking-widest text-foreground outline-none focus:border-ls-compliment/40 transition-all cursor-pointer shadow-inner appearance-none min-w-[160px]"
            value={verdictFilter}
            onChange={(e) => setVerdictFilter(e.target.value)}
          >
            <option value="all">All Verdicts</option>
            <option value="VIABLE">Viable</option>
            <option value="PIVOT REQUIRED">Pivot Required</option>
            <option value="DEAD ON ARRIVAL">Dead on Arrival</option>
          </select>
        </div>
      </div>

      {/* Validations Table */}
      <div className="bg-card border border-border-theme rounded-[3rem] overflow-hidden shadow-2xl theme-transition">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-foreground/[0.01] border-b border-border-theme">
                <th className="px-10 py-6 text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em]">Validation Identity</th>
                <th className="px-10 py-6 text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em]">Submission Date</th>
                <th className="px-10 py-6 text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em]">Operational Status</th>
                <th className="px-10 py-6 text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em] text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-theme/50">
              {filteredValidations.map(v => (
                <tr key={v.id} className="hover:bg-foreground/[0.01] transition-all group">
                  <td className="px-10 py-7">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-ls-compliment/10 flex items-center justify-center text-ls-compliment shadow-inner group-hover:scale-110 transition-transform">
                        <User size={24} />
                      </div>
                      <div>
                        <p className="text-foreground font-black text-sm uppercase tracking-tight group-hover:text-ls-compliment transition-colors leading-tight">
                           {v.user_name || v.user_email}
                        </p>
                        <p className="text-text-muted/40 text-[9px] font-black uppercase tracking-[0.2em] mt-1 font-mono">ID: {v.id.slice(0, 8)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-7">
                    <div className="flex items-center gap-3 text-text-muted/40 text-[10px] font-black uppercase tracking-widest font-mono">
                      <Calendar size={14} />
                      {new Date(v.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-10 py-7">
                    {getStatusBadge(v)}
                  </td>
                  <td className="px-10 py-7 text-right">
                    <Link 
                      href={`/superadmin/validations/${v.id}`}
                      className="inline-flex items-center gap-2 p-3 bg-foreground/5 text-text-muted/20 hover:text-ls-compliment hover:bg-ls-compliment/10 rounded-xl transition-all shadow-sm active:scale-95 border border-border-theme/50"
                    >
                      <ArrowUpRight size={18} />
                      <span className="text-[9px] font-black uppercase tracking-widest pr-2">Inspect</span>
                    </Link>
                  </td>
                </tr>
              ))}
              {filteredValidations.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-10 py-32 text-center">
                    <div className="w-20 h-20 bg-foreground/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-border-theme shadow-inner opacity-20">
                      <FileSearch size={40} />
                    </div>
                    <p className="text-text-muted/20 text-[10px] font-black uppercase tracking-[0.3em] italic">No validations match the active audit parameters</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
