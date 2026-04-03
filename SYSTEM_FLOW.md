# ESCR Digital Queueing System - Complete Flow & Routes

## Overview
This document outlines the complete user flow and routing for the ESCR Digital Queueing System across all three user roles: Students, Staff, and Admin.

---

## 🔐 Authentication Flow

### Login Flow
1. **Login Page** (`/login`)
   - User enters email and password
   - System authenticates with Firebase
   - Fetches user data from Firestore
   - Redirects based on role:
     - **Student** → `/` (Landing Page)
     - **Staff** → `/window-selection`
     - **Admin** → `/admin`

### Signup Flow
1. **Signup Page** (`/signup`)
   - User enters username, email, password
   - Creates Firebase account
   - Creates user document in Firestore with role 'student'
   - Redirects to `/` (Landing Page)

### Password Reset Flow
1. **Forgot Password Page** (`/forgot-password`)
   - User enters email
   - System sends password reset email
   - User clicks link in email to reset password

---

## 🎓 Student Flow

### Route Structure
```
/ (Landing Page)
├── /transactions (Transaction Selection)
│   └── /student-details (Student Details Form)
│       └── /ticket (Display Ticket)
└── /history (View History)
```

### Detailed Flow

#### 1. Landing Page (`/`)
- **Purpose**: Welcome page with system information
- **Features**:
  - Animated logo
  - "Get Started" button → navigates to `/transactions`
  - "About" button → shows system information
  - "Help" button → shows quick help guide
  - Logout button

#### 2. Transaction Selection (`/transactions`)
- **Purpose**: Select the type of transaction
- **Features**:
  - Displays available transaction types (Assessments, Enrollment, Payments, Other Concerns)
  - Real-time queue statistics for each transaction
  - Priority queue indicator
  - Queue tracker showing current ticket status
  - Help modal with instructions
- **Data Loaded**:
  - Transaction types from Firestore
  - Real-time queue updates via subscription
  - Current ticket from sessionStorage (if exists)

#### 3. Student Details (`/student-details`)
- **Purpose**: Collect student information
- **Features**:
  - Student name input
  - Student ID input (optional)
  - Course selection dropdown
  - Year level selection dropdown
  - Form validation
  - Help modal
- **Data Stored**:
  - Saves student details to sessionStorage
  - Saves selected transaction to sessionStorage

#### 4. Display Ticket (`/ticket`)
- **Purpose**: Show generated queue ticket
- **Features**:
  - Ticket number display (e.g., A-001, E-002)
  - Transaction type
  - Current status (Waiting)
  - Position in queue (real-time updates)
  - Estimated wait time
  - Queue statistics (waiting, serving, completed)
  - Priority indicator (if applicable)
  - "Done" button → shows thank you modal → redirects to `/`
- **Data Loaded**:
  - Creates new ticket or loads existing from sessionStorage
  - Real-time queue position updates
  - Queue statistics

#### 5. History (`/history`)
- **Purpose**: View past transactions
- **Features**:
  - List of completed/cancelled/no-show tickets
  - Filter by date range
  - Filter by window
  - Search by ticket number
  - Status indicators
  - Print functionality

---

## 👨‍💼 Staff Flow

### Route Structure
```
/window-selection (Select Window)
└── /staff (Staff Dashboard)
```

### Detailed Flow

#### 1. Window Selection (`/window-selection`)
- **Purpose**: Select the serving window
- **Features**:
  - Displays available windows (Window 1-4)
  - Window status (available/locked)
  - Lock window for staff (not for admin)
  - Stores selected window in sessionStorage
- **Data Loaded**:
  - Windows from Firestore
  - Window lock status

#### 2. Staff Dashboard (`/staff`)
- **Purpose**: Main interface for serving customers
- **Features**:
  - **Now Serving Card**:
    - Current ticket number
    - Student information (name, course, year level)
    - Transaction type
  - **Transaction Selector**:
    - Dropdown to switch between transaction types
    - Shows all available transactions for the window
  - **Action Buttons**:
    - "Call Next Ticket" → calls next ticket in queue (shows count of available tickets)
    - "Ring" → plays notification sound
    - "Complete" → marks ticket as completed
    - "No Show" → marks ticket as no show
  - **Call Other Transaction**:
    - Calls tickets from other transaction types
    - Shows count of available tickets from other transactions
    - Useful when own transaction queue is empty
  - **Statistics**:
    - Waiting tickets count (all transactions)
    - Completed tickets count
  - **Waiting by Transaction**:
    - Shows count of waiting tickets for each transaction type
    - Highlights currently selected transaction
  - **Next in Line**:
    - Shows next 5 tickets in queue (all transactions)
    - Shows transaction type for each ticket
    - Priority tickets highlighted
  - **Priority Notification Banner**:
    - Shows when priority tickets are waiting
    - Displays count of priority tickets
  - **Sidebar**:
    - Dashboard button (refreshes page)
    - History button → navigates to `/history`
    - Logout button
    - Switch Window button → navigates to `/window-selection`
