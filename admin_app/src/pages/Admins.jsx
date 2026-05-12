import React, { useEffect, useState, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import { Shield, ShieldOff, ShieldCheck, UserPlus, X, Search, Loader2, ChevronDown, ChevronUp, Lock } from 'lucide-react'
import { useAuth } from '../AuthContext'
import { toast } from '../components/Toast'

const ALL_PERMISSIONS = [
  { key: 'deposits',    label: 'ฝากเงิน',       icon: 'payments' },
  { key: 'withdrawals', label: 'ถอนเงิน',        icon: 'account_balance_wallet' },
  { key: 'members',     label: 'สมาชิก',         icon: 'group' },
  { key: 'bets',        label: 'รายการโพย',      icon: 'list_alt' },
  { key: 'markets',     label: 'ตลาดหวย',        icon: 'confirmation_number' },
  { key: 'restricted',  label: 'เลขอั้น',        icon: 'block' },
  { key: 'wheel',       label: 'วงล้อโชคดี',     icon: 'casino' },
  { key: 'settings',    label: 'ตั้งค่าระบบ',    icon: 'settings' },
  { key: 'appearance',  label: 'รูปลักษณ์',      icon: 'palette' },
  { key: 'banks',       label: 'ธนาคาร',         icon: 'account_balance' },
  { key: 'promotions',  label: 'โปรโมชั่น',      icon: 'campaign' },
  { key: 'articles',    label: 'บทความ',         icon: 'article' },
  { key: 'sliders',     label: 'สไลด์เดอร์',     icon: 'view_carousel' },
]

const RoleBadge = ({ role }) => {
  if (role === 'super_admin') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
      <ShieldCheck size={10}/> Super Admin
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
      <Shield size={10}/> Admin
    </span>
  )
}

