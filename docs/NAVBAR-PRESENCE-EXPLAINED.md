# NavbarPresence Component Explained

## What is the "Dashboard" You're Looking For?

The "dashboard" is actually the **NavbarPresence** component that appears in the title bar.

## Location
It's in the **blue title bar** at the top of the app, between the title "untitled - Paint" and the settings gear (⚙️) button.

## Visual Layout
```
┌─────────────────────────────────────────────────────────────────┐
│ ●●●  untitled - Paint     [👤👤👤 2]  ⚙️                        │  ← Blue title bar
└─────────────────────────────────────────────────────────────────┘
         ↑                        ↑        ↑
    Window buttons           NavbarPresence  Logout
                            (online users)
```

## What It Shows

### When Online Users Exist (onlineCount > 0)
```
[A][B][+1] 3
 ↑  ↑  ↑   ↑
 │  │  │   └─ Total online count badge (blue)
 │  │  └───── "+1" means 1 more user beyond the 3 shown
 │  └──────── User B's avatar (colored circle with first letter)
 └─────────── User A's avatar (colored circle with first letter)
```

### When No Users Are Online (onlineCount === 0)
```
(nothing displayed - component returns null)
```

**This is why you don't see it!** If no users are detected as online, the NavbarPresence component doesn't render at all.

## Code Reference

Location: `collabcanvas/src/components/Collaboration/NavbarPresence.tsx`

Key logic:
```typescript
if (onlineCount === 0) {
  return null;  // ← Component doesn't render
}
```

## Why You're Not Seeing It

### Scenario 1: You're the only user logged in
**Expected:** Component should show at least "1" (yourself)
**If not showing:** The presence system isn't working - your own presence isn't being written to RTDB

### Scenario 2: Multiple users are logged in
**Expected:** Should show all online users
**If not showing:** RTDB subscription isn't working - can't read other users' presence data

## Component Hierarchy

```
App.tsx
  └─ AppShell
       └─ PaintTitleBar
            └─ NavbarPresence  ← This is what you're looking for
                 └─ Uses usePresence() hook
                      └─ Subscribes to presenceService
                           └─ Reads from Firebase RTDB
```

## What Data It Displays

The NavbarPresence component gets data from the `usePresence()` hook:

```typescript
const { onlineUsers, onlineCount } = usePresence();
//      ↑           ↑
//      │           └─ Total count of online users
//      └───────────── Array of user objects with:
//                     - userId
//                     - username
//                     - color
//                     - online (boolean)
```

This data comes from Firebase Realtime Database at:
```
/sessions/main/users/
  ├─ <userId1>/
  │    └─ presence: { online: true, username: "Alice", color: "#ff0000", ... }
  ├─ <userId2>/
  │    └─ presence: { online: true, username: "Bob", color: "#00ff00", ... }
  └─ <userId3>/
       └─ presence: { online: true, username: "Charlie", color: "#0000ff", ... }
```

## Testing It Works

### Test 1: Single User (You)
1. Login to the app
2. **Expected:** See your own avatar and "1" badge in title bar
3. **If not visible:** Your presence write is failing

### Test 2: Two Users
1. **Browser 1:** Login as User A
2. **Browser 2:** (Incognito) Login as User B
3. **Expected in Browser 1:** See 2 avatars and "2" badge
4. **Expected in Browser 2:** See 2 avatars and "2" badge
5. **If not visible:** Presence subscription/read is failing

### Test 3: Hover for Details
1. Hover over an avatar
2. **Expected:** See tooltip with username

## Where It's Used

The NavbarPresence is imported and displayed in two places:
1. `collabcanvas/src/components/Layout/PaintTitleBar.tsx` (currently active)
2. `collabcanvas/src/components/Layout/Navbar.tsx` (alternative layout)

## Debug: Force Show Component

To test if it's a rendering issue vs. a data issue, you can temporarily force it to show:

```typescript
// In NavbarPresence.tsx, comment out:
// if (onlineCount === 0) {
//   return null;
// }

// This will show the component even with 0 users (for testing only)
```

**Don't commit this change** - it's just for debugging.

## Related Components

1. **NavbarPresence** - Shows avatars in title bar (what you're looking for)
2. **PresenceList** - Shows full list of online users (not currently displayed anywhere)
3. **UserPresenceBadge** - Individual user badge in presence list

## Summary

You're looking for a small component in the title bar that shows:
- Colored circles with user initials
- A blue badge with a number

If you don't see it, it means `onlineCount === 0`, which means:
1. Your presence isn't being written to RTDB (if you're the only user)
2. Other users' presence isn't being read from RTDB (if multiple users are logged in)

The debugging logs we just added will tell us exactly which one it is!

