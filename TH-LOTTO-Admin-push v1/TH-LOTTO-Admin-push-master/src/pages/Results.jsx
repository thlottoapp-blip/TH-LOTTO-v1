import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { Loader2, X, Award, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'
import { toast } from '../components/Toast'

const EMPTY = { result_main:'', p_3top:'', p_3front:'', p_3bottom:'', p_2top:'', p_2bottom:'' }
const fmtDate = (d) => new Date(d + 'T00:00:00').toLocaleDateString('th-TH', { day:'numeric', month:'short', year:'numeric' })
const fmtDt   = (d) => new Date(d).toLocaleString('th-TH', { dateStyle:'short', timeStyle:'short' })
const fmtMoney = (n) => Number(n || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })

export default function Results() {
  const [schedules, setSchedules] = useState([])
  const [resultMap, setResultMap] = useState({})
  const [recent,    setRecent]    = useState([])
  const [loading,   setLoading]   = useState(true)
  const [tab,       setTab]       = useState('pending')
  const [modal,     setModal]     = useState(null)
  const [form,      setForm]      = useState({ ...EMPTY })
  const [working,   setWorking]   = useState(false)
  const [done,      setDone]      = useState(null)

  const load = async () => {
    setLoading(true)
    const since = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
    const [{ data: sched }, { data: res }] = await Promise.all([
      supabase
        .from('draw_schedules')
        .select('id, market_id, draw_date, close_time, status, lottery_markets(id,name,code,type)')
        .neq('status', 'done')
        .gte('draw_date', since)
        .order('draw_date', { ascending: false })
        .order('close_time')
        .limit(100),
      supabase
        .from('lottery_results')
        .select('id, market_id, draw_date, result_main, result_3top, result_2top, result_2bottom, result_3front, result_3bottom, announced_at, lottery_markets(name,code)')
        .gte('draw_date', since)
        .order('announced_at', { ascending: false })
        .limit(50),
    ])
    const map = {}
    res?.forEach(r => { map[`${r.market_id}_${r.draw_date}`] = r })
    setResultMap(map)
    setSchedules(sched || [])
    setRecent(res || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openModal = (s) => {
    setModal(s)
    setForm({ ...EMPTY })
    setDone(null)
  }

  const setField = (k, v) => {
    setForm(f => {
      const next = { ...f, [k]: v }
      if (k === 'result_main' && v.length === 6) {
        next.p_3top = v.slice(-3)
        next.p_2top = v.slice(-2)
      }
      return next
    })
  }

  const submit = async () => {
    const mkt = modal?.lottery_markets
    const isGov = mkt?.type === 'GOVERNMENT'
    if (isGov && form.result_main.length !== 6) { toast.warning('กรุณากรอกรางวัลที่ 1 ให้ครบ 6 หลัก'); return }
    if (!isGov && !form.p_3top) { toast.warning('กรุณากรอก 3 ตัวบน'); return }
    if (!form.p_2bottom) { toast.warning('กรุณากรอก 2 ตัวล่าง'); return }

    setWorking(true)
    const { data, error } = await supabase.rpc('admin_set_result_and_settle', {
      p_market_id:   modal.market_id,
      p_draw_date:   modal.draw_date,
      p_result_main: isGov ? form.result_main : (form.p_3top || null),
      p_3top:        form.p_3top    || null,
      p_3bottom:     form.p_3bottom || null,
      p_3front:      form.p_3front  || null,
      p_2top:        form.p_2top    || null,
      p_2bottom:     form.p_2bottom || null,
    })
    if (error) {
      setWorking(false)
      toast.error(error.message, 'ประกาศผลไม่สำเร็จ')
      return
    }
    // Query actual bet counts — trigger may settle before the RPC loop
    const { data: betsData } = await supabase
      .from('bets')
      .select('status, payout_amount')
      .eq('market_id', modal.market_id)
      .eq('draw_date', modal.draw_date)
      .neq('status', 'PENDING')

    const won     = betsData?.filter(b => b.status === 'WON').length || 0
    const settled = betsData?.length || 0
    const payout  = betsData?.filter(b => b.status === 'WON')
                              .reduce((s, b) => s + Number(b.payout_amount || 0), 0) || 0
    setWorking(false)
    setDone({ settled_bets: settled, won_bets: won, total_payout: payout })
    load()
  }

  const mkt    = modal?.lottery_markets
  const isGov  = mkt?.type === 'GOVERNMENT'
  const already = modal ? !!resultMap[`${modal.market_id}_${modal.draw_date}`] : false

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">ออกผลรางวัล</h1>
          <p className="text-on-surface-variant text-sm">ประกาศผลและชำระรางวัลอัตโนมัติ</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface-variant rounded-full text-sm transition">
          <RefreshCw size={14}/> รีเฟรช
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[['pending','รอออกผล'],['recent','ผลล่าสุด']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition ${tab === k ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}>
            {l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center h-32 items-center"><Loader2 className="animate-spin text-primary" size={24}/></div>
      ) : tab === 'pending' ? (
        <div className="glass-panel rounded-2xl shadow-glass overflow-hidden">
          {schedules.length === 0 ? (
            <div className="text-center py-12 text-outline">ไม่มีงวดที่รอออกผล</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-container text-on-surface-variant text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">ตลาด</th>
                    <th className="px-4 py-3 font-medium">งวดวันที่</th>
                    <th className="px-4 py-3 font-medium">ปิดรับแทง</th>
                    <th className="px-4 py-3 font-medium">สถานะ</th>
                    <th className="px-4 py-3 font-medium">ดำเนินการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {schedules.map(s => {
                    const hasResult = !!resultMap[`${s.market_id}_${s.draw_date}`]
                    return (
                      <tr key={s.id} className="hover:bg-surface-container-low transition">
                        <td className="px-4 py-3">
                          <div className="font-medium text-on-surface">{s.lottery_markets?.name}</div>
                          <div className="text-xs text-outline font-mono">{s.lottery_markets?.code}</div>
                        </td>
                        <td className="px-4 py-3 text-on-surface">{fmtDate(s.draw_date)}</td>
                        <td className="px-4 py-3 text-xs text-on-surface-variant">{fmtDt(s.close_time)}</td>
                        <td className="px-4 py-3">
                          {hasResult ? (
                            <span className="px-2 py-1 rounded-full text-xs bg-secondary-container text-on-secondary-container">ออกผลแล้ว</span>
                          ) : (
                            <span className="px-2 py-1 rounded-full text-xs bg-surface-container-high text-on-surface-variant">{s.status}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {hasResult ? (
                            <span className="text-xs text-on-surface-variant flex items-center gap-1">
                              <CheckCircle2 size={13} className="text-primary"/> เรียบร้อย
                            </span>
                          ) : (
                            <button onClick={() => openModal(s)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary/90 text-on-primary rounded-full text-xs font-medium transition">
                              <Award size={13}/> ออกผล
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="glass-panel rounded-2xl shadow-glass overflow-hidden">
          {recent.length === 0 ? (
            <div className="text-center py-12 text-outline">ยังไม่มีผลรางวัล</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-container text-on-surface-variant text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">ตลาด</th>
                    <th className="px-4 py-3 font-medium">งวดวันที่</th>
                    <th className="px-4 py-3 font-medium">เลขหลัก</th>
                    <th className="px-4 py-3 font-medium">3 ตัวบน</th>
                    <th className="px-4 py-3 font-medium">2 ตัวบน</th>
                    <th className="px-4 py-3 font-medium">2 ตัวล่าง</th>
                    <th className="px-4 py-3 font-medium">ประกาศเมื่อ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {recent.map(r => (
                    <tr key={r.id} className="hover:bg-surface-container-low transition">
                      <td className="px-4 py-3">
                        <div className="font-medium text-on-surface">{r.lottery_markets?.name}</div>
                        <div className="text-xs text-outline font-mono">{r.lottery_markets?.code}</div>
                      </td>
                      <td className="px-4 py-3 text-on-surface">{fmtDate(r.draw_date)}</td>
                      <td className="px-4 py-3 font-bold font-mono text-base tracking-widest text-amber-600">{r.result_main || '-'}</td>
                      <td className="px-4 py-3 font-bold text-primary font-mono text-base">{r.result_3top || '-'}</td>
                      <td className="px-4 py-3 font-mono text-on-surface">{r.result_2top || '-'}</td>
                      <td className="px-4 py-3 font-mono text-on-surface">{r.result_2bottom || '-'}</td>
                      <td className="px-4 py-3 text-xs text-on-surface-variant">{r.announced_at ? fmtDt(r.announced_at) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Result Entry Modal */}
      {modal && !done && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl shadow-capsule w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-on-surface">ออกผลรางวัล</h3>
                <p className="text-sm text-on-surface-variant">{mkt?.name} · {fmtDate(modal.draw_date)}</p>
              </div>
              <button onClick={() => setModal(null)}><X size={20} className="text-outline"/></button>
            </div>

            <div className="bg-error-container/20 border border-error/20 rounded-xl px-4 py-3 mb-5 text-xs flex gap-2 items-start">
              <AlertCircle size={14} className="flex-shrink-0 mt-0.5 text-error"/>
              <span className="text-on-surface-variant">หลังกด "ประกาศผล" ระบบชำระเงินรางวัลทันที — ตรวจสอบให้ถูกต้องก่อนยืนยัน</span>
            </div>

            <div className="space-y-4">
              {isGov && (
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">รางวัลที่ 1 (6 หลัก)</label>
                  <input value={form.result_main}
                    onChange={e => setField('result_main', e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="เช่น 834579" maxLength={6}
                    className="w-full bg-surface-container-low border-none rounded-full px-4 py-3 text-lg font-mono text-center tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-primary"/>
                  {form.result_main.length === 6 && (
                    <p className="text-xs text-outline mt-1.5 text-center">
                      คำนวณอัตโนมัติ → 3 ตัวบน: <b className="text-primary">{form.p_3top}</b> · 2 ตัวบน: <b className="text-primary">{form.p_2top}</b>
                    </p>
                  )}
                </div>
              )}

              {!isGov && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">3 ตัวบน</label>
                    <input value={form.p_3top} onChange={e => setField('p_3top', e.target.value.replace(/\D/g,'').slice(0,3))}
                      placeholder="เช่น 579" maxLength={3}
                      className="w-full bg-surface-container-low border-none rounded-full px-4 py-3 text-lg font-mono text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-primary"/>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">2 ตัวบน</label>
                    <input value={form.p_2top} onChange={e => setField('p_2top', e.target.value.replace(/\D/g,'').slice(0,2))}
                      placeholder="เช่น 79" maxLength={2}
                      className="w-full bg-surface-container-low border-none rounded-full px-4 py-3 text-lg font-mono text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-primary"/>
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">2 ตัวล่าง</label>
                <input value={form.p_2bottom} onChange={e => setField('p_2bottom', e.target.value.replace(/\D/g,'').slice(0,2))}
                  placeholder="เช่น 69" maxLength={2}
                  className="w-full bg-surface-container-low border-none rounded-full px-4 py-3 text-lg font-mono text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-primary"/>
              </div>

              {isGov && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">3 ตัวหน้า (คั่นด้วยเว้นวรรค)</label>
                    <input value={form.p_3front} onChange={e => setField('p_3front', e.target.value)}
                      placeholder="เช่น 123 456"
                      className="w-full bg-surface-container-low border-none rounded-full px-4 py-2.5 text-sm font-mono text-center focus:outline-none focus:ring-2 focus:ring-primary"/>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">3 ตัวล่าง (คั่นด้วยเว้นวรรค)</label>
                    <input value={form.p_3bottom} onChange={e => setField('p_3bottom', e.target.value)}
                      placeholder="เช่น 868 424"
                      className="w-full bg-surface-container-low border-none rounded-full px-4 py-2.5 text-sm font-mono text-center focus:outline-none focus:ring-2 focus:ring-primary"/>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={submit} disabled={working}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary/90 text-on-primary rounded-full font-bold text-sm transition disabled:opacity-60">
                {working ? <Loader2 size={16} className="animate-spin"/> : <Award size={16}/>}
                ประกาศผล + ชำระรางวัล
              </button>
              <button onClick={() => setModal(null)} className="px-5 py-3 bg-surface-container hover:bg-surface-container-high rounded-full text-sm text-on-surface-variant transition">ยกเลิก</button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {modal && done && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl shadow-capsule w-full max-w-sm p-8 text-center">
            <CheckCircle2 size={56} className="text-primary mx-auto mb-4"/>
            <h3 className="text-xl font-bold text-on-surface mb-1">ประกาศผลสำเร็จ!</h3>
            <p className="text-sm text-on-surface-variant mb-5">{mkt?.name} · งวด {fmtDate(modal?.draw_date)}</p>
            <div className="bg-surface-container rounded-2xl p-5 space-y-3 mb-6 text-left">
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">รายการที่ชำระแล้ว</span>
                <span className="font-semibold text-on-surface">{done.settled_bets} รายการ</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">ถูกรางวัล</span>
                <span className="font-semibold text-primary">{done.won_bets} รายการ</span>
              </div>
              <div className="border-t border-outline-variant pt-3 flex justify-between">
                <span className="text-on-surface-variant text-sm">ยอดรางวัลรวม</span>
                <span className="text-xl font-black text-primary">฿{fmtMoney(done.total_payout)}</span>
              </div>
            </div>
            <button onClick={() => { setModal(null); setDone(null) }}
              className="w-full py-3 bg-primary hover:bg-primary/90 text-on-primary rounded-full font-bold text-sm transition">
              ปิด
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
