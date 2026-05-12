/**
 * Database Connection Test Utility
 * 
 * ทดสอบการเชื่อมต่อฐานข้อมูลจริง (Supabase Production)
 */

import { supabase } from '../supabaseClient'

/**
 * Test basic database connection
 */
export async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('key, value')
      .limit(1)
    
    if (error) throw error
    
    return {
      success: true,
      message: 'เชื่อมต่อฐานข้อมูลสำเร็จ',
      data
    }
  } catch (err) {
    return {
      success: false,
      message: 'เชื่อมต่อฐานข้อมูลล้มเหลว',
      error: err.message
    }
  }
}

/**
 * Test admin access
 */
export async function testAdminAccess() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { success: false, message: 'ไม่ได้ล็อกอิน' }
    }
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    
    if (error) throw error
    
    return {
      success: profile?.is_admin === true,
      message: profile?.is_admin ? 'มีสิทธิ์แอดมิน' : 'ไม่มีสิทธิ์แอดมิน',
      userId: user.id
    }
  } catch (err) {
    return {
      success: false,
      message: 'ตรวจสอบสิทธิ์ล้มเหลว',
      error: err.message
    }
  }
}

/**
 * Test notifications table (จาก migration 001)
 */
export async function testNotificationsTable() {
  try {
    const { data, error } = await supabase
      .from('admin_notifications')
      .select('*')
      .limit(1)
    
    if (error) throw error
    
    return {
      success: true,
      message: 'ตาราง admin_notifications พร้อมใช้งาน',
      data
    }
  } catch (err) {
    return {
      success: false,
      message: 'ตาราง admin_notifications ยังไม่พร้อม',
      error: err.message,
      hint: 'กรุณารัน SQL migration 001_admin_notifications.sql'
    }
  }
}

/**
 * Test realtime subscription
 */
export function testRealtime() {
  try {
    const channel = supabase
      .channel('test-connection')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, (payload) => {
        console.log('Realtime test:', payload)
      })
      .subscribe((status) => {
        console.log('Realtime status:', status)
      })
    
    // Unsubscribe after 5 seconds
    setTimeout(() => {
      supabase.removeChannel(channel)
    }, 5000)
    
    return {
      success: true,
      message: 'Realtime subscription ทำงาน'
    }
  } catch (err) {
    return {
      success: false,
      message: 'Realtime ล้มเหลว',
      error: err.message
    }
  }
}

/**
 * Run all tests
 */
export async function runAllTests() {
  console.log('🧪 กำลังทดสอบการเชื่อมต่อฐานข้อมูล...\n')
  
  const tests = [
    { name: 'Connection', fn: testConnection },
    { name: 'Admin Access', fn: testAdminAccess },
    { name: 'Notifications Table', fn: testNotificationsTable },
    { name: 'Realtime', fn: () => Promise.resolve(testRealtime()) }
  ]
  
  const results = []
  
  for (const test of tests) {
    console.log(`⏳ ทดสอบ: ${test.name}...`)
    const result = await test.fn()
    results.push({ name: test.name, ...result })
    
    if (result.success) {
      console.log(`✅ ${test.name}: ${result.message}`)
    } else {
      console.log(`❌ ${test.name}: ${result.message}`)
      if (result.error) console.log(`   Error: ${result.error}`)
      if (result.hint) console.log(`   Hint: ${result.hint}`)
    }
    console.log('')
  }
  
  return results
}
