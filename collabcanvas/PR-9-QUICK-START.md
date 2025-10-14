# PR #9: Enhanced Password Validation - Quick Start

**Quick validation of the enhanced password requirements feature**

---

## Prerequisites

- Firebase emulators running
- Dev server running
- Browser open to http://localhost:5173

---

## Test Steps (2 Minutes)

### 1. Navigate to Signup
```
1. Open http://localhost:5173
2. If logged in, log out
3. Click "Sign Up" or navigate to signup page
```

---

### 2. Test Password Visibility Toggle

**Click the eye icon:**
```
Step 1: Type "TestPassword123!"
→ Password should be masked as dots

Step 2: Click the eye icon on the right side of password field
→ Password should become visible as plain text
→ Icon should change to "eye with slash"

Step 3: Click the eye icon again
→ Password should be masked again
→ Icon should change back to "eye"
```

**Expected:** Password toggles between visible and hidden smoothly

---

### 3. Test Password Requirements Display

**Type in password field gradually:**
```
Step 1: Type "a"
→ Should see requirements box appear
→ All requirements should be RED with × marks

Step 2: Type "abcdef"
→ "At least 8 characters" still RED (only 6 chars)

Step 3: Type "abcdefgh"
→ "At least 8 characters" turns GREEN with ✓
→ Other requirements still RED

Step 4: Type "Abcdefgh"
→ "One uppercase letter" turns GREEN with ✓

Step 5: Type "Abcdefgh1"
→ "One number" turns GREEN with ✓

Step 6: Type "Abcdefgh1!"
→ "One special character" turns GREEN with ✓
→ ALL requirements now GREEN ✅
```

**Expected:** Each requirement smoothly transitions from red to green as met

---

### 4. Test Password Confirmation

**In confirm password field:**
```
Step 1: Type "Abcdefgh1@" (different from password)
→ See RED "× Passwords do not match" indicator

Step 2: Delete and type "Abcdefgh1!" (matching password)
→ See GREEN "✓ Passwords match" indicator
```

**Expected:** Match indicator updates in real-time, smooth color change

---

### 5. Test Form Validation

**Try to submit with invalid password:**
```
1. Fill username: "TestUser"
2. Fill email: "test@example.com"
3. Fill password: "weak"
4. Fill confirm password: "weak"
5. Click "Sign Up"
```

**Expected:** Toast error "Password does not meet all requirements"

**Try to submit with mismatched passwords:**
```
1. Fill username: "TestUser"
2. Fill email: "test2@example.com"
3. Fill password: "Valid123!"
4. Fill confirm password: "Valid123"
5. Click "Sign Up"
```

**Expected:** Toast error "Passwords do not match"

---

### 6. Test Successful Signup

**Create valid account:**
```
1. Fill username: "ValidUser"
2. Fill email: "valid@example.com"
3. Fill password: "MyPass123!@#"
   → All 4 requirements GREEN
4. Fill confirm password: "MyPass123!@#"
   → Match indicator GREEN
5. Click "Sign Up"
```

**Expected:** 
- Toast success "Account created successfully!"
- Redirected to canvas
- User appears in Firebase console

---

## Visual Checklist

During testing, verify:

- [ ] Eye icon appears in password field (right side)
- [ ] Eye icon toggles password visibility
- [ ] Eye icon changes between "eye" and "eye with slash"
- [ ] Confirm password field also has eye icon
- [ ] Requirements box appears below password field
- [ ] Requirements box has light gray background
- [ ] Each requirement shows ✓ or × icon
- [ ] Unmet requirements are RED (#ef4444)
- [ ] Met requirements are GREEN (#10b981)
- [ ] Colors transition smoothly (not instant)
- [ ] Match indicator appears below confirm password field
- [ ] Match indicator shows correct status
- [ ] Form blocks submission with invalid password
- [ ] Form blocks submission with mismatched passwords
- [ ] Valid submission creates account successfully
- [ ] Google sign-in still works (no password requirements)
- [ ] Login page also has password visibility toggle

---

## Edge Cases (Optional)

**Test if you have time:**

```
1. Paste password
   → Requirements should update immediately

2. Very long password (50+ chars)
   → Should work fine

3. Password with emojis "Test123!😀"
   → Special char requirement met, should work

4. Clear password field
   → Requirements box should disappear

5. Tab navigation
   → Should work smoothly between fields

6. Test on Login page
   → Eye icon should also work on login page
```

---

## Expected Results Summary

✅ **Password visibility toggle works (eye icon)**
✅ **Password requirements displayed clearly**
✅ **Real-time visual feedback works**
✅ **Password confirmation works**
✅ **Form validation prevents invalid submissions**
✅ **Valid passwords create accounts successfully**
✅ **UI is polished and accessible**
✅ **Login page also has visibility toggle**

---

## If Issues Found

1. Check browser console for errors
2. Verify files saved:
   - `src/utils/passwordValidation.ts`
   - `src/components/Auth/PasswordRequirements.tsx`
   - `src/components/Auth/Signup.tsx`
3. Restart dev server if needed
4. Check `PR-9-TEST-PLAN.md` for detailed scenarios
5. Document issue in `PR-9-IMPLEMENTATION-STATUS.md`

---

## Time Estimate

**Full test:** 2 minutes  
**With edge cases:** 5 minutes

---

**Quick validation complete! ✅**

