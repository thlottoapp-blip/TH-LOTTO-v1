import React, { useEffect, useState, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import {
  Users, Wallet, ArrowDownCircle, ArrowUpCircle, TrendingUp,
  ListOrdered, AlertTriangle, RefreshCw, Clock
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const fmt = (n) => Number(n || 0).toLocaleString('th-TH', { minimumFractionDigits: 0 })

function KPICard({ icon: Icon, label, value, sub, color = 'emerald', alert }) {
  const colors = {
    emerald: 'bg-primary-container text-on-primary-container',
    blue:    'bg-secondary-container text-on-secondary-container',
    amber:   'bg-warning-container text-on-warning-container',
    rose:    'bg-error-container text-on-error-container',
  }
  return (
    <div className={`glass-panel rounded-2xl p-5 shadow-glass ${alert ? 'ring-2 ring-error' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl ${colors[color]}`}>
          <Icon size={20}/>
        </div>
        {alert && <span className="text-xs font-semibold text-on-error-container bg-error-container px-2 py-0.5 rounded-full">รอดำเนินการ</span>}
      </div>
      <div className="text-2xl font-bold text-on-surface">{value}</div>
      <div className="text-sm text-on-surface-variant mt-0.5">{label}</div>
      {sub && <div className="text-xs text-outline mt-1">{sub}</div>}
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats]     = useState(null)
  const [chart, setChart]     = useState([])
  const [feed, setFeed]       = useState([])
  const [markets, setMarkets] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  const loadAll = useCallback(async () => {
    const [statsRes, chartRes, feedRes, marketsRes] = await Promise.all([
      supabase.rpc('admin_dashboard_stats'),
      supabase.from('transactions')
        .select('type,amount,created_at')
        .in('type', ['DEPOSIT','WIN','PAYOUT','BET'])
        .gte('created_at', new Date(Date.now() - 7*24*60*60*1000).toISOString())
        .order('created_at'),
      supabase.from('transactions')
        .select('type,amount,note,created_at,profiles(full_name,member_id)')
        .order('created_at', { ascending: false })
        .limit(20),
      supabase.rpc('get_markets_with_countdown'),
    ])
    if (statsRes.data) setStats(statsRes.data)
    if (feedRes.data) setFeed(feedRes.data)
    if (marketsRes.data) setMarkets(marketsRes.data)

    // Group chart by day
    if (chartRes.data) {
      const byDay = {}
      chartRes.data.forEach(t => {
        const day = new Date(t.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
        if (!byDay[day]) byDay[day] = { day, ฝาก: 0, แทง: 0, จ่ายรางวัล: 0 }
        if (t.type === 'DEPOSIT') byDay[day].ฝาก += Number(t.amount)
        if (t.type === 'BET') byDay[day].แทง += Number(t.amount)
        if (['WIN','PAYOUT'].includes(t.type)) byDay[day].จ่ายรางวัล += Number(t.amount)
      })
      setChart(Object.values(byDay).slice(-7))
    }
    setLastUpdate(new Date())
    setLoading(false)
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  // Realtime: refresh feed on new transactions
  useEffect(() => {
    const ch = supabase.channel('admin-dashboard')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'deposit_requests' }, loadAll)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'withdraw_requests' }, loadAll)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions' }, loadAll)
      .subscribe()
    const timer = setInterval(loadAll, 60000)
    return () => { supabase.removeChannel(ch); clearInterval(timer) }
  }, [loadAll])

  const feedIcon = (type) => {
    const m = { DEPOSIT:'⬇️', WITHDRAW:'⬆️', BET:'🎰', WIN:'🎉', PAYOUT:'💰', BONUS:'🎁', COMMISSION:'💼', ADMIN_CREDIT:'🔧' }
    return m[type] || '📌'
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-primary animate-pulse text-lg">กำลังโหลดข้อมูล...</div>
    </div>
  )

  const s = stats || {}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Dashboard</h1>
          <p className="text-on-surface-variant text-sm mt-0.5 flex items-center gap-1">
            <Clock size={13}/> อัพเดทล่าสุด: {lastUpdate.toLocaleTimeString('th-TH')}
          </p>
        </div>
        <button onClick={loadAll} className="flex items-center gap-2 px-4 py-2 glass-panel rounded-full text-sm text-on-surface-variant hover:bg-surface-container shadow-glass transition">
          <RefreshCw size={15}/> รีเฟรช
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={Users}          label="สมาชิกทั้งหมด"   value={fmt(s.total_members)}    sub={`ใหม่วันนี้ ${fmt(s.new_today)} คน`}        color="blue" />
        <KPICard icon={Wallet}         label="ยอดเงินรวมในระบบ" value={`฿${fmt(s.total_balance)}`} sub={`ฝากวันนี้ ฿${fmt(s.today_deposit)}`}   color="emerald" />
        <KPICard icon={ArrowDownCircle} label="รอ Approve ฝาก"  value={fmt(s.pending_deposits)}  sub="รายการรอดำเนินการ"                          color="amber" alert={s.pending_deposits > 0} />
        <KPICard icon={ArrowUpCircle}   label="รอ Approve ถอน"  value={fmt(s.pending_withdraws)} sub="รายการรอดำเนินการ"                          color="rose"  alert={s.pending_withdraws > 0} />
      </div>

      {/* Secondary KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel rounded-2xl p-4 shadow-glass">
          <div className="text-xs text-on-surface-variant mb-1">ยอดแทงวันนี้</div>
          <div className="text-xl font-bold text-on-surface">฿{fmt(s.today_bets)}</div>
        </div>
        <div className="glass-panel rounded-2xl p-4 shadow-glass">
          <div className="text-xs text-on-surface-variant mb-1">จ่ายรางวัลวันนี้</div>
          <div className="text-xl font-bold text-error">฿{fmt(s.today_payouts)}</div>
        </div>
        <div className="glass-panel rounded-2xl p-4 shadow-glass">
          <div className="text-xs text-on-surface-variant mb-1">กำไรสุทธิวันนี้</div>
          <div className={`text-xl font-bold ${(s.today_bets - s.today_payouts) >= 0 ? 'text-secondary' : 'text-error'}`}>
            ฿{fmt(s.today_bets - s.today_payouts)}
          </div>
        </div>
        <div className="glass-panel rounded-2xl p-4 shadow-glass">
          <div className="text-xs text-on-surface-variant mb-1">ตลาดเปิดอยู่</div>
          <div className="text-xl font-bold text-secondary">{markets.filter(m => m.is_open).length} ตลาด</div>
        </div>
      </div>

      {/* Charts + Markets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <div className="lg:col-span-2 glass-panel rounded-2xl shadow-glass p-5">
          <h3 className="text-sm font-semibold text-on-surface-variant mb-4">รายได้ 7 วันย้อนหลัง (บาท)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chart} barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => [`฿${fmt(v)}`, '']} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="ฝาก"      fill="#10b981" radius={[4,4,0,0]} />
              <Bar dataKey="แทง"      fill="#3b82f6" radius={[4,4,0,0]} />
              <Bar dataKey="จ่ายรางวัล" fill="#f43f5e" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Market Status */}
        <div className="glass-panel rounded-2xl shadow-glass p-5">
          <h3 className="text-sm font-semibold text-on-surface-variant mb-4">สถานะตลาด</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {markets.length === 0 && <div className="text-outline text-sm text-center py-4">ไม่มีตลาด</div>}
            {markets.map(m => (
              <div key={m.id} className="flex items-center justify-between py-2 border-b border-outline-variant last:border-0">
                <span className="text-sm text-on-surface truncate">{m.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.is_open ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container text-on-surface-variant'}`}>
                  {m.is_open ? '🟢 เปิด' : '⛔ ปิด'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="glass-panel rounded-2xl shadow-glass p-5">
        <h3 className="text-sm font-semibold text-on-surface-variant mb-4 flex items-center gap-2">
          <TrendingUp size={15}/> กิจกรรมล่าสุด (Realtime)
        </h3>
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {feed.map((f, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-outline-variant last:border-0">
              <span className="text-lg">{feedIcon(f.type)}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-on-surface truncate">
                  {f.profiles?.full_name || f.profiles?.member_id || 'ระบบ'} — {f.note || f.type}
                </div>
                <div className="text-xs text-outline">{new Date(f.created_at).toLocaleString('th-TH')}</div>
              </div>
              <div className={`text-sm font-semibold ${['WIN','PAYOUT','DEPOSIT','BONUS'].includes(f.type) ? 'text-secondary' : 'text-on-surface-variant'}`}>
                ฿{fmt(f.amount)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
