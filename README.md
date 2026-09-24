# CampusShare - Intelligent Peer-to-Peer Academic Resource Sharing Platform

A college-level Foundations of Artificial Intelligence project demonstrating Constraint Satisfaction Problems (CSP) and Backtracking Search.

## 🎯 Project Overview

CampusShare is a private academic resource-sharing platform for college students. Students can find, sell, rent, exchange, or donate resources such as:

- Textbooks
- Calculators
- Lab equipment
- Engineering drawing tools
- Arduino kits
- Electronics components
- Project materials

### AI Feature: Smart Resource Planner

The main intelligent feature uses **CSP + Backtracking Search** to find the best combination of resources according to student requirements and constraints.

## 🛠 Technology Stack

- **Frontend**: HTML, CSS, Vanilla JavaScript
- **Backend/Database**: Google Firebase (Cloud Firestore Database, Firebase Authentication)
- **AI Algorithm**: CSP + Backtracking Search (implemented in JavaScript)

## 📁 Project Structure

```
campusshare/
├── index.html
├── login.html
├── register.html
├── complete-profile.html
├── dashboard.html
├── marketplace.html
├── resource-details.html
├── create-listing.html
├── planner.html
├── history.html
├── profile.html
├── seller-requests.html         # Seller request management
├── my-requests.html             # Buyer request tracking
├── chat.html                    # Real-time buyer-seller chat
│
├── css/
│   └── style.css
│
├── js/
│   ├── firebase.js              # Firebase configuration & initialization
│   ├── auth.js                  # Authentication logic (Firebase Auth)
│   ├── marketplace.js           # Marketplace functionality (Cloud Firestore)
│   ├── listing.js               # Listing CRUD operations
│   ├── cspBacktracking.js       # CSP + Backtracking algorithm
│   ├── planner.js               # Planner UI integration
│   ├── history.js               # Planner history
│   ├── profile.js               # Profile management
│   ├── requests.js              # Purchase request handling
│   └── chat.js                  # Real-time messaging (Firestore onSnapshot)
│
├── firestore.rules              # Firestore Security Rules
├── FIREBASE_SETUP.md            # Firebase setup & configuration guide
└── README.md
```

## 🚀 Setup Instructions

### Prerequisites

- A Supabase account (free tier works)
- Basic knowledge of SQL
- A web browser to run the application

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up / Log in
3. Click "New Project"
4. Enter project details:
   - Name: `campusshare`
   - Database Password: (choose a strong password)
   - Region: Choose nearest region
5. Wait for project to be created (2-3 minutes)

### Step 2: Configure Database

1. Open your Supabase project
2. Go to SQL Editor (left sidebar)
3. Copy and execute the SQL from `SETUP_SQL.md`
4. This will create:
   - Tables: `profiles`, `resources`, `planner_history`, `planner_history_items`
   - Row Level Security (RLS) policies
   - Storage bucket: `resource-images`

5. Copy and execute the SQL from `REQUESTS_CHAT_SQL.md`
6. This will add:
   - Tables: `purchase_requests`, `messages`
   - Row Level Security (RLS) policies for requests and chat
   - Supabase Realtime setup for real-time messaging

### Step 3: Configure Supabase Storage

1. Go to Storage (left sidebar)
2. Create a new bucket named `resource-images`
3. Make it public (for image display)
4. Configure bucket policies if needed

### Step 4: Get Supabase Credentials

1. Go to Project Settings → API
2. Copy:
   - Project URL
   - anon public key

### Step 5: Configure Application

1. Open `js/supabase.js`
2. Replace the placeholder values:

```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL_HERE';        // Paste your Project URL
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY_HERE'; // Paste your anon key
```

3. Configure college email domain:

```javascript
const COLLEGE_EMAIL_DOMAIN = 'college.edu'; // Change to your college domain
```

### Step 6: Add Sample Data (Optional)

1. Go to SQL Editor in Supabase
2. Copy and execute the SQL from `SAMPLE_DATA.sql`
3. This will add sample resources for testing

