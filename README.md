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

### AI Feature: Smart Resource Planner (Unit-III CSP & Inference Engine)

The core artificial intelligence module implements **Constraint Satisfaction Problems (CSP)** and search algorithms matching the FOAI Unit-III syllabus:
1. **Simple Backtracking Search (Baseline)**: Chronological depth-first backtracking with static variable ordering.
2. **Backtracking with Forward Checking (Constraint Propagation)**: Dynamically prunes domain values that violate budget or condition constraints ahead of time, detecting dead-end wipeouts early.
3. **Optimized Backtracking with FC + MRV + LCV**:
   - **Minimum Remaining Values (MRV / 'Fail-First' Heuristic)**: Selects the unassigned variable with the fewest remaining valid domain values to trigger quick dead-end detection.
   - **Least Constraining Value (LCV Heuristic)**: Orders values by minimum cost, leaving the maximum remaining budget for remaining unassigned variables.
4. **Side-by-Side Algorithm Comparison Benchmarker**: Compares nodes explored, backtracks count, domain prunings, and execution times across all 3 algorithms with live metrics.

## 🛠 Technology Stack

- **Frontend**: HTML5, Modern CSS, Vanilla JavaScript (ES6+)
- **Backend/Database**: Google Firebase (Cloud Firestore Native Database, Firebase Authentication)
- **AI Engine**: Pure custom CSP Solver with Forward Checking, MRV, LCV, and Benchmark Engine (no external libraries)

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
├── planner.html                 # Smart Resource Planner & CSP Benchmark Dashboard
├── history.html                 # Saved Plans History with algorithm tagging
├── profile.html
├── seller-requests.html         # Seller request management
├── my-requests.html             # Buyer request tracking
├── chat.html                    # Real-time buyer-seller chat (Firestore onSnapshot)
│
├── css/
│   └── style.css                # Modern responsive UI & benchmark dashboard styles
│
├── js/
│   ├── firebase.js              # Firebase configuration & initialization
│   ├── auth.js                  # Authentication logic (Firebase Auth + college email domain check)
│   ├── marketplace.js           # Marketplace queries & filtering (Cloud Firestore)
│   ├── listing.js               # Listing CRUD with Base64 canvas image compression
│   ├── cspBacktracking.js       # Unit-III CSP Solver (Simple BT, FC, MRV, LCV, Benchmark)
│   ├── planner.js               # Planner UI integration & benchmark visualization
│   ├── history.js               # Planner history Firestore integration
│   ├── profile.js               # Profile management
│   ├── requests.js              # Purchase request lifecycle (Pending -> Accepted -> Completed)
│   └── chat.js                  # Real-time messaging with Firestore listeners
│
├── firestore.rules              # Cloud Firestore Security Rules
└── README.md
```

## 🎓 How to Demonstrate During Viva / FOAI Evaluation

### Unit-III CSP Concepts Demonstrated
1. **Variables ($X$)**: The required items requested by the student (e.g. $[ \text{DBMS Book}, \text{Java Book}, \text{Calculator} ]$).
2. **Domains ($D$)**: Available marketplace resources matching the required titles and criteria.
3. **Constraints ($C$)**:
   - $\sum \text{Price}_i \le \text{Budget}$ (Global numerical constraint)
   - $\text{Condition}_i \ge \text{Minimum Condition}$ (Unary condition constraint)
   - $\text{Availability}_i = \text{'Available'}$ (Unary state constraint)
   - $\text{Resource}_i \neq \text{Resource}_j$ (Binary alldiff/uniqueness constraint)

### Inference & Heuristic Enhancements
- **Forward Checking (Constraint Propagation)**: When variable $X_k$ is assigned resource $v$, the remaining budget is computed, and any item in unassigned domains that costs more than the remaining budget is immediately pruned. If any unassigned domain becomes empty, the algorithm detects a dead-end wipeout without needlessly expanding deeper nodes.
- **MRV (Fail-First Principle)**: Selects the variable with the smallest $|D_i|$. If a variable has only 1 available resource, it is assigned immediately before other choices.
- **LCV (Least Constraining Value)**: Sorts domain values so the most budget-preserving item is attempted first.
- **Side-by-Side Benchmark**: In `planner.html`, selecting **Benchmark Mode** runs all three algorithms simultaneously, presenting an interactive table showing search tree nodes explored, backtracks required, prunings executed, and millisecond execution times.

## 🚀 Setup Instructions

### Prerequisites

- A Google Firebase account (free Spark plan works)
- A modern web browser
- Python 3 or Node.js (for running a local HTTP server)

### Step 1: Firebase Project Setup

1. The repository comes pre-configured for Firebase project `foai-53b5b` in `js/firebase.js`.
2. To use your own Firebase project:
   - Go to the [Firebase Console](https://console.firebase.google.com).
   - Click **Add Project** and name it (e.g., `campusshare`).
   - Go to **Build** → **Authentication** → **Sign-in method**, enable **Email/Password**, and click Save.
   - Go to **Build** → **Firestore Database**, click **Create Database** in **Native mode**, and choose your region (e.g., `asia-south2`).
   - In **Project Settings** → **General** → **Your apps**, register a Web App (`</>`) and copy the config object into [`js/firebase.js`](file:///c:/Users/naveed%20sheriff%20j/Desktop/COLLEGE/PROJECTS/FOAI%20PROJECT/js/firebase.js).

### Step 2: Apply Cloud Firestore Security Rules

1. In the Firebase Console, navigate to **Firestore Database** → **Rules**.
2. Paste the contents of [`firestore.rules`](file:///c:/Users/naveed%20sheriff%20j/Desktop/COLLEGE/PROJECTS/FOAI%20PROJECT/firestore.rules):
   - Secure profiles so only registered students can read/create their profile.
   - Restrict listings so only sellers can update/delete their own resources.
   - Protect private buyer-seller chat messages and purchase requests.
3. Click **Publish**.

### Step 3: Configure College Email Domain

Open [`js/firebase.js`](file:///c:/Users/naveed%20sheriff%20j/Desktop/COLLEGE/PROJECTS/FOAI%20PROJECT/js/firebase.js) and update the campus domain constraint:

```javascript
const COLLEGE_EMAIL_DOMAIN = 'rajalakshmi.edu.in'; // Or your university domain (e.g., 'college.edu')
```

### Step 4: Run the Application Locally

Start a local HTTP server from the project root directory:

```bash
# Using Python 3 (Recommended)
python -m http.server 8000

