'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, 
  Clock, 
  ChevronRight, 
  FileText, 
  CheckCircle2, 
  AlertTriangle,
  History,
  Search,
  ArrowUpRight
} from 'lucide-react';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';
import { validatorService } from '@/services/validator';

export default function ValidationHistoryPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await validatorService.listSessions();
        // Sort by date desc
        const sorted = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setSessions(sorted);
      } catch (err) {
        setError("Failed to load archival records.");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const getStatusBadge = (session) => {
    switch (session.status) {
      case 'completed':
        return (
          <div className="flex items-center space-x-2 text-emerald-500 bg-emerald-500/5 px-4 py-1.5 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-[0.2em]">
            <CheckCircle2 className="w-3 h-3" />
            <span>{session.verdict || 'COMPLETED'}</span>
          </div>
        );
      case 'processing':
      case 'submitted':
        return (
          <div className="flex items-center space-x-2 text-ls-compliment bg-ls-compliment/5 px-4 py-1.5 border border-ls-compliment/20 text-[10px] font-bold uppercase tracking-[0.2em]">
            <Clock className="w-3 h-3 animate-pulse" />
            <span>Analyzing Ingestion...</span>
          </div>
        );
      case 'draft':
        return (
          <div className="flex items-center space-x-2 text-ls-white/40 bg-ls-white/5 px-4 py-1.5 border border-ls-white/10 text-[10px] font-bold uppercase tracking-[0.2em]">
            <FileText className="w-3 h-3" />
            <span>Draft Record</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center space-x-2 text-ls-secondary bg-ls-secondary/5 px-4 py-1.5 border border-ls-secondary/20 text-[10px] font-bold uppercase tracking-[0.2em]">
            <AlertTriangle className="w-3 h-3" />
            <span>Failed Ingestion</span>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ls-primary flex items-center justify-center">
        <div className="w-12 h-12 border border-ls-compliment/20 border-t-ls-compliment animate-spin"></div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-ls-primary text-ls-white theme-transition pb-40">
        {/* Archival Header */}
        <div className="bg-ls-primary/80 backdrop-blur-xl border-b border-ls-white/5 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-10">
            <Link 
              href="/validate"
              className="flex items-center space-x-3 text-ls-white/40 hover:text-ls-compliment transition-colors group mb-8"
            >
              <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              <span className="font-bold uppercase tracking-[0.3em] text-[10px]">Return to Architect</span>
            </Link>
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-ls-compliment">Sovereign Intelligence</p>
                <h1 className="text-4xl lg:text-6xl font-serif font-light tracking-tight">Archival Registry</h1>
              </div>
              <div className="p-4 border border-ls-compliment/20 text-ls-compliment hidden md:block">
                <History className="w-8 h-8 opacity-50" />
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-16">
          <div className="max-w-5xl mx-auto space-y-4">
            {sessions.length === 0 ? (
              <div className="border border-ls-white/10 p-24 text-center space-y-8 bg-ls-white/[0.02]">
                <Search className="w-16 h-16 text-ls-white/10 mx-auto" />
                <div className="space-y-2">
                  <h2 className="text-2xl font-serif font-light italic">Registry Empty</h2>
                  <p className="text-ls-white/40 text-sm tracking-widest uppercase">No strategic analyses have been ingested into this ledger.</p>
                </div>
                <Link 
                  href="/validate"
                  className="inline-block border border-ls-compliment text-ls-compliment px-10 py-4 font-bold text-xs uppercase tracking-[0.3em] hover:bg-ls-compliment hover:text-ls-primary transition-all"
                >
                  Initiate New Validation
                </Link>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="grid grid-cols-12 gap-4 px-8 py-4 text-[10px] font-bold uppercase tracking-[0.4em] text-ls-white/30 border-b border-ls-white/5">
                  <div className="col-span-6 lg:col-span-7">Dossier Reference</div>
                  <div className="col-span-4 lg:col-span-3">Status</div>
                  <div className="col-span-2 text-right">Access</div>
                </div>
                
                {sessions.map((session, index) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link 
                      href={session.status === 'completed' ? `/validate/report/${session.id}` : '/validate'}
                      className="block group"
                    >
                      <div className="grid grid-cols-12 gap-4 items-center bg-ls-white/[0.02] border border-ls-white/5 p-8 hover:bg-ls-white/[0.05] hover:border-ls-compliment/30 transition-all group-hover:translate-x-1">
                        <div className="col-span-12 md:col-span-6 lg:col-span-7 flex items-center space-x-8">
                          <div className="text-ls-compliment/40 group-hover:text-ls-compliment transition-colors">
                            <FileText className="w-6 h-6" />
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-xl font-serif font-light tracking-wide group-hover:text-ls-white transition-colors">
                              Record #{session.id.slice(0, 8).toUpperCase()}
                            </h3>
                            <p className="text-[10px] font-mono text-ls-white/30 uppercase tracking-[0.2em]">
                              Ingested: {new Date(session.created_at).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="col-span-8 md:col-span-4 lg:col-span-3">
                          {getStatusBadge(session)}
                        </div>

                        <div className="col-span-4 md:col-span-2 text-right">
                          <div className="inline-flex p-3 border border-ls-white/10 text-ls-white/20 group-hover:text-ls-compliment group-hover:border-ls-compliment/50 transition-all">
                            <ArrowUpRight className="w-5 h-5" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
