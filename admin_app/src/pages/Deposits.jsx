import React, { useEffect, useState, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { CheckCircle, XCircle, Eye, Search, Loader2, Download } from 'lucide-react'
import BankBadge from '../components/BankBadge'
import { toast } from '../components/Toast'
import { useModal } from '../contexts/ModalContext'

const STATUS_LABEL = { PENDING: { label: 'รอดำเนินการ', cls: 'bg-warning-container text-on-warning-container' }, APPROVED: { label: 'อนุมัติแล้ว', cls: 'bg-secondary-container text-on-secondary-container' }, REJECTED: { label: 'ปฏิเสธ', cls: 'bg-error-container text-on-error-container' } }
const fmt = (n) => Number(n || 0).toLocaleString('th-TH')

const exportCSV = (rows) => {
  const headers = ['วันที่','ชื่อ','Member ID','เบอร์','ยอด','โปร','สถานะ','ผู้ดำเนินการ','วันที่อนุมัติ','หมายเหตุ']
  const escape = v => `"${String(v ?? '').replace(/"/g,'""')}"`
  const lines = rows.map(r => [
    new Date(r.created_at).toLocaleString('th-TH'),
    r.profiles?.full_name, r.profiles?.member_id, r.profiles?.phone,
    r.amount, r.promo_code || '', r.status,
    r.approver?.full_name || '', r.approved_at ? new Date(r.approved_at).toLocaleString('th-TH') : '',
    r.admin_note || ''
  ].map(escape).join(','))
  const csv = '\uFEFF' + [headers.join(','), ...lines].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url
  a.download = `deposits_${new Date().toISOString().slice(0,10)}.csv`
  a.click(); URL.revokeObjectURL(url)
}

export default function Deposits() {
  const [rows, setRows]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [status, setStatus]     = useState('PENDING')
  const [preview, setPreview]   = useState(null)
  const [modal, setModal]       = useState(null)
  const [note, setNote]         = useState('')
  const [working, setWorking]   = useState(false)
  const { showSuccess, showError, showWarning, showConfirm } = useModal()

  const load = async () => {
    setLoading(true)
    let q = supabase.from('deposit_requests')
      .select('id,amount,slip_url,status,admin_note,created_at,promo_code,approved_at,approved_by,profiles!user_id(full_name,member_id,phone,bank_name,bank_account_number),approver:profiles!approved_by(full_name)')
      .order('created_at', { ascending: false })
    if (status !== 'ALL') q = q.eq('status', status)
    if (search) {
      const { data: matched } = await supabase.from('profiles').select('id')
        .or(`member_id.ilike.%${search}%,phone.ilike.%${search}%,full_name.ilike.%${search}%`)
      const ids = (matched || []).map(p => p.id)
      if (ids.length === 0) { setRows([]); setLoading(false); return }
      q = q.in('user_id', ids)
    }
    const { data } = await q
    setRows(data || [])
    setLoading(false)
  }

  const loadRef = useRef(load)
  useEffect(() => { loadRef.current = load })

  useEffect(() => { load() }, [status, search])

  useEffect(() => {
    const ch = supabase.channel('deposits-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deposit_requests' }, () => loadRef.current())
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [])

  const doApprove = async () => {
    setWorking(true)
    const { error } = await supabase.rpc('admin_approve_deposit', { p_request_id: modal.id, p_note: note || null })
    setWorking(false)
    if (error) { 
      showError('อนุมัติไม่สำเร็จ', error.message)
      return 
    }
    showSuccess('อนุมัติสำเร็จ!', `อนุมัติการฝากเงิน ฿${Number(modal?.amount || 0).toLocaleString()} แล้ว`)
    setModal(null); setNote(''); load()
  }

  const doReject = async () => {
    if (!note) { 
      showWarning('กรุณาระบุเหตุผล', 'ต้องระบุเหตุผลที่ปฏิเสธก่อน')
      return 
    }
    setWorking(true)
    const { error } = await supabase.rpc('admin_reject_deposit', { p_request_id: modal.id, p_note: note })
    setWorking(false)
    if (error) { 
      showError('ปฏิเสธไม่สำเร็จ', error.message)
      return 
    }
    showSuccess('ปฏิเสธสำเร็จ!', 'รายการฝากเงินถูกปฏิเสธแล้ว')
    setModal(null); setNote(''); load()
  }

  const handleApprove = () => {
    showConfirm(
      'ยืนยันการอนุมัติ?',
      `อนุมัติการฝากเงิน ฿${Number(modal?.amount || 0).toLocaleString()}\nสมาชิก: ${modal?.profiles?.full_name || '-'}`,
      doApprove,
      'ยืนยันอนุมัติ',
      'ยกเลิก'
    )
  }

  const handleReject = () => {
    showConfirm(
      'ยืนยันการปฏิเสธ?',
      `ปฏิเสธการฝากเงิน ฿${Number(modal?.amount || 0).toLocaleString()}\nสมาชิก: ${modal?.profiles?.full_name || '-'}\n\nเหตุผล: ${note || '(ยังไม่ระบุ)'}`,
      doReject,
      'ยืนยันปฏิเสธ',
      'ยกเลิก'
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-on-surface">อนุมัติฝากเงิน</h1>
        <p className="text-on-surface-variant text-sm">ตรวจสอบสลิปและอนุมัติคำขอฝากเงิน</p>
      </div>

      {/* Filters */}
      <div className="glass-panel rounded-2xl shadow-glass p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline"/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหาชื่อ/เบอร์/Member ID"
            className="w-full pl-9 pr-4 py-2 rounded-full bg-surface-container-low border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary"/>
        </div>
        <div className="flex gap-2 flex-wrap">
          {['PENDING','APPROVED','REJECTED','ALL'].map(s => (
            <button key={s} onClick={() => setStatus(s)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${status === s ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}>
              {s === 'ALL' ? 'ทั้งหมด' : STATUS_LABEL[s]?.label || s}
            </button>
          ))}
          <button onClick={() => exportCSV(rows)} disabled={rows.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-secondary-container text-on-secondary-container hover:bg-secondary/20 transition disabled:opacity-40">
            <Download size={14}/> Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel rounded-2xl shadow-glass overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32"><Loader2 className="animate-spin text-primary" size={24}/></div>
        ) : rows.length === 0 ? (
          <div className="text-center py-12 text-outline">ไม่มีรายการ</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-container text-on-surface-variant text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">สมาชิก</th>
                  <th className="px-4 py-3 font-medium">ยอด</th>
                  <th className="px-4 py-3 font-medium">โปร</th>
                  <th className="px-4 py-3 font-medium">สถานะ</th>
                  <th className="px-4 py-3 font-medium">วันที่</th>
                  <th className="px-4 py-3 font-medium">ผู้ดำเนินการ</th>
                  <th className="px-4 py-3 font-medium">สลิป</th>
                  <th className="px-4 py-3 font-medium">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {rows.map(r => (
                  <tr key={r.id} className="hover:bg-surface-container-low transition">
                    <td className="px-4 py-3">
                      <div className="font-medium text-on-surface">{r.profiles?.full_name || '-'}</div>
                      <div className="text-xs text-outline">{r.profiles?.member_id} · {r.profiles?.phone}</div>
                      {r.profiles?.bank_name && <div className="mt-1"><BankBadge code={r.profiles.bank_name} showName /></div>}
                    </td>
                    <td className="px-4 py-3 font-bold text-secondary">฿{fmt(r.amount)}</td>
                    <td className="px-4 py-3 text-xs text-on-surface-variant font-medium">{r.promo_code || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_LABEL[r.status]?.cls}`}>
                        {STATUS_LABEL[r.status]?.label || r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-on-surface-variant">{new Date(r.created_at).toLocaleString('th-TH')}</td>
                    <td className="px-4 py-3 text-xs">
                      {r.approver?.full_name
                        ? <span className="text-on-surface font-medium">{r.approver.full_name}<br/><span className="text-outline">{r.approved_at ? new Date(r.approved_at).toLocaleString('th-TH') : ''}</span></span>
                        : <span className="text-outline">-</span>}
                    </td>
                    <td className="px-4 py-3">
                      {r.slip_url ? (
                        <button onClick={() => setPreview(r.slip_url)}
                          className="flex items-center gap-1 text-primary hover:underline text-xs">
                          <Eye size={13}/> ดูสลิป
                        </button>
                      ) : (
                        <span className="text-xs text-outline">ไม่มีสลิป</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {r.status === 'PENDING' && (
                        <button onClick={() => { setModal(r); setNote('') }}
                          className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-on-primary rounded-full text-xs font-medium transition">
                          ดำเนินการ
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Slip Preview */}
      {preview && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <div className="bg-surface rounded-2xl overflow-hidden max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant">
              <span className="font-semibold text-on-surface">สลิปโอนเงิน</span>
              <button onClick={() => setPreview(null)} className="text-outline hover:text-on-surface-variant text-xl">&times;</button>
            </div>
            <img src={preview} alt="slip" className="w-full object-contain max-h-[70vh]"/>
          </div>
        </div>
      )}

      {/* Approve/Reject Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl shadow-capsule w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-on-surface mb-4">ดำเนินการรายการฝาก</h3>
            <div className="bg-surface-container rounded-xl p-4 mb-4 space-y-1 text-sm">
              <div><span className="text-on-surface-variant">สมาชิก:</span> <span className="font-semibold text-on-surface">{modal.profiles?.full_name}</span></div>
              <div><span className="text-on-surface-variant">ยอด:</span> <span className="font-bold text-secondary">฿{fmt(modal.amount)}</span></div>
              {modal.promo_code && <div><span className="text-on-surface-variant">โปร:</span> <span className="text-secondary">{modal.promo_code}</span></div>}
            </div>
            {modal.slip_url && (
              <div className="mb-4">
                <img src={modal.slip_url} alt="slip" className="w-full rounded-xl object-contain max-h-48"/>
              </div>
            )}
            <textarea value={note} onChange={e => setNote(e.target.value)}
              placeholder="หมายเหตุ (ถ้ามี)"
              className="w-full bg-surface-container-low border-none rounded-xl px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-primary resize-none h-20"/>
            <div className="flex gap-3">
              <button onClick={handleApprove} disabled={working}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-primary/90 text-on-primary rounded-full font-semibold text-sm transition disabled:opacity-60">
                {working ? <Loader2 size={16} className="animate-spin"/> : <CheckCircle size={16}/>} อนุมัติ
              </button>
              <button onClick={handleReject} disabled={working}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-error hover:bg-error/90 text-on-error rounded-full font-semibold text-sm transition disabled:opacity-60">
                {working ? <Loader2 size={16} className="animate-spin"/> : <XCircle size={16}/>} ปฏิเสธ
              </button>
              <button onClick={() => setModal(null)} className="px-4 py-2.5 bg-surface-container hover:bg-surface-container-high rounded-full text-sm text-on-surface-variant transition">ยกเลิก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