# Or using Node.js
npx http-server -p 8000
```

Open your browser and navigate to:
```
http://localhost:8000
```

## 👤 Creating an Account

1. Open the application at `http://localhost:8000`.
2. Click **Register**.
3. Fill in your student information:
   - Full Name
   - College Email (must end with `@` + your configured domain)
   - Student ID / Roll Number
   - Department (e.g., Computer Science and Engineering)
   - Year of Study (e.g., 3)
   - Password (minimum 6 characters)
4. Click **Create Account**.
5. Once registered, you will be taken to your personalized dashboard!

## 📚 Adding Resources & Sample Data

### Method 1: One-Click Academic Sample Data (Instant Seeding)

1. Navigate to the **Marketplace** (`marketplace.html`).
2. If the database is empty, click the **⚡ Seed Sample Academic Data** button in the empty state card.
   *(Alternatively, run `seedSampleResourcesToDatabase()` in the browser developer console).*
3. This writes authentic sample academic items (DBMS Books, Java Books, Casio fx-991EX Calculators, Arduino Kits, Engineering Drawing Sets, Multimeters) directly into your live Firestore database collection.

### Method 2: Create a Custom Listing via the UI

1. From the Dashboard, click **Add Resource** (or navigate to `create-listing.html`).
2. Fill in the listing details:
   - Resource Title & Detailed Description
   - Category (Textbook, Calculator, Lab Equipment, Arduino, Drawing Tools, etc.)
   - Subject & Department
   - Listing Type (Sell, Rent, Exchange, Donate)
   - Price (₹)
   - Physical Condition (New, Like New, Good, Fair, Poor)
   - Pickup Location (e.g., Library, Block A, ECE Lab)
   - Resource Image (automatically compressed into an optimized format and stored directly in Firestore—no external storage bucket required)
3. Click **Create Listing**.

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

- **Cloud Firestore Security Rules (`firestore.rules`)**: Granular server-side authorization ensuring students can only modify their own profiles, listings, and conversations.
- **Institutional Email Domain Restriction**: Enforces that only students with authorized campus email addresses (e.g., `@rajalakshmi.edu.in`) can register.
- **Client-Side XSS Sanitization**: All user-provided fields (titles, descriptions, chat messages, seller names) are sanitized through a global `escapeHtml` utility before rendering into the DOM.
- **Direct Canvas Image Compression**: Images are compressed locally to lightweight Base64 strings, eliminating the complexity and open-bucket risks of external cloud storage buckets.
- **Protected Participant Chat**: Real-time messaging is strictly restricted to the verified buyer and seller of an accepted request.

## 📊 Database Schema (Cloud Firestore)

CampusShare uses **Cloud Firestore** in Native mode. The document-based schema is structured across 5 primary collections:

### 1. `profiles`
Document ID: `userId` (Firebase Auth UID)
- `id`: string (Firebase Auth UID)
- `name`: string
- `email`: string
- `student_id`: string
- `department`: string
- `year`: number
- `created_at`: timestamp

