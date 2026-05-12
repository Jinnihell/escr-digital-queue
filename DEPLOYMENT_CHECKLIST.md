# Deployment Checklist & Security Fixes

This document lists all security fixes and configuration steps required before deploying to production.

## 🚨 CRITICAL - Must Complete Before Production

### 1. Environment Variables Setup
- [ ] Copy `.env.example` to `.env.local`
- [ ] Add Firebase configuration values to `.env.local`
- [ ] Verify `.env.local` is in `.gitignore` (already configured)
- [ ] Never commit `.env.local` to git

**File**: `.env.local`
```
VITE_FIREBASE_API_KEY=your_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_domain_here
VITE_FIREBASE_PROJECT_ID=your_project_id_here
VITE_FIREBASE_STORAGE_BUCKET=your_bucket_here
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
VITE_FIREBASE_APP_ID=your_app_id_here
```

### 2. Firestore Security Rules
- [ ] Deploy updated Firestore Rules with role-based access control
- [ ] Verify rules file has been updated: `firestore.rules`

**Key Changes**:
- All public `allow write: if true;` removed
- Role-based access control implemented (admin, staff, student)
- Data access restricted by user role and ownership

**Deploy via Firebase CLI**:
```bash
firebase deploy --only firestore:rules
```

### 3. Firestore Composite Indexes
- [ ] Create required composite indexes in Firebase Console

**Required Indexes**:
- Collection: `tickets`
  - Fields: `transactionTypeId` (Asc), `status` (Asc), `createdAt` (Asc)
  - Collection: `tickets`
  - Fields: `status` (Desc), `createdAt` (Asc)

**How to Create**:
1. Go to Firebase Console → Firestore Database → Indexes
2. Create Composite Indexes with fields above
3. Wait for indexing to complete

### 4. Authentication Configuration
- [ ] Verify Firebase Auth is enabled for Email/Password
- [ ] Configure Google OAuth credentials in Firebase Console
- [ ] Set authorized redirect URIs for your domain
- [ ] Enable Google OAuth provider in Firebase Auth

### 5. Session & Cookie Security
- [ ] User authentication no longer uses sessionStorage (fixed)
- [ ] All sensitive data now managed through Firebase Auth
- [ ] Consider adding httpOnly secure cookies in production

## 🟠 HIGH PRIORITY - Complete This Sprint

### 6. Input Validation & Sanitization
- [x] Fixed: Email validation in sign-up
- [x] Fixed: Password strength requirements (8+ chars, uppercase, number, special char)
- [x] Fixed: Input sanitization to prevent XSS attacks
- [x] Added: Utility functions in `src/utils/sanitizer.ts`

### 7. Timeouts & Rate Limiting
- [x] Added: 10-second timeout on auth operations
- [x] Added: 5-second timeout on Firestore document fetches
- [x] TODO: Implement rate limiting on:
  - Login attempts (consider Firebase Extensions)
  - Password reset attempts
  - API endpoints if using Cloud Functions

### 8. Error Boundaries
- [x] Added: ErrorBoundary component
- [x] Integrated: Error boundary in App.tsx
- [ ] Test: Verify error handling works in production

### 9. Real-time Subscriptions Cleanup
- [x] Verified: All subscriptions have proper cleanup
- [x] Fixed: Subscription dependencies
- [ ] Test: Monitor for memory leaks in long-running sessions

### 10. Atomic Database Operations
- [x] Fixed: `callNextTicket()` now uses transactions for atomicity
- [x] Fixed: `generateTicketNumber()` uses transactions
- [x] Fixed: `completeTicket()` now calculates wait times correctly
- [ ] Test: Verify ticket operations are atomic under load

## 🟡 MEDIUM PRIORITY - Complete Next Sprint

### 11. Pagination & Query Optimization
- [ ] Add pagination to ticket history queries
- [ ] Implement lazy loading for large datasets
- [ ] Limit initial query results (e.g., last 100 tickets)

**Files to Update**:
- `src/pages/AdminDashboard.tsx`
- `src/pages/History.tsx`

### 12. Reconnection & Offline Handling
- [ ] Implement connection state monitoring
- [ ] Add reconnection logic for dropped subscriptions
- [ ] Show offline indicator to users
- [ ] Buffer changes while offline

### 13. Error Logging Service
- [ ] Implement secure error logging (don't expose details to users)
- [ ] Send critical errors to monitoring service (Sentry, etc.)
- [ ] Remove console.error() calls before production

### 14. Request Deduplication
- [ ] Implement idempotency keys for state-changing operations
- [ ] Prevent duplicate ticket processing on network retry

### 15. Staff Dashboard Improvements
- [ ] Add loading indicators during operations
- [ ] Implement request throttling for frequent operations
- [ ] Add confirmation dialogs for critical actions

## 🔵 LOW PRIORITY - Refactor Next Quarter

### 16. Accessibility
- [ ] Add ARIA live regions for alerts
- [ ] Improve screen reader support
- [ ] Add keyboard navigation

### 17. Performance Monitoring
- [ ] Add performance metrics collection
- [ ] Monitor Core Web Vitals
- [ ] Optimize render performance

### 18. Hardcoded Values Refactor
- [ ] Move timeout values to settings collection:
  - Ticket expiry time (currently 5 minutes)
  - Expiry check interval (currently 30 seconds)
- [ ] Make window numbers configurable
- [ ] Add settings UI for admins

## Testing Checklist

### Security Testing
- [ ] Test Firestore rules are enforced (try unauthorized reads/writes)
- [ ] Test password strength validation
- [ ] Test XSS prevention on name fields
- [ ] Test CSRF protection on state-changing operations

### Functionality Testing
- [ ] Test ticket creation flow end-to-end
- [ ] Test ticket calling with multiple windows
- [ ] Test ticket completion and wait time calculation
- [ ] Test auto-expiry of stale tickets
- [ ] Test role-based access control (student, staff, admin)
- [ ] Test window locking/unlocking
- [ ] Test real-time updates

### Performance Testing
- [ ] Load test with 100+ concurrent users
- [ ] Test with 10,000+ tickets in database
- [ ] Monitor response times and database reads
- [ ] Profile memory usage during long sessions

### Error Handling Testing
- [ ] Simulate network disconnections
- [ ] Test Firebase errors (quota exceeded, etc.)
- [ ] Test auth failures and recovery
- [ ] Verify error messages don't expose sensitive info

## Deployment Steps

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Deploy to Firebase Hosting** (or your chosen platform):
   ```bash
   firebase deploy --only hosting
   ```

3. **Deploy Firestore Rules**:
   ```bash
   firebase deploy --only firestore:rules
   ```

4. **Verify in Production**:
   - Test login with test accounts
   - Verify Firestore security rules are working
   - Monitor error logs
   - Check performance metrics

## Maintenance Tasks

### Weekly
- Review error logs
- Check for unusual login patterns
- Monitor database size and costs

### Monthly
- Review and rotate API keys if necessary
- Update dependencies for security patches
- Audit Firestore rules for effectiveness

### Quarterly
- Security audit
- Performance optimization
- Plan improvements for next iteration

## References

- [Firebase Security Best Practices](https://firebase.google.com/docs/firestore/security/get-started)
- [OWASP Top 10 Web Application Risks](https://owasp.org/www-project-top-ten/)
- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
