import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { Save, Loader2, Palette, Globe, Image } from 'lucide-react'
import { toast } from '../components/Toast'

export default function Appearance() {
  const [settings, setSettings] = useState({})
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState({})
  const [saved, setSaved]       = useState({})

  const KEYS = [
    { key: 'site_name',         label: 'ชื่อเว็บไซต์',     icon: Globe,    type: 'text',  placeholder: 'TH-LOTTO' },
    { key: 'site_logo_url',     label: 'URL โลโก้',         icon: Image,    type: 'text',  placeholder: 'https://...' },
    { key: 'site_favicon_url',  label: 'URL Favicon',       icon: Image,    type: 'text',  placeholder: 'https://...' },
    { key: 'site_primary_color', label: 'สีหลัก (Primary)', icon: Palette,  type: 'color', placeholder: '#1e5e38' },
    { key: 'terms_html',        label: 'ข้อตกลงการใช้งาน (HTML)', icon: Globe, type: 'textarea', placeholder: '<li>...</li>' },
  ]

  useEffect(() => {
    supabase.from('settings').select('key,value').in('key', KEYS.map(k => k.key)).then(({ data }) => {
      const map = {}
      data?.forEach(s => { map[s.key] = s.value })
      setSettings(map)
      setLoading(false)
    })
  }, [])

  const save = async (key) => {
    setSaving(s => ({ ...s, [key]: true }))
    const { error } = await supabase.rpc('admin_upsert_setting', { p_key: key, p_value: String(settings[key] ?? '') })
    setSaving(s => ({ ...s, [key]: false }))
    if (error) { toast.error('เกิดข้อผิดพลาด: ' + error.message); return }
    setSaved(s => ({ ...s, [key]: true }))
    setTimeout(() => setSaved(s => ({ ...s, [key]: false })), 2000)
  }

  if (loading) return <div className="flex justify-center h-32 items-center"><Loader2 className="animate-spin text-primary" size={24}/></div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-on-surface">ออกแบบเว็บไซต์</h1>
        <p className="text-on-surface-variant text-sm">ตั้งค่าโลโก้ สีหลัก และชื่อเว็บไซต์ — ผู้ใช้เห็นทันทีโดยไม่ต้อง deploy ใหม่</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Panel */}
        <div className="lg:col-span-2 glass-panel rounded-2xl shadow-glass p-6">
          <h3 className="font-semibold text-on-surface-variant mb-5">การตั้งค่า</h3>
          <div className="flex items-center gap-4 flex-wrap">
            {settings.site_logo_url && (
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50">
                <img src={settings.site_logo_url} alt="logo" className="h-12 object-contain"/>
                <p className="text-xs text-outline mt-1">โลโก้</p>
              </div>
            )}
            {settings.site_primary_color && (
              <div className="flex items-center gap-3 border border-slate-200 rounded-xl p-3 bg-slate-50">
                <div className="w-10 h-10 rounded-lg shadow" style={{ backgroundColor: settings.site_primary_color }}></div>
                <div>
                  <label className="text-xs font-medium text-on-surface-variant mb-1 block">สีหลัก:</label>
                  <p className="text-xs text-on-surface-variant">{settings.site_primary_color}</p>
                </div>
              </div>
            )}
            {settings.site_name && (
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50">
                <p className="text-lg font-bold" style={{ color: settings.site_primary_color || '#1e5e38' }}>{settings.site_name}</p>
                <p className="text-xs text-on-surface-variant">ชื่อเว็บ</p>
              </div>
            )}
          </div>
        </div>

        {/* Settings Form */}
        <div className="glass-panel rounded-2xl shadow-glass p-6">
          <h3 className="font-semibold text-on-surface-variant mb-5">ตั้งค่า</h3>
          {KEYS.map(item => {
            const Icon = item.icon
            return (
              <div key={item.key}>
                <label className="flex items-center gap-2 text-sm font-medium text-on-surface-variant mb-2">
                  <Icon size={15}/> {item.label}
                </label>
                {item.type === 'textarea' ? (
                  <textarea value={settings[item.key] ?? ''} onChange={e => setSettings(s => ({ ...s, [item.key]: e.target.value }))}
                    className="w-full bg-surface-container-low border-none rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none h-24"/>
                ) : item.type === 'color' ? (
                  <input type="color" value={settings[item.key] ?? '#10b981'} onChange={e => setSettings(s => ({ ...s, [item.key]: e.target.value }))}
                    className="h-10 w-24 rounded-xl border-none cursor-pointer p-0.5"/>
                ) : (
                  <input type={item.type || 'text'} value={settings[item.key] ?? ''} onChange={e => setSettings(s => ({ ...s, [item.key]: e.target.value }))}
                    className="w-full bg-surface-container-low border-none rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"/>
                )}
                <button onClick={() => save(item.key)}
                  disabled={saving[item.key]}
                  className="mt-2 px-4 py-2 bg-primary hover:bg-primary/90 text-on-primary rounded-full text-sm font-medium transition disabled:opacity-40">
                  {saving[item.key] ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>}
                  {saved[item.key] ? 'บันทึกแล้ว ✓' : 'บันทึก'}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