### 2. `resources`
Document ID: Auto-generated Firestore ID
- `seller_id`: string (Firebase Auth UID)
- `seller_name`: string
- `seller_email`: string
- `title`: string (e.g., "DBMS Book - Database System Concepts")
- `description`: string
- `category`: string (`Textbook`, `Calculator`, `Lab Equipment`, `Arduino`, `Drawing Tools`, etc.)
- `subject`: string
- `listing_type`: string (`Sell`, `Rent`, `Exchange`, `Donate`)
- `price`: number (₹)
- `condition`: string (`New`, `Like New`, `Good`, `Fair`, `Poor`)
- `availability`: string (`Available`, `Reserved`, `Sold`)
- `pickup_location`: string
- `image_url`: string (Base64 data URL or external URL)
- `created_at`: timestamp
- `updated_at`: timestamp

### 3. `purchase_requests`
Document ID: Auto-generated Firestore ID
- `resource_id`: string (Foreign reference to `resources`)
- `resource_title`: string
- `resource_image_url`: string
- `resource_price`: number
- `resource_listing_type`: string
- `buyer_id`: string
- `buyer_name`: string
- `buyer_email`: string
- `buyer_department`: string
- `seller_id`: string
- `seller_name`: string
- `seller_email`: string
- `message`: string
- `pickup_location`: string
- `status`: string (`PENDING`, `ACCEPTED`, `REJECTED`, `COMPLETED`)
- `created_at`: timestamp
- `updated_at`: timestamp

### 4. `messages` (Real-Time Chat)
Document ID: Auto-generated Firestore ID
- `request_id`: string (Foreign reference to `purchase_requests`)
- `sender_id`: string (Firebase Auth UID)
- `sender_name`: string
- `message`: string
- `created_at`: timestamp

### 5. `planner_history`
Document ID: Auto-generated Firestore ID
- `user_id`: string (Firebase Auth UID)
- `budget`: number
- `minimum_condition`: string
- `total_cost`: number
- `remaining_budget`: number
- `mode`: string (`mrv`, `fc`, `simple`)
- `items`: array of objects `[{ resource_id, resource_title, price, condition, variable }]`
- `created_at`: timestamp

## 🐛 Troubleshooting

### Issue: "0 Available Resources" in Marketplace / Dashboard
- **Explanation**: The application connects directly to your live Firestore collection. If you have not created listings yet, it accurately displays `0`.
- **Solution**: 
  - Click **⚡ Seed Sample Academic Data** on the Marketplace page (`marketplace.html`) to populate sample textbooks, calculators, and kits.
  - Or click **Add Resource** on the Dashboard to create your own listing!

### Issue: "Email domain not allowed" during registration
- **Solution**: Check [`js/firebase.js`](file:///c:/Users/naveed%20sheriff%20j/Desktop/COLLEGE/PROJECTS/FOAI%20PROJECT/js/firebase.js) line 14:
  ```javascript
  const COLLEGE_EMAIL_DOMAIN = 'rajalakshmi.edu.in'; // Update to your college domain
  ```

### Issue: CSP planner returns "No valid combination found"
- **Solution**: The CSP solver strictly enforces your budget and minimum condition constraints.
  - Try increasing your budget (e.g., ₹1500 instead of ₹500).
  - Or lower the minimum condition (e.g., select `Good` or `Fair`).

### Issue: Firebase "Missing or insufficient permissions"
- **Solution**: Open the Firebase Console, go to **Firestore Database** → **Rules**, and ensure you have published the rules from [`firestore.rules`](file:///c:/Users/naveed%20sheriff%20j/Desktop/COLLEGE/PROJECTS/FOAI%20PROJECT/firestore.rules).

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

The application includes a complete peer-to-peer transaction lifecycle:

### Features:
- **Request Modal**: Buyers can send purchase/rent/exchange requests with proposed pickup location and custom messages.
- **Dynamic Context Buttons**: "Request to Buy", "Request to Rent", "Request to Exchange", "Request to Donate" based on listing type.
- **Seller Requests Page**: Sellers can review incoming requests and accept or decline.
- **My Requests Page**: Buyers can track their submitted requests and status changes.
- **Real-Time Chat**: Live peer-to-peer messaging via Firestore `onSnapshot` listeners once a request is accepted.
- **Status Lifecycle**: `PENDING` → `ACCEPTED` → `COMPLETED` (or `REJECTED`).
- **Resource State Transitions**: Automatically flags resources when a transaction is finalized.

### Security:
- Security rules enforced via [`firestore.rules`](file:///c:/Users/naveed%20sheriff%20j/Desktop/COLLEGE/PROJECTS/FOAI%20PROJECT/firestore.rules).
- Only the specific buyer and seller can read or create messages for a request.
- Users cannot submit requests on their own listings.
- Duplicate pending requests for the same resource are blocked.
- Chat room access is only unlocked after the request is officially accepted by the seller.

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

- Firebase for the excellent backend-as-a-service platform
- The AI algorithms are based on standard CSP and backtracking search techniques from AI textbooks
