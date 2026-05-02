'use client'

/**
 * (entrepreneur)/dashboard/page.jsx – Entrepreneur submission list
 */
import { useEffect, useState } from 'react';
import { Rocket, Clock, CheckCircle2, Eye, FileUp } from 'lucide-react';
import { StatusBadge } from '@/components/portal/PortalShell';
import api from '@/services/api';
import { toast } from 'sonner';
import Link from 'next/link';

export default function EntrepreneurDashboardPage() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/entrepreneur/submissions/')
      .then((r) => setSubmissions(r.data?.results ?? r.data ?? []))
      .catch(() => toast.error('Could not load your submissions.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-16 text-white/30">Loading your submissions…</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Submissions</h1>
          <p className="text-white/40 text-sm mt-1">Track the status of your funding applications</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {submissions.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center">
            <Rocket size={48} className="mx-auto mb-4 text-white/10" />
            <p className="text-white font-medium">No active submissions</p>
            <p className="text-white/30 text-sm mt-1">You haven't submitted any deals yet.</p>
          </div>
        ) : (
          submissions.map((sub) => (
            <div key={sub.id} className="rounded-xl border border-white/10 bg-white/5 p-5 hover:border-white/20 transition-all group">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-white group-hover:text-[#F59F01] transition-colors">
                      {sub.legal_name}
                    </h3>
                    <StatusBadge status={sub.status} />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-white/40">
                    <span className="flex items-center gap-1.5"><Rocket size={14} /> {sub.deal_type_display}</span>
                    <span className="flex items-center gap-1.5"><Clock size={14} /> Submitted {sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString() : 'N/A'}</span>
                    <span className="flex items-center gap-1.5"><CheckCircle2 size={14} /> Step {sub.form_step_completed}/{sub.active_template?.steps?.length || 6}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Link
                    href={`/entrepreneur/submissions/${sub.id}`}
                    className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm px-4 py-2 rounded-lg transition-colors"
                  >
                    <Eye size={16} /> View Details
                  </Link>
                  {(!sub.submitted_at && sub.form_step_completed < 5) && (
                    <Link
                      href={sub.invitation_token ? `/invite/${sub.invitation_token}` : `/entrepreneur/submissions/${sub.id}/apply`}
                      className="flex items-center gap-2 bg-[#F59F01] hover:bg-[#F59F01]/90 text-black text-sm px-4 py-2 rounded-lg font-semibold transition-colors"
                    >
                      <FileUp size={16} /> Complete Form
                    </Link>
                  )}
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="mt-6 h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div 
                  className="h-full bg-[#F59F01] transition-all duration-1000"
                  style={{ width: `${Math.min((sub.form_step_completed / (sub.active_template?.steps?.length || 6)) * 100, 100)}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
