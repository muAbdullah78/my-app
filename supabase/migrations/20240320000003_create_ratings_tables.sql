-- Create ratings table
CREATE TABLE ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  images TEXT[] DEFAULT '{}',
  helpful_count INTEGER DEFAULT 0,
  reported_count INTEGER DEFAULT 0,
  is_verified_purchase BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, order_id)
);

-- Create rating_responses table for shop owners to respond to reviews
CREATE TABLE rating_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rating_id UUID REFERENCES ratings(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  response_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(rating_id)
);

-- Create rating_helpful table to track helpful votes
CREATE TABLE rating_helpful (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rating_id UUID REFERENCES ratings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(rating_id, user_id)
);

-- Create rating_reports table to track reported reviews
CREATE TABLE rating_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rating_id UUID REFERENCES ratings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(rating_id, user_id)
);

-- Enable RLS
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rating_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE rating_helpful ENABLE ROW LEVEL SECURITY;
ALTER TABLE rating_reports ENABLE ROW LEVEL SECURITY;

-- Ratings policies
CREATE POLICY "Users can view all ratings"
  ON ratings FOR SELECT
  USING (true);

CREATE POLICY "Users can create ratings for their own orders"
  ON ratings FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own ratings"
  ON ratings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ratings"
  ON ratings FOR DELETE
  USING (auth.uid() = user_id);

-- Rating responses policies
CREATE POLICY "Everyone can view rating responses"
  ON rating_responses FOR SELECT
  USING (true);

CREATE POLICY "Shop owners can create responses for their shop"
  ON rating_responses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = shop_id
      AND shops.owner_id = auth.uid()
    )
  );

CREATE POLICY "Shop owners can update their responses"
  ON rating_responses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = shop_id
      AND shops.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = shop_id
      AND shops.owner_id = auth.uid()
    )
  );

-- Rating helpful policies
CREATE POLICY "Everyone can view helpful votes"
  ON rating_helpful FOR SELECT
  USING (true);

CREATE POLICY "Users can mark ratings as helpful"
  ON rating_helpful FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their helpful marks"
  ON rating_helpful FOR DELETE
  USING (auth.uid() = user_id);

-- Rating reports policies
CREATE POLICY "Admins can view all reports"
  ON rating_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.role = 'admin'
    )
  );

CREATE POLICY "Users can create reports"
  ON rating_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create function to update helpful count
CREATE OR REPLACE FUNCTION update_rating_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE ratings
    SET helpful_count = helpful_count + 1
    WHERE id = NEW.rating_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE ratings
    SET helpful_count = helpful_count - 1
    WHERE id = OLD.rating_id;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

-- Create function to update reported count
CREATE OR REPLACE FUNCTION update_rating_reported_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE ratings
    SET reported_count = reported_count + 1
    WHERE id = NEW.rating_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE ratings
    SET reported_count = reported_count - 1
    WHERE id = OLD.rating_id;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_ratings_updated_at
  BEFORE UPDATE ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rating_responses_updated_at
  BEFORE UPDATE ON rating_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rating_reports_updated_at
  BEFORE UPDATE ON rating_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_helpful_count
  AFTER INSERT OR DELETE ON rating_helpful
  FOR EACH ROW
  EXECUTE FUNCTION update_rating_helpful_count();

CREATE TRIGGER update_reported_count
  AFTER INSERT OR DELETE ON rating_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_rating_reported_count(); 