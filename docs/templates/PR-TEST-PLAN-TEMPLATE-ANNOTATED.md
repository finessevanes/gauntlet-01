# PR #N: [Feature Name] - Test Plan

**Feature:** [Feature Name]  
**Status:** [ ] Not Started | [ ] In Progress | [x] Complete  
**Tested By:** [Your Name]  
**Date:** [Date]

---

## Setup Instructions

<!-- What needs to be running before testing? -->

**Prerequisites:**
- [ ] Firebase emulators running
- [ ] Dev server running
- [ ] [Any other requirements]

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
<!-- Basic functionality - does the main feature work? -->

- [ ] **Test 1:** [Test name]
  - **Steps:** 
    1. [Action 1]
    2. [Action 2]
  - **Expected:** [What should happen]
  - **Result:** ✅ Pass | ❌ Fail | ⏸️ Blocked

- [ ] **Test 2:** [Test name]
  - **Steps:**
    1. [Action 1]
  - **Expected:** [What should happen]
  - **Result:**

---

### Edge Case Tests
<!-- What happens with unusual inputs or scenarios? -->

- [ ] **Test 3:** [Edge case name]
  - **Setup:** [Special conditions needed]
  - **Steps:**
    1. [Action that triggers edge case]
  - **Expected:** [How it should handle it]
  - **Result:**

---

### Multi-User Tests
<!-- Test with 2+ browser windows -->

- [ ] **Test 4:** [Multi-user scenario]
  - **Setup:** 
    - Browser 1 (Incognito): User A
    - Browser 2 (Normal): User B
  - **Steps:**
    1. **User A:** [Action]
    2. **User B:** [Action]
    3. **User A:** [Verify]
  - **Expected:** [What both users should see]
  - **Result:**

---

### Performance Tests
<!-- Does it meet speed/FPS targets? -->

- [ ] **Test 5:** [Performance metric]
  - **Target:** [Specific number - FPS, latency, etc.]
  - **How to measure:** [Tool or observation method]
  - **Steps:**
    1. [Action that tests performance]
  - **Expected:** [Target met]
  - **Actual:** [Measured result]
  - **Result:**

---

### Error Handling Tests
<!-- What happens when things go wrong? -->

- [ ] **Test 6:** [Error scenario]
  - **Setup:** [How to trigger error]
  - **Steps:**
    1. [Action that should fail gracefully]
  - **Expected:** [Error message or fallback behavior]
  - **Result:**

---

## Success Criteria

<!-- What needs to be true to consider this PR complete? -->

- [ ] All happy path tests pass
- [ ] All edge cases handled gracefully
- [ ] Multi-user scenarios work without conflicts
- [ ] Performance targets met
- [ ] Errors display user-friendly messages
- [ ] No console errors
- [ ] No linter errors
- [ ] Code follows existing patterns

---

## Test Results Summary

**Total Tests:** [N]  
**Passed:** [N] ✅  
**Failed:** [N] ❌  
**Blocked:** [N] ⏸️  

**Overall Status:** ✅ All Pass | ⚠️ Some Failures | ❌ Blocked

---

## Issues Found

<!-- Document any bugs discovered during testing -->

### Issue 1: [Bug name]
- **Severity:** Low | Medium | High | Critical
- **Description:** [What's wrong]
- **Reproduce:**
  1. [Steps]
- **Expected:** [What should happen]
- **Actual:** [What actually happens]
- **Status:** [ ] Open | [ ] Fixed | [ ] Won't Fix

---

## Notes

<!-- Any observations, patterns, or insights from testing -->

- [Note 1]
- [Note 2]

