'use client'

/**
 * (gp)/deals/invite/page.jsx
 * GP form to invite an entrepreneur to submit a deal.
 */
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Send, ChevronLeft, Building2, Mail, Hash, Briefcase, Globe } from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';

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

function Field({ label, error, children, required, icon: Icon }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] text-text-muted font-black uppercase tracking-[0.2em] ml-1">
        {label}{required && <span className="text-ls-compliment ml-0.5">*</span>}
      </label>
      <div className="relative">
        {Icon && <Icon size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/30" />}
        {children}
      </div>
      {error && <p className="text-[10px] text-rose-500 font-bold ml-1">{error}</p>}
    </div>
  );
}

export default function GPInvitePage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
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

  const inputCls = `w-full bg-foreground/[0.03] border border-border-theme rounded-xl ${errors ? 'px-4' : 'pl-11 pr-4'} py-3.5 text-foreground text-sm placeholder:text-text-muted/20 outline-none focus:border-ls-compliment/40 transition-all shadow-inner font-medium`;
  const iconInputCls = `w-full bg-foreground/[0.03] border border-border-theme rounded-xl pl-11 pr-4 py-3.5 text-foreground text-sm placeholder:text-text-muted/20 outline-none focus:border-ls-compliment/40 transition-all shadow-inner font-medium`;

  return (
    <div className="max-w-3xl mx-auto space-y-8 theme-transition animate-in fade-in duration-700">
      {/* Back */}
      <Link href="/gp/deals" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-foreground transition-all">
        <ChevronLeft size={16} /> Back to Pipeline
      </Link>

      {/* Card */}
      <div className="rounded-[2.5rem] border border-border-theme bg-card p-10 space-y-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-ls-compliment/5 blur-[60px] rounded-full -mr-16 -mt-16 pointer-events-none" />
        
        <div className="relative z-10">
          <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">Sourcing Invitation</h1>
          <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mt-1">
            Initiate Deal Intelligence & Secure Submission Protocol
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 relative z-10">
          {/* Fund */}
          <Field label="Target Fund Vehicle" error={errors.fund_id?.message} required icon={Briefcase}>
            <select {...register('fund_id')} className={iconInputCls} defaultValue="">
              <option value="" disabled className="bg-background">Select fund vehicle…</option>
              {funds.map((f) => (
                <option key={f.id} value={f.id} className="bg-background">
                  {f.name} ({f.vintage_year})
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Company */}
            <Field label="Institutional Legal Name" error={errors.legal_name?.message} required icon={Building2}>
              <input
                {...register('legal_name')}
                placeholder="Himalayan Hydro Pvt. Ltd."
                className={iconInputCls}
              />
            </Field>

            {/* OCR */}
            <Field label="Registry (OCR) Number" error={errors.ocr_registration_number?.message} required icon={Hash}>
              <input
                {...register('ocr_registration_number')}
                placeholder="12345/67/68"
                className={iconInputCls}
              />
            </Field>
          </div>

          {/* Email */}
          <Field label="Entrepreneur Identity (Email)" error={errors.entrepreneur_email?.message} required icon={Mail}>
            <input
              {...register('entrepreneur_email')}
              type="email"
              placeholder="principal@institution.com"
              className={iconInputCls}
            />
          </Field>

          {/* Deal type + Sector */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Field label="Transaction Archetype" error={errors.deal_type?.message} required icon={Globe}>
              <select {...register('deal_type')} className={iconInputCls}>
                {DEAL_TYPES.map((t) => (
                  <option key={t.value} value={t.value} className="bg-background">{t.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Economic Sector" error={errors.sector?.message} icon={Briefcase}>
              <select {...register('sector')} className={iconInputCls}>
                <option value="" className="bg-background">Cross-Sector / TBD</option>
                {SECTORS.map((s) => (
                  <option key={s} value={s} className="bg-background">{s}</option>
                ))}
              </select>
            </Field>
          </div>

          {/* Investment Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Field label="Min. Commitment (NPR)" error={errors.investment_range_min_npr?.message} icon={Globe}>
              <input
                {...register('investment_range_min_npr')}
                type="number"
                placeholder="10,000,000"
                className={iconInputCls}
              />
            </Field>
            <Field label="Max. Commitment (NPR)" error={errors.investment_range_max_npr?.message} icon={Globe}>
              <input
                {...register('investment_range_max_npr')}
                type="number"
                placeholder="50,000,000"
                className={iconInputCls}
              />
            </Field>
          </div>

          {/* Info box */}
          <div className={`rounded-2xl ${isDark ? 'bg-ls-compliment/5 border-ls-compliment/20' : 'bg-ls-secondary/5 border-ls-secondary/20'} border p-6 text-[11px] font-medium leading-relaxed italic text-text-muted/80 shadow-inner`}>
            Protocol Note: An invitation with a secure, time-limited cryptographic link will be dispatched. 
            The counterparty can execute the 5-step intelligence disclosure without direct account initialization.
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className={`w-full flex items-center justify-center gap-3 ${isDark ? 'bg-ls-compliment' : 'bg-ls-secondary'} text-white font-black py-4 rounded-2xl shadow-xl hover:scale-[1.01] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-[0.3em] text-[10px]`}
          >
            <Send size={16} />
            {submitting ? 'Executing Protocol…' : 'Send Institutional Invitation'}
          </button>
        </form>
      </div>
    </div>
  );
}
