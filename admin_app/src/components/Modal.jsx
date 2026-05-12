import React from 'react'
import { CheckCircle2, XCircle, AlertTriangle, Info, HelpCircle, Loader2, X } from 'lucide-react'

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
  confirm: HelpCircle,
}

const STYLES = {
  success: {
    icon: 'text-emerald-500',
    bg: 'bg-emerald-50',
    button: 'bg-[#1a7e2a] hover:bg-[#156321]',
  },
  error: {
    icon: 'text-red-500',
    bg: 'bg-red-50',
    button: 'bg-red-600 hover:bg-red-700',
  },
  warning: {
    icon: 'text-amber-500',
    bg: 'bg-amber-50',
    button: 'bg-amber-500 hover:bg-amber-600',
  },
  info: {
    icon: 'text-blue-500',
    bg: 'bg-blue-50',
    button: 'bg-blue-600 hover:bg-blue-700',
  },
  confirm: {
    icon: 'text-[#1a7e2a]',
    bg: 'bg-[#1a7e2a]/10',
    button: 'bg-[#1a7e2a] hover:bg-[#156321]',
  },
}

export default function Modal({
  isOpen,
  onClose,
  type = 'info',
  title,
  message,
  confirmText = 'ตกลง',
  cancelText = 'ยกเลิก',
  onConfirm,
  showCancel = false,
  loading = false,
}) {
  if (!isOpen) return null

  const Icon = ICONS[type] || ICONS.info
  const style = STYLES[type] || STYLES.info

  const handleConfirm = () => {
    if (onConfirm) onConfirm()
    if (!loading) onClose()
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={!loading ? onClose : undefined}
      />

      {/* Modal Card */}
      <div className="relative bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Close button (ถ้าไม่มี onConfirm) */}
        {!onConfirm && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
          >
            <X size={20} />
          </button>
        )}

        {/* Icon */}
        <div className="text-center mb-6">
          <div className={`w-20 h-20 ${style.bg} rounded-full flex items-center justify-center mx-auto mb-4`}>
            <Icon className={`w-10 h-10 ${style.icon}`} />
          </div>
          <h3 className="text-xl font-bold text-slate-900">{title}</h3>
          {message && (
            <p className="text-sm text-slate-500 mt-2 leading-relaxed whitespace-pre-line">{message}</p>
          )}
        </div>

        {/* Buttons */}
        <div className={`flex gap-3 ${showCancel ? 'flex-row' : 'flex-col'}`}>
          {showCancel && (
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3.5 px-6 rounded-2xl font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`flex-1 py-3.5 px-6 rounded-2xl font-semibold text-white ${style.button} transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2`}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <CheckCircle2 size={18} />
                {confirmText}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