- **Data Loaded**:
  - Real-time ticket updates via subscription
  - Queue statistics
  - Transaction types
- **Audio Features**:
  - Notification sound when ticket is called
  - Voice announcement (e.g., "Ticket A-001, please proceed to window 1")

---

## 👨‍💻 Admin Flow

### Route Structure
```
/admin (Admin Selection)
├── /admin/dashboard (Admin Dashboard)
├── /admin/settings (System Settings)
└── /admin/reports (Reports)
```

### Detailed Flow

#### 1. Admin Selection (`/admin`)
- **Purpose**: Admin menu with quick stats
- **Features**:
  - Real-time queue statistics
  - Menu cards:
    - Dashboard → `/admin/dashboard`
    - Reports → `/admin/reports`
    - Settings → `/admin/settings`
    - Monitor → `/monitor` (public monitor)
  - Logout button
- **Data Loaded**:
  - Real-time queue updates via subscription

#### 2. Admin Dashboard (`/admin/dashboard`)
- **Purpose**: Manage queues and view status
- **Features**:
  - **Queue Management**:
    - View all active tickets
    - Call next ticket for any window
    - Complete tickets
    - Mark tickets as no show
  - **Window Management**:
    - View window status
    - See current ticket per window
  - **Transaction Management**:
    - View transaction types
    - Enable/disable transactions
  - **Statistics**:
    - Total tickets
    - Waiting tickets
    - Serving tickets
    - Completed tickets
    - Average wait time
    - Average serve time
- **Data Loaded**:
  - All tickets from Firestore
  - All windows from Firestore
  - Transaction types
  - Queue statistics

#### 3. System Settings (`/admin/settings`)
- **Purpose**: Configure system settings
- **Features**:
  - System name
  - Daily reset time
  - Maximum daily tickets
  - Enable/disable priority queue
  - Enable/disable notifications
  - Average service time
- **Data Loaded**:
  - Current settings from Firestore

#### 4. Reports (`/admin/reports`)
- **Purpose**: View analytics and reports
- **Features**:
  - Date range filter
  - Total tickets served
  - Average wait time
  - Average serve time
  - Breakdown by transaction type
  - Breakdown by window
  - Hourly distribution chart
  - Export to PDF/Print
- **Data Loaded**:
  - Historical ticket data
  - Calculated statistics

---

## 📺 Public Monitor (`/monitor`)
- **Purpose**: Display queue status on public screens
- **Features**:
  - Dark theme for visibility
  - Real-time ticket updates
  - Currently serving tickets
  - Waiting tickets
  - Notification sound when new ticket is called
  - Voice announcement
  - Auto-refreshing clock
- **Data Loaded**:
  - Real-time ticket updates via subscription
  - Windows from Firestore

---

## 🔄 Real-time Updates

### Subscription System
- All pages use `subscribeToActiveTickets` for real-time updates
- Updates trigger automatically when:
  - New ticket is created
  - Ticket status changes (waiting → serving → completed)
  - Ticket is cancelled or marked as no show

### Session Storage
- `selectedTransaction`: Stores selected transaction type
- `studentDetails`: Stores student information
- `currentTicket`: Stores current ticket for tracking
- `selectedWindow`: Stores selected window for staff

---

## 🛡️ Protected Routes

### Role-Based Access Control
- **Student Routes**: `/`, `/transactions`, `/student-details`, `/ticket`, `/history`
- **Staff Routes**: `/window-selection`, `/staff`, `/history`
- **Admin Routes**: `/admin`, `/admin/dashboard`, `/admin/settings`, `/admin/reports`
- **Public Routes**: `/login`, `/signup`, `/forgot-password`, `/monitor`

### ProtectedRoute Component
- Checks authentication status
- Validates user role against allowed roles
- Redirects unauthorized users to appropriate page
- Shows loading spinner while checking auth

---

## 🎨 UI/UX Features

### Loading States
- All pages show loading spinner while data is loading
- Loading state properly cleared after data loads or on error
- Auth loading state prevents premature redirects

### Notifications
- Success alerts for completed actions
- Error alerts for failed operations
- Warning alerts for queue status
- Toast notifications for real-time updates

### Modals
- Help modals with instructions
- Thank you modal after ticket generation
- Confirmation modals for destructive actions

### Responsive Design
- Mobile-friendly layouts
- Adaptive navigation
- Touch-friendly buttons

---

## 🔧 Technical Implementation

### State Management
- React Context for authentication
- React Context for alerts/notifications
- Local state for page-specific data
- Session storage for temporary data

### Data Persistence
- Firebase Authentication for user accounts
- Firestore for all data storage
- Session storage for temporary state
- Real-time subscriptions for live updates

### Error Handling
- Try-catch blocks for all async operations
- Fallback logic for failed Firestore fetches
- User-friendly error messages
- Console logging for debugging
