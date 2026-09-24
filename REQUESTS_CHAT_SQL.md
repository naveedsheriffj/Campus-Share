# CampusShare - Purchase Requests & Chat System SQL

Execute this SQL in your Supabase SQL Editor to add the purchase requests and messaging system.

## ============================================
# TABLE CREATION
## ============================================

-- Create purchase_requests table
CREATE TABLE IF NOT EXISTS purchase_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    resource_id UUID REFERENCES resources(id) ON DELETE CASCADE NOT NULL,
    buyer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    pickup_location TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(resource_id, buyer_id, status) -- Prevent duplicate active requests
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id UUID REFERENCES purchase_requests(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_purchase_requests_resource_id ON purchase_requests(resource_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_buyer_id ON purchase_requests(buyer_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_seller_id ON purchase_requests(seller_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_status ON purchase_requests(status);
CREATE INDEX IF NOT EXISTS idx_messages_request_id ON messages(request_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);

-- Create trigger to update updated_at timestamp for purchase_requests
CREATE TRIGGER update_purchase_requests_updated_at
    BEFORE UPDATE ON purchase_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

## ============================================
# ROW LEVEL SECURITY (RLS) POLICIES
## ============================================

-- Enable RLS on new tables
ALTER TABLE purchase_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- ============================================
# PROFILES TABLE POLICY UPDATE
## ============================================

-- Add policy to allow viewing profiles through purchase requests
CREATE POLICY "Users can view profiles through requests"
    ON profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM purchase_requests
            WHERE (purchase_requests.buyer_id = profiles.id OR purchase_requests.seller_id = profiles.id)
            AND (purchase_requests.buyer_id = auth.uid() OR purchase_requests.seller_id = auth.uid())
        )
    );

-- ============================================
# PURCHASE_REQUESTS TABLE POLICIES
## ============================================

-- Buyers can view their own requests
CREATE POLICY "Buyers can view own requests"
    ON purchase_requests FOR SELECT
    USING (auth.uid() = buyer_id);

-- Sellers can view requests for their resources
CREATE POLICY "Sellers can view requests for their resources"
    ON purchase_requests FOR SELECT
    USING (auth.uid() = seller_id);

-- Users can create purchase requests (only as buyer)
CREATE POLICY "Users can create purchase requests"
    ON purchase_requests FOR INSERT
    WITH CHECK (
        auth.uid() = buyer_id 
        AND auth.uid() != seller_id -- Prevent requesting own listings
    );

-- Buyers can update their own requests (for cancellation)
CREATE POLICY "Buyers can update own requests"
    ON purchase_requests FOR UPDATE
    USING (auth.uid() = buyer_id)
    WITH CHECK (auth.uid() = buyer_id);

-- Sellers can update requests for their resources (accept/reject/complete)
CREATE POLICY "Sellers can update requests for their resources"
    ON purchase_requests FOR UPDATE
    USING (auth.uid() = seller_id)
    WITH CHECK (auth.uid() = seller_id);

-- ============================================
# MESSAGES TABLE POLICIES
## ============================================

-- Participants can view messages for their requests
CREATE POLICY "Participants can view messages"
    ON messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM purchase_requests
            WHERE purchase_requests.id = messages.request_id
            AND (purchase_requests.buyer_id = auth.uid() OR purchase_requests.seller_id = auth.uid())
        )
    );

-- Participants can send messages for their requests
CREATE POLICY "Participants can send messages"
    ON messages FOR INSERT
    WITH CHECK (
        auth.uid() = sender_id
        AND EXISTS (
            SELECT 1 FROM purchase_requests
            WHERE purchase_requests.id = messages.request_id
            AND (purchase_requests.buyer_id = auth.uid() OR purchase_requests.seller_id = auth.uid())
            AND purchase_requests.status = 'ACCEPTED' -- Only allow messages after acceptance
        )
    );

-- ============================================
# REALTIME SETUP
## ============================================

-- Enable realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- ============================================
# VERIFICATION
## ============================================

-- Verify tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('purchase_requests', 'messages');

-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('purchase_requests', 'messages');

-- Verify policies were created
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('purchase_requests', 'messages');

-- Verify realtime is enabled
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