### Step 7: Run the Application

1. Open `index.html` in a web browser
2. Or use a local server:
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Using Node.js (if you have http-server installed)
   npx http-server
   ```
3. Navigate to `http://localhost:8000`

## 👤 Creating the First User

1. Open the application in your browser
2. Click "Register"
3. Fill in the form:
   - Full Name
   - College Email (must match configured domain)
   - Student ID
   - Department
   - Year
   - Password
4. Click "Create Account"
5. Check your email for verification (if enabled)
6. Login with your credentials

## 📚 Adding Sample Resources

### Method 1: Via SQL (Recommended for Testing)

Execute the SQL in `SAMPLE_DATA.sql` to add pre-configured sample resources.

### Method 2: Via Application UI

1. Login to the application
2. Go to Dashboard → "Add Resource"
3. Fill in the listing details:
   - Title
   - Description
   - Category
   - Subject
   - Listing Type (Sell/Rent/Exchange/Donate)
   - Price
   - Condition
   - Availability
   - Pickup Location
   - Image (optional)
4. Click "Create Listing"

## 🤖 Testing the CSP Planner

1. Login to the application
2. Navigate to "Smart Planner"
3. Enter required resources (one per line):
   ```
   DBMS Book
   Java Book
   Calculator
   ```
4. Set budget: `1500`
5. Set minimum condition: `Good`
6. Click "Find Best Combination"
7. View the results and algorithm steps

### Expected Behavior

The planner will:
- Define CSP variables from your requirements
- Generate domains from available resources
- Apply constraints (budget, condition, availability, no duplicates)
- Use backtracking search to find valid combinations
- Return the best solution (lowest cost, best condition, fewest sellers)
- Show algorithm steps for demonstration

## 🎓 How to Demonstrate During Viva

### CSP Explanation

**What is a CSP?**
A Constraint Satisfaction Problem consists of:
- **Variables**: Items we need to find (e.g., DBMS Book, Java Book, Calculator)
- **Domains**: Possible values for each variable (available resources)
- **Constraints**: Rules that must be satisfied (budget, condition, availability)

**Example:**
```
Variables: [DBMS Book, Java Book, Calculator]

Domains:
  DBMS Book → [DBMS Book A (₹500, Good), DBMS Book B (₹700, New)]
  Java Book → [Java Book A (₹400, Good), Java Book B (₹600, Fair)]
  Calculator → [Calculator A (₹450, Good), Calculator B (₹300, Poor)]

Constraints:
  - Total cost ≤ ₹1500
  - Condition ≥ Good
  - Resource must be Available
  - No duplicate resources
```

### Backtracking Explanation

**How Backtracking Works:**
1. Select an unassigned variable
2. Try a value from its domain
3. Check if constraints are satisfied
4. If valid, continue with next variable
5. If invalid, backtrack and try another value
6. Repeat until all variables are assigned or all options exhausted

**Algorithm Steps (shown in UI):**
```
Step 1: Selected variable: DBMS Book
Step 2: Trying DBMS Book = DBMS Book A (₹500, Good)
Step 3: ✓ Valid assignment
Step 4: Selected variable: Java Book
Step 5: Trying Java Book = Java Book A (₹400, Good)
Step 6: ✓ Valid assignment
Step 7: Selected variable: Calculator
Step 8: Trying Calculator = Calculator B (₹300, Poor)
Step 9: ✗ Invalid: Condition constraint failed (Poor < Good)
Step 10: ↩ Backtracking from Calculator = Calculator B
Step 11: Trying Calculator = Calculator A (₹450, Good)
Step 12: ✓ Valid assignment
Step 13: Solution found!
```

### Key Points to Emphasize

1. **Real CSP Implementation**: The algorithm is implemented in JavaScript, not a library
2. **Constraint Checking**: Each assignment is validated against all constraints
3. **Backtracking**: The algorithm visibly backtracks when constraints fail
4. **Optimal Solution**: Returns best solution based on cost, condition, and seller count
5. **Educational Value**: Algorithm steps are displayed for understanding

