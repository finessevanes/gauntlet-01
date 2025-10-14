# PR #8: Google OAuth Authentication - Test Plan

**Feature:** Google Sign-In support alongside email/password authentication  
**Status:** [ ] Planning  
**Date:** October 14, 2025

---

## Setup Instructions

**Prerequisites:**
- [ ] Firebase emulators running
- [ ] Dev server running
- [ ] Google OAuth provider enabled in Firebase Console
- [ ] 2+ browsers available for multi-user testing

**Commands:**
```bash
# Terminal 1
cd collabcanvas
firebase emulators:start

# Terminal 2  
cd collabcanvas
npm run dev
```

---

## Test Scenarios

### Happy Path Tests

- [ ] **Test 1:** Google Sign-In button appears on login page
  - **Steps:** 
    1. Navigate to login page
    2. Observe available sign-in options
  - **Expected:** 
    - Email/password fields visible
    - "Continue with Google" button visible
    - Button has Google logo/branding
    - Clear visual separation between auth methods

- [ ] **Test 2:** New user signs up with Google
  - **Steps:**
    1. Click "Continue with Google" on login page
    2. Select Google account in popup
    3. Complete Google OAuth flow
  - **Expected:** 
    - Google popup opens correctly
    - User redirected to canvas after auth
    - Username set from Google display name
    - Email captured from Google account
    - Cursor color auto-assigned
    - User profile created in Firestore
    - Toast notification shows "Welcome!"

- [ ] **Test 3:** Existing Google user logs in
  - **Setup:** User previously signed up with Google
  - **Steps:**
    1. Click "Continue with Google"
    2. Select same Google account
  - **Expected:** 
    - User logs in without creating duplicate profile
    - Existing username and cursor color preserved
    - Redirected to canvas
    - Toast shows "Welcome back!"

- [ ] **Test 4:** Google Sign-In on signup page
  - **Steps:**
    1. Navigate to signup page
    2. Click "Continue with Google"
    3. Complete OAuth flow
  - **Expected:** 
    - Same behavior as login page
    - User account created if new
    - No need to enter username manually

---

### Edge Case Tests

- [ ] **Test 5:** User cancels Google popup
  - **Steps:**
    1. Click "Continue with Google"
    2. Close Google popup without selecting account
  - **Expected:** 
    - User remains on login page
    - No error toast shown (cancellation is intentional)
    - Can try again or use email/password

- [ ] **Test 6:** Google OAuth fails (simulated)
  - **Setup:** Simulate network error during OAuth
  - **Steps:**
    1. Disconnect network
    2. Click "Continue with Google"
  - **Expected:** 
    - Error toast: "Failed to sign in with Google"
    - User remains on login page
    - Can retry after reconnection

- [ ] **Test 7:** Google account with no display name
  - **Setup:** Use Google account without display name
  - **Steps:**
    1. Sign in with Google account lacking display name
  - **Expected:** 
    - Username defaults to email prefix (before @)
    - Or prompts user to enter username
    - No app crash

- [ ] **Test 8:** Same email, different providers
  - **Setup:** Create account with email/password first
  - **Steps:**
    1. Sign up with email test@example.com and password
    2. Log out
    3. Try to sign in with Google using test@example.com
  - **Expected:** 
    - Firebase handles account linking appropriately
    - User sees helpful error if linking not allowed
    - Existing email/password account not overwritten

- [ ] **Test 9:** Multiple consecutive Google sign-ins
  - **Steps:**
    1. Sign in with Google as User A
    2. Log out
    3. Sign in with Google as User B
    4. Log out
    5. Sign in again as User A
  - **Expected:** 
    - No duplicate profiles created
    - Each user's data preserved
    - No presence/cursor conflicts

---

### Multi-User Tests

- [ ] **Test 10:** Mixed auth methods - multi-user collaboration
  - **Setup:** 
    - Browser 1: User logs in with email/password
    - Browser 2: User logs in with Google
  - **Steps:**
    1. Both users join canvas
    2. Move cursors
    3. Create shapes
  - **Expected:** 
    - Both users see each other's cursors
    - Presence list shows both users
    - No auth method indicated (seamless)
    - Cursor colors different
    - Shape operations work normally

- [ ] **Test 11:** Google user disconnect/reconnect
  - **Setup:** User authenticated via Google
  - **Steps:**
    1. User A logs in with Google
    2. User B observes presence list
    3. User A closes browser
    4. Wait 5 seconds
    5. User A reopens and signs in with Google
  - **Expected:** 
    - User A goes offline after ~5s
    - User A reappears when reconnecting
    - No duplicate presence entries
    - Cursor tracking resumes immediately

---

### Performance Tests

- [ ] **Test 12:** Google Sign-In latency
  - **Target:** <2 seconds from button click to canvas redirect
  - **How to measure:** Stopwatch or browser DevTools
  - **Steps:**
    1. Click "Continue with Google"
    2. Select account in popup (pre-authorized)
    3. Measure time to canvas
  - **Expected:** 
    - OAuth popup opens in <500ms
    - Redirect to canvas in <2s total
    - No loading screen glitches

