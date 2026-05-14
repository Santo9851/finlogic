'use client'

import { useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter, usePathname } from 'next/navigation';

export default function AuthGuard({ children, allowedRoles = [] }) {
  const { user, authLoading, getDashboardUrl } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push(`/auth/login?returnUrl=${encodeURIComponent(pathname)}`);
      } else if (allowedRoles.length > 0) {
        const userRoles = Array.isArray(user.roles) ? user.roles : [user.role];
        const hasAccess = allowedRoles.some(role => userRoles.includes(role));
        
        if (!hasAccess) {
          const destination = getDashboardUrl();
          router.push(destination);
        }
      }
    }
  }, [user, authLoading, router, pathname, allowedRoles, getDashboardUrl]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-abstract-gradient flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-[#F59F01]/20 border-t-[#F59F01] animate-spin"></div>
      </div>
    );
  }

  const userRoles = user ? (Array.isArray(user.roles) ? user.roles : [user.role]) : [];
  const authorized = allowedRoles.length === 0 || allowedRoles.some(role => userRoles.includes(role));

  return user && authorized ? children : null;
}
