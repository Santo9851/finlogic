'use client'

/**
 * (gp-investor)/dashboard/page.jsx
 * Dashboard for GP Investors (shareholders in the management company).
 */
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart3, 
  Users, 
  Calendar, 
  FileCheck, 
  ShieldCheck, 
  Gavel,
  ArrowUpRight,
  Loader2,
  ExternalLink,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import api from '@/services/api';
import { MetricCard } from '@/components/portal/PortalShell';
import Link from 'next/link';

export default function GPInvestorDashboard() {
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['gp-investor', 'dashboard'],
    queryFn: async () => {
      const res = await api.get('/deals/gp-investor/dashboard/');
      return res.data;
    }
  });

  if (isLoading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-12 theme-transition">
      <Loader2 className="w-12 h-12 text-ls-compliment animate-spin opacity-40" />
      <p className="text-text-muted text-[10px] font-bold uppercase tracking-[0.4em] animate-pulse">Syncing Shareholder Ledger...</p>
    </div>
  );

  return (
    <div className="space-y-20 animate-in fade-in duration-1000 pb-32 max-w-7xl mx-auto">
      {/* Header - Institutional Shareholder Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 border-b border-border-theme pb-12">
        <div className="space-y-6">
          <div className="flex items-center gap-4 text-ls-compliment text-[10px] font-bold uppercase tracking-[0.5em]">
            <ShieldCheck size={14} /> Strategic Shareholder Registry
          </div>
          <h1 className="text-5xl md:text-7xl font-serif font-light text-foreground tracking-tight leading-tight">
            Shareholder <span className="italic">Dossier</span>
          </h1>
          <p className="text-xl text-text-muted font-serif font-light italic max-w-xl">
            A comprehensive overview of management company equity, dividend distribution sequence, and institutional fund performance.
          </p>
        </div>
        <div className="flex items-center gap-6 px-10 py-5 bg-border-theme/20 border border-border-theme shadow-sm">
           <div className="space-y-1 text-right">
             <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.3em]">Entity Identifier</p>
             <p className="text-[9px] text-text-muted/40 font-bold uppercase tracking-widest font-mono">GP-MGMT-2075-SHARES</p>
          </div>
        </div>
      </div>

      {/* Shareholding Summary Ledger */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-border-theme border border-border-theme shadow-2xl">
        <MetricCard 
          label="Shares Held" 
          value={dashboard?.shareholder?.shares_held?.toLocaleString() || '0'} 
          icon={Users} 
          color="#F59F01" 
        />
        <MetricCard 
          label="Ownership Protocol" 
          value={`${dashboard?.shareholder?.ownership_percentage || '0'}%`} 
          icon={ShieldCheck} 
          color="#0B6EC3" 
        />
        <MetricCard 
          label="Dividends Realized" 
          value={`रू ${((dashboard?.shareholder?.total_dividends_npr || 0) / 1e5).toFixed(1)}L`} 
          icon={ArrowUpRight} 
          color="#16c784" 
        />
        <MetricCard 
          label="Institutional AUM" 
          value={`रू ${((dashboard?.total_committed_npr || 0) / 1e7).toFixed(1)}Cr`} 
          icon={BarChart3} 
          color="#8b5cf6" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
        <div className="lg:col-span-2 space-y-16">
          {/* Fund Performance Ledger */}
          <div className="bg-card border border-border-theme shadow-2xl theme-transition overflow-hidden">
            <div className="px-12 py-10 border-b border-border-theme flex items-center justify-between bg-border-theme/10">
              <h3 className="text-[10px] font-bold text-text-muted flex items-center gap-4 uppercase tracking-[0.5em]">
                <BarChart3 size={16} className="text-ls-compliment" /> Fund Performance Registry
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-border-theme/5 border-b border-border-theme">
                    <th className="px-12 py-8 text-[10px] font-bold text-text-muted uppercase tracking-[0.5em]">Fund Entity</th>
                    <th className="px-12 py-8 text-[10px] font-bold text-text-muted uppercase tracking-[0.5em]">Vintage</th>
                    <th className="px-12 py-8 text-[10px] font-bold text-text-muted uppercase tracking-[0.5em]">Status</th>
                    <th className="px-12 py-8 text-[10px] font-bold text-text-muted uppercase tracking-[0.5em] text-right">NAV MOIC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-theme">
                  {dashboard?.funds?.map((fund) => (
                    <tr key={fund.id} className="hover:bg-ls-primary group transition-all duration-500 cursor-pointer">
                      <td className="px-12 py-10">
                        <span className="text-xl font-serif font-light text-foreground group-hover:text-ls-white transition-all uppercase tracking-tight">
                          {fund.name}
                        </span>
                      </td>
                      <td className="px-12 py-10">
                        <span className="text-base font-serif italic text-text-muted group-hover:text-ls-white/60 transition-all">{fund.vintage_year}</span>
                      </td>
                      <td className="px-12 py-10">
                        <span className="text-[9px] border border-border-theme group-hover:border-ls-white/20 px-4 py-1.5 text-text-muted group-hover:text-ls-white/40 uppercase font-bold tracking-[0.3em]">
                          {fund.status}
                        </span>
                      </td>
                      <td className="px-12 py-10 text-right">
                        <span className="text-2xl font-serif font-light text-ls-up group-hover:text-ls-compliment transition-all tabular-nums">1.25x</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Dividend Sequence */}
          <div className="bg-card border border-border-theme shadow-2xl theme-transition overflow-hidden">
            <div className="px-12 py-10 border-b border-border-theme bg-border-theme/10">
              <h3 className="text-[10px] font-bold text-text-muted flex items-center gap-4 uppercase tracking-[0.5em]">
                <TrendingUp size={16} className="text-ls-up" /> Dividend Ingestion Sequence
              </h3>
            </div>
            <div className="divide-y divide-border-theme">
              {dashboard?.shareholder?.dividend_history?.length > 0 ? (
                dashboard?.shareholder?.dividend_history.map((div, i) => (
                  <div key={i} className="p-10 flex items-center justify-between hover:bg-ls-primary group transition-all duration-500 cursor-default">
                    <div className="space-y-3">
                      <p className="text-2xl font-serif font-light text-foreground group-hover:text-ls-white transition-all tabular-nums">रू {div.amount_npr.toLocaleString()}</p>
                      <p className="text-[9px] text-text-muted group-hover:text-ls-white/40 uppercase tracking-[0.4em] font-bold font-mono">FY {div.fiscal_year} • {div.payment_date}</p>
                    </div>
                    <span className="text-[9px] font-bold px-6 py-2 border border-ls-up/20 bg-ls-up/5 text-ls-up group-hover:bg-ls-white group-hover:text-ls-primary group-hover:border-ls-white transition-all uppercase tracking-widest">
                      {div.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-20 text-center text-text-muted/20 font-serif italic text-lg">No dividend distributions recorded in sequence.</div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - Governance & Data */}
        <div className="space-y-12">
          <div className="bg-card border border-border-theme p-10 shadow-2xl relative group overflow-hidden theme-transition">
            <div className="absolute top-0 right-0 w-24 h-24 bg-ls-compliment/5 blur-[50px] rounded-full -mr-12 -mt-12 pointer-events-none" />
            <h3 className="text-[10px] font-bold text-text-muted/40 uppercase tracking-[0.5em] mb-10 flex items-center gap-4">
              <FileCheck size={16} className="text-ls-compliment" /> Shareholder Archival Vault
            </h3>
            
            <div className="space-y-6">
              {dashboard?.internal_documents?.length > 0 ? (
                dashboard.internal_documents.map((doc) => (
                  <div key={doc.id} className="p-6 border border-border-theme hover:border-ls-compliment/30 bg-foreground/[0.01] hover:bg-ls-primary group cursor-pointer transition-all duration-500">
                    <div className="space-y-3">
                      <p className="text-lg font-serif font-light text-foreground group-hover:text-ls-white transition-all uppercase tracking-tight truncate leading-none">{doc.title}</p>
                      <p className="text-[9px] text-text-muted group-hover:text-ls-white/40 font-bold uppercase tracking-[0.3em] font-mono">{doc.document_type.replace('_', ' ')}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[10px] text-text-muted/40 uppercase tracking-widest text-center py-10 italic">Archival vault empty</p>
              )}
            </div>
          </div>

          <div className="bg-ls-primary text-ls-white p-10 shadow-2xl relative overflow-hidden group">
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-ls-compliment/10 blur-[60px] rounded-full -mr-16 -mb-16 pointer-events-none" />
            <h4 className="text-ls-compliment font-bold text-[10px] uppercase tracking-[0.5em] mb-6 flex items-center gap-4">
              <Gavel size={14} className="text-ls-compliment" /> Governance Protocol
            </h4>
            <p className="text-base font-serif italic text-ls-white/60 leading-relaxed mb-10">
              Access the electronic voting sequence for strategic management company decisions and governance mandates.
            </p>
            <Link 
              href="/gp-investor/governance"
              className="w-full py-5 bg-ls-compliment text-ls-primary text-[10px] font-bold uppercase tracking-[0.5em] hover:bg-ls-white transition-all shadow-xl block text-center"
            >
              Open Governance Gateway
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
