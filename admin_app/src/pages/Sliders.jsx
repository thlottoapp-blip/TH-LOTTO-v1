import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { Plus, Trash2, Loader2, X, Save, ArrowUp, ArrowDown } from 'lucide-react'
import { toast } from '../components/Toast'

const EMPTY = { title:'', description:'', image_url:'', link_url:'', button_text:'', display_order:0, is_active:true }

export default function Sliders() {
  const [rows, setRows]     = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]   = useState(null)
  const [working, setWorking] = useState(false)

  const load = async () => {
    const { data } = await supabase.from('sliders').select('*').order('display_order')
    setRows(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    setWorking(true)
    const { id, updated_at, slide_code, ...fields } = modal
    let error
    if (id) {
      ({ error } = await supabase.from('sliders').update(fields).eq('id', id))
    } else {
      ({ error } = await supabase.from('sliders').insert(fields))
    }
    setWorking(false)
    if (error) { toast.error('เกิดข้อผิดพลาด: ' + error.message); return }
    setModal(null); load()
  }

  const remove = async (id) => {
    if (!confirm('ลบแบนเนอร์นี้?')) return
    await supabase.from('sliders').delete().eq('id', id)
    load()
  }

  const moveOrder = async (id, dir) => {
    const idx = rows.findIndex(r => r.id === id)
    const swapIdx = idx + dir
    if (swapIdx < 0 || swapIdx >= rows.length) return
    const a = rows[idx], b = rows[swapIdx]
    await supabase.from('sliders').update({ display_order: b.display_order }).eq('id', a.id)
    await supabase.from('sliders').update({ display_order: a.display_order }).eq('id', b.id)
    load()
  }

  if (loading) return <div className="flex justify-center h-32 items-center"><Loader2 className="animate-spin text-primary" size={24}/></div>

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">แบนเนอร์ / Slider</h1>
          <p className="text-on-surface-variant text-sm">จัดการรูปภาพ Slider หน้าหลัก</p>
        </div>
        <button onClick={() => setModal({ ...EMPTY, display_order: rows.length + 1 })}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-on-primary rounded-full text-sm font-medium transition">
          <Plus size={15}/> เพิ่มแบนเนอร์
        </button>
      </div>

      <div className="space-y-3">
        {rows.length === 0 && <div className="text-center py-12 text-outline glass-panel rounded-2xl">ยังไม่มีแบนเนอร์</div>}
        {rows.map((r, i) => (
          <div key={r.id} className={`glass-panel rounded-2xl shadow-glass p-4 flex items-center gap-4 ${!r.is_active ? 'opacity-50' : ''}`}>
            {r.image_url && (
              <img src={r.image_url} alt={r.title} className="w-32 h-20 object-cover rounded-xl border border-outline-variant flex-shrink-0"/>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-on-surface">{r.title || 'ไม่มีชื่อ'}</div>
              {r.link_url && <div className="text-xs text-secondary truncate">{r.link_url}</div>}
              <div className="text-xs text-outline mt-1">ลำดับ: {r.display_order} · {r.is_active ? '🟢 แสดง' : '⛔ ซ่อน'}</div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex flex-col gap-1">
                <button onClick={() => moveOrder(r.id, -1)} disabled={i === 0} className="p-1 text-outline hover:text-on-surface-variant disabled:opacity-30"><ArrowUp size={14}/></button>
                <button onClick={() => moveOrder(r.id, 1)} disabled={i === rows.length-1} className="p-1 text-outline hover:text-on-surface-variant disabled:opacity-30"><ArrowDown size={14}/></button>
              </div>
              <button onClick={() => setModal({ ...r })} className="p-2 text-primary hover:bg-primary/10 rounded-lg transition">✎</button>
              <button onClick={() => remove(r.id)} className="p-2 text-error hover:bg-error/10 rounded-lg transition"><Trash2 size={15}/></button>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl shadow-capsule w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-on-surface">{modal.id ? 'แก้ไข' : 'เพิ่ม'}แบนเนอร์</h3>
              <button onClick={() => setModal(null)}><X size={20} className="text-outline"/></button>
            </div>
            <div className="space-y-4">
              {[
                { key:'title', label:'ชื่อ (ใช้ภายใน)', type:'text', placeholder:'เช่น แบนเนอร์โปรต้อนรับ' },
                { key:'description', label:'คำบรรยาย', type:'text', placeholder:'ข้อความใต้แบนเนอร์' },
                { key:'image_url', label:'URL รูปภาพ', type:'text', placeholder:'https://...' },
                { key:'link_url', label:'URL ลิงค์ (ถ้ากดแล้วไปไหน)', type:'text', placeholder:'https://...' },
                { key:'button_text', label:'ข้อความปุ่ม', type:'text', placeholder:'เช่น รับสิทธิ์เลย' },
                { key:'display_order', label:'ลำดับ', type:'number', placeholder:'1' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-medium text-on-surface-variant mb-1 block">{f.label}</label>
                  <input type={f.type} value={modal[f.key] ?? ''} placeholder={f.placeholder}
                    onChange={e => setModal(m => ({ ...m, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value }))}
                    className="w-full bg-surface-container-low border-none rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"/>
                </div>
              ))}
              {modal.image_url && <img src={modal.image_url} alt="" className="w-full rounded-xl object-cover max-h-40 border border-outline-variant"/>}
              <div className="flex items-center gap-3">
                <label className="text-sm text-on-surface-variant">แสดง:</label>
                <input type="checkbox" checked={modal.is_active} onChange={e => setModal(m => ({ ...m, is_active: e.target.checked }))} className="w-4 h-4"/>
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
