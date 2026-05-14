'use client'

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Mail, Lock, User, Phone, Briefcase, TrendingUp, Github, Linkedin, Globe, ChevronDown, ArrowRight } from 'lucide-react';
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

  return (
    <div className="min-h-screen flex bg-background theme-transition selection:bg-ls-compliment/30 font-sans">
      {/* Left side: Architectural Image (Visible on LG up) */}
      <div className="hidden lg:block lg:w-5/12 relative overflow-hidden bg-ls-primary">
        <div className="absolute inset-0 z-0 opacity-40 grayscale mix-blend-luminosity">
          <img 
            src="/images/redesign/harmony.png" 
            alt="Institutional Harmony" 
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ls-primary via-transparent to-transparent" />
        </div>
        
        <div className="absolute inset-0 z-10 flex flex-col justify-end p-20 space-y-8">
           <div className="space-y-4 max-w-lg">
              <div className="h-1 w-12 bg-ls-compliment" />
              <h2 className="text-5xl font-serif font-light text-ls-white leading-tight">
                Architects of <br />Growth
              </h2>
              <p className="text-xl text-ls-white/60 font-light leading-relaxed">
                Join a disciplined ecosystem of growth partners, founders, and institutional allocators.
              </p>
           </div>
        </div>
      </div>

      {/* Right side: Register Form */}
      <div className="w-full lg:w-7/12 flex flex-col justify-center px-8 sm:px-12 md:px-20 lg:px-24 py-20 relative overflow-hidden">
        {/* Subtle background decoration for mobile */}
        <div className="lg:hidden absolute top-0 right-0 w-64 h-64 bg-ls-compliment/5 rounded-full blur-3xl -mx-20 -my-20" />
        
        <div className="max-w-2xl w-full mx-auto relative z-10">
          {/* Logo */}
          <div className="mb-16">
            <Link href="/" className="inline-block transition-transform hover:scale-105">
              <FinlogicLogo size={44} variant="full" />
            </Link>
          </div>

          <div className="space-y-12">
            <header className="space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-ls-compliment">Network Admission</span>
              <h1 className="text-5xl font-serif font-light leading-tight">Create Account</h1>
              <p className="text-lg text-text-muted font-light leading-relaxed">
                Apply to join the Finlogic Capital platform and access our proprietary investment framework.
              </p>
            </header>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                
                {/* Role Selection */}
                <div className="md:col-span-2 space-y-3">
                  <label className="text-[10px] font-bold text-ls-compliment uppercase tracking-[0.4em]">I am a...</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-0 flex items-center pointer-events-none text-text-muted group-focus-within:text-ls-compliment transition-colors">
                      {selectedRole === 'investor' ? <TrendingUp size={18} strokeWidth={1.5}/> : <Briefcase size={18} strokeWidth={1.5}/>}
                    </div>
                    <select 
                      {...register('role')} 
                      className="block w-full pl-8 pr-3 py-4 bg-transparent border-b border-border-theme text-foreground focus:outline-none focus:border-ls-compliment transition-all text-xl font-light appearance-none"
                      defaultValue=""
                    >
                      <option value="" disabled className="bg-background">Select your role</option>
                      <option value="entrepreneur" className="bg-background">Entrepreneur</option>
                      <option value="investor" className="bg-background">Investor (LP Investor)</option>
                      <option value="gp_investor" className="bg-background">GP Investor (GP Shareholder)</option>
                      <option value="reader" className="bg-background">Reader</option>
                      <option value="admin" className="bg-background">Admin (GP Staff)</option>
                      <option value="super_admin" className="bg-background">Super Admin (GP Senior Staff)</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-0 flex items-center pointer-events-none text-text-muted">
                       <ChevronDown size={18} />
                    </div>
                  </div>
                  {errors.role && <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 mt-2">{errors.role.message}</p>}
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-ls-compliment uppercase tracking-[0.4em]">First Name</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-0 flex items-center pointer-events-none text-text-muted group-focus-within:text-ls-compliment transition-colors"><User size={18} strokeWidth={1.5}/></div>
                    <input {...register('first_name')} placeholder="John" className="block w-full pl-8 pr-3 py-4 bg-transparent border-b border-border-theme text-foreground focus:outline-none focus:border-ls-compliment transition-all text-xl font-light" />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-ls-compliment uppercase tracking-[0.4em]">Last Name</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-0 flex items-center pointer-events-none text-text-muted group-focus-within:text-ls-compliment transition-colors"><User size={18} strokeWidth={1.5}/></div>
                    <input {...register('last_name')} placeholder="Doe" className="block w-full pl-8 pr-3 py-4 bg-transparent border-b border-border-theme text-foreground focus:outline-none focus:border-ls-compliment transition-all text-xl font-light" />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-3">
                  <label className="text-[10px] font-bold text-ls-compliment uppercase tracking-[0.4em]">Email Address</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-0 flex items-center pointer-events-none text-text-muted group-focus-within:text-ls-compliment transition-colors"><Mail size={18} strokeWidth={1.5}/></div>
                    <input {...register('email')} type="email" placeholder="you@institution.com" className="block w-full pl-8 pr-3 py-4 bg-transparent border-b border-border-theme text-foreground focus:outline-none focus:border-ls-compliment transition-all text-xl font-light" />
                  </div>
                  {errors.email && <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 mt-2">{errors.email.message}</p>}
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-ls-compliment uppercase tracking-[0.4em]">Password</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-0 flex items-center pointer-events-none text-text-muted group-focus-within:text-ls-compliment transition-colors"><Lock size={18} strokeWidth={1.5}/></div>
                    <input {...register('password')} type="password" placeholder="••••••••" className="block w-full pl-8 pr-3 py-4 bg-transparent border-b border-border-theme text-foreground focus:outline-none focus:border-ls-compliment transition-all text-xl font-light" />
                  </div>
                  {errors.password && <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 mt-2">{errors.password.message}</p>}
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-ls-compliment uppercase tracking-[0.4em]">Confirm Password</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-0 flex items-center pointer-events-none text-text-muted group-focus-within:text-ls-compliment transition-colors"><Lock size={18} strokeWidth={1.5}/></div>
                    <input {...register('password_confirm')} type="password" placeholder="••••••••" className="block w-full pl-8 pr-3 py-4 bg-transparent border-b border-border-theme text-foreground focus:outline-none focus:border-ls-compliment transition-all text-xl font-light" />
                  </div>
                  {errors.password_confirm && <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 mt-2">{errors.password_confirm.message}</p>}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !selectedRole}
                className="w-full group relative flex items-center justify-center overflow-hidden bg-ls-primary py-6 text-ls-white transition-all hover:bg-ls-compliment hover:text-ls-primary active:scale-[0.98] disabled:opacity-50"
              >
                <span className="relative z-10 text-xs font-bold uppercase tracking-[0.4em]">
                  {isLoading ? <><Loader2 className="animate-spin mr-2 h-4 w-4" />Processing Admission...</> : 'Submit Application'}
                </span>
              </button>
            </form>
            <footer className="pt-10 border-t border-border-theme flex flex-col sm:flex-row items-center justify-between gap-6">
              <p className="text-sm text-text-muted font-light">
                Already registered?
              </p>
              <Link 
                href="/auth/login" 
                className="inline-flex items-center space-x-3 text-xs font-bold uppercase tracking-widest text-ls-compliment hover:text-ls-white transition-all"
              >
                <span>Sign In</span>
                <ArrowRight size={16} />
              </Link>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
