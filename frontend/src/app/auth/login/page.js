'use client'

import { useState, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/lib/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Mail, Lock, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import FinlogicLogo from '@/components/FinlogicLogo';
import { useTheme } from 'next-themes';
import { useEffect } from 'react';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

function LoginContent() {
  const { user, authLoading, login, getDashboardUrl } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, resolvedTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const returnUrl = searchParams.get('returnUrl');

  useEffect(() => {
    if (!authLoading && user) {
      const destination = getDashboardUrl();
      router.push(destination);
    }
  }, [user, authLoading, router, getDashboardUrl]);

  const isDark = resolvedTheme === 'dark';

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

      // 2. Otherwise, use role-based redirect
      const destination = getDashboardUrl();
      router.push(destination);
    } else {
      toast.error(result.error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background theme-transition selection:bg-ls-compliment/30 font-sans">
      {/* Left side: Architectural Image (Visible on LG up) */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden bg-ls-primary">
        <div className="absolute inset-0 z-0 opacity-40 grayscale mix-blend-luminosity">
          <img 
            src="/images/redesign/vision.png" 
            alt="Institutional Authority" 
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ls-primary via-transparent to-transparent" />
        </div>
        
        <div className="absolute inset-0 z-10 flex flex-col justify-end p-20 space-y-8">
           <div className="space-y-4 max-w-lg">
              <div className="h-1 w-12 bg-ls-compliment" />
              <h2 className="text-5xl font-serif font-light text-ls-white leading-tight">
                Investing in <br />Nepal's Future
              </h2>
              <p className="text-xl text-ls-white/60 font-light leading-relaxed">
                Join our exclusive network of visionary entrepreneurs and institutional investors.
              </p>
           </div>
        </div>
      </div>

      {/* Right side: Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 md:px-20 lg:px-32 py-20 relative overflow-hidden">
        {/* Subtle background decoration for mobile */}
        <div className="lg:hidden absolute top-0 right-0 w-64 h-64 bg-ls-compliment/5 rounded-full blur-3xl -mx-20 -my-20" />
        
        <div className="max-w-md w-full mx-auto relative z-10">
          {/* Logo */}
          <div className="mb-20">
            <Link href="/" className="inline-block transition-transform hover:scale-105">
              <FinlogicLogo size={44} variant="full" />
            </Link>
          </div>

          <div className="space-y-12">
            <header className="space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-ls-compliment">Authentication Portal</span>
              <h1 className="text-5xl font-serif font-light leading-tight">Welcome Back</h1>
              <p className="text-lg text-text-muted font-light leading-relaxed">
                Sign in to access your institutional dashboard and portfolio analytics.
              </p>
            </header>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-ls-compliment uppercase tracking-[0.4em]">Email Address</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-0 flex items-center pointer-events-none text-text-muted group-focus-within:text-ls-compliment transition-colors">
                      <Mail size={18} strokeWidth={1.5} />
                    </div>
                    <input
                      {...register('email')}
                      type="email"
                      autoComplete="username"
                      className="block w-full pl-8 pr-3 py-4 bg-transparent border-b border-border-theme text-foreground placeholder:text-text-muted/20 focus:outline-none focus:border-ls-compliment transition-all text-xl font-light"
                      placeholder="you@institution.com"
                    />
                  </div>
                  {errors.email && <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 mt-2">{errors.email.message}</p>}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-ls-compliment uppercase tracking-[0.4em]">Password</label>
                    <Link href="/auth/forgot-password" className="text-[10px] font-bold uppercase tracking-widest text-text-muted hover:text-ls-compliment transition-colors">
                      Forgot?
                    </Link>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-0 flex items-center pointer-events-none text-text-muted group-focus-within:text-ls-compliment transition-colors">
                      <Lock size={18} strokeWidth={1.5} />
                    </div>
                    <input
                      {...register('password')}
                      type="password"
                      autoComplete="current-password"
                      className="block w-full pl-8 pr-3 py-4 bg-transparent border-b border-border-theme text-foreground placeholder:text-text-muted/20 focus:outline-none focus:border-ls-compliment transition-all text-xl font-light"
                      placeholder="••••••••"
                    />
                  </div>
                  {errors.password && <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 mt-2">{errors.password.message}</p>}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full group relative flex items-center justify-center overflow-hidden bg-ls-primary py-6 text-ls-white transition-all hover:bg-ls-compliment hover:text-ls-primary active:scale-[0.98] disabled:opacity-50"
              >
                <span className="relative z-10 text-xs font-bold uppercase tracking-[0.4em]">
                  {isLoading ? 'Transmitting...' : 'Sign In'}
                </span>
              </button>
            </form>

            <footer className="pt-10 border-t border-border-theme flex flex-col sm:flex-row items-center justify-between gap-6">
              <p className="text-sm text-text-muted font-light">
                New to the network?
              </p>
              <Link 
                href="/auth/register" 
                className="inline-flex items-center space-x-3 text-xs font-bold uppercase tracking-widest text-ls-compliment hover:text-ls-white transition-all"
              >
                <span>Create Account</span>
                <ArrowRight size={16} />
              </Link>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Loader2 className="animate-spin h-10 w-10 text-ls-compliment" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}

