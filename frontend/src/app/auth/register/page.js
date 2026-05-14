'use client'

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Mail, Lock, User, Phone, Briefcase, TrendingUp, Github, Linkedin, Globe } from 'lucide-react';
import { toast } from 'sonner';
import FinlogicLogo from '@/components/FinlogicLogo';
import { useTheme } from 'next-themes';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  phone: z.string().optional(),
  role: z.enum(['entrepreneur', 'investor', 'gp_investor', 'reader', 'admin', 'super_admin'], { required_error: 'Please select a role' }),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  password_confirm: z.string(),
}).refine(data => data.password === data.password_confirm, {
  message: "Passwords don't match",
  path: ['password_confirm'],
});

export default function RegisterPage() {
  const { user, authLoading, register: registerUser, getDashboardUrl } = useAuth();
  const router = useRouter();
  const { theme, resolvedTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    if (!authLoading && user) {
      const destination = getDashboardUrl();
      router.push(destination); 
    }
  }, [user, authLoading, router, getDashboardUrl]);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({ 
    resolver: zodResolver(registerSchema),
    mode: 'onBlur' 
  });

  const selectedRole = watch('role');

  const onSubmit = async (data) => {
    setIsLoading(true);
    const result = await registerUser(data);
    
    if (result.success) {
      router.push('/auth/register/success');
    } else {
      // If result.error contains the "pending approval" message, it means registration worked but login didn't
      if (result.error?.includes('pending admin approval')) {
        router.push('/auth/register/success');
      } else {
        toast.error(result.error || 'Registration failed.');
      }
      setIsLoading(false);
    }
  };


  const inputClass = "block w-full pl-10 pr-3 py-2.5 bg-foreground/5 border border-border-theme rounded-xl text-foreground placeholder-text-muted/30 focus:outline-none focus:ring-2 focus:ring-[#F59F01]/50 focus:border-[#F59F01] transition-colors theme-transition dark:bg-card";

  return (
    <div className="min-h-screen bg-abstract-gradient flex flex-col items-center justify-center p-4 py-12 theme-transition">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6 hover:scale-105 transition-transform">
            <FinlogicLogo size={44} variant="full" darkBg={isDark} />
          </Link>
          <h1 className="text-3xl font-bold text-foreground mb-2">Create Account</h1>
          <p className="text-text-muted">Join the Finlogic Capital platform</p>
        </div>

        {/* Role cards removed - replaced by dropdown in form */}

        {/* Form Card */}
        <div className="glass-card rounded-2xl p-8 relative overflow-hidden theme-transition">
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#F59F01]/5 rounded-full blur-3xl" />

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 relative z-10">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1.5">I am a...</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                  {selectedRole === 'investor' ? <TrendingUp size={16}/> : <Briefcase size={16}/>}
                </div>
                <select 
                  {...register('role')} 
                  className={`${inputClass} appearance-none`}
                  defaultValue=""
                >
                  <option value="" disabled>Select your role</option>
                  <option value="entrepreneur" className="bg-card text-foreground">Entrepreneur</option>
                  <option value="investor" className="bg-card text-foreground">Investor (LP Investor)</option>
                  <option value="gp_investor" className="bg-card text-foreground">GP Investor (GP Shareholder)</option>
                  <option value="reader" className="bg-card text-foreground">Reader</option>
                  <option value="admin" className="bg-card text-foreground">Admin (GP Staff)</option>
                  <option value="super_admin" className="bg-card text-foreground">Super Admin (GP Senior Staff)</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-text-muted">
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                </div>
              </div>
              {errors.role && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.role.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">First Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted"><User size={16}/></div>
                  <input {...register('first_name')} placeholder="John" className={inputClass} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">Last Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted"><User size={16}/></div>
                  <input {...register('last_name')} placeholder="Doe" className={inputClass} />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-1.5">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted"><Mail size={16}/></div>
                <input {...register('email')} type="email" placeholder="you@example.com" className={inputClass} />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-1.5">Phone (Optional)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted"><Phone size={16}/></div>
                <input {...register('phone')} type="tel" placeholder="+977 98XXXXXXXX" className={inputClass} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted"><Lock size={16}/></div>
                  <input {...register('password')} type="password" placeholder="••••••••" className={inputClass} />
                </div>
                {errors.password && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.password.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted"><Lock size={16}/></div>
                  <input {...register('password_confirm')} type="password" placeholder="••••••••" className={inputClass} />
                </div>
                {errors.password_confirm && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.password_confirm.message}</p>}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !selectedRole}
              className="w-full flex justify-center py-2.5 px-4 rounded-xl shadow-sm text-sm font-semibold text-ls-primary-fixed bg-[#F59F01] hover:bg-[#F59F01]/90 hover:shadow-lg hover:shadow-[#F59F01]/20 focus:outline-none focus:ring-2 focus:ring-[#F59F01] disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-2"
            >
              {isLoading ? <><Loader2 className="animate-spin mr-2 h-4 w-4" />Creating Account...</> : 'Create Account'}
            </button>
          </form>

          <div className="mt-8 relative z-10">
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border-theme"></div></div>
              <div className="relative flex justify-center text-sm"><span className="px-2 bg-card text-text-muted">Or continue with</span></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => toast.info('Social sign-on coming soon')}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-border-theme bg-foreground/5 hover:bg-foreground/10 transition-colors text-sm font-medium"
              >
                <Github size={18} /> GitHub
              </button>
              <button
                type="button"
                onClick={() => toast.info('Social sign-on coming soon')}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-border-theme bg-foreground/5 hover:bg-foreground/10 transition-colors text-sm font-medium"
              >
                <Linkedin size={18} className="text-[#0077b5]" /> LinkedIn
              </button>
            </div>
          </div>

          <div className="mt-8 text-center relative z-10">
            <p className="text-sm text-text-muted">
              Already have an account?{' '}
              <Link href="/auth/login" className="font-semibold text-foreground hover:text-[#F59F01] transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
