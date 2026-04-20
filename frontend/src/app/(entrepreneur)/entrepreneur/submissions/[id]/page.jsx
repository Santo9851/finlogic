'use client'

/**
 * (entrepreneur)/submissions/[id]/page.jsx – Entrepreneur detail view
 */
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, FileText, CheckCircle2, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { StatusBadge } from '@/components/portal/PortalShell';
import api from '@/services/api';
import { toast } from 'sonner';

export default function EntrepreneurSubmissionDetailPage() {
  const { id } = useParams();
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/entrepreneur/submissions/${id}/`)
      .then((r) => setDeal(r.data))
      .catch(() => toast.error('Could not load submission details.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-center py-16 text-white/30">Loading details…</div>;
  if (!deal) return <div className="text-center py-16 text-red-400">Submission not found.</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link href="/entrepreneur/dashboard" className="flex items-center gap-1.5 text-white/40 hover:text-white text-sm transition-colors">
        <ChevronLeft size={16} /> Back to Dashboard
      </Link>

      <div className="rounded-xl border border-white/10 bg-white/5 p-6 md:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-white">{deal.legal_name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-white/40">
              <StatusBadge status={deal.status} />
              <span>{deal.sector}</span>
              <span>•</span>
              <span>{deal.deal_type_display}</span>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2 text-right">
            <p className="text-xs text-white/30 uppercase tracking-widest">Current Status</p>
            <p className="text-[#F59F01] font-semibold">{deal.status_display}</p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 py-8 border-y border-white/8">
          <div className="space-y-1">
            <p className="text-xs text-white/30 uppercase tracking-widest">Target Fund</p>
            <p className="text-white font-medium">{deal.fund_detail?.name ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-white/30 uppercase tracking-widest">Submitted Date</p>
            <p className="text-white font-medium">
              {deal.submitted_at ? new Date(deal.submitted_at).toLocaleDateString() : 'Draft'}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-white/30 uppercase tracking-widest">Progress</p>
            <p className="text-white font-medium">Step {deal.form_step_completed} of 5</p>
          </div>
        </div>

        {/* Content Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <section>
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FileText size={18} className="text-[#F59F01]" /> Form Responses
              </h2>
              <div className="space-y-4">
                {deal.form_responses?.map((resp) => (
                  <details key={resp.id} className="group rounded-lg border border-white/10 bg-white/2">
                    <summary className="p-4 cursor-pointer flex items-center justify-between text-sm text-white/70 hover:text-white transition-colors">
                      <span className="font-medium">Step {resp.step_index}: {resp.step_name.replace('_', ' ').toUpperCase()}</span>
                      <ChevronLeft size={16} className="group-open:-rotate-90 transition-transform" />
                    </summary>
                    <div className="p-4 pt-0 border-t border-white/5">
                      <pre className="text-xs text-white/50 bg-black/40 p-4 rounded-md overflow-x-auto">
                        {JSON.stringify(resp.response_data, null, 2)}
                      </pre>
                    </div>
                  </details>
                ))}
                {(!deal.form_responses || deal.form_responses.length === 0) && (
                  <p className="text-white/20 text-sm italic">No form steps completed yet.</p>
                )}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-white/10 bg-[#F59F01]/5 p-6 space-y-4">
              <h3 className="text-sm font-semibold text-white uppercase tracking-widest">Next Steps</h3>
              <p className="text-sm text-white/60 leading-relaxed">
                {deal.status === 'SUBMITTED' ? (
                  "Your submission is being reviewed by our GP staff. We will notify you once the screening is complete."
                ) : deal.status === 'SCREENING' ? (
                  "We are currently screening your proposal. Expect a response within 5-10 business days."
                ) : (
                  "Follow the dashboard for updates on your application status."
                )}
              </p>
              {deal.form_step_completed < 5 && (
                <Link
                  href={`/invite/${deal.invitation_token}`}
                  className="block w-full text-center bg-[#F59F01] text-black text-sm font-bold py-3 rounded-lg hover:bg-[#F59F01]/90 transition-colors"
                >
                  Continue Form
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
