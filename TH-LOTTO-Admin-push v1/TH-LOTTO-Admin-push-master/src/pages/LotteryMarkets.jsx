import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { Edit, Loader2, X, Save, ToggleLeft, ToggleRight, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from '../components/Toast'

const DAY_LABEL = { 1:'จันทร์', 2:'อังคาร', 3:'พุธ', 4:'พฤหัส', 5:'ศุกร์', 6:'เสาร์', 7:'อาทิตย์' }
const BET_TYPES = [
  { key:'4TOP',    label:'4 ตัวบน' },
  { key:'3TOP',    label:'3 ตัวบน' },
  { key:'3TODE',   label:'3 ตัวโต๊ด' },
  { key:'3FRONT',  label:'3 ตัวหน้า' },
  { key:'3BOTTOM', label:'3 ตัวล่าง' },
  { key:'2TOP',    label:'2 ตัวบน' },
  { key:'2BOTTOM', label:'2 ตัวล่าง' },
  { key:'RUN_UP',  label:'วิ่งบน' },
  { key:'RUN_DOWN',label:'วิ่งล่าง' },
]
const fmt = (n) => Number(n||0).toLocaleString('th-TH')

export default function LotteryMarkets() {
  const [markets, setMarkets]   = useState([])
  const [allRates, setAllRates] = useState({})
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState(null)
  const [rates, setRates]       = useState({})
  const [expanded, setExpanded] = useState(null)
  const [working, setWorking]   = useState(false)

  const load = async () => {
    const [mRes, rRes] = await Promise.all([
      supabase.from('lottery_markets').select('*').order('display_order'),
      supabase.from('payout_rates').select('market,bet_type,rate'),
    ])
    setMarkets(mRes.data || [])
    // Group payout_rates by market code
    const grouped = {}
    ;(rRes.data || []).forEach(r => {
      if (!grouped[r.market]) grouped[r.market] = {}
      grouped[r.market][r.bet_type] = r.rate
    })
    setAllRates(grouped)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openModal = (m) => {
    setRates({ ...(allRates[m.code] || {}) })
    setModal({ ...m })
  }

  const save = async () => {
    if (!modal.name) { toast.warning('กรุณากรอกชื่อตลาด'); return }
    setWorking(true)
    const { error } = await supabase.from('lottery_markets').update({
      name: modal.name,
      logo_url: modal.logo_url,
      stream_url: modal.stream_url || '',
      draw_time: modal.draw_time,
      close_minutes_before: Number(modal.close_minutes_before),
      is_active: modal.is_active,
    }).eq('id', modal.id)
    if (error) { setWorking(false); toast.error('เกิดข้อผิดพลาด: ' + error.message); return }
    // Save payout rates — uses market code string, column name is 'rate'
    for (const [bet_type, rate] of Object.entries(rates)) {
      if (rate === '' || rate === null || rate === undefined) continue
      await supabase.from('payout_rates')
        .upsert({ market: modal.code, bet_type, rate: Number(rate) }, { onConflict: 'market,bet_type' })
    }
    setWorking(false); setModal(null); load()
  }

  const toggleActive = async (id, val) => {
    await supabase.from('lottery_markets').update({ is_active: !val }).eq('id', id)
    load()
  }

  if (loading) return <div className="flex justify-center h-32 items-center"><Loader2 className="animate-spin text-primary" size={24}/></div>

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-on-surface">จัดการตลาดหวย</h1>
        <p className="text-on-surface-variant text-sm">แก้ไขข้อมูลตลาด เปิด/ปิด และตั้งอัตราจ่ายรางวัล</p>
      </div>

      <div className="space-y-3">
        {markets.map(m => {
          const mRates = allRates[m.code] || {}
          const dayStr = m.draw_days?.map(d => DAY_LABEL[d]).filter(Boolean).join(', ')
          const dateStr = m.draw_day_of_month?.join(', ')
          return (
            <div key={m.id} className="glass-panel rounded-2xl shadow-glass overflow-hidden">
              <div className="flex items-center gap-4 p-4">
                {m.logo_url
                  ? <img src={m.logo_url} alt={m.name} className="w-10 h-10 rounded-xl object-contain border border-outline-variant flex-shrink-0"/>
                  : <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-outline text-xs font-bold flex-shrink-0">{m.code?.slice(0,2)}</div>
                }
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-on-surface">{m.name}</span>
                    <span className="text-xs bg-surface-container text-on-surface-variant px-2 py-0.5 rounded-full font-mono">{m.code}</span>
                  </div>
                  <div className="text-xs text-on-surface-variant mt-0.5">
                    ออก {m.draw_time?.slice(0,5)} น. · ปิดรับก่อน {m.close_minutes_before} นาที
                    {dayStr && ` · ${dayStr}`}
                    {dateStr && ` · วันที่ ${dateStr}`}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => toggleActive(m.id, m.is_active)} className={m.is_active ? 'text-primary' : 'text-outline'}>
                    {m.is_active ? <ToggleRight size={28}/> : <ToggleLeft size={28}/>}
                  </button>
                  <button onClick={() => openModal(m)} className="p-2 text-primary hover:bg-primary/10 rounded-lg transition"><Edit size={15}/></button>
                  <button onClick={() => setExpanded(expanded === m.id ? null : m.id)} className="p-2 text-outline hover:bg-surface-container rounded-lg transition">
                    {expanded === m.id ? <ChevronUp size={15}/> : <ChevronDown size={15}/>}
                  </button>
                </div>
              </div>
              {expanded === m.id && (
                <div className="border-t border-outline-variant px-4 py-3 bg-surface-container-low">
                  <div className="text-xs font-semibold text-on-surface-variant mb-2">อัตราจ่ายรางวัล</div>
                  {Object.keys(mRates).length === 0
                    ? <div className="text-xs text-outline">ยังไม่ได้ตั้งอัตราจ่าย</div>
                    : <div className="flex flex-wrap gap-2">
                        {Object.entries(mRates).map(([bt, rate]) => (
                          <div key={bt} className="glass-panel rounded-lg px-3 py-1.5 text-center">
                            <div className="text-xs text-on-surface-variant">{BET_TYPES.find(b => b.key === bt)?.label || bt}</div>
                            <div className="font-bold text-secondary text-sm">{fmt(rate)}x</div>
                          </div>
                        ))}
                      </div>
                  }
                </div>
              )}
            </div>
          )
        })}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl shadow-capsule w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-on-surface">แก้ไขตลาด: {modal.name}</h3>
              <button onClick={() => setModal(null)}><X size={20} className="text-outline"/></button>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-on-surface-variant mb-1 block">ชื่อตลาด</label>
                  <input value={modal.name} onChange={e => setModal(m => ({ ...m, name: e.target.value }))}
                    className="w-full bg-surface-container-low border-none rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"/>
                </div>
                <div>
                  <label className="text-xs font-medium text-on-surface-variant mb-1 block">เวลาออกรางวัล</label>
                  <input type="time" value={modal.draw_time?.slice(0,5) || ''} onChange={e => setModal(m => ({ ...m, draw_time: e.target.value }))}
                    className="w-full bg-surface-container-low border-none rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"/>
                </div>
                <div>
                  <label className="text-xs font-medium text-on-surface-variant mb-1 block">ปิดรับก่อน (นาที)</label>
                  <input type="number" value={modal.close_minutes_before || 0} onChange={e => setModal(m => ({ ...m, close_minutes_before: e.target.value }))}
                    className="w-full bg-surface-container-low border-none rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"/>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-on-surface-variant mb-1 block">URL โลโก้</label>
                  <input value={modal.logo_url || ''} onChange={e => setModal(m => ({ ...m, logo_url: e.target.value }))}
                    className="w-full bg-surface-container-low border-none rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"/>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-on-surface-variant mb-1 block">🔴 URL ถ่ายทอดสด (YouTube) — ว่าง = ไม่แสดงวิดีโอ</label>
                  <input value={modal.stream_url || ''} onChange={e => setModal(m => ({ ...m, stream_url: e.target.value }))}
                    placeholder="https://youtube.com/live/XXXX หรือ https://youtu.be/XXXX"
                    className="w-full bg-surface-container-low border-none rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"/>
                </div>
              </div>

              <div className="bg-surface-container-low rounded-xl p-4 space-y-3">
                <h4 className="font-semibold text-on-surface-variant text-sm">อัตราจ่ายรางวัล (เท่า) — รหัสตลาด: <span className="font-mono text-secondary">{modal.code}</span></h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {BET_TYPES.map(bt => (
                    <div key={bt.key}>
                      <label className="text-xs text-on-surface-variant mb-1 block">{bt.label}</label>
                      <input type="number" step="0.01"
                        value={rates[bt.key] ?? ''}
                        placeholder="ไม่ใช้"
                        onChange={e => setRates(r => ({ ...r, [bt.key]: e.target.value }))}
                        className="w-full bg-surface-container border-none rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"/>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input type="checkbox" id="mkt-active" checked={!!modal.is_active} onChange={e => setModal(m => ({ ...m, is_active: e.target.checked }))} className="w-4 h-4"/>
                <label htmlFor="mkt-active" className="text-sm text-on-surface-variant">เปิดใช้งานตลาดนี้</label>
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
