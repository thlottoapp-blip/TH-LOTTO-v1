import { supabase } from '../supabaseClient'

/**
 * Admin Notifications Utility
 * 
 * Auto-generated notifications from database triggers:
 * - DEPOSIT: New deposit request
 * - WITHDRAW: New withdrawal request  
 * - RESULT: Lottery result announced
 * - MEMBER: New member registration
 * 
 * Manual notifications can be created with createNotification()
 */

// Fetch all notifications
export async function fetchNotifications(limit = 20) {
  const { data, error } = await supabase
    .from('admin_notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (error) throw error
  return data || []
}

// Mark single notification as read
export async function markAsRead(notificationId) {
  const { error } = await supabase
    .from('admin_notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
  
  if (error) throw error
  return true
}

// Mark all notifications as read
export async function markAllAsRead() {
  const { error } = await supabase
    .from('admin_notifications')
    .update({ is_read: true })
    .eq('is_read', false)
  
  if (error) throw error
  return true
}

// Get unread count
export async function getUnreadCount() {
  const { count, error } = await supabase
    .from('admin_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('is_read', false)
  
  if (error) throw error
  return count || 0
}

// Create manual notification (for system alerts)
export async function createNotification(type, message, linkUrl = null, metadata = {}) {
  const validTypes = ['DEPOSIT', 'WITHDRAW', 'RESULT', 'MEMBER', 'SYSTEM']
  if (!validTypes.includes(type)) {
    throw new Error(`Invalid notification type: ${type}`)
  }
  
  const { data, error } = await supabase
    .from('admin_notifications')
    .insert({
      type,
      message,
      link_url: linkUrl,
      metadata,
      is_read: false
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

// Delete old notifications (admin only)
export async function cleanupOldNotifications(days = 30) {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  
  const { error } = await supabase
    .from('admin_notifications')
    .delete()
    .lt('created_at', cutoff.toISOString())
  
  if (error) throw error
  return true
}

// Subscribe to realtime notifications
export function subscribeToNotifications(callback) {
  const channel = supabase
    .channel('admin-notifications')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'admin_notifications' },
      (payload) => {
        callback(payload)
      }
    )
    .subscribe()
  
  return () => {
    supabase.removeChannel(channel)
  }
}

// Get notification icon and color by type
export function getNotificationStyle(type) {
  const styles = {
    DEPOSIT: {
      icon: 'payments',
      color: 'text-secondary',
      bgColor: 'bg-secondary/10'
    },
    WITHDRAW: {
      icon: 'account_balance_wallet',
      color: 'text-error',
      bgColor: 'bg-error/10'
    },
    RESULT: {
      icon: 'emoji_events',
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    MEMBER: {
      icon: 'person_add',
      color: 'text-tertiary',
      bgColor: 'bg-tertiary/10'
    },
    SYSTEM: {
      icon: 'info',
      color: 'text-on-surface-variant',
      bgColor: 'bg-surface-container'
    }
  }
  
  return styles[type] || styles.SYSTEM
}