## 🔒 Security Features

- **Row Level Security (RLS)**: Users can only access their own data
- **Email Domain Validation**: Only college email addresses allowed
- **Authentication**: Supabase Auth with email verification
- **No Service Role Keys**: Only anon key used in frontend
- **Ownership Checks**: Users can only edit/delete their own listings

## 📊 Database Schema

### Tables

#### profiles
- `id` (UUID, primary key)
- `name` (text)
- `email` (text)
- `student_id` (text)
- `department` (text)
- `year` (integer)
- `created_at` (timestamp)

#### resources
- `id` (UUID, primary key)
- `seller_id` (UUID, foreign key → profiles.id)
- `title` (text)
- `description` (text)
- `category` (text)
- `subject` (text)
- `listing_type` (text)
- `price` (numeric)
- `condition` (text)
- `availability` (text)
- `pickup_location` (text)
- `image_url` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### planner_history
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key → profiles.id)
- `budget` (numeric)
- `minimum_condition` (text)
- `total_cost` (numeric)
- `remaining_budget` (numeric)
- `created_at` (timestamp)

#### planner_history_items
- `id` (UUID, primary key)
- `history_id` (UUID, foreign key → planner_history.id)
- `resource_id` (UUID, foreign key → resources.id)
- `resource_title` (text)
- `price` (numeric)
- `condition` (text)

## 🐛 Troubleshooting

### Issue: "No resources found"
- **Solution**: Add sample data via SQL or create listings through the UI

### Issue: "Email domain not allowed"
- **Solution**: Update `COLLEGE_EMAIL_DOMAIN` in `js/supabase.js`

### Issue: Images not uploading
- **Solution**: Ensure `resource-images` bucket exists and is public in Supabase Storage

### Issue: CSP planner returns no solution
- **Solution**: Increase budget or lower minimum condition requirement

### Issue: Authentication errors
- **Solution**: Verify Supabase URL and anon key are correctly configured

## 📝 Future Enhancements (Not Implemented)

These are future features mentioned in the requirements but NOT implemented in this version:

- Payment gateway integration
- AI chatbot
- Machine learning price prediction
- Recommendation system
- Scam detection
- Ratings and reviews
- Push notifications
- Mobile app
- Multi-college support

## 💬 Buyer-Seller Communication System

The application now includes a complete buyer-seller communication system:

### Features:
- **Request Modal**: Buyers can send requests with custom messages and pickup locations
- **Dynamic Button Labels**: "Request to Buy", "Request to Rent", "Request to Exchange", "Request to Donate"
- **Seller Requests Page**: Sellers can view and manage requests for their listings
- **My Requests Page**: Buyers can track their request status
- **Real-time Chat**: Private messaging between buyer and seller after request acceptance
- **Status Management**: PENDING → ACCEPTED → COMPLETED workflow
- **Automatic Updates**: Resource availability changes based on request status

### Security:
- Row Level Security (RLS) on all request and message tables
- Only participants can view their requests and messages
- Users cannot request their own listings
- Duplicate active requests are prevented
- Chat is only available after request acceptance

## 🎓 Academic Context

This project is designed for a **Foundations of Artificial Intelligence** course to demonstrate:

1. **Constraint Satisfaction Problems (CSP)**
   - Variable representation
   - Domain generation
   - Constraint formulation

2. **Backtracking Search**
   - Recursive implementation
   - Constraint propagation
   - Solution reconstruction

3. **Real-world Application**
   - Practical use of AI algorithms
   - User interface for algorithm visualization
   - Integration with modern web technologies

## 👥 Team

This is an individual project for the Foundations of Artificial Intelligence course.

## 📄 License

This project is created for educational purposes.

## 🙏 Acknowledgments

- Supabase for the excellent backend-as-a-service platform
- The AI algorithms are based on standard CSP and backtracking search techniques from AI textbooks
