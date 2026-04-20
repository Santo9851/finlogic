'use client'

/**
 * (gp)/deals/new/page.jsx
 * Manual deal creation form for GP staff.
 */
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, ChevronLeft } from 'lucide-react';
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

const inputCls = "w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-[#F59F01]/40 transition-all";

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
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/gp/deals" className="flex items-center gap-1.5 text-white/40 hover:text-white text-sm">
        <ChevronLeft size={16} /> Back to Pipeline
      </Link>

      <div className="rounded-xl border border-white/10 bg-white/5 p-8">
        <h1 className="text-2xl font-bold text-white mb-6">Create New Deal</h1>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/60">Target Fund</label>
            <select {...register('fund')} className={inputCls}>
              <option value="" className="bg-[#08001a]">Select Fund...</option>
              {funds.map(f => <option key={f.id} value={f.id} className="bg-[#08001a]">{f.name}</option>)}
            </select>
            {errors.fund && <p className="text-xs text-red-400">{errors.fund.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/60">Company Legal Name</label>
            <input {...register('legal_name')} className={inputCls} placeholder="e.g. Kathmandu Tech Ltd." />
            {errors.legal_name && <p className="text-xs text-red-400">{errors.legal_name.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/60">OCR Number</label>
            <input {...register('ocr_registration_number')} className={inputCls} placeholder="e.g. 98765/080/081" />
            {errors.ocr_registration_number && <p className="text-xs text-red-400">{errors.ocr_registration_number.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/60">Deal Type</label>
              <select {...register('deal_type')} className={inputCls}>
                <option value="GROWTH" className="bg-[#08001a]">Growth Capital</option>
                <option value="BUYOUT" className="bg-[#08001a]">Buyout</option>
                <option value="RECAP" className="bg-[#08001a]">Recapitalization</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/60">Sector</label>
              <input {...register('sector')} className={inputCls} placeholder="e.g. IT" />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#F59F01] text-black font-bold py-3 rounded-lg hover:bg-[#F59F01]/90 transition-all disabled:opacity-50"
          >
            {submitting ? 'Creating...' : 'Create Deal'}
          </button>
        </form>
      </div>
    </div>
  );
}