export default function Admins() {
  const { profile: me, isSuperAdmin } = useAuth()
  const [admins, setAdmins]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [working, setWorking]     = useState(null)
  const [expandedId, setExpandedId] = useState(null)

  const [showAdd, setShowAdd]     = useState(false)
  const [query, setQuery]         = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults]     = useState([])
  const [selected, setSelected]   = useState(null)
  const [newRole, setNewRole]     = useState('admin')
  const [newPerms, setNewPerms]   = useState([])

  const load = useCallback(async () => {
    let q = supabase.from('profiles')
      .select('id,member_id,full_name,phone,is_admin,admin_role,admin_permissions,status,created_at')
      .eq('is_admin', true)
      .order('created_at')
    if (!isSuperAdmin()) q = q.neq('admin_role', 'super_admin')
    const { data } = await q
    setAdmins(data || [])
    setLoading(false)
  }, [isSuperAdmin])

  useEffect(() => { load() }, [load])

  const searchUsers = async () => {
    if (!query.trim()) return
    setSearching(true)
    const { data } = await supabase.rpc('admin_search_non_admins', { p_query: query.trim() })
    setResults(data || [])
    setSearching(false)
  }

  const addAdmin = async () => {
    if (!selected) return
    setWorking('add')
    const perms = newRole === 'super_admin' ? ['*'] : newPerms
    const { data, error } = await supabase.rpc('admin_set_admin_permissions', {
      p_target_id: selected.id, p_role: newRole, p_permissions: perms
    })
    setWorking(null)
    if (error || data?.ok === false) {
      toast.error(error?.message || data?.error || 'เกิดข้อผิดพลาด')
    } else {
      toast.success(`เพิ่ม ${selected.full_name || selected.phone} เป็น ${newRole === 'super_admin' ? 'Super Admin' : 'Admin'} แล้ว`)
      setShowAdd(false); setSelected(null); setResults([]); setQuery(''); setNewPerms([])
      load()
    }
  }

  const savePermissions = async (admin, role, perms) => {
    setWorking(admin.id)
    const finalPerms = role === 'super_admin' ? ['*'] : perms
    const { data, error } = await supabase.rpc('admin_set_admin_permissions', {
      p_target_id: admin.id, p_role: role, p_permissions: finalPerms
    })
    setWorking(null)
    if (error || data?.ok === false) {
      toast.error(error?.message || data?.error || 'เกิดข้อผิดพลาด')
    } else {
      toast.success('บันทึกสิทธิ์แล้ว')
      load()
    }
  }

  const revokeAdmin = async (admin) => {
    if (!window.confirm(`ถอนสิทธิ์ ${admin.full_name || admin.phone} ออกจาก Admin?`)) return
    setWorking(admin.id)
    const { data, error } = await supabase.rpc('admin_revoke_admin', { p_target_id: admin.id })
    setWorking(null)
    if (error || data?.ok === false) {
      toast.error(error?.message || data?.error || 'เกิดข้อผิดพลาด')
    } else {
      toast.success('ถอนสิทธิ์แล้ว')
      load()
    }
  }

  const togglePerm = (perms, key) =>
    perms.includes(key) ? perms.filter(p => p !== key) : [...perms, key]

  if (loading) return <div className="flex justify-center h-32 items-center"><Loader2 className="animate-spin text-primary" size={24}/></div>

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">ผู้ดูแลระบบ</h1>
          <p className="text-on-surface-variant text-sm">จัดการสิทธิ์ Admin — เฉพาะ Super Admin เท่านั้น</p>
        </div>
        {isSuperAdmin() && (
          <button onClick={() => { setShowAdd(true); setSelected(null); setResults([]); setQuery('') }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-full text-sm font-semibold hover:bg-primary/90 transition">
            <UserPlus size={15}/> เพิ่ม Admin
          </button>
        )}
      </div>

      {!isSuperAdmin() && (
        <div className="glass-panel rounded-2xl p-4 flex items-center gap-3 text-sm border-l-4 border-amber-400">
          <Lock size={16} className="text-amber-500 flex-shrink-0"/>
          <span className="text-on-surface-variant">คุณมีสิทธิ์ดูรายชื่อเท่านั้น การแก้ไขสิทธิ์ต้องเป็น Super Admin</span>
        </div>
      )}

      {/* Admin list */}
      <div className="glass-panel rounded-2xl shadow-glass overflow-hidden">
        {admins.map((r, idx) => {
          const isMe = r.id === me?.id
          const expanded = expandedId === r.id
          const perms = r.admin_permissions || []
          const isSA = r.admin_role === 'super_admin'

          return (
            <div key={r.id} className={`border-b border-surface-container last:border-0 ${idx % 2 === 0 ? '' : 'bg-surface-container-low/30'}`}>
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold text-sm flex-shrink-0">
                  {(r.full_name || 'A')[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-on-surface text-sm">{r.full_name || '-'}</span>
                    <RoleBadge role={r.admin_role} />
                    {isMe && <span className="text-[10px] text-outline">(คุณ)</span>}
                  </div>
                  <div className="text-xs text-outline">{r.phone} · {r.member_id}</div>
                </div>
                {isSuperAdmin() && !isMe && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => setExpandedId(expanded ? null : r.id)}
                      className="text-xs px-3 py-1.5 bg-surface-container hover:bg-primary/10 text-primary rounded-full font-medium transition flex items-center gap-1">
                      {expanded ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
                      สิทธิ์
                    </button>
                    <button onClick={() => revokeAdmin(r)} disabled={working === r.id}
                      className="text-xs px-3 py-1.5 bg-error-container hover:bg-error/10 text-on-error-container rounded-full font-medium transition disabled:opacity-60 flex items-center gap-1">
                      {working === r.id ? <Loader2 size={13} className="animate-spin"/> : <ShieldOff size={13}/>}
                      ถอนสิทธิ์
                    </button>
                  </div>
                )}
              </div>

              {/* Permission editor */}
              {expanded && isSuperAdmin() && !isMe && (
                <PermissionEditor
                  admin={r}
                  onSave={savePermissions}
                  working={working === r.id}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Add Admin Modal */}
      {showAdd && isSuperAdmin() && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold text-on-surface flex items-center gap-2"><UserPlus size={18}/> เพิ่ม Admin ใหม่</h2>
              <button onClick={() => setShowAdd(false)} className="p-1.5 rounded-full hover:bg-surface-container"><X size={18}/></button>
            </div>
            <div className="p-5 space-y-4">
              {/* Search */}
              <div>
                <label className="text-sm font-medium text-on-surface-variant mb-1.5 block">ค้นหาสมาชิก (ชื่อ / เบอร์ / Member ID)</label>
                <div className="flex gap-2">
                  <input value={query} onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && searchUsers()}
                    placeholder="กรอกเบอร์หรือชื่อ..."
                    className="flex-1 border border-outline-variant rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"/>
                  <button onClick={searchUsers} disabled={searching}
                    className="px-4 py-2 bg-primary text-on-primary rounded-full text-sm font-medium hover:bg-primary/90 transition disabled:opacity-60">
                    {searching ? <Loader2 size={14} className="animate-spin"/> : <Search size={14}/>}
                  </button>
                </div>
              </div>

              {results.length > 0 && (
                <div className="border border-outline-variant rounded-2xl overflow-hidden">
                  {results.map(u => (
                    <button key={u.id} onClick={() => setSelected(u)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-primary/5 transition border-b border-outline-variant/30 last:border-0 ${selected?.id === u.id ? 'bg-primary/10' : ''}`}>
                      <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface font-bold text-sm flex-shrink-0">
                        {(u.full_name || 'U')[0]}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-on-surface">{u.full_name || '-'}</div>
                        <div className="text-xs text-outline">{u.phone} · {u.member_id}</div>
                      </div>
                      {selected?.id === u.id && <span className="ml-auto text-primary text-xs font-bold">✓ เลือก</span>}
                    </button>
                  ))}
                </div>
              )}

              {selected && (
                <>
                  <div>
                    <label className="text-sm font-medium text-on-surface-variant mb-1.5 block">ระดับสิทธิ์</label>
                    <div className="flex gap-3">
                      {[{v:'admin',l:'Admin'},{v:'super_admin',l:'Super Admin'}].map(opt => (
                        <button key={opt.v} onClick={() => setNewRole(opt.v)}
                          className={`flex-1 py-2.5 rounded-full text-sm font-semibold border-2 transition ${newRole === opt.v ? 'border-primary bg-primary text-on-primary' : 'border-outline-variant text-on-surface-variant hover:border-primary/50'}`}>
                          {opt.v === 'super_admin' && '⭐ '}{opt.l}
                        </button>
                      ))}
                    </div>
                    {newRole === 'super_admin' && (
                      <p className="text-xs text-amber-600 mt-1.5">⚠️ Super Admin มีสิทธิ์ทุกอย่างและสามารถเพิ่ม/ถอนสิทธิ์ Admin คนอื่นได้</p>
                    )}
                  </div>

                  {newRole === 'admin' && (
                    <div>
                      <label className="text-sm font-medium text-on-surface-variant mb-2 block">สิทธิ์การเข้าถึง</label>
                      <div className="grid grid-cols-2 gap-2">
                        {ALL_PERMISSIONS.map(p => (
                          <label key={p.key} className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition ${newPerms.includes(p.key) ? 'border-primary bg-primary/8 text-primary' : 'border-outline-variant/50 hover:border-primary/40 text-on-surface-variant'}`}>
                            <input type="checkbox" className="hidden" checked={newPerms.includes(p.key)}
                              onChange={() => setNewPerms(prev => togglePerm(prev, p.key))}/>
                            <span className="material-symbols-outlined text-[16px]">{p.icon}</span>
                            <span className="text-xs font-medium">{p.label}</span>
                          </label>
                        ))}
                      </div>
                      <button onClick={() => setNewPerms(ALL_PERMISSIONS.map(p => p.key))}
                        className="mt-2 text-xs text-primary hover:underline">เลือกทั้งหมด</button>
                    </div>
                  )}

                  <button onClick={addAdmin} disabled={working === 'add' || (newRole === 'admin' && newPerms.length === 0)}
                    className="w-full py-3 bg-primary text-on-primary rounded-full font-semibold hover:bg-primary/90 transition disabled:opacity-60">
                    {working === 'add' ? <Loader2 size={16} className="animate-spin mx-auto"/> : `เพิ่ม ${selected.full_name || selected.phone} เป็น Admin`}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PermissionEditor({ admin, onSave, working }) {
  const isSA = admin.admin_role === 'super_admin'
  const [role, setRole]   = useState(admin.admin_role || 'admin')
  const [perms, setPerms] = useState(
    (admin.admin_permissions || []).filter(p => p !== '*')
  )

  const togglePerm = (key) =>
    setPerms(prev => prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key])

  return (
    <div className="px-4 pb-4 bg-surface-container-low/50 border-t border-surface-container">
      <div className="pt-3 space-y-3">
        <div>
          <p className="text-xs font-semibold text-on-surface-variant mb-2">ระดับสิทธิ์</p>
          <div className="flex gap-2">
            {[{v:'admin',l:'Admin'},{v:'super_admin',l:'⭐ Super Admin'}].map(opt => (
              <button key={opt.v} onClick={() => setRole(opt.v)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold border-2 transition ${role === opt.v ? 'border-primary bg-primary text-on-primary' : 'border-outline-variant text-on-surface-variant'}`}>
                {opt.l}
              </button>
            ))}
          </div>
        </div>

        {role === 'admin' && (
          <div>
            <p className="text-xs font-semibold text-on-surface-variant mb-2">สิทธิ์การเข้าถึง</p>
            <div className="grid grid-cols-3 gap-1.5">
              {ALL_PERMISSIONS.map(p => (
                <label key={p.key} className={`flex items-center gap-1.5 p-2 rounded-lg border cursor-pointer transition text-xs ${perms.includes(p.key) ? 'border-primary bg-primary/10 text-primary' : 'border-outline-variant/40 text-on-surface-variant hover:border-primary/30'}`}>
                  <input type="checkbox" className="hidden" checked={perms.includes(p.key)}
                    onChange={() => togglePerm(p.key)}/>
                  <span className="material-symbols-outlined text-[14px]">{p.icon}</span>
                  <span>{p.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 justify-end pt-1">
          <button onClick={() => onSave(admin, role, perms)} disabled={working || (role === 'admin' && perms.length === 0)}
            className="px-4 py-2 bg-primary text-on-primary rounded-full text-xs font-semibold hover:bg-primary/90 transition disabled:opacity-60 flex items-center gap-1.5">
            {working ? <Loader2 size={12} className="animate-spin"/> : <ShieldCheck size={12}/>}
            บันทึกสิทธิ์
          </button>
        </div>
      </div>
    </div>
  )
}
