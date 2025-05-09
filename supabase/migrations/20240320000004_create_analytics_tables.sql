-- Create shop_analytics table for daily metrics
CREATE TABLE shop_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_orders INTEGER DEFAULT 0,
  total_revenue DECIMAL(10, 2) DEFAULT 0,
  total_customers INTEGER DEFAULT 0,
  average_order_value DECIMAL(10, 2) DEFAULT 0,
  total_products_sold INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(shop_id, date)
);

-- Create product_analytics table for product performance
CREATE TABLE product_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  views INTEGER DEFAULT 0,
  add_to_cart_count INTEGER DEFAULT 0,
  purchase_count INTEGER DEFAULT 0,
  revenue DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(product_id, date)
);

-- Create customer_analytics table for customer insights
CREATE TABLE customer_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(10, 2) DEFAULT 0,
  average_order_value DECIMAL(10, 2) DEFAULT 0,
  first_order_date DATE,
  last_order_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(shop_id, user_id)
);

-- Create traffic_analytics table for shop traffic
CREATE TABLE traffic_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  page_views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  source VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(shop_id, date, source)
);

-- Enable RLS
ALTER TABLE shop_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE traffic_analytics ENABLE ROW LEVEL SECURITY;

-- Shop analytics policies
CREATE POLICY "Shop owners can view their shop analytics"
  ON shop_analytics FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM shops
    WHERE shops.id = shop_analytics.shop_id
    AND shops.owner_id = auth.uid()
  ));

-- Product analytics policies
CREATE POLICY "Shop owners can view their product analytics"
  ON product_analytics FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM shops
    WHERE shops.id = product_analytics.shop_id
    AND shops.owner_id = auth.uid()
  ));

-- Customer analytics policies
CREATE POLICY "Shop owners can view their customer analytics"
  ON customer_analytics FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM shops
    WHERE shops.id = customer_analytics.shop_id
    AND shops.owner_id = auth.uid()
  ));

-- Traffic analytics policies
CREATE POLICY "Shop owners can view their traffic analytics"
  ON traffic_analytics FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM shops
    WHERE shops.id = traffic_analytics.shop_id
    AND shops.owner_id = auth.uid()
  ));

-- Create function to update shop analytics
CREATE OR REPLACE FUNCTION update_shop_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update or insert shop analytics for the day
  INSERT INTO shop_analytics (
    shop_id,
    date,
    total_orders,
    total_revenue,
    total_customers,
    average_order_value,
    total_products_sold
  )
  SELECT
    NEW.shop_id,
    CURRENT_DATE,
    COUNT(DISTINCT o.id),
    SUM(o.total_amount),
    COUNT(DISTINCT o.user_id),
    CASE
      WHEN COUNT(DISTINCT o.id) > 0 THEN SUM(o.total_amount) / COUNT(DISTINCT o.id)
      ELSE 0
    END,
    SUM(oi.quantity)
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.id
  WHERE o.shop_id = NEW.shop_id
  AND DATE(o.created_at) = CURRENT_DATE
  GROUP BY NEW.shop_id
  ON CONFLICT (shop_id, date)
  DO UPDATE SET
    total_orders = EXCLUDED.total_orders,
    total_revenue = EXCLUDED.total_revenue,
    total_customers = EXCLUDED.total_customers,
    average_order_value = EXCLUDED.average_order_value,
    total_products_sold = EXCLUDED.total_products_sold,
    updated_at = timezone('utc'::text, now());

  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create function to update product analytics
CREATE OR REPLACE FUNCTION update_product_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update or insert product analytics for the day
  INSERT INTO product_analytics (
    product_id,
    shop_id,
    date,
    purchase_count,
    revenue
  )
  SELECT
    NEW.product_id,
    p.shop_id,
    CURRENT_DATE,
    SUM(oi.quantity),
    SUM(oi.quantity * oi.price)
  FROM order_items oi
  JOIN products p ON p.id = oi.product_id
  WHERE oi.product_id = NEW.product_id
  AND DATE(oi.created_at) = CURRENT_DATE
  GROUP BY NEW.product_id, p.shop_id
  ON CONFLICT (product_id, date)
  DO UPDATE SET
    purchase_count = EXCLUDED.purchase_count,
    revenue = EXCLUDED.revenue,
    updated_at = timezone('utc'::text, now());

  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create function to update customer analytics
CREATE OR REPLACE FUNCTION update_customer_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update or insert customer analytics
  INSERT INTO customer_analytics (
    shop_id,
    user_id,
    total_orders,
    total_spent,
    average_order_value,
    first_order_date,
    last_order_date
  )
  SELECT
    NEW.shop_id,
    NEW.user_id,
    COUNT(DISTINCT id),
    SUM(total_amount),
    CASE
      WHEN COUNT(DISTINCT id) > 0 THEN SUM(total_amount) / COUNT(DISTINCT id)
      ELSE 0
    END,
    MIN(DATE(created_at)),
    MAX(DATE(created_at))
  FROM orders
  WHERE shop_id = NEW.shop_id
  AND user_id = NEW.user_id
  GROUP BY NEW.shop_id, NEW.user_id
  ON CONFLICT (shop_id, user_id)
  DO UPDATE SET
    total_orders = EXCLUDED.total_orders,
    total_spent = EXCLUDED.total_spent,
    average_order_value = EXCLUDED.average_order_value,
    first_order_date = EXCLUDED.first_order_date,
    last_order_date = EXCLUDED.last_order_date,
    updated_at = timezone('utc'::text, now());

  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_shop_analytics_on_order
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_shop_analytics();

CREATE TRIGGER update_product_analytics_on_order_item
  AFTER INSERT OR UPDATE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_product_analytics();

CREATE TRIGGER update_customer_analytics_on_order
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_analytics();

-- Create triggers for updating timestamps
CREATE TRIGGER update_shop_analytics_updated_at
  BEFORE UPDATE ON shop_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_analytics_updated_at
  BEFORE UPDATE ON product_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_analytics_updated_at
  BEFORE UPDATE ON customer_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_traffic_analytics_updated_at
  BEFORE UPDATE ON traffic_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 