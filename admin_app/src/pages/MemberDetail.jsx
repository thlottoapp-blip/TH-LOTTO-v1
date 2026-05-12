import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { ArrowLeft, Loader2, User, Wallet, ListOrdered, ArrowUpDown, LogIn } from 'lucide-react'
import BankBadge from '../components/BankBadge'

const fmt = (n) => Number(n || 0).toLocaleString('th-TH')
const fmtDate = (d) => d ? new Date(d).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' }) : '-'
const TABS = [
  { key: 'overview', label: 'ภาพรวม', icon: User },
  { key: 'bets', label: 'ประวัติแทง', icon: ListOrdered },
  { key: 'transactions', label: 'ธุรกรรม', icon: ArrowUpDown },
  { key: 'deposits', label: 'ฝาก/ถอน', icon: Wallet },
  { key: 'logins', label: 'ล็อกอิน', icon: LogIn },
]

const STATUS_BET = { PENDING: 'bg-warning-container text-on-warning-container', WON: 'bg-secondary-container text-on-secondary-container', LOST: 'bg-surface-container text-on-surface-variant', CANCELLED: 'bg-error-container text-on-error-container' }
const STATUS_DEP = { PENDING: 'bg-warning-container text-on-warning-container', APPROVED: 'bg-secondary-container text-on-secondary-container', REJECTED: 'bg-error-container text-on-error-container' }

export default function MemberDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tab, setTab] = useState('overview')
  const [profile, setProfile] = useState(null)
  const [wallet, setWallet] = useState(null)
  const [loading, setLoading] = useState(true)

  // Tab data
  const [bets, setBets] = useState([])
  const [txns, setTxns] = useState([])
  const [deposits, setDeposits] = useState([])
  const [withdrawals, setWithdrawals] = useState([])
  const [logins, setLogins] = useState([])
  const [tabLoading, setTabLoading] = useState(false)

  // Load profile + wallet
  useEffect(() => {
    (async () => {
      setLoading(true)
      const [{ data: p }, { data: w }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', id).single(),
        supabase.from('wallets').select('*').eq('user_id', id).single(),
      ])
      setProfile(p)
      setWallet(w)
      setLoading(false)
    })()
  }, [id])

  // Load tab data
  const loadTab = useCallback(async (t) => {
    setTabLoading(true)
    switch (t) {
      case 'bets': {
        const { data } = await supabase.from('bets')
          .select('id,numbers,bet_type,amount,payout_rate,payout_amount,status,draw_date,created_at,lottery_markets(name)')
          .eq('user_id', id).order('created_at', { ascending: false }).limit(100)
        setBets(data || [])
        break
      }
      case 'transactions': {
        const { data } = await supabase.from('transactions')
          .select('*')
          .eq('user_id', id).order('created_at', { ascending: false }).limit(100)
        setTxns(data || [])
        break
      }
      case 'deposits': {
        const [{ data: dep }, { data: wd }] = await Promise.all([
          supabase.from('deposit_requests').select('*').eq('user_id', id).order('created_at', { ascending: false }).limit(50),
          supabase.from('withdraw_requests').select('*').eq('user_id', id).order('created_at', { ascending: false }).limit(50),
        ])
        setDeposits(dep || [])
        setWithdrawals(wd || [])
        break
      }
      case 'logins': {
        if (profile?.phone) {
          const { data } = await supabase.from('login_attempts')
            .select('*').eq('phone', profile.phone).order('attempted_at', { ascending: false }).limit(100)
          setLogins(data || [])
        }
        break
      }
    }
    setTabLoading(false)
  }, [id, profile?.phone])

  useEffect(() => {
    if (tab !== 'overview' && profile) loadTab(tab)
  }, [tab, profile, loadTab])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin text-primary" size={28} />
    </div>
  )

  if (!profile) return (
    <div className="text-center py-20">
      <p className="text-on-surface-variant mb-4">ไม่พบข้อมูลสมาชิก</p>
      <button onClick={() => navigate('/members')} className="px-4 py-2 bg-primary text-on-primary rounded-full text-sm">กลับ</button>
    </div>
  )

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/members')} className="p-2 hover:bg-surface-container rounded-full transition">
          <ArrowLeft size={20} className="text-on-surface" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-on-surface">{profile.full_name || 'ไม่ระบุชื่อ'}</h1>
          <p className="text-on-surface-variant text-sm">{profile.member_id} · {profile.phone}</p>
        </div>
        <span className={`ml-auto px-3 py-1 rounded-full text-xs font-medium ${profile.status === 'active' ? 'bg-secondary-container text-on-secondary-container' : 'bg-error-container text-on-error-container'}`}>
          {profile.status === 'active' ? 'ปกติ' : 'ระงับ'}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${tab === t.key ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}>
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="glass-panel rounded-2xl shadow-glass">
        {tab === 'overview' && <OverviewTab profile={profile} wallet={wallet} />}
        {tab === 'bets' && <BetsTab data={bets} loading={tabLoading} />}
        {tab === 'transactions' && <TransactionsTab data={txns} loading={tabLoading} />}
        {tab === 'deposits' && <DepositsTab deposits={deposits} withdrawals={withdrawals} loading={tabLoading} />}
        {tab === 'logins' && <LoginsTab data={logins} loading={tabLoading} />}
      </div>
    </div>
  )
}

