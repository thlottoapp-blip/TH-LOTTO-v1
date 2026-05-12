-- Enable Realtime for all admin-relevant tables

-- Deposit requests
ALTER PUBLICATION supabase_realtime ADD TABLE deposit_requests;

-- Withdrawal requests  
ALTER PUBLICATION supabase_realtime ADD TABLE withdraw_requests;

-- Transactions
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;

-- Lottery results
ALTER PUBLICATION supabase_realtime ADD TABLE lottery_results;

-- Bets
ALTER PUBLICATION supabase_realtime ADD TABLE bets;

-- Profiles (for new member alerts)
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

-- Settings (for config changes)
ALTER PUBLICATION supabase_realtime ADD TABLE settings;

-- Admin notifications (already added in migration 001)
-- ALTER PUBLICATION supabase_realtime ADD TABLE admin_notifications;
