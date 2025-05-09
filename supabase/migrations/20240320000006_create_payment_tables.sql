-- Create payment_methods table
CREATE TABLE payment_methods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(20) CHECK (type IN ('card', 'bank_account')) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  last_four VARCHAR(4) NOT NULL,
  is_default BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create payments table
CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_method_id UUID REFERENCES payment_methods(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD' NOT NULL,
  status VARCHAR(20) CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')) NOT NULL,
  provider_payment_id VARCHAR(255),
  provider_refund_id VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create refunds table
CREATE TABLE refunds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  reason TEXT,
  status VARCHAR(20) CHECK (status IN ('pending', 'succeeded', 'failed')) NOT NULL,
  provider_refund_id VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

-- Payment methods policies
CREATE POLICY "Users can view their own payment methods"
  ON payment_methods FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payment methods"
  ON payment_methods FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment methods"
  ON payment_methods FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payment methods"
  ON payment_methods FOR DELETE
  USING (auth.uid() = user_id);

-- Payments policies
CREATE POLICY "Users can view their own payments"
  ON payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Shop owners can view payments for their orders"
  ON payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = payments.order_id
      AND orders.shop_id IN (
        SELECT id FROM shops
        WHERE owner_id = auth.uid()
      )
    )
  );

-- Refunds policies
CREATE POLICY "Users can view their own refunds"
  ON refunds FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM payments
      WHERE payments.id = refunds.payment_id
      AND payments.user_id = auth.uid()
    )
  );

CREATE POLICY "Shop owners can view refunds for their orders"
  ON refunds FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM payments
      JOIN orders ON orders.id = payments.order_id
      WHERE payments.id = refunds.payment_id
      AND orders.shop_id IN (
        SELECT id FROM shops
        WHERE owner_id = auth.uid()
      )
    )
  );

-- Create function to handle default payment method
CREATE OR REPLACE FUNCTION handle_default_payment_method()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default THEN
    UPDATE payment_methods
    SET is_default = false
    WHERE user_id = NEW.user_id
    AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_refunds_updated_at
  BEFORE UPDATE ON refunds
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER handle_default_payment_method_trigger
  BEFORE INSERT OR UPDATE ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION handle_default_payment_method(); 