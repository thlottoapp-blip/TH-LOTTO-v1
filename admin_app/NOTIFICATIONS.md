# ระบบแจ้งเตือน Admin (Admin Notifications System)

## 🔔 ภาพรวม

ระบบแจ้งเตือนอัตโนมัติสำหรับแอดมิน แจ้งเตือนเมื่อมีเหตุการณ์สำคัญเกิดขึ้นในระบบ

## 📦 ไฟล์ที่สร้าง

```
supabase/
  migrations/
    001_admin_notifications.sql    # ตาราง + Triggers
    002_enable_realtime.sql         # Realtime subscriptions

src/
  utils/
    notifications.js               # Utility functions
  components/
    Layout.jsx                     # UI Component (มี notification bell)
```

## 🗄️ ฐานข้อมูล

### ตาราง `admin_notifications`

| คอลัมน์ | ประเภท | คำอธิบาย |
|---------|--------|----------|
| `id` | UUID | Primary key |
| `type` | TEXT | DEPOSIT, WITHDRAW, RESULT, MEMBER, SYSTEM |
| `message` | TEXT | ข้อความแจ้งเตือน |
| `link_url` | TEXT | ลิงก์ไปหน้าที่เกี่ยวข้อง |
| `is_read` | BOOLEAN | สถานะอ่านแล้ว |
| `metadata` | JSONB | ข้อมูลเพิ่มเติม |
| `created_at` | TIMESTAMPTZ | เวลาสร้าง |

## ⚡ Auto-Notifications (Triggers)

| เหตุการณ์ | Trigger | ข้อความ |
|-----------|---------|---------|
| ฝากเงินใหม่ | `trg_notify_deposit` | "สมาชิก {name} ({id}) ฝากเงิน ฿{amount}" |
| ถอนเงินใหม่ | `trg_notify_withdraw` | "สมาชิก {name} ({id}) ขอถอน ฿{amount}" |
| ออกผลหวย | `trg_notify_result` | "ออกผล {market} งวด {date} แล้ว" |
| สมาชิกใหม่ | `trg_notify_member` | "สมาชิกใหม่: {name} ({phone})" |

## 🎯 การใช้งาน UI

### ใน Layout Component:

```jsx
// กดที่กระดิ่งเพื่อดูการแจ้งเตือน
<button onClick={() => setNotifOpen(!notifOpen)}>
  <span className="material-symbols-outlined">notifications</span>
  {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
</button>
```

### ฟีเจอร์:
- 🔴 Badge แสดงจำนวน unread (สูงสุด 9+)
- 📋 Dropdown panel แสดง 20 รายการล่าสุด
- ⏰ เวลาแบบ Relative ("2 นาทีที่แล้ว")
- ✅ Mark as read (คลิกที่รายการ หรือ "อ่านทั้งหมด")
- 🔄 Realtime updates (อัพเดทอัตโนมัติ)
- 🔗 Click to navigate (คลิกแล้วไปหน้าที่เกี่ยวข้อง)

## 🔧 Utility Functions

```javascript
import { 
  fetchNotifications, 
  markAsRead, 
  markAllAsRead,
  createNotification,
  subscribeToNotifications 
} from '../utils/notifications'

// ดึงการแจ้งเตือน
const notifications = await fetchNotifications(20)

// อ่านแล้ว
await markAsRead(notificationId)

// อ่านทั้งหมด
await markAllAsRead()

// สร้างแจ้งเตือนด้วยมือ (System)
await createNotification('SYSTEM', 'ข้อความ', '/link', {})

// Subscribe realtime
const unsubscribe = subscribeToNotifications((payload) => {
  console.log('New notification:', payload)
})
```

## 🚀 การติดตั้ง

### 1. รัน SQL Migrations ใน Supabase SQL Editor:

```bash
# ไปที่ Supabase Dashboard > SQL Editor
# คัดลอกเนื้อหาจาก:
# - supabase/migrations/001_admin_notifications.sql
# - supabase/migrations/002_enable_realtime.sql
```

### 2. ติดตั้ง dependencies:

```bash
npm install date-fns
```

### 3. เพิ่ม `date-fns` ใน `package.json`:

```json
"dependencies": {
  "date-fns": "^3.6.0"
}
```

## 🎨 ไอคอนตามประเภท

| ประเภท | ไอคอน | สี |
|--------|-------|-----|
| DEPOSIT | payments | secondary (เขียว) |
| WITHDRAW | account_balance_wallet | error (แดง) |
| RESULT | emoji_events | primary (น้ำเงิน) |
| MEMBER | person_add | tertiary (ม่วง) |
| SYSTEM | info | on-surface-variant |

## 🔒 ความปลอดภัย (RLS)

```sql
-- เฉพาะ Admin เท่านั้นที่เห็นการแจ้งเตือน
CREATE POLICY "Admin full access to notifications"
  ON admin_notifications
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
```

## 🧹 Maintenance

```sql
-- ลบการแจ้งเตือนเกิน 30 วัน
SELECT cleanup_old_notifications();

-- นับ unread
SELECT admin_unread_notification_count();

-- อ่านทั้งหมด
SELECT admin_mark_all_notifications_read();
```

## 📝 ตัวอย่างการสร้างแจ้งเตือนด้วยมือ

```javascript
// จาก frontend
await createNotification(
  'SYSTEM', 
  'ระบบจะปิดปรับปรุงเวลา 02:00 น.', 
  '/settings',
  { priority: 'high' }
)
```

## ✅ Checklist

- [ ] รัน SQL migration 001
- [ ] รัน SQL migration 002
- [ ] ติดตั้ง `date-fns`
- [ ] ทดสอบฝากเงิน → ดูการแจ้งเตือน
- [ ] ทดสอบถอนเงิน → ดูการแจ้งเตือน
- [ ] ทดสอบคลิกที่การแจ้งเตือน → Navigate ไปหน้าที่ถูกต้อง