- [ ] **Test 13:** User profile creation time (Google)
  - **Target:** <1 second for Firestore write
  - **How to measure:** Firebase Emulator UI logs
  - **Steps:**
    1. Sign in with new Google account
    2. Check Emulator UI for Firestore writes
  - **Expected:** 
    - User profile created in Firestore
    - Contains: uid, username, email, cursorColor, createdAt
    - Write completes in <1s

---

### Error Handling Tests

- [ ] **Test 14:** Popup blocked by browser
  - **Setup:** Enable popup blocker in browser
  - **Steps:**
    1. Click "Continue with Google"
    2. Observe popup blocker notification
  - **Expected:** 
    - User sees browser's popup blocked notification
    - Error toast: "Please allow popups to sign in with Google"
    - Instructions to retry

- [ ] **Test 15:** User already signed in with Google in another tab
  - **Setup:** User signed in to Google in another browser tab
  - **Steps:**
    1. Click "Continue with Google"
    2. Google popup auto-selects signed-in account
  - **Expected:** 
    - Seamless sign-in (no account selection needed)
    - Fast authentication (<1s)

- [ ] **Test 16:** Firestore profile creation fails
  - **Setup:** Simulate Firestore write failure
  - **Steps:**
    1. Stop Firestore emulator mid-auth
    2. Complete Google sign-in
  - **Expected:** 
    - Error toast: "Failed to create user profile"
    - User not stuck in broken state
    - Can retry sign-in

---

### UI/UX Tests

- [ ] **Test 17:** Google button styling
  - **Steps:**
    1. View login page
    2. Inspect Google Sign-In button
  - **Expected:** 
    - Follows Google branding guidelines
    - Clear Google logo/icon
    - Button text: "Continue with Google"
    - Accessible (keyboard navigation, ARIA labels)
    - Hover/active states work

- [ ] **Test 18:** Loading state during Google auth
  - **Steps:**
    1. Click "Continue with Google"
    2. Observe button state before popup
  - **Expected:** 
    - Button shows loading state (spinner or "Signing in...")
    - Button disabled during auth
    - Re-enables if cancelled or error

- [ ] **Test 19:** Visual separator between auth methods
  - **Steps:**
    1. View login page
    2. Observe layout
  - **Expected:** 
    - Clear "OR" divider between email/password and Google
    - Visually balanced layout
    - Not cluttered or confusing

---

## Success Criteria

- [ ] All happy path tests pass
- [ ] All edge cases handled gracefully
- [ ] Multi-user scenarios work with mixed auth methods
- [ ] Google Sign-In completes in <2 seconds
- [ ] User profile created correctly for Google users
- [ ] No console errors during auth flow
- [ ] No linter errors
- [ ] Existing email/password auth still works
- [ ] Code follows existing service layer pattern
- [ ] Firebase security rules updated if needed

---

## Browser Compatibility

Test Google Sign-In in:
- [ ] Chrome (primary)
- [ ] Firefox
- [ ] Safari (note: popup behavior may differ)
- [ ] Edge

---

## Firebase Configuration Check

### Emulator Configuration
1. Open Emulator UI: `http://localhost:4000`
2. Navigate to Authentication tab
3. Verify Google provider enabled

### Firestore Schema Verification
Check that Google-authenticated users create same profile structure:
```json
{
  "users/{userId}": {
    "uid": "google_user_id",
    "username": "John Doe",
    "email": "john@gmail.com",
    "cursorColor": "#3b82f6",
    "createdAt": "2025-10-14T12:00:00Z"
  }
}
```

---

## Common Issues & Debugging

### Issue: Google popup doesn't open
**Debug:**
- Check browser popup blocker settings
- Verify Firebase config includes correct OAuth settings
- Check console for errors

### Issue: "Auth domain not authorized"
**Debug:**
- Verify authDomain in firebase.ts matches Firebase Console
- Check OAuth redirect URIs in Google Cloud Console
- Ensure localhost:5173 is authorized

### Issue: User profile not created
**Debug:**
- Check Firestore emulator logs
- Verify Firestore rules allow user profile writes
- Check authService.ts createUserProfile logic

### Issue: Popup closes but user not logged in
**Debug:**
- Check for errors in console
- Verify Google account selected in popup
- Check Firebase Auth emulator logs

---

## Test Results Summary

**Total Tests:** 19  
**Passed:** 0 ✅  
**Failed:** 0 ❌  
**Blocked:** 0 ⏸️  

**Overall Status:** [ ] Not Started

---

## Sign-Off Criteria

- [ ] All 19 tests pass
- [ ] No regression in existing email/password auth
- [ ] Google Sign-In works in all major browsers
- [ ] Performance targets met (<2s auth flow)
- [ ] User profiles created correctly
- [ ] Multi-user collaboration works with mixed auth methods
- [ ] Code reviewed and approved
- [ ] Documentation updated

---

**Last Updated:** October 14, 2025  
**Tester:** [Your Name]  
**Status:** Ready for Implementation

