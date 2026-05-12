'use client'

/**
 * (gp)/deals/new/page.jsx
 * Manual deal creation form for GP staff.
 */
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, ChevronLeft, Building2 } from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const schema = z.object({
  fund: z.string().min(1, 'Select a fund'),
  legal_name: z.string().min(2, 'Company legal name is required'),
  ocr_registration_number: z.string().min(4, 'OCR number is required'),
  deal_type: z.enum(['GROWTH', 'BUYOUT', 'RECAP']),
  status: z.string().default('SCREENING'),
  sector: z.string().min(1, 'Sector is required'),
});

const inputCls = "w-full bg-foreground/[0.03] border border-border-theme rounded-xl px-4 py-3 text-foreground text-sm outline-none focus:border-[#F59F01]/40 transition-all font-medium shadow-inner placeholder:text-text-muted/20";

export default function GPNewDealPage() {
  const [funds, setFunds] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { status: 'SCREENING', deal_type: 'GROWTH' }
  });

  useEffect(() => {
    api.get('/deals/funds/').then(r => setFunds(r.data?.results ?? r.data ?? []));
  }, []);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const res = await api.post('/deals/projects/', data);
      toast.success('Deal created successfully');
      router.push(`/gp/deals/${res.data.id}`);
    } catch (err) {
      toast.error('Failed to create deal.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 theme-transition animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link href="/gp/deals" className="flex items-center gap-2 text-text-muted hover:text-foreground text-xs font-black uppercase tracking-widest transition-colors">
        <ChevronLeft size={16} /> Back to Pipeline
      </Link>

      <div className="rounded-[2.5rem] border border-border-theme bg-card p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#F59F01]/5 blur-[60px] rounded-full -mr-16 -mt-16 pointer-events-none" />
        
        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 rounded-xl bg-foreground/5 flex items-center justify-center text-[#F59F01] border border-border-theme shadow-inner">
            <Plus size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-foreground uppercase tracking-tight">Initialize Deal</h1>
            <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] opacity-40">GP Internal Sourcing Workflow</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] ml-1">Strategic Fund Allocation</label>
            <select {...register('fund')} className={inputCls}>
              <option value="" className="bg-background">Select Targeted Fund...</option>
              {funds.map(f => <option key={f.id} value={f.id} className="bg-background">{f.name}</option>)}
            </select>
            {errors.fund && <p className="text-[10px] font-bold text-red-500 uppercase tracking-wide ml-1">{errors.fund.message}</p>}
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] ml-1">Entity Legal Identification</label>
            <input {...register('legal_name')} className={inputCls} placeholder="e.g. Kathmandu Tech Ltd." />
            {errors.legal_name && <p className="text-[10px] font-bold text-red-500 uppercase tracking-wide ml-1">{errors.legal_name.message}</p>}
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] ml-1">OCR Registration Index</label>
            <input {...register('ocr_registration_number')} className={inputCls} placeholder="e.g. 98765/080/081" />
            {errors.ocr_registration_number && <p className="text-[10px] font-bold text-red-500 uppercase tracking-wide ml-1">{errors.ocr_registration_number.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] ml-1">Deal Thesis</label>
              <select {...register('deal_type')} className={inputCls}>
                <option value="GROWTH" className="bg-background">Growth Capital</option>
                <option value="BUYOUT" className="bg-background">Institutional Buyout</option>
                <option value="RECAP" className="bg-background">Recapitalization</option>
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] ml-1">Industry Vertical</label>
              <input {...register('sector')} className={inputCls} placeholder="e.g. IT, Energy, FMCG" />
            </div>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#F59F01] text-ls-primary-fixed text-[10px] font-black uppercase tracking-[0.3em] py-5 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-2xl shadow-[#F59F01]/20"
            >
              {submitting ? 'Creating Pipeline Entry...' : 'Finalize & Create Deal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
