-- Create enum types for payment methods
CREATE TYPE payment_method AS ENUM (
  'credit_card',
  'debit_card',
  'bank_transfer',
  'cash_on_delivery'
);

-- Create payments table
CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  payment_method payment_method NOT NULL,
  status payment_status DEFAULT 'pending',
  stripe_payment_id VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create payment_methods table for storing user's payment methods
CREATE TABLE payment_methods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type payment_method NOT NULL,
  is_default BOOLEAN DEFAULT false,
  stripe_payment_method_id VARCHAR(255),
  card_last4 VARCHAR(4),
  card_brand VARCHAR(50),
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create RLS policies
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Payments policies
CREATE POLICY "Users can view their own payments"
  ON payments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = payments.order_id
    AND orders.user_id = auth.uid()
  ));

CREATE POLICY "Users can create payments for their orders"
  ON payments FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = payments.order_id
    AND orders.user_id = auth.uid()
  ));

-- Payment methods policies
CREATE POLICY "Users can view their own payment methods"
  ON payment_methods FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payment methods"
  ON payment_methods FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment methods"
  ON payment_methods FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payment methods"
  ON payment_methods FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updating timestamps
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle payment status updates
CREATE OR REPLACE FUNCTION handle_payment_status_update()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS NULL OR NEW.status != OLD.status THEN
    -- Update order payment status
    UPDATE orders
    SET payment_status = NEW.status
    WHERE id = NEW.order_id;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER payment_status_update
  AFTER UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION handle_payment_status_update(); 