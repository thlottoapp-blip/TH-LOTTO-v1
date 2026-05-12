import React, { useState, useEffect, useRef } from 'react'
import { ToastContainer, initToast } from './Toast'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { supabase } from '../supabaseClient'
import { formatDistanceToNow } from 'date-fns'
import { th } from 'date-fns/locale'
import { 
  fetchNotifications, 
  markAsRead, 
  markAllAsRead,
  subscribeToNotifications,
  getNotificationStyle 
} from '../utils/notifications'

const NAV_GROUPS = [
  {
    label: 'ภาพรวม',
    items: [
      { to: '/', label: 'แผงควบคุม', icon: 'dashboard', end: true, perm: null },
    ]
  },
  {
    label: 'การเงิน',
    items: [
      { to: '/deposits',    label: 'รายการฝากเงิน',  icon: 'payments',                 perm: 'deposits' },
      { to: '/withdrawals', label: 'รายการถอนเงิน',  icon: 'account_balance_wallet',   perm: 'withdrawals' },
    ]
  },
  {
    label: 'สมาชิก',
    items: [
      { to: '/members', label: 'จัดการสมาชิก', icon: 'group',                perm: 'members' },
      { to: '/admins',  label: 'ผู้ดูแลระบบ',  icon: 'admin_panel_settings', perm: null },
    ]
  },
  {
    label: 'หวย',
    items: [
      { to: '/markets',    label: 'ตลาดหวย',    icon: 'confirmation_number', perm: 'markets' },
      { to: '/results',    label: 'ออกผลรางวัล', icon: 'emoji_events',       perm: 'markets' },
      { to: '/bets',       label: 'รายการโพย',  icon: 'list_alt',            perm: 'bets' },
      { to: '/restricted', label: 'เลขอั้น',    icon: 'block',               perm: 'restricted' },
    ]
  },
  {
    label: 'เกม',
    items: [
      { to: '/wheel', label: 'วงล้อโชคดี', icon: 'casino', perm: 'wheel' },
    ]
  },
  {
    label: 'คอนเทนต์',
    items: [
      { to: '/sliders',    label: 'สไลเดอร์',  icon: 'view_carousel', perm: 'sliders' },
      { to: '/promotions', label: 'โปรโมชั่น', icon: 'campaign',      perm: 'promotions' },
      { to: '/articles',   label: 'บทความ',    icon: 'article',       perm: 'articles' },
    ]
  },
  {
    label: 'ระบบ',
    items: [
      { to: '/settings',   label: 'ตั้งค่าระบบ', icon: 'settings',        perm: 'settings' },
      { to: '/appearance', label: 'รูปลักษณ์',   icon: 'palette',         perm: 'appearance' },
      { to: '/banks',      label: 'ธนาคาร',         icon: 'account_balance', perm: 'banks' },
      { to: '/data-management', label: 'Backup & ข้อมูล', icon: 'backup',           perm: 'settings' },
    ]
  },
]

