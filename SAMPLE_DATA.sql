# CampusShare - Sample Data Insertion

Execute this SQL in your Supabase SQL Editor to add sample data for testing.

## ============================================
# IMPORTANT: First, create a test user
## ============================================

-- This script assumes you have at least one user registered through the app.
-- The sample resources will be assigned to the first user found.
-- If you want to use a specific user, replace the user_id below with your actual user UUID.

-- Get the first user ID (you can replace this with your actual user UUID)
-- Run this query to get your user ID after registering:
-- SELECT id FROM profiles LIMIT 1;

## ============================================
# SAMPLE PROFILES (Optional - for testing)
## ============================================

-- Note: In production, profiles are created automatically during registration.
-- These are for testing purposes only.

-- Insert sample profiles (if you want to test with multiple users)
-- Replace the UUIDs with actual user IDs from your auth.users table

-- INSERT INTO profiles (id, name, email, student_id, department, year) VALUES
-- ('USER_UUID_1', 'Alice Johnson', 'alice@college.edu', 'STU001', 'Computer Science', 3),
-- ('USER_UUID_2', 'Bob Smith', 'bob@college.edu', 'STU002', 'Electronics', 2),
-- ('USER_UUID_3', 'Carol Davis', 'carol@college.edu', 'STU003', 'Mechanical', 4);

## ============================================
# SAMPLE RESOURCES
## ============================================

-- IMPORTANT: Replace 'YOUR_USER_ID_HERE' with an actual user UUID from your profiles table
-- You can get this by running: SELECT id FROM profiles LIMIT 1;

-- First, let's create a variable for the user ID (you'll need to replace this)
-- For now, we'll use a placeholder - you MUST replace this with a real UUID

DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- Get the first user ID from profiles table
    SELECT id INTO test_user_id FROM profiles LIMIT 1;
    
    -- If no user exists, create a note
    IF test_user_id IS NULL THEN
        RAISE NOTICE 'No users found. Please register a user through the app first.';
    ELSE
        -- Insert sample resources
        INSERT INTO resources (seller_id, title, description, category, subject, listing_type, price, condition, availability, pickup_location) VALUES
        -- DBMS Books
        (test_user_id, 'DBMS Book - Database System Concepts', 'Comprehensive textbook on database management systems. Good condition, minimal highlighting.', 'Textbook', 'Database Systems', 'Sell', 500, 'Good', 'Available', 'Library'),
        (test_user_id, 'DBMS Book - Fundamentals of Database Systems', 'Excellent condition, like new. Includes practice problems.', 'Textbook', 'Database Systems', 'Sell', 700, 'New', 'Available', 'Block A'),
        
        -- Java Books
        (test_user_id, 'Java Book - Head First Java', 'Great for beginners. Some wear but all pages intact.', 'Textbook', 'Java Programming', 'Sell', 400, 'Good', 'Available', 'Library'),
        (test_user_id, 'Java Book - Effective Java', 'Advanced Java programming. Fair condition, some notes in margins.', 'Textbook', 'Java Programming', 'Sell', 600, 'Fair', 'Available', 'Block B'),
        
        -- Calculators
        (test_user_id, 'Scientific Calculator Casio fx-991EX', 'Fully functional, good condition. Includes original case.', 'Calculator', 'Mathematics', 'Sell', 450, 'Good', 'Available', 'Library'),
        (test_user_id, 'Basic Calculator', 'Simple calculator for basic math. Poor condition, buttons sticky.', 'Calculator', 'Mathematics', 'Sell', 300, 'Poor', 'Available', 'Block C'),
        
        -- Arduino Kits
        (test_user_id, 'Arduino Uno Starter Kit', 'Complete starter kit with Arduino Uno, breadboard, LEDs, sensors. Like new.', 'Arduino', 'Electronics', 'Sell', 650, 'Like New', 'Available', 'Lab'),
        (test_user_id, 'Arduino Mega 2560 Kit', 'Advanced Arduino kit with Mega board and various components. Brand new.', 'Arduino', 'Electronics', 'Sell', 900, 'New', 'Available', 'Lab'),
        
        -- Lab Equipment
        (test_user_id, 'Digital Multimeter', 'Digital multimeter for electronics lab. Good condition, works perfectly.', 'Lab Equipment', 'Electronics', 'Sell', 350, 'Good', 'Available', 'Lab'),
        (test_user_id, 'Oscilloscope Probe Set', 'Set of oscilloscope probes. Fair condition, one probe has minor damage.', 'Lab Equipment', 'Electronics', 'Sell', 200, 'Fair', 'Available', 'Lab'),
        
        -- Drawing Tools
        (test_user_id, 'Engineering Drawing Set', 'Complete set with compass, protractor, set squares. Good condition.', 'Drawing Tools', 'Engineering Drawing', 'Sell', 300, 'Good', 'Available', 'Drawing Hall'),
        (test_user_id, 'Drafting Table', 'Portable drafting table. Fair condition, some surface scratches.', 'Drawing Tools', 'Engineering Drawing', 'Sell', 800, 'Fair', 'Available', 'Drawing Hall'),
        
        -- Electronics Components
        (test_user_id, 'Resistor Kit', 'Assorted resistors from 10Ω to 1MΩ. New condition.', 'Electronics', 'Electronics', 'Sell', 150, 'New', 'Available', 'Lab'),
        (test_user_id, 'LED Kit', 'Various colored LEDs with resistors. Good condition.', 'Electronics', 'Electronics', 'Sell', 100, 'Good', 'Available', 'Lab'),
        
        -- Project Materials
        (test_user_id, 'Project Display Board', '3-fold display board for project presentations. Like new, used once.', 'Project Material', 'General', 'Sell', 250, 'Like New', 'Available', 'Library'),
        (test_user_id, 'Project Enclosure Box', 'Plastic enclosure box for electronics projects. Good condition.', 'Project Material', 'Electronics', 'Sell', 200, 'Good', 'Available', 'Lab'),
        
        -- Other
        (test_user_id, 'Backpack', 'Large backpack for carrying books and laptop. Good condition.', 'Other', 'General', 'Sell', 400, 'Good', 'Available', 'Common Area'),
        (test_user_id, 'Laptop Stand', 'Adjustable laptop stand. New condition.', 'Other', 'General', 'Sell', 350, 'New', 'Available', 'Common Area');
        
        RAISE NOTICE 'Sample resources inserted successfully for user ID: %', test_user_id;
    END IF;
END $$;

## ============================================
# ALTERNATIVE: Insert resources for specific user
## ============================================

-- If you want to insert resources for a specific user, 
-- replace 'YOUR_USER_ID_HERE' with the actual UUID and run:

-- INSERT INTO resources (seller_id, title, description, category, subject, listing_type, price, condition, availability, pickup_location) VALUES
-- ('YOUR_USER_ID_HERE', 'DBMS Book', 'Database textbook', 'Textbook', 'DBMS', 'Sell', 500, 'Good', 'Available', 'Library'),
-- ('YOUR_USER_ID_HERE', 'Java Book', 'Java programming book', 'Textbook', 'Java', 'Sell', 400, 'Good', 'Available', 'Library'),
-- ('YOUR_USER_ID_HERE', 'Calculator', 'Scientific calculator', 'Calculator', 'Math', 'Sell', 450, 'Good', 'Available', 'Library');

## ============================================
# VERIFICATION
## ============================================

-- Check how many resources were inserted
SELECT COUNT(*) as total_resources FROM resources;

-- View sample resources
SELECT 
    title, 
    category, 
    listing_type, 
    price, 
    condition, 
    availability,
    pickup_location
FROM resources 
ORDER BY created_at DESC 
LIMIT 10;

-- View resources by category
SELECT category, COUNT(*) as count 
FROM resources 
GROUP BY category 
ORDER BY count DESC;
