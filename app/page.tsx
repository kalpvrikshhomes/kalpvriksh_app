'use client'

import { useState, useEffect } from 'react'
import { LoginPage } from '@/components/login-page'
import { Dashboard } from '@/components/dashboard'
import { type User } from '@/lib/types'
import { User as SupabaseUser } from '@supabase/supabase-js'
import Image from 'next/image'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/session');
        const { user: apiUser, error } = await response.json();
        if (error || !apiUser) {
          console.error('Session error or no user:', error);
          setLoading(false);
          return;
        }
        setUser({
          id: apiUser.id,
          name: apiUser.full_name,
          role: apiUser.role,
        });
      } catch (e) {
        console.error('checkSession exception:', e);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    setUser(null);
  }


  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background gap-4">
        <Image src="/logo.png" alt="Kalpvriksh Logo" width={200} height={56} className="h-16 w-auto animate-pulse" priority />
        <div className="text-muted-foreground animate-pulse font-medium">Loading...</div>
      </div>
    )
  }

  return user ? (
    <Dashboard user={user} onLogout={handleLogout} />
  ) : (
    <LoginPage />
  )
}
