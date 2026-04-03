# ESCR Digital Queueing System - React/TypeScript

## Deployment to Vercel

### Prerequisites
1. Node.js installed
2. Vercel account
3. Firebase project with Firestore and Authentication enabled

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Deploy
```bash
vercel
```

Follow the prompts:
- Set up and deploy? Yes
- Which scope? Your Vercel team
- Link to existing project? No
- Project name: `myqueue` (or your preferred name)
- Directory? `.`
- Want to modify settings? No

### Step 4: Configure Environment Variables (Optional)
If you want to use different Firebase config per environment:
```bash
vercel env add VITE_FIREBASE_API_KEY
vercel env add VITE_FIREBASE_AUTH_DOMAIN
# etc.
```

### Firebase Setup

#### 1. Enable Authentication
- Go to Firebase Console > Authentication
- Enable Email/Password sign-in method

#### 2. Create Firestore Collections
Create these collections in your Firebase Firestore:

**transactions** (sample data):
```json
{
  "name": "Enrollment",
  "description": "Course enrollment and registration",
  "code": "ENR",
  "active": true,
  "priority": true
}
```

**windows** (sample data):
```json
{
  "name": "Window 1",
  "number": 1,
  "active": true,
  "currentTicketId": null
}
```

**settings** (document ID: "system"):
```json
{
  "systemName": "ESCR Digital Queueing System",
  "resetTime": "00:00",
  "maxDailyTickets": 100,
  "enablePriority": true,
  "enableNotifications": true,
  "averageServiceTime": 300
}
```

#### 3. Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

## Features
- User authentication (Login/Signup/Password Reset)
- Role-based access (Student, Staff, Admin)
- Queue ticket generation with priority support
- Real-time queue monitoring
- Staff dashboard for managing queue
- Admin dashboard for settings and reports
- Public display monitor
- Queue history

## Routes
- `/` - Landing page (students)
- `/login` - Login page
- `/signup` - Signup page
- `/transactions` - Transaction selection
- `/ticket` - Display ticket
- `/history` - Queue history
- `/admin` - Admin menu
- `/admin/dashboard` - Admin dashboard
- `/admin/settings` - System settings
- `/admin/reports` - Reports
- `/staff` - Staff dashboard
- `/monitor` - Public queue monitor

## Development
```bash
npm install
npm run dev
```
