'use client'

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { authService } from '@/services/auth';
import Link from 'next/link';
import { Loader2, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const schema = z.object({
  email: z.string().email('Invalid email address'),
});

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await authService.forgotPassword(data.email);
      setSubmitted(true);
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-abstract-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center gap-2 mb-6">
            <div className="w-10 h-10 bg-[#F59F01] rounded flex items-center justify-center shadow-lg shadow-[#F59F01]/20">
              <span className="text-[#100226] font-bold text-xl">FL</span>
            </div>
            <span className="text-xl font-bold text-white tracking-wide">FINLOGIC</span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Reset Password</h1>
          <p className="text-white/60">
            {submitted ? 'Check your inbox for the reset link.' : "Enter your email and we&apos;ll send a reset link."}
          </p>
        </div>

        <div className="glass-card rounded-2xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#F59F01]/5 rounded-full blur-3xl" />

          {submitted ? (
            <div className="text-center py-4 relative z-10">
              <CheckCircle size={48} className="text-[#F59F01] mx-auto mb-4" />
              <p className="text-white/80 mb-6">If that email is registered, you&apos;ll receive a reset link shortly.</p>
              <Link href="/auth/login" className="inline-flex items-center gap-2 text-[#F59F01] hover:underline font-semibold">
                <ArrowLeft size={16} /> Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 relative z-10">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1.5">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/40"><Mail size={18}/></div>
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="you@example.com"
                    className="block w-full pl-10 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#F59F01]/50 focus:border-[#F59F01] transition-colors"
                  />
                </div>
                {errors.email && <p className="mt-1.5 text-sm text-red-400">{errors.email.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2.5 px-4 rounded-xl text-sm font-semibold text-[#100226] bg-[#F59F01] hover:bg-[#F59F01]/90 hover:shadow-lg hover:shadow-[#F59F01]/20 disabled:opacity-50 transition-all"
              >
                {isLoading ? <><Loader2 className="animate-spin mr-2 h-4 w-4" />Sending...</> : 'Send Reset Link'}
              </button>
              <div className="text-center">
                <Link href="/auth/login" className="inline-flex items-center gap-1 text-sm text-white/60 hover:text-white transition-colors">
                  <ArrowLeft size={14}/> Back to Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
