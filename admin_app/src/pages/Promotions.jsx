import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { Plus, Edit, Trash2, Loader2, X, Save, ToggleLeft, ToggleRight } from 'lucide-react'
import { toast } from '../components/Toast'

const EMPTY = { title:'', promo_code:'', description:'', image_url:'', badge_text:'', background_color:'', type:'general', line1:'', line2:'', bonus_rate:0, bonus_amount:0, min_deposit:0, max_withdrawal:0, turnover_multiplier:1, default_amount:0, target_view:'deposit', is_active:true }

export default function Promotions() {
  const [rows, setRows]     = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]   = useState(null)
  const [working, setWorking] = useState(false)

  const load = async () => {
    const { data } = await supabase.from('promotions').select('*').order('created_at', { ascending: false })
    setRows(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    setWorking(true)
    const { id, created_at, ...fields } = modal
    let error
    if (id) {
      ({ error } = await supabase.from('promotions').update(fields).eq('id', id))
    } else {
      ({ error } = await supabase.from('promotions').insert(fields))
    }
    setWorking(false)
    if (error) { toast.error('เกิดข้อผิดพลาด: ' + error.message); return }
    setModal(null); load()
  }

  const remove = async (id) => {
    if (!confirm('ลบโปรโมชั่นนี้?')) return
    await supabase.from('promotions').delete().eq('id', id)
    load()
  }

  const toggle = async (id, val) => {
    await supabase.from('promotions').update({ is_active: !val }).eq('id', id)
    load()
  }

  if (loading) return <div className="flex justify-center h-32 items-center"><Loader2 className="animate-spin text-primary" size={24}/></div>

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">โปรโมชั่น</h1>
          <p className="text-on-surface-variant text-sm">จัดการโปรโมชั่นและ Promo Code</p>
        </div>
        <button onClick={() => setModal({ ...EMPTY })}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-on-primary rounded-full text-sm font-medium transition">
          <Plus size={15}/> เพิ่มโปร
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {rows.map(r => (
          <div key={r.id} className={`glass-panel rounded-2xl shadow-glass overflow-hidden ${!r.is_active ? 'opacity-60' : ''}`}>
            {r.image_url && (
              <div className="relative">
                <img src={r.image_url} alt={r.title} className="w-full h-28 object-cover"/>
                {r.badge_text && <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-bold bg-primary text-on-primary shadow">{r.badge_text}</span>}
              </div>
            )}
            <div className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-bold text-on-surface">{r.title}</div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs font-mono bg-surface-container text-on-surface-variant px-2 py-0.5 rounded-full">{r.promo_code}</span>
                  {!r.image_url && r.badge_text && <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{r.badge_text}</span>}
                </div>
              </div>
              <button onClick={() => toggle(r.id, r.is_active)} className={r.is_active ? 'text-primary' : 'text-outline'}>
                {r.is_active ? <ToggleRight size={28}/> : <ToggleLeft size={28}/>}
              </button>
            </div>
            <p className="text-xs text-on-surface-variant mb-3">{r.description}</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-on-surface-variant mb-4">
              <div>โบนัส: <span className="font-semibold text-secondary">{r.bonus_rate}% / ฿{r.bonus_amount}</span></div>
              <div>ฝากขั้นต่ำ: <span className="font-semibold text-on-surface">฿{r.min_deposit}</span></div>
              <div>Turnover: <span className="font-semibold text-on-surface">{r.turnover_multiplier}x</span></div>
              <div>ถอนสูงสุด: <span className="font-semibold text-on-surface">฿{r.max_withdrawal}</span></div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setModal({ ...r })}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface-variant rounded-full text-xs font-medium transition">
                <Edit size={13}/> แก้ไข
              </button>
              <button onClick={() => remove(r.id)}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-error-container hover:bg-error/10 text-on-error-container rounded-full text-xs font-medium transition">
                <Trash2 size={13}/> ลบ
              </button>
            </div>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl shadow-capsule w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-on-surface">{modal.id ? 'แก้ไข' : 'เพิ่ม'}โปรโมชั่น</h3>
              <button onClick={() => setModal(null)}><X size={20} className="text-slate-400"/></button>
            </div>
            <div className="space-y-4">
              {[
                { key:'title', label:'ชื่อโปร', type:'text' },
                { key:'promo_code', label:'Promo Code', type:'text' },
                { key:'description', label:'คำอธิบาย', type:'text' },
                { key:'image_url', label:'URL รูปภาพโปร', type:'text' },
                { key:'badge_text', label:'Badge Text (เช่น NEW, HOT, VIP)', type:'text' },
                { key:'background_color', label:'Background Color/Gradient (CSS)', type:'text' },
                { key:'line1', label:'ข้อความบรรทัด 1 (ไม่บังคับ)', type:'text' },
                { key:'line2', label:'ข้อความบรรทัด 2 (ไม่บังคับ)', type:'text' },
                { key:'bonus_rate', label:'โบนัส (%)', type:'number' },
                { key:'bonus_amount', label:'โบนัสคงที่ (บาท)', type:'number' },
                { key:'min_deposit', label:'ฝากขั้นต่ำ (บาท)', type:'number' },
                { key:'max_withdrawal', label:'ถอนสูงสุด (บาท)', type:'number' },
                { key:'turnover_multiplier', label:'Turnover (x)', type:'number' },
                { key:'default_amount', label:'ยอดฝากตั้งต้น (บาท)', type:'number' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-medium text-on-surface-variant mb-1 block">{f.label}</label>
                  <input type={f.type} value={modal[f.key] ?? ''}
                    onChange={e => setModal(m => ({ ...m, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value }))}
                    className="w-full bg-surface-container-low border-none rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"/>
                </div>
              ))}
              <div>
                <label className="text-xs font-medium text-on-surface-variant mb-1 block">ประเภทโปร</label>
                <select value={modal.type || 'general'} onChange={e => setModal(m => ({ ...m, type: e.target.value }))}
                  className="w-full bg-surface-container-low border-none rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="general">ทั่วไป (general)</option>
                  <option value="welcome">ต้อนรับ (welcome)</option>
                  <option value="deposit">ฝากเงิน (deposit)</option>
                  <option value="rebate">คืนยอด (rebate)</option>
                  <option value="special">พิเศษ (special)</option>
                  <option value="referral">แนะนำเพื่อน (referral)</option>
                </select>
              </div>
              {modal.image_url && <img src={modal.image_url} alt="" className="w-full rounded-xl object-cover max-h-32 border border-outline-variant"/>}
              <div className="flex items-center gap-3">
                <label className="text-sm text-on-surface-variant">สถานะ:</label>
                <button onClick={() => setModal(m => ({ ...m, is_active: !m.is_active }))}
                  className={modal.is_active ? 'text-primary' : 'text-outline'}>
                  {modal.is_active ? <ToggleRight size={32}/> : <ToggleLeft size={32}/>}
                </button>
                <span className="text-sm text-on-surface">{modal.is_active ? 'เปิดใช้งาน' : 'ปิด'}</span>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={save} disabled={working}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-primary/90 text-on-primary rounded-full font-semibold text-sm transition disabled:opacity-60">
                {working ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} บันทึก
              </button>
              <button onClick={() => setModal(null)} className="px-5 py-2.5 bg-surface-container hover:bg-surface-container-high rounded-full text-sm text-on-surface-variant transition">ยกเลิก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
