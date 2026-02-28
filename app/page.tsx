'use client'

import { useState, useEffect } from 'react'
import { LoginPage } from '@/components/login-page'
import { Dashboard } from '@/components/dashboard'
import { type User } from '@/lib/types'
import { User as SupabaseUser } from '@supabase/supabase-js'

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
    return <div className="flex items-center justify-center h-screen bg-background">Loading...</div>
  }

  return user ? (
    <Dashboard user={user} onLogout={handleLogout} />
  ) : (
    <LoginPage />
  )
}
