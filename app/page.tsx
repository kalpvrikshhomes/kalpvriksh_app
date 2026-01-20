'use client'

import { useState, useEffect } from 'react'
import { LoginPage } from '@/components/login-page'
import { Dashboard } from '@/components/dashboard'
import { type User } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { User as SupabaseUser } from '@supabase/supabase-js'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('useEffect: start');
    const checkSession = async () => {
      console.log('checkSession: start');
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('getSession error:', error);
          setLoading(false);
          return;
        }
        console.log('checkSession: session', session);
        if (session) {
          await fetchAndSetUserProfile(session.user);
        } else {
          setLoading(false);
        }
      } catch (e) {
        console.error('checkSession exception:', e);
        setLoading(false);
      }
      console.log('checkSession: end');
    };

    checkSession();
    console.log('useEffect: end');
  }, []);

  const fetchAndSetUserProfile = async (supabaseUser: SupabaseUser) => {
    console.log('fetchAndSetUserProfile: start');
    setLoading(true)
    try {
      console.log('fetchAndSetUserProfile: fetching profile');
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single()

      console.log('fetchAndSetUserProfile: profile', profile);
      console.log('fetchAndSetUserProfile: error', error);

      if (error) {
        console.error('Error fetching profile:', error)
        setUser(null)
      } else if (profile) {
        setUser({
          id: profile.id,
          name: profile.full_name,
          role: profile.role,
        })
      }
    } catch (error) {
      console.error('An unexpected error occurred:', error)
      setUser(null)
    } finally {
      setLoading(false)
      console.log('fetchAndSetUserProfile: end');
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
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
