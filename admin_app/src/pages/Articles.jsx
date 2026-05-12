import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { Plus, Edit, Trash2, Loader2, X, Save } from 'lucide-react'
import { toast } from '../components/Toast'

const EMPTY = { title:'', content:'', image_url:'', category:'ข่าวสาร', is_published:true }

export default function Articles() {
  const [rows, setRows]     = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]   = useState(null)
  const [working, setWorking] = useState(false)

  const load = async () => {
    const { data } = await supabase.from('articles').select('*').order('created_at', { ascending: false })
    setRows(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    setWorking(true)
    const { id, created_at, updated_at, ...fields } = modal
    let error
    if (id) {
      ({ error } = await supabase.from('articles').update(fields).eq('id', id))
    } else {
      ({ error } = await supabase.from('articles').insert(fields))
    }
    setWorking(false)
    if (error) { toast.error('เกิดข้อผิดพลาด: ' + error.message); return }
    setModal(null); load()
  }

  const remove = async (id) => {
    if (!confirm('ลบบทความนี้?')) return
    try {
      const { error } = await supabase.from('articles').delete().eq('id', id)
      if (error) throw error
      load()
    } catch (e) {
      toast.error('เกิดข้อผิดพลาด: ' + e.message)
    }
  }

  if (loading) return <div className="flex justify-center h-32 items-center"><Loader2 className="animate-spin text-primary" size={24}/></div>

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">บทความ / ข่าวสาร</h1>
          <p className="text-on-surface-variant text-sm">จัดการเนื้อหาบทความในแอพ</p>
        </div>
        <button onClick={() => setModal({ ...EMPTY })}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-on-primary rounded-full text-sm font-medium transition">
          <Plus size={15}/> เพิ่มบทความ
        </button>
      </div>

      <div className="glass-panel rounded-2xl shadow-glass overflow-hidden">
        {rows.length === 0 ? (
          <div className="text-center py-12 text-outline">ยังไม่มีบทความ</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {rows.map(r => (
              <div key={r.id} className="flex items-center gap-4 p-4 hover:bg-surface-container-low transition">
                {r.image_url && <img src={r.image_url} alt={r.title} className="w-16 h-12 object-cover rounded-lg flex-shrink-0"/>}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-on-surface truncate">{r.title}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-surface-container text-on-surface-variant px-2 py-0.5 rounded-full">{r.category}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${r.is_published ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container text-on-surface-variant'}`}>
                      {r.is_published ? 'เผยแพร่แล้ว' : 'ฉบับร่าง'}
                    </span>
                    <span className="text-xs text-outline">{new Date(r.created_at).toLocaleDateString('th-TH')}</span>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
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
          <div className="glass-panel rounded-2xl shadow-capsule w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-on-surface">{modal.id ? 'แก้ไข' : 'เพิ่ม'}บทความ</h3>
              <button onClick={() => setModal(null)}><X size={20} className="text-slate-400"/></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-on-surface-variant mb-1 block">หัวข้อ</label>
                <input value={modal.title} onChange={e => setModal(m => ({ ...m, title: e.target.value }))}
                  className="w-full bg-surface-container-low border-none rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"/>
              </div>
              <div>
                <label className="text-xs font-medium text-on-surface-variant mb-1 block">URL รูปภาพ</label>
                <input value={modal.image_url || ''} onChange={e => setModal(m => ({ ...m, image_url: e.target.value }))}
                  className="w-full bg-surface-container-low border-none rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"/>
              </div>
              <div>
                <label className="text-xs font-medium text-on-surface-variant mb-1 block">หมวดหมู่</label>
                <select value={modal.category} onChange={e => setModal(m => ({ ...m, category: e.target.value }))}
                  className="w-full bg-surface-container-low border-none rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                  <option>ข่าวสาร</option><option>เทคนิค</option><option>โปรโมชั่น</option><option>อื่นๆ</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-on-surface-variant mb-1 block">เนื้อหา</label>
                <textarea value={modal.content || ''} onChange={e => setModal(m => ({ ...m, content: e.target.value }))}
                  className="w-full bg-surface-container-low border-none rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none h-40"/>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={modal.is_published} onChange={e => setModal(m => ({ ...m, is_published: e.target.checked }))} className="w-4 h-4"/>
                <label className="text-sm text-slate-600">เผยแพร่ทันที</label>
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
