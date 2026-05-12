import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

let _cache = null
let _promise = null

function getBankMap() {
  if (_cache) return Promise.resolve(_cache)
  if (!_promise) {
    _promise = supabase.from('banks').select('code,name,image_url').then(({ data }) => {
      _cache = {}
      ;(data || []).forEach(b => { _cache[b.code] = b })
      return _cache
    })
  }
  return _promise
}

export default function BankBadge({ code, showName = false, size = 'sm' }) {
  const [bank, setBank] = useState(null)

  useEffect(() => {
    if (!code) return
    getBankMap().then(map => {
      setBank(map[code] || { code, name: code, image_url: null })
    })
  }, [code])

  if (!code) return <span className="text-outline text-xs">-</span>

  const dim = size === 'md' ? 'w-7 h-7' : 'w-5 h-5'

  return (
    <div className="flex items-center gap-1.5">
      {bank?.image_url ? (
        <img
          src={bank.image_url}
          alt={bank?.name || code}
          className={`${dim} rounded-full object-contain bg-white border border-outline-variant flex-shrink-0 shadow-sm`}
          onError={e => { e.currentTarget.style.display = 'none' }}
        />
      ) : (
        <div className={`${dim} rounded-full bg-surface-container border border-outline-variant flex items-center justify-center font-bold text-on-surface-variant flex-shrink-0`}
          style={{ fontSize: '8px' }}>
          {(code || '?').slice(0, 2)}
        </div>
      )}
      <span className="text-xs font-medium text-on-surface">
        {showName ? (bank?.name || code) : code}
      </span>
    </div>
  )
}
