import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { Save, Loader2, AlertCircle } from 'lucide-react'
import { toast } from '../components/Toast'

const GROUPS = [
  {
    title: 'การเงิน',
    keys: [
      { key: 'min_deposit',            label: 'ฝากขั้นต่ำ (บาท)',        type: 'number' },
      { key: 'min_withdraw',           label: 'ถอนขั้นต่ำ (บาท)',        type: 'number' },
      { key: 'max_withdraw_per_request', label: 'ถอนสูงสุดต่อครั้ง (บาท)',  type: 'number' },
      { key: 'max_daily_withdraw',     label: 'ถอนสูงสุดต่อวัน (บาท)',   type: 'number' },
      { key: 'max_withdraw_per_day',   label: 'จำนวนครั้งถอนต่อวัน',     type: 'number' },
      { key: 'min_bet',                label: 'แทงขั้นต่ำต่อเลข (บาท)',  type: 'number' },
      { key: 'referral_commission_rate', label: 'Commission Referral (%)', type: 'number' },
      { key: 'commission_rate',        label: 'อัตรา Commission (%)',     type: 'number' },
    ]
  },
  {
    title: 'บัญชีรับโอน',
    keys: [
      { key: 'company_bank_name',          label: 'ชื่อธนาคาร',          type: 'text' },
      { key: 'company_bank_code',          label: 'รหัสธนาคาร',          type: 'text' },
      { key: 'company_bank_account_number', label: 'เลขบัญชี',           type: 'text' },
      { key: 'company_bank_account_name',  label: 'ชื่อบัญชี',           type: 'text' },
      { key: 'company_promptpay_number',   label: 'เบอร์พร้อมเพย์',      type: 'text' },
      { key: 'qr_payment_enabled',         label: 'เปิดใช้ QR Payment',  type: 'select', options: ['true','false'] },
    ]
  },
  {
    title: 'วงล้อลุ้นโชค',
    keys: [
      { key: 'lucky_wheel_enabled',    label: 'เปิดใช้วงล้อ',           type: 'select', options: ['TRUE','FALSE'] },
      { key: 'lucky_wheel_cost',       label: 'ราคาหมุน (บาท)',         type: 'number' },
      { key: 'lucky_wheel_daily_limit', label: 'หมุนได้ต่อวัน (ครั้ง)', type: 'number' },
      { key: 'lucky_wheel_min_deposit', label: 'ฝากขั้นต่ำก่อนหมุน',   type: 'number' },
    ]
  },
  {
    title: 'Live & ติดต่อ',
    keys: [
      { key: 'live_stream_url',   label: 'YouTube Live URL',    type: 'text' },
      { key: 'contact_line_url',  label: 'LINE URL',            type: 'text' },
      { key: 'contact_line_id',   label: 'LINE ID',             type: 'text' },
      { key: 'service_hours_text', label: 'เวลาให้บริการ',     type: 'text' },
    ]
  },
  {
    title: 'ประกาศ',
    keys: [
      { key: 'announcement_enabled', label: 'เปิดข้อความวิ่ง', type: 'select', options: ['TRUE','FALSE'] },
      { key: 'announcement_text',    label: 'ข้อความวิ่ง',     type: 'text' },
    ]
  },
  {
    title: 'ระบบ',
    keys: [
      { key: 'maintenance_mode', label: 'Maintenance Mode', type: 'select', options: ['FALSE','TRUE'] },
      { key: 'system_status',    label: 'สถานะระบบ',        type: 'select', options: ['ONLINE','OFFLINE'] },
      { key: 'deposit_timeout_seconds', label: 'หมดเวลาสลิป (วินาที)', type: 'number' },
    ]
  },
]

export default function Settings() {
  const [settings, setSettings] = useState({})
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState({})
  const [saved, setSaved]       = useState({})

  useEffect(() => {
    supabase.from('settings').select('key,value').then(({ data }) => {
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
        <h1 className="text-2xl font-bold text-on-surface">ตั้งค่าระบบ</h1>
        <p className="text-on-surface-variant text-sm">เปลี่ยนค่าแล้วกด "บันทึก" แต่ละรายการ — ผู้ใช้เห็นทันที</p>
      </div>

      {GROUPS.map(group => (
        <div key={group.title} className="glass-panel rounded-2xl shadow-glass overflow-hidden">
          <div className="px-5 py-3 border-b border-outline-variant bg-surface-container">
            <h3 className="font-semibold text-on-surface-variant">{group.title}</h3>
          </div>
          <div className="p-5 space-y-4">
            {group.keys.map(item => (
              <div key={item.key} className="flex items-center gap-4 px-5 py-4 border-b border-outline-variant last:border-0">
                <label className="w-52 text-sm text-on-surface-variant flex-shrink-0">{item.label}</label>
                <div className="flex-1">
                  {item.type === 'select' ? (
                    <select
                      value={settings[item.key] ?? ''}
                      onChange={e => setSettings(s => ({ ...s, [item.key]: e.target.value }))}
                      className="w-full sm:w-64 bg-surface-container-low border-none rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                      {item.options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input
                      type={item.type}
                      value={settings[item.key] ?? ''}
                      onChange={e => setSettings(s => ({ ...s, [item.key]: e.target.value }))}
                      className="w-full sm:w-64 bg-surface-container-low border-none rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"/>
                  )}
                </div>
                <button onClick={() => save(item.key)} disabled={saving[item.key]}
                  className={`px-4 py-2 bg-primary hover:bg-primary/90 text-on-primary rounded-full text-sm font-medium transition disabled:opacity-40`}>
                  {saving[item.key] ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>}
                  {saved[item.key] ? 'บันทึกแล้ว ✓' : 'บันทึก'}
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
