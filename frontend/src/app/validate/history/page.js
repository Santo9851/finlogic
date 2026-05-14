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
        setError("Failed to load history.");
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
          <div className="flex items-center space-x-1.5 text-green-500 bg-green-500/10 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-green-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{session.verdict || 'COMPLETED'}</span>
          </div>
        );
      case 'processing':
      case 'submitted':
        return (
          <div className="flex items-center space-x-1.5 text-ls-compliment bg-ls-compliment/10 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-ls-compliment/20">
            <Clock className="w-3.5 h-3.5 animate-pulse" />
            <span>Analyzing...</span>
          </div>
        );
      case 'draft':
        return (
          <div className="flex items-center space-x-1.5 text-text-muted bg-background px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-border-theme">
            <FileText className="w-3.5 h-3.5" />
            <span>Draft (Step {session.current_step})</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center space-x-1.5 text-ls-secondary bg-ls-secondary/10 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-ls-secondary/20">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Failed</span>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-ls-compliment/20 border-t-ls-compliment animate-spin"></div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background text-foreground theme-transition pb-40">
        {/* Header */}
        <div className="bg-background/80 backdrop-blur-xl border-b border-border-theme sticky top-0 z-50">
          <div className="container mx-auto px-4 py-6">
            <Link 
              href="/validate"
              className="flex items-center space-x-2 text-text-muted hover:text-ls-compliment transition-colors group mb-4"
            >
              <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
              <span className="font-bold uppercase tracking-widest text-xs">Back to Validator</span>
            </Link>
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-2xl bg-ls-compliment/10 text-ls-compliment">
                <History className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-black">Validation History</h1>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto space-y-6">
            {sessions.length === 0 ? (
              <div className="rounded-[3rem] bg-card border border-border-theme p-20 text-center space-y-6">
                <Search className="w-16 h-16 text-text-muted mx-auto opacity-20" />
                <h2 className="text-2xl font-bold">No analyses found</h2>
                <p className="text-text-muted">Start your first business idea validation today.</p>
                <Link 
                  href="/validate"
                  className="inline-block bg-ls-compliment text-ls-primary px-8 py-4 rounded-full font-bold hover:scale-105 transition-all"
                >
                  Start New Validation
                </Link>
              </div>
            ) : (
              sessions.map((session, index) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link 
                    href={session.status === 'completed' ? `/validate/report/${session.id}` : '/validate'}
                    className="block group"
                  >
                    <div className="bg-card border border-border-theme p-6 md:p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 hover:border-ls-compliment transition-all hover:shadow-xl">
                      <div className="flex items-center space-x-6 w-full md:w-auto">
                        <div className="h-14 w-14 rounded-2xl bg-ls-compliment/5 flex items-center justify-center text-ls-compliment group-hover:bg-ls-compliment/10 transition-colors">
                          <FileText className="w-7 h-7" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-xl font-bold group-hover:text-ls-compliment transition-colors">
                            Analysis #{session.id.slice(0, 8)}
                          </h3>
                          <p className="text-sm text-text-muted">
                            {new Date(session.created_at).toLocaleDateString('en-US', { 
                              month: 'long', 
                              day: 'numeric', 
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end w-full md:w-auto space-x-6">
                        {getStatusBadge(session)}
                        <div className="p-2 rounded-full border border-border-theme text-text-muted group-hover:text-ls-compliment group-hover:border-ls-compliment transition-all">
                          <ArrowUpRight className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