/* ============ TAB COMPONENTS ============ */

function OverviewTab({ profile, wallet }) {
  return (
    <div className="p-5 space-y-6">
      {/* Wallet Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'ยอดเงิน', value: `฿${fmt(wallet?.balance)}`, color: 'text-secondary' },
          { label: 'คอมมิชชั่น', value: `฿${fmt(wallet?.commission_balance)}`, color: 'text-primary' },
          { label: 'แทงรวม', value: `฿${fmt(wallet?.total_bets)}`, color: 'text-on-surface' },
          { label: 'ถูกรางวัลรวม', value: `฿${fmt(wallet?.total_won)}`, color: 'text-secondary' },
        ].map(c => (
          <div key={c.label} className="bg-surface-container rounded-xl p-4 text-center">
            <div className="text-xs text-on-surface-variant mb-1">{c.label}</div>
            <div className={`text-lg font-bold ${c.color}`}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Profile Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { label: 'Member ID', value: profile.member_id },
          { label: 'เบอร์โทร', value: profile.phone },
          { label: 'ชื่อ', value: profile.full_name },
          { label: 'Username', value: profile.username },
          { label: 'VIP', value: profile.vip_level },
          { label: 'สถานะ', value: profile.status },
          { label: 'สมัครเมื่อ', value: fmtDate(profile.created_at) },
          { label: 'อัปเดตล่าสุด', value: fmtDate(profile.updated_at) },
        ].map(r => (
          <div key={r.label} className="flex items-center justify-between py-2 border-b border-outline-variant/30">
            <span className="text-sm text-on-surface-variant">{r.label}</span>
            <span className="text-sm font-medium text-on-surface">{r.value || '-'}</span>
          </div>
        ))}
      </div>

      {/* Bank Info */}
      {profile.bank_name && (
        <div className="bg-surface-container rounded-xl p-4">
          <div className="text-xs text-on-surface-variant mb-2">ข้อมูลธนาคาร</div>
          <BankBadge code={profile.bank_name} showName />
          <div className="mt-2 text-sm text-on-surface">
            <div>เลขบัญชี: <span className="font-medium">{profile.bank_account_number || '-'}</span></div>
            <div>ชื่อบัญชี: <span className="font-medium">{profile.bank_account_name || '-'}</span></div>
          </div>
        </div>
      )}
    </div>
  )
}

function TabLoader() {
  return <div className="flex items-center justify-center h-32"><Loader2 className="animate-spin text-primary" size={24} /></div>
}

function EmptyState({ text }) {
  return <div className="text-center py-12 text-outline">{text}</div>
}

