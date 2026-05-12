import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { Plus, Edit, Trash2, Loader2, X, Save } from 'lucide-react'
import { toast } from '../components/Toast'

const EMPTY = { name:'', code:'', image_url:'', is_active:true }

export default function Banks() {
  const [rows, setRows]     = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]   = useState(null)
  const [working, setWorking] = useState(false)

  const load = async () => {
    const { data } = await supabase.from('banks').select('*').order('name')
    setRows(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    if (!modal.name || !modal.code) { toast.warning('กรุณากรอกชื่อและรหัสธนาคาร'); return }
    setWorking(true)
    let error
    if (modal.id) {
      ({ error } = await supabase.from('banks').update({ name: modal.name, code: modal.code, image_url: modal.image_url, is_active: modal.is_active }).eq('id', modal.id))
    } else {
      ({ error } = await supabase.from('banks').insert({ name: modal.name, code: modal.code, image_url: modal.image_url, is_active: modal.is_active }))
    }
    setWorking(false)
    if (error) { toast.error('เกิดข้อผิดพลาด: ' + error.message); return }
    setModal(null); load()
  }

  const remove = async (id) => {
    if (!confirm('ลบธนาคารนี้?')) return
    try {
      const { error } = await supabase.from('banks').delete().eq('id', id)
      if (error) throw error
      load()
    } catch (e) {
      toast.error('เกิดข้อผิดพลาด: ' + e.message)
    }
  }

  const toggle = async (id, val) => {
    await supabase.from('banks').update({ is_active: !val }).eq('id', id)
    load()
  }

  if (loading) return <div className="flex justify-center h-32 items-center"><Loader2 className="animate-spin text-primary" size={24}/></div>

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">ธนาคารที่รองรับ</h1>
          <p className="text-on-surface-variant text-sm">รายการธนาคารที่ผู้ใช้เลือกได้ตอนสมัคร</p>
        </div>
        <button onClick={() => setModal({ ...EMPTY })}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-on-primary rounded-full text-sm font-medium transition">
          <Plus size={15}/> เพิ่มธนาคาร
        </button>
      </div>

      <div className="glass-panel rounded-2xl shadow-glass overflow-hidden">
        {rows.length === 0 ? (
          <div className="text-center py-12 text-outline">ยังไม่มีธนาคาร</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {rows.map(r => (
              <div key={r.id} className={`flex items-center gap-4 p-4 hover:bg-surface-container-low transition ${!r.is_active ? 'opacity-60' : ''}`}>
                {r.image_url
                  ? <img src={r.image_url} alt={r.name} className="w-10 h-10 object-contain rounded-lg border border-slate-100"/>
                  : <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant text-xs font-bold">{r.code?.slice(0,2)}</div>
                }
                <div className="flex-1">
                  <div className="font-semibold text-on-surface">{r.name}</div>
                  <div className="text-xs text-outline font-mono">{r.code}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggle(r.id, r.is_active)}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${r.is_active ? 'bg-secondary-container text-on-secondary-container hover:bg-secondary/20' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}>
                    {r.is_active ? '🟢 เปิด' : '⛔ ปิด'}
                  </button>
                  <button onClick={() => setModal({ ...r })} className="p-2 text-primary hover:bg-primary/10 rounded-lg transition"><Edit size={15}/></button>
                  <button onClick={() => remove(r.id)} className="p-2 text-error hover:bg-error/10 rounded-lg transition"><Trash2 size={15}/></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl shadow-capsule w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-on-surface">{modal.id ? 'แก้ไข' : 'เพิ่ม'}ธนาคาร</h3>
              <button onClick={() => setModal(null)}><X size={20} className="text-slate-400"/></button>
            </div>
            <div className="space-y-4">
              {[
                { key:'name', label:'ชื่อธนาคาร', placeholder:'เช่น ธนาคารกสิกรไทย' },
                { key:'code', label:'รหัส (Code)', placeholder:'เช่น KBANK' },
                { key:'image_url', label:'URL โลโก้ธนาคาร', placeholder:'https://...' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-medium text-on-surface-variant mb-1 block">{f.label}</label>
                  <input value={modal[f.key] || ''} placeholder={f.placeholder}
                    onChange={e => setModal(m => ({ ...m, [f.key]: e.target.value }))}
                    className="w-full bg-surface-container-low border-none rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"/>
                </div>
              ))}
              {modal.image_url && <img src={modal.image_url} alt="" className="w-16 h-16 object-contain rounded-xl border border-slate-100"/>}
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={modal.is_active} onChange={e => setModal(m => ({ ...m, is_active: e.target.checked }))} className="w-4 h-4"/>
                <label className="text-sm text-slate-600">เปิดให้เลือกได้</label>
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
