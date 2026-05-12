import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { toast } from '../components/Toast'

export default function RestrictedNumbers() {
  const [markets, setMarkets] = useState([])
  const [rows, setRows]       = useState([])
  const [market, setMarket]   = useState('')
  const [numbers, setNumbers] = useState('')
  const [betType, setBetType] = useState('3TOP')
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)

  const BET_TYPES = ['3TOP','3TODE','3FRONT','3BOTTOM','2TOP','2BOTTOM','RUN_UP','RUN_DOWN','4TOP']

  useEffect(() => {
    Promise.all([
      supabase.from('lottery_markets').select('id,name').eq('is_active', true).order('name'),
      supabase.from('restricted_numbers').select('id,number,bet_type,created_at,lottery_markets(name)').order('created_at', { ascending: false })
    ]).then(([m, r]) => {
      setMarkets(m.data || [])
      setRows(r.data || [])
      if (m.data?.length) setMarket(m.data[0].id)
      setLoading(false)
    })
  }, [])

  const add = async () => {
    if (!numbers.trim() || !market) { toast.warning('กรุณากรอกข้อมูลให้ครบ'); return }
    setWorking(true)
    const numList = numbers.split(/[\s,]+/).filter(Boolean)
    for (const n of numList) {
      await supabase.from('restricted_numbers').insert({ market_id: market, number: n.trim(), bet_type: betType })
    }
    setNumbers('')
    const { data } = await supabase.from('restricted_numbers').select('id,number,bet_type,created_at,lottery_markets(name)').order('created_at', { ascending: false })
    setRows(data || [])
    setWorking(false)
  }

  const remove = async (id) => {
    if (!confirm('ลบเลขอั้นนี้?')) return
    try {
      const { error } = await supabase.from('restricted_numbers').delete().eq('id', id)
      if (error) throw error
      setRows(r => r.filter(x => x.id !== id))
    } catch (e) {
      toast.error('เกิดข้อผิดพลาด: ' + e.message)
    }
  }

  if (loading) return <div className="flex justify-center h-32 items-center"><Loader2 className="animate-spin text-primary" size={24}/></div>

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-on-surface">จัดการเลขอั้น</h1>
        <p className="text-on-surface-variant text-sm">เลขที่ไม่รับแทงในแต่ละตลาด</p>
      </div>

      <div className="glass-panel rounded-2xl shadow-glass p-5">
        <h3 className="font-semibold text-on-surface-variant mb-4">เพิ่มเลขอั้น</h3>
        <div className="flex flex-wrap gap-3">
          <select value={market} onChange={e => setMarket(e.target.value)}
            className="bg-surface-container-low border-none rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
            {markets.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <select value={betType} onChange={e => setBetType(e.target.value)}
            className="bg-surface-container-low border-none rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
            {BET_TYPES.map(b => <option key={b}>{b}</option>)}
          </select>
          <input value={numbers} onChange={e => setNumbers(e.target.value)}
            placeholder="เลข (คั่นด้วยช่องว่าง/จุลภาค)"
            className="flex-1 min-w-48 bg-surface-container-low border-none rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"/>
          <button onClick={add} disabled={working}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-on-primary rounded-full text-sm font-medium transition disabled:opacity-60">
            {working ? <Loader2 size={15} className="animate-spin"/> : <Plus size={15}/>} เพิ่ม
          </button>
        </div>
      </div>

      <div className="glass-panel rounded-2xl shadow-glass overflow-hidden">
        {rows.length === 0 ? (
          <div className="text-center py-12 text-outline">ยังไม่มีเลขอั้น</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-container text-on-surface-variant text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">ตลาด</th>
                  <th className="px-4 py-3 font-medium">เลข</th>
                  <th className="px-4 py-3 font-medium">ประเภท</th>
                  <th className="px-4 py-3 font-medium">เพิ่มเมื่อ</th>
                  <th className="px-4 py-3 font-medium">ลบ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {rows.map(r => (
                  <tr key={r.id} className="hover:bg-surface-container-low transition">
                    <td className="px-4 py-3 text-on-surface">{r.lottery_markets?.name || '-'}</td>
                    <td className="px-4 py-3 font-bold text-lg text-error">{r.number}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 bg-secondary-container text-on-secondary-container rounded-full text-xs font-medium">{r.bet_type}</span></td>
                    <td className="px-4 py-3 text-xs text-outline">{new Date(r.created_at).toLocaleString('th-TH')}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => remove(r.id)} className="p-1.5 text-error hover:bg-error/10 rounded-lg transition"><Trash2 size={15}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
