-- ============================================================================
-- POST-PAYMENT NOTIFICATIONS & TRACKING MIGRATION
-- ============================================================================
-- Adds notifications table and enhanced order tracking
-- ============================================================================

-- ============================================================================
-- 1. CREATE NOTIFICATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,

  -- Notification details
  type TEXT NOT NULL, -- 'payment_success', 'order_shipped', 'item_sold', etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT, -- Optional link to order/listing page

  -- Metadata
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,

  -- Status
  read BOOLEAN DEFAULT false NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  read_at TIMESTAMPTZ NULL
);

-- Add indices for performance
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_read_idx ON public.notifications(read);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_type_idx ON public.notifications(type);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. RLS POLICIES FOR NOTIFICATIONS
-- ============================================================================

-- Users can view their own notifications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'notifications'
    AND policyname = 'Users can view own notifications'
  ) THEN
    CREATE POLICY "Users can view own notifications"
      ON public.notifications FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Users can update their own notifications (mark as read)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'notifications'
    AND policyname = 'Users can update own notifications'
  ) THEN
    CREATE POLICY "Users can update own notifications"
      ON public.notifications FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- System can insert notifications (via API)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'notifications'
    AND policyname = 'System can insert notifications'
  ) THEN
    CREATE POLICY "System can insert notifications"
      ON public.notifications FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

-- ============================================================================
-- 3. ENHANCE ORDERS TABLE
-- ============================================================================

-- Add tracking and shipping fields if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'tracking_number'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN tracking_number TEXT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'shipping_carrier'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN shipping_carrier TEXT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'shipped_at'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN shipped_at TIMESTAMPTZ NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'delivered_at'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN delivered_at TIMESTAMPTZ NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'buyer_shipping_address'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN buyer_shipping_address JSONB NULL;
  END IF;
END $$;

-- Add index for tracking numbers
CREATE INDEX IF NOT EXISTS orders_tracking_number_idx ON public.orders(tracking_number);

-- ============================================================================
-- 4. FUNCTION: AUTO-UPDATE NOTIFICATION READ TIME
-- ============================================================================

CREATE OR REPLACE FUNCTION update_notification_read_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.read = true AND OLD.read = false THEN
    NEW.read_at = timezone('utc'::text, now());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update read_at when notification is marked as read
DROP TRIGGER IF EXISTS trigger_update_notification_read_at ON public.notifications;
CREATE TRIGGER trigger_update_notification_read_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_read_at();

-- ============================================================================
-- 5. HELPER FUNCTION: GET UNREAD NOTIFICATION COUNT
-- ============================================================================

CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM public.notifications
  WHERE user_id = p_user_id
    AND read = false;

  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.notifications IS 'In-app notifications for users';
COMMENT ON COLUMN public.notifications.type IS 'Notification type: payment_success, order_shipped, item_sold, etc.';
COMMENT ON COLUMN public.notifications.link IS 'Optional URL to redirect user when clicking notification';
COMMENT ON COLUMN public.orders.tracking_number IS 'Shipping tracking number';
COMMENT ON COLUMN public.orders.shipping_carrier IS 'Shipping carrier name (USPS, UPS, FedEx, etc.)';
COMMENT ON COLUMN public.orders.buyer_shipping_address IS 'Buyer shipping address as JSON';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Notifications and tracking migration applied successfully!';
  RAISE NOTICE '📋 Next steps:';
  RAISE NOTICE '1. Set up email service (Resend or Nodemailer)';
  RAISE NOTICE '2. Configure Stripe webhook endpoint';
  RAISE NOTICE '3. Test payment flow end-to-end';
END $$;
