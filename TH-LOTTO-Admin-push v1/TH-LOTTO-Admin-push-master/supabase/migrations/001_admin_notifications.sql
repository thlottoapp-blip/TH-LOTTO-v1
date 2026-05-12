-- =============================================
-- Admin Notifications System - Complete Setup
-- =============================================

-- 1. Create admin_notifications table
CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('DEPOSIT', 'WITHDRAW', 'RESULT', 'MEMBER', 'SYSTEM')),
  message TEXT NOT NULL,
  link_url TEXT,
  is_read BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE admin_notifications;

-- 3. Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_admin_notifications_updated_at
  BEFORE UPDATE ON admin_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. RLS Policies (Admin only access)
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to notifications"
  ON admin_notifications
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND is_admin = true
    )
  );

-- =============================================
-- AUTO-NOTIFICATION TRIGGERS
-- =============================================

-- Function: Create notification for new deposit
CREATE OR REPLACE FUNCTION notify_admin_deposit()
RETURNS TRIGGER AS $$
DECLARE
  v_member_id TEXT;
  v_full_name TEXT;
  v_amount NUMERIC;
BEGIN
  -- Get member info
  SELECT member_id, full_name INTO v_member_id, v_full_name
  FROM profiles WHERE id = NEW.user_id;
  
  v_amount := NEW.amount;
  
  -- Insert notification
  INSERT INTO admin_notifications (type, message, link_url, metadata)
  VALUES (
    'DEPOSIT',
    format('สมาชิก %s (%s) ฝากเงิน ฿%s', v_full_name, v_member_id, v_amount::TEXT),
    '/deposits',
    jsonb_build_object(
      'deposit_id', NEW.id,
      'user_id', NEW.user_id,
      'amount', v_amount,
      'status', NEW.status
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: New deposit request
DROP TRIGGER IF EXISTS trg_notify_deposit ON deposit_requests;
CREATE TRIGGER trg_notify_deposit
  AFTER INSERT ON deposit_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_admin_deposit();

-- Function: Create notification for new withdrawal
CREATE OR REPLACE FUNCTION notify_admin_withdraw()
RETURNS TRIGGER AS $$
DECLARE
  v_member_id TEXT;
  v_full_name TEXT;
  v_amount NUMERIC;
BEGIN
  SELECT member_id, full_name INTO v_member_id, v_full_name
  FROM profiles WHERE id = NEW.user_id;
  
  v_amount := NEW.amount;
  
  INSERT INTO admin_notifications (type, message, link_url, metadata)
  VALUES (
    'WITHDRAW',
    format('สมาชิก %s (%s) ขอถอนเงิน ฿%s', v_full_name, v_member_id, v_amount::TEXT),
    '/withdrawals',
    jsonb_build_object(
      'withdraw_id', NEW.id,
      'user_id', NEW.user_id,
      'amount', v_amount,
      'bank_name', NEW.bank_name
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: New withdrawal request
DROP TRIGGER IF EXISTS trg_notify_withdraw ON withdraw_requests;
CREATE TRIGGER trg_notify_withdraw
  AFTER INSERT ON withdraw_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_admin_withdraw();

-- Function: Create notification for lottery result set
CREATE OR REPLACE FUNCTION notify_admin_result()
RETURNS TRIGGER AS $$
DECLARE
  v_market_name TEXT;
BEGIN
  SELECT name INTO v_market_name
  FROM lottery_markets WHERE id = NEW.market_id;
  
  INSERT INTO admin_notifications (type, message, link_url, metadata)
  VALUES (
    'RESULT',
    format('ออกผล %s งวด %s แล้ว', v_market_name, NEW.draw_date),
    '/results',
    jsonb_build_object(
      'result_id', NEW.id,
      'market_id', NEW.market_id,
      'market_name', v_market_name,
      'draw_date', NEW.draw_date,
      'result_main', NEW.result_main
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: New lottery result
DROP TRIGGER IF EXISTS trg_notify_result ON lottery_results;
CREATE TRIGGER trg_notify_result
  AFTER INSERT ON lottery_results
  FOR EACH ROW
  EXECUTE FUNCTION notify_admin_result();

-- Function: Create notification for new member
CREATE OR REPLACE FUNCTION notify_admin_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO admin_notifications (type, message, link_url, metadata)
  VALUES (
    'MEMBER',
    format('สมาชิกใหม่: %s (%s)', NEW.full_name, NEW.phone),
    '/members',
    jsonb_build_object(
      'user_id', NEW.id,
      'member_id', NEW.member_id,
      'phone', NEW.phone
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: New member registration (only when is_admin = false)
DROP TRIGGER IF EXISTS trg_notify_member ON profiles;
CREATE TRIGGER trg_notify_member
  AFTER INSERT ON profiles
  FOR EACH ROW
  WHEN (NEW.is_admin = false)
  EXECUTE FUNCTION notify_admin_member();

-- =============================================
-- UTILITY FUNCTIONS
-- =============================================

-- Function: Mark all notifications as read
CREATE OR REPLACE FUNCTION admin_mark_all_notifications_read()
RETURNS void AS $$
BEGIN
  UPDATE admin_notifications SET is_read = true WHERE is_read = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get unread notification count
CREATE OR REPLACE FUNCTION admin_unread_notification_count()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count 
  FROM admin_notifications 
  WHERE is_read = false;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Cleanup old notifications (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM admin_notifications 
  WHERE created_at < now() - interval '30 days';
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- SEED DATA (Optional - for testing)
-- =============================================

INSERT INTO admin_notifications (type, message, link_url, is_read, metadata) VALUES
('SYSTEM', 'ระบบแอดมินพร้อมใช้งาน', '/', true, '{}'),
('DEPOSIT', 'ทดสอบ: สมาชิก TEST001 ฝากเงิน ฿1,000', '/deposits', false, '{"test": true}'),
('WITHDRAW', 'ทดสอบ: สมาชิก TEST002 ขอถอน ฿500', '/withdrawals', false, '{"test": true}')
ON CONFLICT DO NOTHING;