function BetsTab({ data, loading }) {
  if (loading) return <TabLoader />
  if (!data.length) return <EmptyState text="ไม่มีประวัติการแทง" />
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-surface-container text-on-surface-variant text-left">
          <tr>
            <th className="px-4 py-3 font-medium">ตลาด</th>
            <th className="px-4 py-3 font-medium">เลข</th>
            <th className="px-4 py-3 font-medium">ประเภท</th>
            <th className="px-4 py-3 font-medium">ยอด</th>
            <th className="px-4 py-3 font-medium">จ่าย</th>
            <th className="px-4 py-3 font-medium">สถานะ</th>
            <th className="px-4 py-3 font-medium">งวด</th>
            <th className="px-4 py-3 font-medium">วันที่</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/30">
          {data.map(r => (
            <tr key={r.id} className="hover:bg-surface-container-low transition">
              <td className="px-4 py-3 text-xs text-on-surface-variant">{r.lottery_markets?.name || '-'}</td>
              <td className="px-4 py-3 font-bold text-lg text-on-surface">{r.numbers}</td>
              <td className="px-4 py-3 text-xs text-on-surface-variant font-medium">{r.bet_type}</td>
              <td className="px-4 py-3 font-semibold text-on-surface">฿{fmt(r.amount)}</td>
              <td className="px-4 py-3 font-semibold text-secondary">{r.payout_amount > 0 ? `฿${fmt(r.payout_amount)}` : '-'}</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BET[r.status] || ''}`}>
                  {r.status === 'PENDING' ? 'รอผล' : r.status === 'WON' ? '✓ ถูก' : r.status === 'LOST' ? 'ไม่ถูก' : r.status}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-outline">{r.draw_date || '-'}</td>
              <td className="px-4 py-3 text-xs text-outline">{fmtDate(r.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TransactionsTab({ data, loading }) {
  if (loading) return <TabLoader />
  if (!data.length) return <EmptyState text="ไม่มีธุรกรรม" />

  const typeLabel = (t) => {
    const map = { DEPOSIT: 'ฝากเงิน', WITHDRAW: 'ถอนเงิน', BET: 'แทง', WIN: 'ถูกรางวัล', COMMISSION: 'คอมมิชชั่น', ADMIN_CREDIT: 'Admin เพิ่ม', ADMIN_DEBIT: 'Admin ตัด', REFUND: 'คืนเงิน' }
    return map[t] || t
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-surface-container text-on-surface-variant text-left">
          <tr>
            <th className="px-4 py-3 font-medium">วันที่</th>
            <th className="px-4 py-3 font-medium">ประเภท</th>
            <th className="px-4 py-3 font-medium">จำนวน</th>
            <th className="px-4 py-3 font-medium">ยอดหลัง</th>
            <th className="px-4 py-3 font-medium">หมายเหตุ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/30">
          {data.map(r => (
            <tr key={r.id} className="hover:bg-surface-container-low transition">
              <td className="px-4 py-3 text-xs text-outline">{fmtDate(r.created_at)}</td>
              <td className="px-4 py-3 font-medium text-on-surface">{typeLabel(r.type)}</td>
              <td className={`px-4 py-3 font-bold ${r.amount >= 0 ? 'text-secondary' : 'text-error'}`}>
                {r.amount >= 0 ? '+' : ''}{fmt(r.amount)}
              </td>
              <td className="px-4 py-3 text-on-surface-variant">฿{fmt(r.balance_after)}</td>
              <td className="px-4 py-3 text-xs text-outline">{r.note || r.reference_type || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function DepositsTab({ deposits, withdrawals, loading }) {
  if (loading) return <TabLoader />
  return (
    <div className="p-5 space-y-6">
      {/* Deposits */}
      <div>
        <h3 className="text-sm font-bold text-on-surface mb-3">รายการฝากเงิน ({deposits.length})</h3>
        {deposits.length === 0 ? <p className="text-outline text-sm">ไม่มีรายการ</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-container text-on-surface-variant text-left">
                <tr>
                  <th className="px-4 py-2 font-medium">วันที่</th>
                  <th className="px-4 py-2 font-medium">ยอด</th>
                  <th className="px-4 py-2 font-medium">โปร</th>
                  <th className="px-4 py-2 font-medium">สถานะ</th>
                  <th className="px-4 py-2 font-medium">หมายเหตุ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                {deposits.map(r => (
                  <tr key={r.id} className="hover:bg-surface-container-low transition">
                    <td className="px-4 py-2 text-xs text-outline">{fmtDate(r.created_at)}</td>
                    <td className="px-4 py-2 font-bold text-secondary">฿{fmt(r.amount)}</td>
                    <td className="px-4 py-2 text-xs">{r.promo_code || '-'}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_DEP[r.status] || ''}`}>
                        {r.status === 'PENDING' ? 'รอ' : r.status === 'APPROVED' ? 'อนุมัติ' : 'ปฏิเสธ'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs text-outline">{r.admin_note || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Withdrawals */}
      <div>
        <h3 className="text-sm font-bold text-on-surface mb-3">รายการถอนเงิน ({withdrawals.length})</h3>
        {withdrawals.length === 0 ? <p className="text-outline text-sm">ไม่มีรายการ</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-container text-on-surface-variant text-left">
                <tr>
                  <th className="px-4 py-2 font-medium">วันที่</th>
                  <th className="px-4 py-2 font-medium">ยอด</th>
                  <th className="px-4 py-2 font-medium">ธนาคาร</th>
                  <th className="px-4 py-2 font-medium">สถานะ</th>
                  <th className="px-4 py-2 font-medium">หมายเหตุ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                {withdrawals.map(r => (
                  <tr key={r.id} className="hover:bg-surface-container-low transition">
                    <td className="px-4 py-2 text-xs text-outline">{fmtDate(r.created_at)}</td>
                    <td className="px-4 py-2 font-bold text-error">฿{fmt(r.amount)}</td>
                    <td className="px-4 py-2 text-xs">{r.bank_name || '-'} {r.bank_account_number || ''}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_DEP[r.status] || ''}`}>
                        {r.status === 'PENDING' ? 'รอ' : r.status === 'APPROVED' ? 'โอนแล้ว' : 'ปฏิเสธ'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs text-outline">{r.admin_note || '-'}</td>
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

function LoginsTab({ data, loading }) {
  if (loading) return <TabLoader />
  if (!data.length) return <EmptyState text="ไม่มีประวัติล็อกอิน" />
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-surface-container text-on-surface-variant text-left">
          <tr>
            <th className="px-4 py-3 font-medium">วันที่-เวลา</th>
            <th className="px-4 py-3 font-medium">ผลลัพธ์</th>
            <th className="px-4 py-3 font-medium">IP</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/30">
          {data.map(r => (
            <tr key={r.id} className="hover:bg-surface-container-low transition">
              <td className="px-4 py-3 text-on-surface">{fmtDate(r.attempted_at)}</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.success ? 'bg-secondary-container text-on-secondary-container' : 'bg-error-container text-on-error-container'}`}>
                  {r.success ? '✓ สำเร็จ' : '✗ ไม่สำเร็จ'}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-outline font-mono">{r.ip_address || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
