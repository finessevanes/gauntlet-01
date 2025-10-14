# Post-MVP Backlog

This document tracks known issues, improvements, and polish items that are **not critical for MVP launch**. These may be addressed if time permits before launch, or deferred to post-MVP iterations.

---

## Known Issues (Non-Critical)

### 1. Shape Completion: Multi-Touch Scroll Edge Case
**Status:** Known Issue  
**Priority:** Low  
**Severity:** Minor Visual Glitch

**Description:**
When a user is placing a shape and performs a 3-finger scroll, then lifts ONE finger while keeping 2 fingers on the trackpad, the shape gets committed to the database but remains visually at 50% opacity (preview state) instead of updating to 100% opacity (finalized state).

**Root Cause:**
The `pointerup` event from the single finger lift is being interpreted as "complete shape" even though the user is mid-gesture with other fingers still active.

**Impact:**
- Rare edge case requiring specific gesture
- Shape data is correctly saved
- Only visual state is incorrect
- Does not affect normal shape completion flow

**Potential Fix:**
- Ignore `pointerup` events when multiple touches are still active
- Check if scroll/gesture is in progress before completing shapes
- Track active touch points and only complete when all are released

---

## Future Enhancements

<!-- Add nice-to-have features here -->

---

## Polish Items

<!-- Add UI/UX improvements here -->

---

## Performance Optimizations

<!-- Add performance improvements here -->

