import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { toast } from '../components/Toast'
import { Database, Download, Trash2, RefreshCw, Loader2, ShieldAlert } from 'lucide-react'

const fmt = (n) => Number(n || 0).toLocaleString('th-TH')
const fmtBytes = (b) => b < 1024 ? `${b} B` : b < 1048576 ? `${(b/1024).toFixed(1)} KB` : `${(b/1048576).toFixed(2)} MB`

export default function DataManagement() {
  const [files, setFiles]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [running, setRunning]   = useState(false)
  const [stats, setStats]       = useState(null)
  const [confirm, setConfirm]   = useState(false)

  const loadFiles = async () => {
    setLoading(true)
    const { data } = await supabase.storage.from('backups').list('', {
      sortBy: { column: 'created_at', order: 'desc' }
    })
    setFiles(data || [])
    setLoading(false)
  }

  const loadStats = async () => {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const [{ count: dep }, { count: wit }, { count: notif }] = await Promise.all([
      supabase.from('deposit_requests').select('*', { count: 'exact', head: true })
        .in('status', ['APPROVED','REJECTED']).lt('created_at', cutoff),
      supabase.from('withdraw_requests').select('*', { count: 'exact', head: true })
        .in('status', ['APPROVED','REJECTED']).lt('created_at', cutoff),
      supabase.from('notifications').select('*', { count: 'exact', head: true })
        .eq('is_read', true).lt('created_at', cutoff),
    ])
    setStats({ deposits: dep || 0, withdrawals: wit || 0, notifications: notif || 0 })
  }

  useEffect(() => { loadFiles(); loadStats() }, [])

  const runBackup = async () => {
    setRunning(true); setConfirm(false)
    try {
      const { data, error } = await supabase.functions.invoke('backup-and-cleanup')
      if (error) throw error
      if (!data?.ok) throw new Error(data?.error || 'เกิดข้อผิดพลาด')
      toast.success(
        `สำเร็จ — ฝาก ${fmt(data.deposits_archived)} | ถอน ${fmt(data.withdrawals_archived)} | แจ้งเตือน ${fmt(data.notifications_cleared)} รายการ`
      )
      await loadFiles(); await loadStats()
    } catch (e) {
      toast.error(e.message || 'ไม่สามารถรัน backup ได้')
    }
    setRunning(false)
  }

  const downloadFile = async (name) => {
    const { data, error } = await supabase.storage.from('backups').download(name)
    if (error) { toast.error('ดาวน์โหลดไม่สำเร็จ'); return }
    const url = URL.createObjectURL(data)
    const a = document.createElement('a'); a.href = url; a.download = name; a.click()
    URL.revokeObjectURL(url)
  }

  const deleteFile = async (name) => {
    const { error } = await supabase.storage.from('backups').remove([name])
    if (error) { toast.error('ลบไม่สำเร็จ'); return }
    toast.success('ลบไฟล์แล้ว')
    loadFiles()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-on-surface flex items-center gap-2">
          <Database size={22}/> จัดการข้อมูล & Backup
        </h1>
        <p className="text-on-surface-variant text-sm mt-1">
          ระบบ backup อัตโนมัติทุก 7 วัน — ลบรายการฝาก/ถอนที่เสร็จแล้วและแจ้งเตือนที่อ่านแล้ว
        </p>
      </div>

      {/* Stats */}
      <div className="glass-panel rounded-2xl shadow-glass p-5">
        <h2 className="font-bold text-on-surface mb-3 flex items-center gap-2">
          <RefreshCw size={16}/> รายการที่พร้อม Archive (อายุ &gt; 7 วัน)
        </h2>
        {stats ? (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'ฝากเงิน', val: stats.deposits, color: 'text-secondary' },
              { label: 'ถอนเงิน', val: stats.withdrawals, color: 'text-error' },
              { label: 'แจ้งเตือน (อ่านแล้ว)', val: stats.notifications, color: 'text-outline' },
            ].map(({ label, val, color }) => (
              <div key={label} className="text-center bg-surface-container rounded-xl p-3">
                <div className={`text-2xl font-black ${color}`}>{fmt(val)}</div>
                <div className="text-xs text-on-surface-variant mt-1">{label}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex justify-center py-4"><Loader2 className="animate-spin text-primary" size={20}/></div>
        )}

        {/* Action */}
        <div className="mt-4 flex items-center gap-3">
          {!confirm ? (
            <button
              onClick={() => setConfirm(true)}
              disabled={running || (stats && stats.deposits === 0 && stats.withdrawals === 0 && stats.notifications === 0)}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-full font-medium text-sm hover:bg-primary/90 transition disabled:opacity-40"
            >
              {running ? <Loader2 size={15} className="animate-spin"/> : <Database size={15}/>}
              {running ? 'กำลัง Backup...' : 'Backup & Clear ทันที'}
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-error-container text-on-error-container rounded-2xl px-4 py-2.5 text-sm">
              <ShieldAlert size={15}/>
              <span className="font-medium">ยืนยัน? ข้อมูลจะถูกลบหลัง backup</span>
              <button onClick={runBackup} className="ml-2 px-3 py-1 bg-error text-white rounded-full text-xs font-bold">ยืนยัน</button>
              <button onClick={() => setConfirm(false)} className="px-3 py-1 bg-surface-container rounded-full text-xs">ยกเลิก</button>
            </div>
          )}
          <span className="text-xs text-outline">ระบบรัน backup อัตโนมัติทุก 7 วัน</span>
        </div>
      </div>

      {/* Backup files */}
      <div className="glass-panel rounded-2xl shadow-glass overflow-hidden">
        <div className="px-5 py-4 border-b border-outline-variant flex items-center justify-between">
          <h2 className="font-bold text-on-surface">ไฟล์ Backup ทั้งหมด</h2>
          <button onClick={loadFiles} className="text-outline hover:text-on-surface-variant transition">
            <RefreshCw size={15}/>
          </button>
        </div>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary" size={22}/></div>
        ) : files.length === 0 ? (
          <div className="text-center py-10 text-outline text-sm">ยังไม่มีไฟล์ backup</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-container text-on-surface-variant">
              <tr>
                <th className="px-5 py-3 text-left font-medium">ชื่อไฟล์</th>
                <th className="px-5 py-3 text-left font-medium">ขนาด</th>
                <th className="px-5 py-3 text-left font-medium">วันที่สร้าง</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {files.map(f => (
                <tr key={f.name} className="hover:bg-surface-container-low transition">
                  <td className="px-5 py-3 font-mono text-on-surface">{f.name}</td>
                  <td className="px-5 py-3 text-on-surface-variant">{fmtBytes(f.metadata?.size || 0)}</td>
                  <td className="px-5 py-3 text-on-surface-variant text-xs">
                    {f.created_at ? new Date(f.created_at).toLocaleString('th-TH') : '-'}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => downloadFile(f.name)}
                        className="flex items-center gap-1 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-medium hover:bg-secondary/20 transition">
                        <Download size={12}/> ดาวน์โหลด
                      </button>
                      <button onClick={() => deleteFile(f.name)}
                        className="flex items-center gap-1 px-3 py-1 rounded-full bg-error-container text-on-error-container text-xs font-medium hover:bg-error/20 transition">
                        <Trash2 size={12}/> ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
