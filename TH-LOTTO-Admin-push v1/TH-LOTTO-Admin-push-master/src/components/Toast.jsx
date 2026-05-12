import React, { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react'

const VARIANTS = {
  success: {
    bg: 'bg-[#1a7e2a]',
    icon: CheckCircle2,
    title: 'สำเร็จ',
  },
  error: {
    bg: 'bg-red-600',
    icon: XCircle,
    title: 'เกิดข้อผิดพลาด',
  },
  warning: {
    bg: 'bg-amber-500',
    icon: AlertTriangle,
    title: 'แจ้งเตือน',
  },
  info: {
    bg: 'bg-blue-600',
    icon: Info,
    title: 'ข้อมูล',
  },
}

function ToastItem({ id, type = 'info', message, title, onClose }) {
  const v = VARIANTS[type] || VARIANTS.info
  const Icon = v.icon

  useEffect(() => {
    const t = setTimeout(() => onClose(id), 4000)
    return () => clearTimeout(t)
  }, [id, onClose])

  return (
    <div className={`${v.bg} text-white rounded-2xl shadow-2xl px-5 py-4 flex items-start gap-3 min-w-[280px] max-w-sm w-full animate-fade-in`}>
      <Icon size={22} className="flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm">{title || v.title}</p>
        {message && <p className="text-white/90 text-xs mt-0.5 leading-relaxed">{message}</p>}
      </div>
      <button onClick={() => onClose(id)} className="flex-shrink-0 opacity-70 hover:opacity-100 transition">
        <X size={16} />
      </button>
    </div>
  )
}

export function ToastContainer({ toasts, onClose }) {
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-3 items-center pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem {...t} onClose={onClose} />
        </div>
      ))}
    </div>
  )
}

let _setToasts = null

export function initToast(setter) {
  _setToasts = setter
}

let _counter = 0

export function showToast({ type = 'info', title, message }) {
  if (!_setToasts) return
  const id = ++_counter
  _setToasts(prev => [...prev, { id, type, title, message }])
}

export const toast = {
  success: (message, title) => showToast({ type: 'success', title, message }),
  error: (message, title) => showToast({ type: 'error', title, message }),
  warning: (message, title) => showToast({ type: 'warning', title, message }),
  info: (message, title) => showToast({ type: 'info', title, message }),
}
