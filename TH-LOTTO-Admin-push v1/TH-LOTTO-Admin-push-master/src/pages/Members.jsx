import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { Search, Edit, Loader2, X, Save, PlusCircle, MinusCircle, Eye } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from '../components/Toast'
import BankBadge from '../components/BankBadge'

const fmt = (n) => Number(n || 0).toLocaleString('th-TH')
const BANKS = ['KBANK','SCB','KTB','BBL','BAY','TMB','CIMB','TTB','GSB','BAAC']

export default function Members() {
  const navigate = useNavigate()
  const [rows, setRows]       = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [page, setPage]       = useState(0)
  const [total, setTotal]     = useState(0)
  const [modal, setModal]     = useState(null)
  const [walletModal, setWalletModal] = useState(null)
  const [delta, setDelta]     = useState('')
  const [deltaNote, setDeltaNote] = useState('')
  const [working, setWorking] = useState(false)
  const LIMIT = 20

  const load = async () => {
    setLoading(true)
    let q = supabase.from('profiles')
      .select('id,member_id,full_name,phone,bank_name,bank_account_number,bank_account_name,is_admin,status,vip_level,created_at,wallets(balance,commission_balance,total_won,total_bets)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * LIMIT, (page + 1) * LIMIT - 1)
    if (search) q = q.or(`member_id.ilike.%${search}%,phone.ilike.%${search}%,full_name.ilike.%${search}%`)
    const { data, count } = await q
    setRows(data || [])
    setTotal(count || 0)
    setLoading(false)
  }

  useEffect(() => { load() }, [search, page])

  const saveEdit = async () => {
    setWorking(true)
    const patch = {
      full_name: modal.full_name, phone: modal.phone,
      bank_name: modal.bank_name, bank_account_number: modal.bank_account_number,
      bank_account_name: modal.bank_account_name,
      status: modal.status, vip_level: modal.vip_level,
    }
    const { error } = await supabase.rpc('admin_update_member', { p_user_id: modal.id, p_patch: patch })
    setWorking(false)
    if (error) { toast.error('เกิดข้อผิดพลาด: ' + error.message); return }
    setModal(null); load()
  }

  const adjustWallet = async (sign) => {
    if (!delta || isNaN(delta)) { toast.warning('กรุณากรอกจำนวนเงิน'); return }
    setWorking(true)
    const amount = sign * Math.abs(Number(delta))
    const { error } = await supabase.rpc('admin_adjust_wallet', {
      p_user_id: walletModal.id, p_delta: amount, p_note: deltaNote || 'Admin adjust'
    })
    setWorking(false)
    if (error) { toast.error('เกิดข้อผิดพลาด: ' + error.message); return }
    setWalletModal(null); setDelta(''); setDeltaNote(''); load()
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-on-surface">สมาชิกทั้งหมด</h1>
        <p className="text-on-surface-variant text-sm">จัดการข้อมูลสมาชิก ({fmt(total)} คน)</p>
      </div>

      <div className="glass-panel rounded-2xl shadow-glass p-4">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline"/>
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(0) }}
            placeholder="ค้นหาชื่อ / เบอร์ / Member ID"
            className="w-full pl-9 pr-4 py-2 rounded-full bg-surface-container-low border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary"/>
        </div>
      </div>

      <div className="glass-panel rounded-2xl shadow-glass overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32"><Loader2 className="animate-spin text-primary" size={24}/></div>
        ) : rows.length === 0 ? (
          <div className="text-center py-12 text-outline">ไม่พบสมาชิก</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-container text-on-surface-variant text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">สมาชิก</th>
                  <th className="px-4 py-3 font-medium">ยอดเงิน</th>
                  <th className="px-4 py-3 font-medium">แทงรวม</th>
                  <th className="px-4 py-3 font-medium">ถูกรางวัล</th>
                  <th className="px-4 py-3 font-medium">สถานะ</th>
                  <th className="px-4 py-3 font-medium">สมัครเมื่อ</th>
                  <th className="px-4 py-3 font-medium">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                {rows.map(r => (
                  <tr key={r.id} className="hover:bg-surface-container-low transition">
                    <td className="px-4 py-3">
                      <div className="font-medium text-on-surface">{r.full_name || '-'}</div>
                      <div className="text-xs text-outline">{r.member_id} · {r.phone}</div>
                      {r.bank_name && <div className="mt-1"><BankBadge code={r.bank_name} showName /></div>}
                    </td>
                    <td className="px-4 py-3 font-bold text-secondary">฿{fmt(r.wallets?.balance)}</td>
                    <td className="px-4 py-3 text-on-surface-variant">฿{fmt(r.wallets?.total_bets)}</td>
                    <td className="px-4 py-3 text-on-surface-variant">฿{fmt(r.wallets?.total_won)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.status === 'active' ? 'bg-secondary-container text-on-secondary-container' : 'bg-error-container text-on-error-container'}`}>
                        {r.status === 'active' ? 'ปกติ' : 'ระงับ'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-outline">{new Date(r.created_at).toLocaleDateString('th-TH')}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => setModal({ ...r })}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="แก้ไข">
                          <Edit size={15}/>
                        </button>
                        <button onClick={() => { setWalletModal(r); setDelta(''); setDeltaNote('') }}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition" title="ปรับยอดเงิน">
                          <PlusCircle size={15}/>
                        </button>
                        <button onClick={() => navigate(`/members/${r.id}`)}
                          className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition" title="ดูรายละเอียด">
                          <Eye size={15}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {/* Pagination */}
        {total > LIMIT && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-outline-variant text-sm text-on-surface-variant">
            <span>หน้า {page + 1} / {Math.ceil(total / LIMIT)}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(0, p-1))} disabled={page === 0}
                className="px-3 py-1 rounded-full bg-surface-container hover:bg-surface-container-high disabled:opacity-40">ก่อนหน้า</button>
              <button onClick={() => setPage(p => p+1)} disabled={(page+1)*LIMIT >= total}
                className="px-3 py-1 rounded-full bg-surface-container hover:bg-surface-container-high disabled:opacity-40">ถัดไป</button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl shadow-capsule w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-on-surface">แก้ไขสมาชิก</h3>
              <button onClick={() => setModal(null)}><X size={20} className="text-slate-400"/></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs font-medium text-on-surface-variant mb-1 block">ชื่อ-นามสกุล</label>
                <input value={modal.full_name || ''} onChange={e => setModal(m => ({...m, full_name: e.target.value}))}
                  className="w-full bg-surface-container-low border-none rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"/>
              </div>
              <div>
                <label className="text-xs font-medium text-on-surface-variant mb-1 block">เบอร์โทร</label>
                <input value={modal.phone || ''} onChange={e => setModal(m => ({...m, phone: e.target.value}))}
                  className="w-full bg-surface-container-low border-none rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"/>
              </div>
              <div>
                <label className="text-xs font-medium text-on-surface-variant mb-1 block">สถานะ</label>
                <select value={modal.status} onChange={e => setModal(m => ({...m, status: e.target.value}))}
                  className="w-full bg-surface-container-low border-none rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="active">ปกติ</option>
                  <option value="suspended">ระงับ</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-on-surface-variant mb-1 block">ธนาคาร</label>
                <select value={modal.bank_name || ''} onChange={e => setModal(m => ({...m, bank_name: e.target.value}))}
                  className="w-full bg-surface-container-low border-none rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                  {BANKS.map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-on-surface-variant mb-1 block">เลขบัญชี</label>
                <input value={modal.bank_account_number || ''} onChange={e => setModal(m => ({...m, bank_account_number: e.target.value}))}
                  className="w-full bg-surface-container-low border-none rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"/>
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-on-surface-variant mb-1 block">ชื่อบัญชี</label>
                <input value={modal.bank_account_name || ''} onChange={e => setModal(m => ({...m, bank_account_name: e.target.value}))}
                  className="w-full bg-surface-container-low border-none rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"/>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={saveEdit} disabled={working}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-primary/90 text-on-primary rounded-full font-semibold text-sm transition disabled:opacity-60">
                {working ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} บันทึก
              </button>
              <button onClick={() => setModal(null)} className="px-5 py-2.5 bg-surface-container hover:bg-surface-container-high rounded-full text-sm text-on-surface-variant transition">ยกเลิก</button>
            </div>
          </div>
        </div>
      )}

      {/* Wallet Adjust Modal */}
      {walletModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl shadow-capsule w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-on-surface">ปรับยอดเงิน</h3>
              <button onClick={() => setWalletModal(null)}><X size={20} className="text-slate-400"/></button>
            </div>
            <div className="bg-surface-container rounded-xl p-3 mb-4 text-sm">
              <div className="font-semibold text-on-surface">{walletModal.full_name}</div>
              <div className="text-on-surface-variant">ยอดปัจจุบัน: <span className="font-bold text-secondary">฿{fmt(walletModal.wallets?.balance)}</span></div>
            </div>
            <div className="mb-4">
              <label className="text-xs font-medium text-on-surface-variant mb-1 block">จำนวนเงิน (บาท)</label>
              <input type="number" value={delta} onChange={e => setDelta(e.target.value)} placeholder="เช่น 100"
                className="w-full bg-surface-container-low border-none rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"/>
            </div>
            <div className="mb-5">
              <label className="text-xs font-medium text-on-surface-variant mb-1 block">หมายเหตุ</label>
              <input value={deltaNote} onChange={e => setDeltaNote(e.target.value)} placeholder="เหตุผลการปรับยอด"
                className="w-full bg-surface-container-low border-none rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"/>
            </div>
            <div className="flex gap-3">
              <button onClick={() => adjustWallet(1)} disabled={working}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-primary/90 text-on-primary rounded-full text-sm font-semibold transition disabled:opacity-60">
                <PlusCircle size={15}/> เพิ่มเงิน
              </button>
              <button onClick={() => adjustWallet(-1)} disabled={working}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-error hover:bg-error/90 text-on-error rounded-full text-sm font-semibold transition disabled:opacity-60">
                <MinusCircle size={15}/> ตัดเงิน
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
