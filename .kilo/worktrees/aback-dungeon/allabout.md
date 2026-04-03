# ESCR Digital Queue Management System (DQMS)

## Overview

The **ESCR Digital Queue Management System** is a comprehensive web-based queue management solution designed for **East Systems College of Rizal (ESCR)**. It modernizes school operations by providing a faster, more systematic, and highly organized flow of transactions. The system significantly reduces wait times and minimizes campus congestion, allowing students, parents, and staff to complete their tasks with greater ease.

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Technology Stack](#technology-stack)
3. [User Roles](#user-roles)
4. [Authentication & Security](#authentication--security)
5. [Core Features](#core-features)
6. [Database Structure](#database-structure)
7. [Key Files & Functions](#key-files--functions)
8. [Queue Flow Logic](#queue-flow-logic)
9. [Transaction Types](#transaction-types)
10. [Window Management](#window-management)
11. [Monitoring & Reports](#monitoring--reports)
12. [API & Real-time Features](#api--real-time-features)
13. [Security Features](#security-features)
14. [Responsive Design](#responsive-design)
15. [Getting Started](#getting-started)

---

## System Architecture

### Technology Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | React 19, TypeScript, Tailwind CSS |
| **Backend/Database** | Firebase Firestore |
| **Authentication** | Firebase Auth |
| **Routing** | React Router v7 |
| **Icons** | Lucide React |
| **Build Tool** | Vite 7 |

### Directory Structure

```
myqueue/
├── src/
│   ├── components/
│   │   └── ProtectedRoute.tsx       # Role-based access control
│   ├── context/
│   │   └── AuthContext.tsx          # Authentication state management
│   ├── firebase/
│   │   ├── config.ts                # Firebase configuration
│   │   └── index.ts                 # Firebase exports
│   ├── pages/
│   │   ├── Login.tsx                # User login
│   │   ├── Signup.tsx               # User registration
│   │   ├── ForgotPassword.tsx       # Password reset
│   │   ├── Landing.tsx             # Student home page
│   │   ├── TransactionSelection.tsx # Select transaction type
│   │   ├── StudentDetails.tsx       # Enter student details
│   │   ├── DisplayTicket.tsx        # Show generated ticket
│   │   ├── AdminSelection.tsx       # Admin menu selection
│   │   ├── AdminDashboard.tsx       # Admin management
│   │   ├── WindowSelection.tsx      # Staff window selection
│   │   ├── StaffDashboard.tsx        # Staff queue management
│   │   ├── PublicMonitor.tsx        # Public display monitor
│   │   └── History.tsx              # Transaction history
│   ├── services/
│   │   └── queueService.ts         # Firestore operations
│   ├── types/
│   │   └── index.ts                # TypeScript interfaces
│   ├── seed.ts                     # Database initialization
│   ├── App.tsx                      # Main application
│   └── main.tsx                     # Entry point
├── public/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── firestore.rules
└── README.md
```

---

## User Roles

The system supports three distinct user roles:

| Role | Permissions |
|------|-------------|
| **Student** | Get queue tickets, view ticket status, view history |
| **Staff** | Serve queues, manage active queues, view history |
| **Admin** | Full access to all features including settings, reports, and management |

### Role-Based Access Control (RBAC)

Each route is protected based on the user's role:

```typescript
// Example from App.tsx
<Route path="/" element={
  <ProtectedRoute allowedRoles={['student']}>
    <Landing />
  </ProtectedRoute>
} />
```

---

## Authentication & Security

### Login System ([`Login.tsx`](src/pages/Login.tsx))

- **Role-Based Redirect**: Automatically redirects based on user role
- **Authentication**: Uses Firebase Auth with email/password
- **Session Management**: React Context for state management
- **Error Handling**: Clear error messages for failed attempts

### Registration ([`Signup.tsx`](src/pages/Signup.tsx))

- **Role Selection**: Choose between student, staff, or admin
- **Password Requirements**: Minimum 6 characters
- **Auto-Login**: Automatically logs in user after successful registration
- **Role-Based Redirect**: Directs to appropriate dashboard after signup

### Forgot Password ([`ForgotPassword.tsx`](src/pages/ForgotPassword.tsx))

- **Email-Based Reset**: Sends password reset link via Firebase Auth
- **Two-Step Process**: Email verification → Password change

### Session Security ([`AuthContext.tsx`](src/context/AuthContext.tsx))

```typescript
// Session state management
const { user, loading } = useAuth();

// Protected routes check user role before rendering
```

---

## Core Features

### 1. Queue Ticket Generation

**File**: [`TransactionSelection.tsx`](src/pages/TransactionSelection.tsx) → [`StudentDetails.tsx`](src/pages/StudentDetails.tsx) → [`DisplayTicket.tsx`](src/pages/DisplayTicket.tsx)

#### Process Flow:
1. **Category Selection**: User selects transaction type
2. **Student Details**: Collects name, course, and year level
3. **Queue Number Generation**: Creates unique ticket number with prefix
4. **Position Calculation**: Determines queue position

#### Queue Number Format:
```
{prefix}{3-digit-number}

Examples:
- A001 (Assessments)
- E001 (Enrollment)
- P001 (Payments)
- O001 (Other Concerns)
```

### 2. Ticket Display & Printing

**File**: [`DisplayTicket.tsx`](src/pages/DisplayTicket.tsx)

- **Ticket Information Displayed**:
  - Queue number (large, prominent display)
  - Transaction type
  - Position in queue
  - Estimated wait time
  - Status (Waiting/Serving/Completed)

### 3. Queue Status Tracking

**File**: [`DisplayTicket.tsx`](src/pages/DisplayTicket.tsx)

- **Real-time Updates**: Polls server for queue updates
- **Status Display**:
  - Current position in queue
  - Assigned window
  - Queue status (Waiting/Serving/Completed)
- **Share Functionality**: Share ticket via native share or clipboard

---

## Database Structure

### Collections

#### 1. `users` Collection
```typescript
interface User {
  id: string;
  username: string;
  email: string;
  role: 'student' | 'staff' | 'admin';
  createdAt: Date;
}
```

#### 2. `tickets` Collection (Active Queue)
```typescript
interface QueueTicket {
  id: string;
  ticketNumber: string;
  transactionTypeId: string;
  transactionTypeName: string;
  userId: string | null;
  studentName?: string;
  studentId?: string;
  course?: string;
  yearLevel?: string;
  status: 'waiting' | 'serving' | 'completed' | 'cancelled';
  priority: boolean;
  createdAt: Date;
  calledAt: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  windowId: string | null;
  windowName: string | null;
  waitTime: number;
  serveTime: number;
}
```

#### 3. `transactions` Collection (Transaction Types)
```typescript
interface TransactionType {
  id: string;
  name: string;
  description: string;
  code: string;
  prefix: string;
  active: boolean;
  priority: boolean;
  windowNumber: number;
}
```

#### 4. `windows` Collection
```typescript
interface Window {
  id: string;
  name: string;
  number: number;
  active: boolean;
  currentTicketId: string | null;
}
```

#### 5. `settings` Collection
```typescript
interface SystemSettings {
  systemName: string;
  resetTime: string;
  maxDailyTickets: number;
  enablePriority: boolean;
  enableNotifications: boolean;
  averageServiceTime: number;
}
```

#### 6. `counters` Collection
```typescript
interface Counter {
  id: string; // e.g., "A_20260313"
  count: number;
}
```

---

## Key Files & Functions

### Queue Service ([`queueService.ts`](src/services/queueService.ts))

```typescript
// Generate ticket number
generateTicketNumber(prefix: string): Promise<string>

// Create new ticket
createTicket(transactionTypeId, transactionTypeName, prefix, isPriority, userId, studentDetails): Promise<QueueTicket>

// Call next ticket
callNextTicket(transactionTypeId, windowId, windowName): Promise<QueueTicket | null>

// Complete ticket
completeTicket(ticketId: string): Promise<void>

// Cancel ticket
cancelTicket(ticketId: string): Promise<void>

// Get queue statistics
getQueueStats(transactionTypeId?: string): Promise<QueueStats>

// Subscribe to active tickets (real-time)
subscribeToActiveTickets(callback): Unsubscribe

// Reset queue
resetQueue(): Promise<void>
```

---

## Queue Flow Logic

### Student Flow
```
1. Login/Registration
        ↓
2. Landing Page (Get Started)
        ↓
3. Transaction Selection
        ↓
4. Fill Student Details
        ↓
5. Generate Ticket
        ↓
6. Display & Print Ticket
        ↓
7. Queue Status Page (Wait for turn)
        ↓
8. Transaction Complete
```

### Staff Flow
```
1. Login
        ↓
2. Window Selection
        ↓
3. Staff Dashboard
        ↓
4. Call Next / Serve Student
        ↓
5. Complete Transaction
        ↓
6. Repeat or View Reports
```

### Admin Flow
```
1. Login
        ↓
2. Admin Selection
        ↓
3. Dashboard / Reports / Settings
        ↓
4. Manage Transactions & Windows
        ↓
5. View Analytics
```

---

## Transaction Types

### Default Transaction Types

| Transaction | Prefix | Window | Description |
|-------------|--------|--------|-------------|
| Enrollment | E | 2 | New enrollments, subject enrollment |
| Assessments | A | 1 | Assessment forms, evaluations |
| Payments | P | 3 | Tuition fees, other payments |
| Other Concerns | O | 4 | Document requests, general inquiries |

---

## Window Management

### Window Selection ([`WindowSelection.tsx`](src/pages/WindowSelection.tsx))

Allows staff to select their assigned window:
- Window 1: Assessments
- Window 2: Enrollment
- Window 3: Payments
- Window 4: Other Concerns

### Staff Dashboard ([`StaffDashboard.tsx`](src/pages/StaffDashboard.tsx))

#### Features:
1. **Current Serving Display**: Shows who's currently being served
2. **Statistics**: Number waiting, number completed
3. **Waiting List**: Shows next pending tickets
4. **Action Buttons**: Call Next, Complete, Cancel
5. **Transaction Type Management**: Select handled transaction type

---

## Monitoring & Reports

### Public Monitor ([`PublicMonitor.tsx`](src/pages/PublicMonitor.tsx))

#### Display Features:
- **Now Serving**: Large display of current ticket
- **Queue Statistics**: Waiting, Serving, Services counts
- **Window Status**: Real-time status of all windows
- **Up Next**: List of next tickets in queue

#### Audio Features:
- **Sound Toggle**: Enable/disable notifications
- **Bell Sound**: Plays when new ticket is called
- **Voice Announcement**: Text-to-speech for ticket numbers

### Admin Reports ([`AdminDashboard.tsx`](src/pages/AdminDashboard.tsx))

Available Reports:
1. **Dashboard**: Overview of queue statistics
2. **Transactions**: Manage transaction types
3. **Windows**: Manage service windows
4. **Settings**: System configuration
5. **Reports**: Analytics and data

### Transaction History ([`History.tsx`](src/pages/History.tsx))

- Complete transaction log for the user
- Filterable by date and status
- Color-coded status badges

---

## API & Real-time Features

### Real-time Subscriptions

The system uses Firestore's `onSnapshot` for real-time updates:

```typescript
// Subscribe to active tickets
const unsubscribe = subscribeToActiveTickets((tickets) => {
  // Update UI with latest tickets
});
```

### Public Monitor API

The public monitor automatically receives real-time updates:
- Current serving ticket
- Window status
- Queue statistics
- Waiting list

---

## Security Features

### Implemented Protections:

| Feature | Implementation |
|---------|----------------|
| **Authentication** | Firebase Auth with email/password |
| **Authorization** | Role-based route protection |
| **Data Security** | Firestore security rules |
| **Input Validation** | TypeScript interfaces |
| **XSS Prevention** | React's built-in escaping |
| **Route Protection** | ProtectedRoute component |

### Firestore Security Rules ([`firestore.rules`](firestore.rules))

```javascript
// Transactions and windows are publicly readable
// Tickets require authentication for updates
// User data is protected by ownership
```

---

## Responsive Design

### Breakpoints

| Breakpoint | Target |
|------------|--------|
| < 640px | Mobile |
| < 768px | Tablet |
| < 1024px | Desktop |
| >= 1024px | Large Desktop |

### Design System

- **Color Palette**:
  - Primary: `#2563EB` (Blue 600)
  - Secondary: `#1E40AF` (Blue 800)
  - Background: Gradient from green-200 via blue-100 to blue-300
  - Success: `#16A34A` (Green 600)
  - Warning: `#CA8A04` (Yellow 600)
  - Error: `#DC2626` (Red 600)

- **Typography**: System fonts (Segoe UI, Arial, sans-serif)

- **Components**:
  - Responsive grid layouts
  - Flexbox for alignment
  - Mobile-first approach
  - Touch-friendly buttons

---

## Getting Started

### Prerequisites

- Node.js 18+
- Firebase project with Firestore and Auth enabled
- npm or yarn

### Installation

```bash
# Clone the repository
cd myqueue

# Install dependencies
npm install

# Set up Firebase configuration
# Edit src/firebase/config.ts with your Firebase credentials

# Run development server
npm run dev

# Build for production
npm run build
```

### Database Initialization

Run the seed script to populate initial data:

```bash
npm run seed
```

This creates:
- 4 Transaction Types
- 4 Windows
- System Settings

### Environment Variables

Create a `.env` file (optional - can also edit config.ts directly):
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

## Conclusion

The **ESCR Digital Queue Management System** is a complete, production-ready solution that effectively manages queue operations for an educational institution. It combines robust security, user-friendly interfaces, and comprehensive reporting to deliver an efficient queue management experience.

### Key Strengths:
- ✅ Role-based access control
- ✅ Real-time monitoring with audio announcements
- ✅ Comprehensive analytics
- ✅ Multi-window support
- ✅ Mobile responsive
- ✅ Easy to deploy
- ✅ TypeScript for type safety

---

*Document generated: 2026*
*System: ESCR Digital Queue Management System*
*Technology: React + Firebase*
*Developer: Custom Web Solution*