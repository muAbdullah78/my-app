-- Create enum types for order status
CREATE TYPE order_status AS ENUM (
  'pending',
  'confirmed',
  'processing',
  'ready_for_delivery',
  'out_for_delivery',
  'delivered',
  'cancelled'
);

-- Create enum types for payment status
CREATE TYPE payment_status AS ENUM (
  'pending',
  'paid',
  'failed',
  'refunded'
);

-- Create orders table
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  status order_status DEFAULT 'pending',
  total_price DECIMAL(10,2) NOT NULL,
  special_instructions TEXT,
  payment_status payment_status DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create order_services table
CREATE TABLE order_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create deliveries table
CREATE TABLE deliveries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  status order_status DEFAULT 'pending',
  estimated_delivery_time TIMESTAMP WITH TIME ZONE,
  current_location JSONB,
  driver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create order_tracking table for tracking history
CREATE TABLE order_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  status order_status NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create RLS policies
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_tracking ENABLE ROW LEVEL SECURITY;

-- Orders policies
CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders"
  ON orders FOR UPDATE
  USING (auth.uid() = user_id);

-- Order services policies
CREATE POLICY "Users can view their order services"
  ON order_services FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_services.order_id
    AND orders.user_id = auth.uid()
  ));

CREATE POLICY "Users can create their order services"
  ON order_services FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_services.order_id
    AND orders.user_id = auth.uid()
  ));

-- Deliveries policies
CREATE POLICY "Users can view their deliveries"
  ON deliveries FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = deliveries.order_id
    AND orders.user_id = auth.uid()
  ));

-- Order tracking policies
CREATE POLICY "Users can view their order tracking"
  ON order_tracking FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_tracking.order_id
    AND orders.user_id = auth.uid()
  ));

-- Create functions and triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deliveries_updated_at
  BEFORE UPDATE ON deliveries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to track order status changes
CREATE OR REPLACE FUNCTION track_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS NULL OR NEW.status != OLD.status THEN
    INSERT INTO order_tracking (order_id, status, notes)
    VALUES (NEW.id, NEW.status, 'Status updated');
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER track_order_status
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION track_order_status_change(); 