'use client'

import { useState, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { authService } from '@/services/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Lock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const schema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  password_confirm: z.string(),
}).refine(d => d.password === d.password_confirm, {
  message: "Passwords don't match",
  path: ['password_confirm'],
});

function ResetPasswordContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const uid = searchParams.get('uid');
  const token = searchParams.get('token');

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    if (!uid || !token) { toast.error('Invalid or expired reset link.'); return; }
    setIsLoading(true);
    try {
      await authService.resetPassword({ uid, token, new_password: data.password, new_password_confirm: data.password_confirm });
      setSuccess(true);
      setTimeout(() => router.push('/auth/login'), 3000);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Reset failed. The link may be expired.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = "block w-full pl-10 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#F59F01]/50 focus:border-[#F59F01] transition-colors";

  return (
    <div className="min-h-screen bg-abstract-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-[#F59F01] rounded flex items-center justify-center shadow-lg shadow-[#F59F01]/20">
              <span className="text-[#100226] font-bold text-xl">FL</span>
            </div>
            <span className="text-xl font-bold text-white tracking-wide">FINLOGIC</span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Set New Password</h1>
          <p className="text-white/60">Choose a strong password for your account.</p>
        </div>

        <div className="glass-card rounded-2xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#F59F01]/5 rounded-full blur-3xl" />

          {success ? (
            <div className="text-center py-4 relative z-10">
              <CheckCircle size={48} className="text-[#F59F01] mx-auto mb-4" />
              <p className="text-white font-semibold text-lg mb-2">Password Updated!</p>
              <p className="text-white/60">Redirecting to login...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 relative z-10">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1.5">New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/40"><Lock size={18}/></div>
                  <input {...register('password')} type="password" placeholder="••••••••" className={inputClass} />
                </div>
                {errors.password && <p className="mt-1.5 text-sm text-red-400">{errors.password.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/40"><Lock size={18}/></div>
                  <input {...register('password_confirm')} type="password" placeholder="••••••••" className={inputClass} />
                </div>
                {errors.password_confirm && <p className="mt-1.5 text-sm text-red-400">{errors.password_confirm.message}</p>}
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2.5 px-4 rounded-xl text-sm font-semibold text-[#100226] bg-[#F59F01] hover:bg-[#F59F01]/90 hover:shadow-lg hover:shadow-[#F59F01]/20 disabled:opacity-50 transition-all mt-2"
              >
                {isLoading ? <><Loader2 className="animate-spin mr-2 h-4 w-4" />Saving...</> : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-abstract-gradient flex items-center justify-center p-4">
        <Loader2 className="animate-spin h-10 w-10 text-[#F59F01]" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
