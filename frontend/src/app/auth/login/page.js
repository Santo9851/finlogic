'use client'

import { useState, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/lib/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

function LoginContent() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const returnUrl = searchParams.get('returnUrl');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    const result = await login(data);
    
    if (result.success) {
      toast.success('Successfully logged in');
      
      // 1. If returnUrl exists (from a protected route), go there first
      if (returnUrl) {
        router.push(returnUrl);
        return;
      }

      // 2. Otherwise, use role-based redirect map
      const roles = result.user.roles || '';
      const roleList = Array.isArray(roles) 
        ? roles 
        : roles.split(',').map(r => r.trim()).filter(Boolean);

      const REDIRECT_MAP = {
        super_admin: '/superadmin/dashboard',
        admin: '/gp/dashboard',
        gp_investor: '/gp-investor/dashboard',
        investor: '/lp/dashboard',
        entrepreneur: '/entrepreneur/dashboard',
      };

      // Priority order for multi-role users
      const priorityOrder = ['super_admin', 'admin', 'gp_investor', 'investor', 'entrepreneur'];
      const targetRole = priorityOrder.find(r => roleList.includes(r));
      
      const destination = REDIRECT_MAP[targetRole] || '/';
      router.push(destination);
    } else {
      toast.error(result.error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-abstract-gradient flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        
        {/* Brand/Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block flex items-center justify-center gap-2 mb-6">
            <div className="w-10 h-10 bg-[#F59F01] rounded flex items-center justify-center shadow-lg shadow-[#F59F01]/20">
              <span className="text-[#100226] font-bold text-xl tracking-tighter">FL</span>
            </div>
            <span className="text-xl font-bold text-white tracking-wide">FINLOGIC</span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-white/60">Log in to your account to continue</p>
        </div>

        {/* Form Card */}
        <div className="glass-card rounded-2xl p-8 relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#F59F01]/10 rounded-full blur-3xl -mx-10 -my-10 border border-[#F59F01]/5" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mx-10 -my-10" />

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 relative z-10">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/40">
                  <Mail size={18} />
                </div>
                <input
                  {...register('email')}
                  type="email"
                  className="block w-full pl-10 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#F59F01]/50 focus:border-[#F59F01] transition-colors"
                  placeholder="you@example.com"
                />
              </div>
              {errors.email && <p className="mt-1.5 text-sm text-red-400">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-white/80">Password</label>
                <Link href="/auth/forgot-password" className="text-xs text-[#F59F01] hover:text-[#F59F01]/80 hover:underline transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/40">
                  <Lock size={18} />
                </div>
                <input
                  {...register('password')}
                  type="password"
                  className="block w-full pl-10 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#F59F01]/50 focus:border-[#F59F01] transition-colors"
                  placeholder="••••••••"
                />
              </div>
              {errors.password && <p className="mt-1.5 text-sm text-red-400">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-[#100226] bg-[#F59F01] hover:bg-[#F59F01]/90 hover:shadow-lg hover:shadow-[#F59F01]/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#100226] focus:ring-[#F59F01] disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-6"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                  Logging in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-8 text-center relative z-10">
            <p className="text-sm text-white/60">
              Don&apos;t have an account?{' '}
              <Link href="/auth/register" className="font-semibold text-white hover:text-[#F59F01] transition-colors">
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-abstract-gradient flex items-center justify-center p-4">
        <Loader2 className="animate-spin h-10 w-10 text-[#F59F01]" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}

