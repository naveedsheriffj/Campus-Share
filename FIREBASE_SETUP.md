# CampusShare - Firebase Setup Guide

This guide details the Firebase configuration for **CampusShare** on project `foai-53b5b`.
The application uses **Firebase Authentication** and **Cloud Firestore** for all database storage and real-time messaging, with **no external Cloud Storage service required** (images are saved directly in Firestore).

---

## 🚀 Quick Setup Status

- **Project ID**: `foai-53b5b`
- **Firestore Database**: Already active in `(default)` native mode (`asia-south2`).
- **Sample Data**: Pre-seeded with academic textbooks (DBMS, Java), Calculators, Arduino kits, Multimeters, and Drawing tools.
- **Frontend Integration**: Fully updated with Firebase Web SDK v10 (Authentication & Firestore Database).

---

## 🛠 Required 2-Minute Steps in Firebase Console

Open the [Firebase Console](https://console.firebase.google.com/project/foai-53b5b/overview):

### 1. Enable Authentication Sign-In Methods
1. Go to **Build** → **Authentication** in the left sidebar.
2. Click **Get Started** (if not yet enabled).
3. On the **Sign-in method** tab:
   - **Email/Password**: Click, toggle **Enable**, and click **Save**.
   - **Google**: Click, toggle **Enable**, select your project support email, and click **Save**.

### 2. Apply Firestore Security Rules
1. Go to **Build** → **Firestore Database**.
2. Click the **Rules** tab at the top.
3. Replace the contents with the rules from [`firestore.rules`](./firestore.rules) and click **Publish**.

---

## 📂 Project Data Model in Cloud Firestore

### 1. `profiles`
Document ID: `userId` (Firebase Auth UID)
- `id`: string
- `name`: string
- `email`: string
- `student_id`: string
- `department`: string
- `year`: number
- `created_at`: timestamp

### 2. `resources`
Document ID: auto-generated
- `seller_id`: string (Auth UID)
- `seller_name`: string
- `seller_email`: string
- `title`: string
- `description`: string
- `category`: string (`Textbook`, `Calculator`, `Lab Equipment`, etc.)
- `subject`: string
- `listing_type`: string (`Sell`, `Rent`, `Exchange`, `Donate`)
- `price`: number
- `condition`: string (`New`, `Like New`, `Good`, `Fair`, `Poor`)
- `availability`: string (`Available`, `Reserved`, `Sold`)
- `pickup_location`: string
- `image_url`: string (Image URL or optimized Base64 data URL)
- `created_at`: timestamp
- `updated_at`: timestamp

### 3. `purchase_requests`
Document ID: auto-generated
- `resource_id`: string
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

### 4. `messages` (Real-time Chat)
Document ID: auto-generated
- `request_id`: string
- `sender_id`: string
- `sender_name`: string
- `message`: string
- `created_at`: timestamp

### 5. `planner_history`
Document ID: auto-generated
- `user_id`: string
- `budget`: number
- `minimum_condition`: string
- `total_cost`: number
- `remaining_budget`: number
- `items`: array of objects `[{ resource_id, resource_title, price, condition, variable }]`
- `created_at`: timestamp

---

## 🏃 Running the Application

You can serve the application locally using Python or any static web server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx -y serve .
```

Then navigate to `http://localhost:8000` in your web browser.
