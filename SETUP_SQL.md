# CampusShare - Database Setup SQL

Execute this SQL in your Supabase SQL Editor to set up the database schema and Row Level Security policies.

## ============================================
# TABLE CREATION
## ============================================

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    student_id TEXT NOT NULL,
    department TEXT NOT NULL,
    year INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create resources table
CREATE TABLE IF NOT EXISTS resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    subject TEXT,
    listing_type TEXT NOT NULL CHECK (listing_type IN ('Sell', 'Rent', 'Exchange', 'Donate')),
    price NUMERIC NOT NULL DEFAULT 0 CHECK (price >= 0),
    condition TEXT NOT NULL CHECK (condition IN ('New', 'Like New', 'Good', 'Fair', 'Poor')),
    availability TEXT NOT NULL DEFAULT 'Available' CHECK (availability IN ('Available', 'Reserved', 'Sold')),
    pickup_location TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create planner_history table
CREATE TABLE IF NOT EXISTS planner_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    budget NUMERIC NOT NULL CHECK (budget >= 0),
    minimum_condition TEXT NOT NULL CHECK (minimum_condition IN ('New', 'Like New', 'Good', 'Fair', 'Poor')),
    total_cost NUMERIC NOT NULL CHECK (total_cost >= 0),
    remaining_budget NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create planner_history_items table
CREATE TABLE IF NOT EXISTS planner_history_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    history_id UUID REFERENCES planner_history(id) ON DELETE CASCADE NOT NULL,
    resource_id UUID REFERENCES resources(id) ON DELETE SET NULL,
    resource_title TEXT NOT NULL,
    price NUMERIC NOT NULL CHECK (price >= 0),
    condition TEXT NOT NULL CHECK (condition IN ('New', 'Like New', 'Good', 'Fair', 'Poor'))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_resources_seller_id ON resources(seller_id);
CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category);
CREATE INDEX IF NOT EXISTS idx_resources_listing_type ON resources(listing_type);
CREATE INDEX IF NOT EXISTS idx_resources_condition ON resources(condition);
CREATE INDEX IF NOT EXISTS idx_resources_availability ON resources(availability);
CREATE INDEX IF NOT EXISTS idx_planner_history_user_id ON planner_history(user_id);
CREATE INDEX IF NOT EXISTS idx_planner_history_items_history_id ON planner_history_items(history_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for resources table
CREATE TRIGGER update_resources_updated_at
    BEFORE UPDATE ON resources
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, name, email, student_id, department, year)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'name',
        NEW.email,
        NEW.raw_user_meta_data->>'student_id',
        NEW.raw_user_meta_data->>'department',
        (NEW.raw_user_meta_data->>'year')::INTEGER
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

## ============================================
# ROW LEVEL SECURITY (RLS) POLICIES
## ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE planner_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE planner_history_items ENABLE ROW LEVEL SECURITY;

-- ============================================
# PROFILES TABLE POLICIES
## ============================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Users can insert their own profile (for signup) - more permissive
CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id OR auth.uid() IS NULL);

-- ============================================
# RESOURCES TABLE POLICIES
## ============================================

-- Everyone can view available resources
CREATE POLICY "Anyone can view available resources"
    ON resources FOR SELECT
    USING (availability = 'Available');

-- Users can view their own resources regardless of availability
CREATE POLICY "Users can view own resources"
    ON resources FOR SELECT
    USING (auth.uid() = seller_id);

-- Users can create resources (only for themselves)
CREATE POLICY "Users can create resources"
    ON resources FOR INSERT
    WITH CHECK (auth.uid() = seller_id);

-- Users can update their own resources
CREATE POLICY "Users can update own resources"
    ON resources FOR UPDATE
    USING (auth.uid() = seller_id);

-- Users can delete their own resources
CREATE POLICY "Users can delete own resources"
    ON resources FOR DELETE
    USING (auth.uid() = seller_id);

-- ============================================
# PLANNER_HISTORY TABLE POLICIES
## ============================================

-- Users can view their own planner history
CREATE POLICY "Users can view own planner history"
    ON planner_history FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create planner history (only for themselves)
CREATE POLICY "Users can create planner history"
    ON planner_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own planner history
CREATE POLICY "Users can delete own planner history"
    ON planner_history FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
# PLANNER_HISTORY_ITEMS TABLE POLICIES
## ============================================

-- Users can view planner history items through their history
CREATE POLICY "Users can view own planner history items"
    ON planner_history_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM planner_history
            WHERE planner_history.id = planner_history_items.history_id
            AND planner_history.user_id = auth.uid()
        )
    );

-- Users can create planner history items through their history
CREATE POLICY "Users can create planner history items"
    ON planner_history_items FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM planner_history
            WHERE planner_history.id = planner_history_items.history_id
            AND planner_history.user_id = auth.uid()
        )
    );

-- Users can delete planner history items through their history
CREATE POLICY "Users can delete own planner history items"
    ON planner_history_items FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM planner_history
            WHERE planner_history.id = planner_history_items.history_id
            AND planner_history.user_id = auth.uid()
        )
    );

## ============================================
# STORAGE BUCKET SETUP
## ============================================

-- Create storage bucket for resource images
INSERT INTO storage.buckets (id, name, public)
VALUES ('resource-images', 'resource-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for resource-images bucket

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'resource-images');

-- Allow public to view images
CREATE POLICY "Public can view images"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'resource-images');

-- Allow users to delete their own images
CREATE POLICY "Users can delete own images"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'resource-images'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

## ============================================
# VERIFICATION
## ============================================

-- Verify tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'resources', 'planner_history', 'planner_history_items');

-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'resources', 'planner_history', 'planner_history_items');

-- Verify policies were created
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('profiles', 'resources', 'planner_history', 'planner_history_items');

-- Verify storage bucket was created
SELECT * FROM storage.buckets WHERE id = 'resource-images';

## ============================================
# ADDITIONAL FEATURES
## ============================================

## Purchase Requests & Chat System

For the buyer-seller communication system (purchase requests, seller requests, buyer requests, and chat), execute the SQL in `REQUESTS_CHAT_SQL.md`. This adds:

- `purchase_requests` table - for managing buy/rent/exchange/donate requests
- `messages` table - for real-time chat between buyers and sellers
- Row Level Security policies for both tables
- Supabase Realtime setup for the messages table

The communication system includes:
- Request modal with message and pickup location
- Seller request management (accept/reject/complete)
- Buyer request tracking
- Real-time chat after request acceptance
- Automatic resource availability updates
