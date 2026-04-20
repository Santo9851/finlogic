'use client'

/**
 * (gp)/deals/invite/page.jsx
 * GP form to invite an entrepreneur to submit a deal.
 */
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Send, ChevronLeft } from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const schema = z.object({
  fund_id: z.string().min(1, 'Select a fund'),
  legal_name: z.string().min(2, 'Company legal name is required'),
  ocr_registration_number: z.string().min(4, 'OCR number is required'),
  entrepreneur_email: z.string().email('Valid email required'),
  deal_type: z.enum(['GROWTH', 'BUYOUT', 'RECAP']),
  sector: z.string().optional(),
  investment_range_min_npr: z.coerce.number().positive().optional(),
  investment_range_max_npr: z.coerce.number().positive().optional(),
});

const DEAL_TYPES = [
  { value: 'GROWTH', label: 'Growth Capital' },
  { value: 'BUYOUT', label: 'Buyout' },
  { value: 'RECAP', label: 'Recapitalisation' },
];

const SECTORS = [
  'Hydropower', 'Banking', 'Manufacturing', 'Tourism', 'IT',
  'Agriculture', 'Infrastructure', 'Health', 'Education', 'Retail', 'Other',
];

function Field({ label, error, children, required }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm text-white/60 font-medium">
        {label}{required && <span className="text-[#F59F01] ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

const inputCls =
  'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-white/20 outline-none focus:border-[#F59F01]/50 focus:ring-1 focus:ring-[#F59F01]/20 transition-all';

export default function GPInvitePage() {
  const [funds, setFunds] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { deal_type: 'GROWTH' } });

  useEffect(() => {
    api.get('/deals/funds/').then((r) => {
      setFunds(r.data?.results ?? r.data ?? []);
    }).catch(() => toast.error('Could not load funds.'));
  }, []);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const res = await api.post('/deals/projects/invite/', data);
      toast.success(`Invitation sent to ${data.entrepreneur_email}`);
      router.push(`/gp/deals/${res.data.id}`);
    } catch (e) {
      const msg = e.response?.data?.detail
        ?? Object.values(e.response?.data ?? {}).flat().join(', ')
        ?? 'Failed to send invitation.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back */}
      <Link href="/gp/deals" className="flex items-center gap-1.5 text-white/40 hover:text-white text-sm transition-colors">
        <ChevronLeft size={16} /> Back to Pipeline
      </Link>

      {/* Card */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-white">Invite Entrepreneur</h1>
          <p className="text-white/40 text-sm mt-1">
            Create a deal and send an invitation email with a secure form link.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Fund */}
          <Field label="Fund" error={errors.fund_id?.message} required>
            <select {...register('fund_id')} className={inputCls} defaultValue="">
              <option value="" disabled className="bg-[#08001a]">Select a fund…</option>
              {funds.map((f) => (
                <option key={f.id} value={f.id} className="bg-[#08001a]">
                  {f.name} ({f.vintage_year})
                </option>
              ))}
            </select>
          </Field>

          {/* Company */}
          <Field label="Company Legal Name" error={errors.legal_name?.message} required>
            <input
              {...register('legal_name')}
              placeholder="e.g. Himalayan Hydro Pvt. Ltd."
              className={inputCls}
            />
          </Field>

          {/* OCR */}
          <Field label="OCR Registration Number" error={errors.ocr_registration_number?.message} required>
            <input
              {...register('ocr_registration_number')}
              placeholder="e.g. 12345/67/68"
              className={inputCls}
            />
          </Field>

          {/* Email */}
          <Field label="Entrepreneur Email" error={errors.entrepreneur_email?.message} required>
            <input
              {...register('entrepreneur_email')}
              type="email"
              placeholder="founder@company.com"
              className={inputCls}
            />
          </Field>

          {/* Deal type + Sector */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Deal Type" error={errors.deal_type?.message} required>
              <select {...register('deal_type')} className={inputCls}>
                {DEAL_TYPES.map((t) => (
                  <option key={t.value} value={t.value} className="bg-[#08001a]">{t.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Sector" error={errors.sector?.message}>
              <select {...register('sector')} className={inputCls}>
                <option value="" className="bg-[#08001a]">Any / TBD</option>
                {SECTORS.map((s) => (
                  <option key={s} value={s} className="bg-[#08001a]">{s}</option>
                ))}
              </select>
            </Field>
          </div>

          {/* Investment Range */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Min. Investment (NPR)" error={errors.investment_range_min_npr?.message}>
              <input
                {...register('investment_range_min_npr')}
                type="number"
                placeholder="10,000,000"
                className={inputCls}
              />
            </Field>
            <Field label="Max. Investment (NPR)" error={errors.investment_range_max_npr?.message}>
              <input
                {...register('investment_range_max_npr')}
                type="number"
                placeholder="50,000,000"
                className={inputCls}
              />
            </Field>
          </div>

          {/* Info box */}
          <div className="rounded-lg bg-[#F59F01]/5 border border-[#F59F01]/15 px-4 py-3 text-sm text-[#F59F01]/70">
            An invitation email with a secure 7-day link will be sent to the entrepreneur. They can
            fill in the 5-step form without creating an account.
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-[#F59F01] text-black font-semibold py-3 rounded-lg hover:bg-[#F59F01]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={16} />
            {submitting ? 'Sending…' : 'Send Invitation'}
          </button>
        </form>
      </div>
    </div>
  );
}
