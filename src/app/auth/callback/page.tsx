
"use client";

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      login(token).then(() => {
        toast.success('Successfully logged in!');
        router.push('/dashboard');
      }).catch((error) => {
        console.error('Login failed:', error);
        toast.error('Login failed. Please try again.');
        router.push('/');
      });
    } else {
      toast.error('No authentication token received');
      router.push('/');
    }
  }, [searchParams, login, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-lg text-muted-foreground">Completing authentication...</p>
      </div>
    </div>
  );
}
