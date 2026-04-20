'use client'

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Mail, Lock, User, Phone, Briefcase, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  phone: z.string().optional(),
  role: z.enum(['entrepreneur', 'investor'], { required_error: 'Please select a role' }),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  password_confirm: z.string(),
}).refine(data => data.password === data.password_confirm, {
  message: "Passwords don't match",
  path: ['password_confirm'],
});

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data) => {
    setIsLoading(true);
    const result = await registerUser(data);
    
    if (result.success) {
      if (result.status === 202) {
        toast.success('Role request submitted!', {
          description: result.message || 'An administrator will review your request to add this role to your account.',
          duration: 6000,
        });
        setTimeout(() => router.push('/auth/login'), 2000);
      } else {
        // Success but login might have failed because of is_approved=False
        toast.success('Account created!', {
          description: 'Your account is pending admin approval. You will receive an email once an administrator reviews your request.',
          duration: 10000,
        });
        setTimeout(() => router.push('/auth/login'), 3000);
      }
    } else {
      // If result.error contains the "pending approval" message, it means registration worked but login didn't
      if (result.error?.includes('pending admin approval')) {
        toast.success('Account created!', {
          description: 'Your account is pending admin approval. You will be able to login once an administrator reviews your request.',
          duration: 10000,
        });
        setTimeout(() => router.push('/auth/login'), 3000);
      } else {
        toast.error(result.error || 'Registration failed.');
      }
      setIsLoading(false);
    }
  };

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setValue('role', role, { shouldValidate: true });
  };

  const inputClass = "block w-full pl-10 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#F59F01]/50 focus:border-[#F59F01] transition-colors";

  return (
    <div className="min-h-screen bg-abstract-gradient flex flex-col items-center justify-center p-4 py-12">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center gap-2 mb-6">
            <div className="w-10 h-10 bg-[#F59F01] rounded flex items-center justify-center shadow-lg shadow-[#F59F01]/20">
              <span className="text-[#100226] font-bold text-xl">FL</span>
            </div>
            <span className="text-xl font-bold text-white tracking-wide">FINLOGIC</span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-white/60">Join the Finlogic Capital platform</p>
        </div>

        {/* Role Selector */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            type="button"
            onClick={() => handleRoleSelect('entrepreneur')}
            className={`relative flex flex-col items-center gap-3 p-5 rounded-2xl border transition-all ${
              selectedRole === 'entrepreneur'
                ? 'border-[#F59F01] bg-[#F59F01]/10 shadow-lg shadow-[#F59F01]/10'
                : 'border-white/10 bg-white/5 hover:border-white/30'
            }`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedRole === 'entrepreneur' ? 'bg-[#F59F01]/20' : 'bg-white/5'}`}>
              <Briefcase size={22} className={selectedRole === 'entrepreneur' ? 'text-[#F59F01]' : 'text-white/40'} />
            </div>
            <div className="text-center">
              <p className={`font-semibold ${selectedRole === 'entrepreneur' ? 'text-white' : 'text-white/60'}`}>Entrepreneur</p>
              <p className="text-xs text-white/40 mt-0.5">Submit projects for funding</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => handleRoleSelect('investor')}
            className={`relative flex flex-col items-center gap-3 p-5 rounded-2xl border transition-all ${
              selectedRole === 'investor'
                ? 'border-[#F59F01] bg-[#F59F01]/10 shadow-lg shadow-[#F59F01]/10'
                : 'border-white/10 bg-white/5 hover:border-white/30'
            }`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedRole === 'investor' ? 'bg-[#F59F01]/20' : 'bg-white/5'}`}>
              <TrendingUp size={22} className={selectedRole === 'investor' ? 'text-[#F59F01]' : 'text-white/40'} />
            </div>
            <div className="text-center">
              <p className={`font-semibold ${selectedRole === 'investor' ? 'text-white' : 'text-white/60'}`}>Investor</p>
              <p className="text-xs text-white/40 mt-0.5">Discover vetted opportunities</p>
            </div>
          </button>
        </div>
        {errors.role && <p className="text-sm text-red-400 text-center -mt-3 mb-4">{errors.role.message}</p>}

        {/* Form Card */}
        <div className="glass-card rounded-2xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#F59F01]/5 rounded-full blur-3xl" />

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 relative z-10">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1.5">First Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/40"><User size={16}/></div>
                  <input {...register('first_name')} placeholder="John" className={inputClass} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1.5">Last Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/40"><User size={16}/></div>
                  <input {...register('last_name')} placeholder="Doe" className={inputClass} />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/40"><Mail size={16}/></div>
                <input {...register('email')} type="email" placeholder="you@example.com" className={inputClass} />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">Phone (Optional)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/40"><Phone size={16}/></div>
                <input {...register('phone')} type="tel" placeholder="+977 98XXXXXXXX" className={inputClass} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1.5">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/40"><Lock size={16}/></div>
                  <input {...register('password')} type="password" placeholder="••••••••" className={inputClass} />
                </div>
                {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/40"><Lock size={16}/></div>
                  <input {...register('password_confirm')} type="password" placeholder="••••••••" className={inputClass} />
                </div>
                {errors.password_confirm && <p className="mt-1 text-xs text-red-400">{errors.password_confirm.message}</p>}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !selectedRole}
              className="w-full flex justify-center py-2.5 px-4 rounded-xl shadow-sm text-sm font-semibold text-[#100226] bg-[#F59F01] hover:bg-[#F59F01]/90 hover:shadow-lg hover:shadow-[#F59F01]/20 focus:outline-none focus:ring-2 focus:ring-[#F59F01] disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-2"
            >
              {isLoading ? <><Loader2 className="animate-spin mr-2 h-4 w-4" />Creating Account...</> : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center relative z-10">
            <p className="text-sm text-white/60">
              Already have an account?{' '}
              <Link href="/auth/login" className="font-semibold text-white hover:text-[#F59F01] transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
