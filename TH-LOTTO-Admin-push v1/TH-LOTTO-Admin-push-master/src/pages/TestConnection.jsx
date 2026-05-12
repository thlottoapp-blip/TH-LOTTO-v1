import React, { useState, useEffect } from 'react'
import { testConnection, testAdminAccess, testNotificationsTable, testRealtime, runAllTests } from '../utils/dbTest'
import { supabase } from '../supabaseClient'

export default function TestConnection() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [dbStatus, setDbStatus] = useState(null)

  const runTests = async () => {
    setLoading(true)
    const res = await runAllTests()
    setResults(res)
    setLoading(false)
  }

  const quickTest = async () => {
    setLoading(true)
    const result = await testConnection()
    setDbStatus(result)
    setLoading(false)
  }

  // Auto-run on mount
  useEffect(() => {
    quickTest()
  }, [])

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-on-surface">ทดสอบการเชื่อมต่อฐานข้อมูล</h1>
        <p className="text-on-surface-variant text-sm">ตรวจสอบการเชื่อมต่อ Supabase จริง</p>
      </div>

      {/* Quick Status */}
      {dbStatus && (
        <div className={`glass-panel rounded-2xl p-6 ${dbStatus.success ? 'bg-secondary/10' : 'bg-error/10'}`}>
          <div className="flex items-center gap-3">
            <span className={`text-2xl ${dbStatus.success ? 'text-secondary' : 'text-error'}`}>
              {dbStatus.success ? '✅' : '❌'}
            </span>
            <div>
              <h3 className={`font-semibold ${dbStatus.success ? 'text-secondary' : 'text-error'}`}>
                {dbStatus.success ? 'เชื่อมต่อสำเร็จ' : 'เชื่อมต่อล้มเหลว'}
              </h3>
              <p className="text-sm text-on-surface-variant">{dbStatus.message}</p>
            </div>
          </div>
          {dbStatus.error && (
            <p className="mt-3 text-xs text-error bg-error/10 p-2 rounded">{dbStatus.error}</p>
          )}
        </div>
      )}

      {/* Database Info */}
      <div className="glass-panel rounded-2xl p-6">
        <h3 className="font-semibold text-on-surface mb-4">ข้อมูลการเชื่อมต่อ</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-on-surface-variant">Supabase URL:</span>
            <span className="font-mono text-on-surface">{import.meta.env.VITE_SUPABASE_URL || 'ไม่ได้ตั้งค่า'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-on-surface-variant">Anon Key:</span>
            <span className="font-mono text-on-surface">
              {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ มีข้อมูล' : '❌ ไม่มีข้อมูล'}
            </span>
          </div>
        </div>
      </div>

      {/* Test Buttons */}
      <div className="flex gap-3">
        <button
          onClick={quickTest}
          disabled={loading}
          className="flex-1 py-3 bg-primary hover:bg-primary/90 text-on-primary rounded-full font-medium transition disabled:opacity-50"
        >
          {loading ? '⏳ กำลังทดสอบ...' : '🔄 ทดสอบอีกครั้ง'}
        </button>
        <button
          onClick={runTests}
          disabled={loading}
          className="flex-1 py-3 bg-secondary hover:bg-secondary/90 text-on-secondary rounded-full font-medium transition disabled:opacity-50"
        >
          🧪 ทดสอบทั้งหมด
        </button>
      </div>

      {/* Full Test Results */}
      {results.length > 0 && (
        <div className="glass-panel rounded-2xl p-6">
          <h3 className="font-semibold text-on-surface mb-4">ผลการทดสอบทั้งหมด</h3>
          <div className="space-y-3">
            {results.map((r, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${r.success ? 'bg-secondary/10' : 'bg-error/10'}`}>
                <span className={`text-xl ${r.success ? 'text-secondary' : 'text-error'}`}>
                  {r.success ? '✅' : '❌'}
                </span>
                <div className="flex-1">
                  <p className="font-medium text-on-surface">{r.name}</p>
                  <p className="text-sm text-on-surface-variant">{r.message}</p>
                  {r.error && <p className="text-xs text-error mt-1">{r.error}</p>}
                  {r.hint && <p className="text-xs text-primary mt-1">💡 {r.hint}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="glass-panel rounded-2xl p-6 bg-warning-container/30">
        <h3 className="font-semibold text-on-surface-variant mb-3">⚠️ คำแนะนำ</h3>
        <ul className="text-sm text-on-surface-variant space-y-2 list-disc list-inside">
          <li>ถ้าเชื่อมต่อไม่ได้ ตรวจสอบ .env ว่ามี VITE_SUPABASE_URL และ VITE_SUPABASE_ANON_KEY</li>
          <li>ถ้า Notifications Table ไม่พร้อม ต้องรัน SQL migration 001 ใน Supabase</li>
          <li>ต้องล็อกอินเป็นแอดมินก่อนถึงจะเห็นข้อมูลบางอย่าง</li>
        </ul>
      </div>

      {/* Next Steps */}
      <div className="flex gap-3">
        <button
          onClick={() => window.location.href = '/login'}
          className="flex-1 py-3 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-full font-medium transition"
        >
          🔐 ไปหน้า Login
        </button>
        <button
          onClick={() => window.location.href = '/'}
          className="flex-1 py-3 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-full font-medium transition"
        >
          📊 ไป Dashboard
        </button>
      </div>
    </div>
  )
}