export default function Layout() {
  const { profile, signOut, hasPermission } = useAuth()
  const nav = useNavigate()
  const [open, setOpen] = useState(false)
  const [siteSettings, setSiteSettings] = useState({ site_logo_url: '', site_name: 'THLotto' })
  
  // Notification state
  const [toasts, setToasts] = useState([])
  const closeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id))
  useEffect(() => { initToast(setToasts) }, [])

  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const notifRef = useRef(null)

  useEffect(() => {
    supabase.from('settings')
      .select('key,value')
      .in('key', ['site_logo_url', 'site_name'])
      .then(({ data }) => {
        if (data) {
          const map = {}
          data.forEach(s => { map[s.key] = s.value })
          setSiteSettings(prev => ({ ...prev, ...map }))
        }
      })
  }, [])

  const handleLogout = async () => { await signOut(); nav('/login', { replace: true }) }
  const initial = (profile?.full_name || 'A')[0].toUpperCase()

  // Load notifications
  const loadNotifications = async () => {
    try {
      const data = await fetchNotifications(20)
      setNotifications(data)
      setUnreadCount(data.filter(n => !n.is_read).length)
    } catch (err) {
      console.error('Failed to load notifications:', err)
    }
  }

  // Handle notification click
  const handleNotifClick = async (notification) => {
    // Mark as read
    if (!notification.is_read) {
      try {
        await markAsRead(notification.id)
        setNotifications(prev => prev.map(n => 
          n.id === notification.id ? { ...n, is_read: true } : n
        ))
        setUnreadCount(prev => Math.max(0, prev - 1))
      } catch (err) {
        console.error('Failed to mark as read:', err)
      }
    }
    
    // Navigate to link if provided
    if (notification.link_url) {
      nav(notification.link_url)
      setNotifOpen(false)
    }
  }

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    }
  }

  // Realtime subscription
  useEffect(() => {
    loadNotifications()
    const unsubscribe = subscribeToNotifications((payload) => {
      if (payload.eventType === 'INSERT') {
        // Add new notification to top
        setNotifications(prev => [payload.new, ...prev].slice(0, 20))
        if (!payload.new.is_read) {
          setUnreadCount(prev => prev + 1)
        }
      } else {
        // Reload for updates/deletes
        loadNotifications()
      }
    })
    return unsubscribe
  }, [])

  // Close notification panel on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="min-h-screen bg-background flex font-prompt">
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar — glassmorphic floating pill */}
      <aside className={`
        fixed left-0 top-0 z-40 h-screen w-72 flex flex-col
        bg-white/60 backdrop-blur-xl border border-white/20
        shadow-[0_20px_50px_rgba(6,78,59,0.15)]
        rounded-none lg:rounded-[40px] lg:m-4 lg:h-[calc(100vh-32px)]
        transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo / Profile */}
        <div className="p-6 flex flex-col items-center border-b border-white/20 flex-shrink-0">
          {siteSettings.site_logo_url ? (
            <img
              src={siteSettings.site_logo_url}
              alt={siteSettings.site_name}
              className="h-16 w-auto object-contain mb-3 drop-shadow-md"
              onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex' }}
            />
          ) : null}
          <div
            className="h-16 w-16 rounded-full bg-primary-container items-center justify-center mb-3 border-2 border-white shadow-capsule-md"
            style={{ display: siteSettings.site_logo_url ? 'none' : 'flex' }}>
            <span className="text-on-primary-container text-2xl font-black">{initial}</span>
          </div>
          <div className="text-lg font-black tracking-tight text-primary">{siteSettings.site_name || 'THLotto'}</div>
          <div className="text-on-surface-variant text-sm mt-1">{profile?.full_name || 'ผู้ดูแลระบบ'}</div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 scrollbar-thin">
          {NAV_GROUPS.map((group, gi) => {
            const visibleItems = group.items.filter(item => item.perm === null || hasPermission(item.perm))
            if (visibleItems.length === 0) return null
            return (
            <div key={gi} className="mb-1">
              <div className="px-4 pt-3 pb-1">
                <span className="text-[10px] font-bold tracking-[0.12em] uppercase text-outline">{group.label}</span>
              </div>
              <div className="space-y-0.5">
                {visibleItems.map(item => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 mx-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200 ease-out
                      ${isActive
                        ? 'bg-primary text-on-primary shadow-capsule-md'
                        : 'text-on-surface-variant hover:bg-primary/8 hover:text-primary active:scale-95'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          className="material-symbols-outlined text-[20px] leading-none flex-shrink-0"
                          style={{ fontVariationSettings: isActive ? "'FILL' 1, 'wght' 500" : "'FILL' 0, 'wght' 400" }}
                        >
                          {item.icon}
                        </span>
                        <span className="truncate">{item.label}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-white/20 flex-shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 py-3 px-4 rounded-full text-sm font-medium text-on-surface-variant hover:bg-error/10 hover:text-error transition-all duration-200 active:scale-95"
          >
            <span className="material-symbols-outlined text-[22px] leading-none">logout</span>
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-[304px]">
        {/* Header — glassmorphic floating pill */}
        <header className="sticky top-0 z-20 mx-4 mt-4">
          <div className="bg-white/60 backdrop-blur-md rounded-full border border-white/30 shadow-glass px-6 py-0 flex items-center h-16 gap-4">
            {/* Mobile hamburger */}
            <button
              className="lg:hidden p-2 rounded-full text-on-surface-variant hover:bg-primary/5 active:scale-95 transition-all"
              onClick={() => setOpen(true)}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>

            {/* Search */}
            <div className="flex-1 max-w-sm hidden md:flex items-center gap-2 bg-surface-container-low rounded-full px-4 py-2 border border-outline-variant/30">
              <span className="material-symbols-outlined text-outline text-[18px]">search</span>
              <span className="text-sm text-outline">ค้นหา...</span>
            </div>

            <div className="ml-auto flex items-center gap-2">
              {/* Online indicator */}
              <div className="hidden sm:flex items-center gap-2 bg-secondary-container/40 text-on-secondary-container px-3 py-1.5 rounded-full text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse inline-block"></span>
                ระบบออนไลน์
              </div>
              {/* Notification */}
              <div className="relative" ref={notifRef}>
                <button 
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="p-2 rounded-full text-on-surface-variant hover:bg-primary/5 transition-all relative"
                >
                  <span className="material-symbols-outlined">notifications</span>
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-error text-on-error text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                
                {notifOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white/90 backdrop-blur-xl rounded-2xl shadow-capsule border border-white/30 z-50 max-h-96 overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b border-outline-variant/30">
                      <h3 className="font-semibold text-on-surface">การแจ้งเตือน</h3>
                      {unreadCount > 0 && (
                        <button 
                          onClick={handleMarkAllAsRead}
                          className="text-xs text-primary hover:text-primary/70 font-medium"
                        >
                          อ่านทั้งหมด
                        </button>
                      )}
                    </div>
                    <div className="overflow-y-auto max-h-72">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-outline text-sm">
                          ไม่มีการแจ้งเตือน
                        </div>
                      ) : (
                        notifications.map(n => {
                          const style = getNotificationStyle(n.type)
                          return (
                            <div 
                              key={n.id}
                              onClick={() => handleNotifClick(n)}
                              className={`p-4 border-b border-outline-variant/20 cursor-pointer transition-colors ${
                                n.is_read ? 'bg-surface/50' : 'bg-primary/5 hover:bg-primary/10'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <span className={`material-symbols-outlined ${style.color}`}>
                                  {style.icon}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm ${n.is_read ? 'text-on-surface-variant' : 'text-on-surface font-medium'}`}>
                                    {n.message}
                                  </p>
                                  <p className="text-xs text-outline mt-1">
                                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: th })}
                                  </p>
                                </div>
                                {!n.is_read && (
                                  <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1"></span>
                                )}
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
              {/* Avatar */}
              <div className="h-9 w-9 rounded-full bg-primary-container flex items-center justify-center border-2 border-white shadow-sm text-on-primary-container font-bold text-sm">
                {initial}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 pt-6">
          <Outlet />
        </main>
        {/* Version footer */}
        <footer className="px-6 py-2 text-right text-[10px] text-outline/50">
          v{__APP_VERSION__}
        </footer>
      </div>
      <ToastContainer toasts={toasts} onClose={closeToast} />
    </div>
  )
}
