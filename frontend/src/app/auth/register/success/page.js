'use client'

import Link from 'next/link';
import { CheckCircle2, Mail, ArrowRight, Home } from 'lucide-react';
import FinlogicLogo from '@/components/FinlogicLogo';
import { useTheme } from 'next-themes';

export default function RegisterSuccessPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <div className="min-h-screen bg-abstract-gradient flex flex-col items-center justify-center p-4 theme-transition relative overflow-y-auto">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block hover:scale-105 transition-transform">
            <FinlogicLogo size={44} variant="full" darkBg={isDark} />
          </Link>
        </div>

        {/* Success Card */}
        <div className="glass-card rounded-2xl p-8 text-center relative overflow-hidden theme-transition z-10 pointer-events-auto">
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#F59F01]/5 rounded-full blur-3xl" />
          
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20 animate-in zoom-in duration-500">
              <CheckCircle2 size={40} className="text-green-500" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-foreground mb-4">Account Created!</h1>
          <p className="text-text-muted mb-8 text-lg">
            Thank you for joining Finlogic Capital. Your account has been successfully created and is now pending administrator review.
          </p>

          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-foreground/5 border border-border-theme text-left">
              <div className="w-10 h-10 rounded-lg bg-[#F59F01]/10 flex items-center justify-center shrink-0">
                <Mail size={20} className="text-[#F59F01]" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Check your email</p>
                <p className="text-sm text-text-muted">We've sent a welcome email with details about your account and platform access.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-foreground/5 border border-border-theme text-left">
              <div className="w-10 h-10 rounded-lg bg-[#F59F01]/10 flex items-center justify-center shrink-0">
                <CheckCircle2 size={20} className="text-[#F59F01]" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Wait for approval</p>
                <p className="text-sm text-text-muted">Our team will review your registration within 24-48 hours. You'll receive an email once approved.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 relative z-20">
            <Link 
              href="/auth/login"
              className="flex-1 flex justify-center items-center py-3 px-4 rounded-xl shadow-sm text-sm font-semibold text-ls-primary-fixed bg-[#F59F01] hover:bg-[#F59F01]/90 transition-all cursor-pointer pointer-events-auto"
            >
              Back to Sign In <ArrowRight size={16} className="ml-2" />
            </Link>
            <Link 
              href="/"
              className="flex-1 flex justify-center items-center py-3 px-4 rounded-xl border border-border-theme text-sm font-semibold text-foreground hover:bg-foreground/5 transition-all cursor-pointer pointer-events-auto"
            >
              <Home size={16} className="mr-2" /> Home
            </Link>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-text-muted">
          Need immediate assistance? Contact us at <a href="tel:+9779851437351" className="text-[#F59F01] hover:underline">+977-9851437351</a>
        </p>
      </div>
    </div>
  );
}
