import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (uid) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id,member_id,full_name,phone,is_admin,status,avatar_url,admin_role,admin_permissions')
        .eq('id', uid)
        .single()
      if (error) throw error
      if (!data.is_admin) { await supabase.auth.signOut(); return }
      setProfile(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const isSuperAdmin = () => profile?.admin_role === 'super_admin'

  const hasPermission = (perm) => {
    if (!profile) return false
    if (profile.admin_role === 'super_admin') return true
    const perms = profile.admin_permissions || []
    return perms.includes('*') || perms.includes(perm)
  }

  const pinToPassword = async (phone, pin) => {
    const raw = new TextEncoder().encode(pin + phone);
    const hashBuffer = await crypto.subtle.digest('SHA-256', raw);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  const signIn = async (phone, pin) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: `${phone}@thlotto.app`,
      password: await pinToPassword(phone, pin),
    })
    if (!error && data?.user) {
      const { data: prof } = await supabase.from('profiles').select('is_admin').eq('id', data.user.id).single()
      if (!prof?.is_admin) {
        await supabase.auth.signOut()
        return { data: null, error: { message: 'ไม่มีสิทธิ์เข้าใช้งาน Admin Panel' } }
      }
    }
    return { data, error }
  }

  const signOut = () => supabase.auth.signOut()

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signOut, isSuperAdmin, hasPermission, refreshProfile: () => fetchProfile(user?.id) }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
