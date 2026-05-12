import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { supabase } from '../supabaseClient'

export default function Login() {
  const { signIn } = useAuth()
  const nav = useNavigate()
  const [phone, setPhone] = useState('')
  const [pin, setPin] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [siteName, setSiteName] = useState('THLotto')

  useEffect(() => {
    supabase.from('settings')
      .select('key,value')
      .in('key', ['site_logo_url', 'site_name'])
      .then(({ data }) => {
        if (data) {
          const map = {}
          data.forEach(s => { map[s.key] = s.value })
          if (map.site_logo_url) setLogoUrl(map.site_logo_url)
          if (map.site_name) setSiteName(map.site_name)
        }
      })
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!phone || pin.length !== 4) { setError('กรุณากรอกเบอร์โทรและ PIN 4 หลัก'); return }
    setLoading(true)
    const { error: err } = await signIn(phone.trim(), pin)
    setLoading(false)
    if (err) { setError(err.message || 'เข้าสู่ระบบไม่สำเร็จ'); return }
    nav('/', { replace: true })
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 font-prompt overflow-hidden relative">
      {/* Ambient blobs */}
      <div className="absolute -top-[40%] -right-[20%] w-[80%] h-[80%] rounded-full bg-primary-container opacity-5 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-secondary-container opacity-10 blur-[100px] pointer-events-none" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-[440px]">
        <div className="glass-panel rounded-xl shadow-capsule p-10 flex flex-col gap-8">

          {/* Header */}
          <div className="flex flex-col items-center text-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt={siteName} className="h-16 w-auto object-contain drop-shadow-md"
                onError={e => { e.currentTarget.style.display='none' }} />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center shadow-capsule-md border-2 border-white">
                <span className="material-symbols-outlined text-on-primary-container text-[32px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}>shield_person</span>
              </div>
            )}
            <h1 className="text-3xl font-black tracking-tight text-primary">{siteName}</h1>
            <p className="text-sm text-on-surface-variant">ระบบยืนยันตัวตนระดับบริหาร</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Phone */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface-variant tracking-wide ml-1">เบอร์โทรศัพท์</label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-4 text-outline text-[20px]">call</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="กรอกเบอร์โทรศัพท์"
                  maxLength={10}
                  className="w-full bg-surface-container-low border-none rounded-full py-3.5 pl-12 pr-4 text-sm text-on-surface placeholder:text-outline-variant focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all outline-none"
                />
              </div>
            </div>

            {/* PIN */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface-variant tracking-wide ml-1">รหัส PIN 4 หลัก</label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-4 text-outline text-[20px]">dialpad</span>
                <input
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="••••"
                  maxLength={4}
                  className="w-full bg-surface-container-low border-none rounded-full py-3.5 pl-12 pr-12 text-sm text-on-surface placeholder:text-outline-variant focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all outline-none tracking-widest text-center"
                />
                <button type="button" onClick={() => setShowPin(p => !p)}
                  className="absolute right-4 text-outline hover:text-on-surface transition-colors">
                  <span className="material-symbols-outlined text-[20px]">{showPin ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 bg-error-container text-on-error-container rounded-full px-4 py-3 text-sm">
                <span className="material-symbols-outlined text-[18px]">error</span>
                {error}
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="mt-2 w-full bg-primary text-on-primary rounded-full py-3.5 text-sm font-semibold shadow-capsule-md hover:scale-[1.02] active:scale-95 transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2">
              {loading
                ? <><span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>กำลังเข้าสู่ระบบ...</>
                : <><span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>login</span>เข้าสู่ระบบ</>
              }
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-xs text-outline flex items-center justify-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">lock</span>
            การเชื่อมต่อที่ปลอดภัยและเข้ารหัส
          </p>
        </div>
      </div>
    </div>
  )
}
