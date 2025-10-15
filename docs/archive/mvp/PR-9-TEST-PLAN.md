# PR #9: Enhanced Password Validation - Test Plan

**Feature:** Enhanced Password Requirements with Dynamic UI Feedback  
**Status:** [x] In Progress  
**Tested By:** AI Assistant  
**Date:** October 14, 2025

---

## Setup Instructions

1. Start Firebase emulators: `firebase emulators:start`
2. Start dev server: `npm run dev`
3. Navigate to signup page
4. Test in multiple browsers for UI consistency

---

## Test Scenarios

### Happy Path Tests

#### Test 1.1: Valid Password Creation
- **Steps:**
  1. Navigate to signup page
  2. Enter username: "TestUser"
  3. Enter email: "test@example.com"
  4. Enter password: "Test123!@#"
  5. Enter confirm password: "Test123!@#"
  6. Observe all requirement indicators turn green
  7. Click "Sign Up"
- **Expected:** Account created successfully
- **Status:** [ ] Pass | [ ] Fail

#### Test 1.2: Password Requirements UI Updates Dynamically
- **Steps:**
  1. Focus on password field
  2. Type "a" - observe min length indicator (red)
  3. Type "abcdef" - observe min length turns green, others red
  4. Type "Abcdef" - observe uppercase turns green
  5. Type "Abcdef1" - observe number turns green
  6. Type "Abcdef1!" - observe special char turns green
- **Expected:** Each requirement turns green as satisfied
- **Status:** [ ] Pass | [ ] Fail

#### Test 1.3: Password Confirmation Match
- **Steps:**
  1. Enter password: "Test123!@#"
  2. Enter confirm password: "Test123!@#"
  3. Observe match indicator
  4. Submit form
- **Expected:** Passwords match, form submits successfully
- **Status:** [ ] Pass | [ ] Fail

---

### Edge Case Tests

#### Test 2.1: Password Mismatch
- **Steps:**
  1. Enter password: "Test123!@#"
  2. Enter confirm password: "Test123!@"
  3. Attempt to submit
- **Expected:** Error message "Passwords do not match"
- **Status:** [ ] Pass | [ ] Fail

#### Test 2.2: Minimum Length Exactly Met
- **Steps:**
  1. Enter password: "Test12!"
  2. Verify length indicator (8 characters minimum)
- **Expected:** Length requirement turns green
- **Status:** [ ] Pass | [ ] Fail

#### Test 2.3: Password Without Special Character
- **Steps:**
  1. Enter password: "Test1234"
  2. Attempt to submit
- **Expected:** Special character requirement shows red, form doesn't submit
- **Status:** [ ] Pass | [ ] Fail

#### Test 2.4: Password Without Number
- **Steps:**
  1. Enter password: "TestTest!"
  2. Attempt to submit
- **Expected:** Number requirement shows red, form doesn't submit
- **Status:** [ ] Pass | [ ] Fail

#### Test 2.5: Password Without Uppercase
- **Steps:**
  1. Enter password: "test1234!"
  2. Attempt to submit
- **Expected:** Uppercase requirement shows red, form doesn't submit
- **Status:** [ ] Pass | [ ] Fail

#### Test 2.6: Password With Only Special Characters
- **Steps:**
  1. Enter password: "!@#$%^&*()"
  2. Check requirements
- **Expected:** Shows special char green, others red
- **Status:** [ ] Pass | [ ] Fail

#### Test 2.7: Very Long Password
- **Steps:**
  1. Enter password: 100+ character string with all requirements
  2. Submit form
- **Expected:** Form accepts and creates account
- **Status:** [ ] Pass | [ ] Fail

#### Test 2.8: Paste Password
- **Steps:**
  1. Copy valid password: "Test123!@#"
  2. Paste into password field
  3. Observe requirements update
- **Expected:** All requirements turn green immediately
- **Status:** [ ] Pass | [ ] Fail

---

### UI/UX Tests

#### Test 3.1: Requirements Visibility
- **Steps:**
  1. Navigate to signup page
  2. Observe password requirements display
- **Expected:** Requirements clearly visible below password field
- **Status:** [ ] Pass | [ ] Fail

#### Test 3.2: Color Contrast
- **Steps:**
  1. Check red (unmet) requirement text
  2. Check green (met) requirement text
- **Expected:** Both colors are accessible (WCAG AA compliant)
- **Status:** [ ] Pass | [ ] Fail

#### Test 3.3: Requirements List Formatting
- **Steps:**
  1. View password requirements list
- **Expected:** 
  - Checkmark/X icon for each requirement
  - Clear requirement text
  - Smooth color transitions
- **Status:** [ ] Pass | [ ] Fail

#### Test 3.4: Mobile Responsiveness
- **Steps:**
  1. Open on mobile viewport (375px width)
  2. Test password entry and requirements display
- **Expected:** Requirements display properly on small screens
- **Status:** [ ] Pass | [ ] Fail

---

### Error Handling Tests

#### Test 4.1: Empty Password Submission
- **Steps:**
  1. Fill username and email
  2. Leave password empty
  3. Submit form
- **Expected:** Error "Please fill in all fields"
- **Status:** [ ] Pass | [ ] Fail

#### Test 4.2: Empty Confirm Password
- **Steps:**
  1. Fill username, email, password
  2. Leave confirm password empty
  3. Submit form
- **Expected:** Error "Please fill in all fields"
- **Status:** [ ] Pass | [ ] Fail

#### Test 4.3: Firebase Weak Password Error
- **Steps:**
  1. (Hypothetically) bypass client-side validation
  2. Submit weak password to Firebase
- **Expected:** Firebase catches and returns appropriate error
- **Status:** [ ] Pass | [ ] Fail

---

### Integration Tests

#### Test 5.1: Complete Signup Flow
- **Steps:**
  1. Enter username: "PasswordTestUser"
  2. Enter email: "password-test@example.com"
  3. Enter password: "MyPass123!@#"
  4. Confirm password: "MyPass123!@#"
  5. Submit form
  6. Verify account created in Firestore
- **Expected:** 
  - User document created in Firestore
  - User can log in with new credentials
- **Status:** [ ] Pass | [ ] Fail

#### Test 5.2: Existing Email with New Password Requirements
- **Steps:**
  1. Create account with email: "existing@example.com"
  2. Log out
  3. Attempt signup again with same email
- **Expected:** "This email is already registered" error
- **Status:** [ ] Pass | [ ] Fail

---

## Success Criteria

- [ ] All password requirements enforced:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one number
  - At least one special character
- [ ] Dynamic UI feedback:
  - Requirements update in real-time
  - Green checkmark for met requirements
  - Red X for unmet requirements
  - Smooth transitions
- [ ] Password confirmation:
  - Separate confirm password field
  - Match validation
  - Clear error messages
- [ ] Form validation:
  - Cannot submit with invalid password
  - Cannot submit with mismatched passwords
  - Clear error messages
- [ ] No regression:
  - Google sign-in still works
  - Login page unaffected
  - Existing functionality preserved

---

## Test Results Summary

**Total Tests:** 20  
**Passed:** 0  
**Failed:** 0  
**Blocked:** 0  

---

## Issues Found

(To be filled during testing)

---

## Notes

- Password requirements follow industry standard conventions
- Special characters: `!@#$%^&*()_+-=[]{}|;:,.<>?`
- Requirements are both client-side and server-side validated
- UI provides immediate, actionable feedback to users

