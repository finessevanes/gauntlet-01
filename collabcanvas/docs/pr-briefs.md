# You've Got Mail — PR Briefs

**Project:** Postcard creator with Paint tools + real-time collaboration + physical mailing service

**Business Model:** Freemium (1 free canvas) → $20 for 3 postcard credits

---

## Phase 1: Paint Tools (MVP Drawing)

### PR #1: Pencil Tool
**Brief:** Add free-form drawing tool to enable users to draw custom lines, signatures, and sketches on postcards.

**Deliverables:**
- Pencil tool button in toolbar (✏️ icon)
- Click-and-drag drawing interaction
- New `path` shape type in Firestore
- SVG path rendering with Konva Line component
- Line smoothing algorithm (reduce excessive points)
- Real-time drawing preview
- Support for stroke width (inherited from width selector)
- AI can call `createPath()` with point arrays

**Dependencies:** None

**Complexity:** Medium-High (~3-4 hours)

---

### PR #2: Spray Paint Tool
**Brief:** Add spray paint tool for creating clouds, textures, and airbrushed effects with particle-based rendering.

**Deliverables:**
- Spray paint tool button in toolbar (💨 icon)
- Click-and-drag to spray particles
- New `spray` shape type (stores particle coordinates)
- Particle distribution algorithm (random scatter in circular area)
- Spray radius and density controls
- Real-time spray preview
- AI can call `createSpray()` for natural effects

**Dependencies:** None (but works better after PR #5 for size controls)

**Complexity:** Medium (~2-3 hours)

---

### PR #3: Fill Bucket Tool
**Brief:** Add flood-fill tool to quickly fill enclosed areas and backgrounds with color.

**Deliverables:**
- Fill bucket tool button in toolbar (🪣 icon)
- Click to flood-fill closed regions
- Flood-fill algorithm implementation
- Fill tolerance slider (color matching threshold)
- Works on shapes and canvas background
- AI can call `fillArea(x, y, color)`

**Dependencies:** Canvas needs to be rasterized for pixel-based flood fill

**Complexity:** Medium-High (~4-5 hours)

---

## Phase 2: AI Features (Core Requirement)

### PR #4: Clippy-Style Chat UI
**Brief:** Add AI assistant chat interface with original Clippy character for prompt-based drawing.

**Deliverables:**
- Chat drawer/panel (bottom of screen or sidebar)
- Clippy character animation/image (use `docs/images/clippy-assistant.png`)
- Text input for user prompts
- Message history display
- Loading states during AI processing
- Success/error message display
- Keyboard shortcut to open chat (Cmd+K)

**Dependencies:** None (UI only)

**Complexity:** Medium (~3-4 hours)

---

### PR #5: AI Drawing Prompts + Templates
**Brief:** Integrate AI API (OpenAI/Claude) to interpret prompts and create postcard scenes.

**Deliverables:**
- AI service integration (OpenAI/Claude API)
- Prompt parsing ("draw a dog on a boat")
- Shape creation from AI commands
- Pre-built templates (house, tree, car, person, dog, boat)
- AI uses existing tools: createShape, createPath, createSpray
- Multi-object composition logic ("draw a red house with a tree" → multiple shapes)
- Error handling for invalid prompts
- AI can use spray tool for clouds/textures

**Dependencies:** PR #1-3 (drawing tools help but not required), PR #4 (chat UI)

**Complexity:** High (~6-8 hours)

---

## Phase 3: Canvas Management

### PR #6: Canvas Size & Aspect Ratio
**Brief:** Change canvas from 5000×5000 to 1200×1800 (4×6 postcard at 300 DPI) with aspect ratio lock.

**Deliverables:**
- Update `CANVAS_WIDTH = 1200` and `CANVAS_HEIGHT = 1800` in constants
- Adjust default zoom/pan to fit postcard in viewport
- Update background grid to match postcard dimensions
- Visual postcard border/guides
- Update existing shapes if any (migration)

**Dependencies:** None (but should be done early as it affects all other features)

**Complexity:** Low (~1 hour)

---

### PR #7: Stroke Width Selector
**Brief:** Add brush size picker to control line thickness for pencil, spray, and shape outlines.

**Deliverables:**
- Stroke width selector in toolbar (1px, 3px, 5px, 8px options)
- Visual indicator of current width
- Apply to pencil tool paths
- Apply to shape outlines (optional)
- Store width with each shape
- AI can specify stroke width in shape creation

**Dependencies:** PR #1 (Pencil tool benefits most)

**Complexity:** Low-Medium (~2 hours)

---

### PR #8: Canvas Sharing + Collaboration
**Brief:** Add shareable links so users can invite friends to draw together in real-time.

**Deliverables:**
- Generate shareable link for canvas
- "Share" button in navbar
- Copy link to clipboard
- Anyone with link can edit canvas (no permissions yet)
- Show "Shared via link" indicator
- Track collaborators on canvas

**Dependencies:** None (collaboration already works, just needs sharing UI)

**Complexity:** Low (~1-2 hours)

---

## Phase 4: Business Logic (Stretch Goals)

### PR #9: Canvas Limit (Free User Restriction)
**Brief:** Enforce 1 canvas limit for free users to prepare for paid tier.

**Deliverables:**
- Add `canvasLimit` field to user schema (default: 1)
- Track user's canvas count
- Block canvas creation if limit reached
- Show "Upgrade to create more canvases" modal
- Canvas list/gallery view (shows user's canvases)
- Canvas naming and renaming

**Dependencies:** None

**Complexity:** Medium (~2-3 hours)

---

### PR #10: Stripe Integration + Credits System
**Brief:** Add Stripe payment flow ($20) and postcard credit tracking (3 credits per purchase).

**Deliverables:**
- Stripe Checkout integration (test mode)
- Payment button/modal ("Buy 3 Postcards - $20")
- Add `postcardCredits` field to user schema
- Increment credits after successful payment
- Stripe webhook handler (payment success/failure)
- Display remaining credits in user dashboard
- Add `stripeCustomerId` to user schema

**Dependencies:** Firebase Functions for webhook handling

**Complexity:** Medium-High (~4-5 hours)

---

### PR #11: Send Postcard Flow + Order Form
**Brief:** Add "Send Postcard" button and recipient address form for paid users.

**Deliverables:**
- "Send Postcard" button (only visible if user has credits)
- Order form modal:
  - Recipient: name, address, city, state, zip (US only)
  - Sender: name
- US address validation
- Form submission creates order record
- Decrement user's postcard credits
- Confirmation screen ("Your postcard will be mailed!")

**Dependencies:** PR #10 (needs credits system)

**Complexity:** Medium (~3 hours)

---

### PR #12: Canvas Export to PNG
**Brief:** Export current canvas as 1200×1800 PNG image for printing.

**Deliverables:**
- `exportCanvasToPNG()` function
- Renders all shapes to 1200×1800 image
- Upload PNG to Firebase Storage
- Return image URL for order record
- Handle transparency and layer ordering

**Dependencies:** PR #6 (needs correct canvas dimensions)

**Complexity:** Medium (~2-3 hours)

---

### PR #13: Postcard Back Template Generator
**Brief:** Generate postcard back image with address layout and "You've Got Mail" branding.

**Deliverables:**
- Use template from `docs/images/postcard-back-template.png`
- Overlay recipient address on template
- Overlay sender name
- Generate final 1200×1800 back image
- Combine front (canvas export) + back into order package

**Dependencies:** PR #12 (needs PNG export)

**Complexity:** Low-Medium (~2 hours)

---

### PR #14: Email to Owner (Order Notifications)
**Brief:** Send email to vanessa.mercado24@gmail.com with postcard images and order details.

**Deliverables:**
- Firebase Email Extension setup (or SendGrid)
- Email template for new orders
- Attachments: postcard front PNG, postcard back PNG
- Email body includes:
  - Order ID
  - Recipient: name, full address
  - Sender: name
  - Order timestamp
  - User email (for communication)
- Trigger email on order creation

**Dependencies:** PR #12, PR #13 (needs PNG exports)

**Complexity:** Medium (~2-3 hours)

---

### PR #15: User Email Notifications
**Brief:** Send confirmation and "postcard mailed" emails to users.

**Deliverables:**
- Email #1: Order confirmation (immediate)
  - "We received your order!"
  - Order details, expected mail time
- Email #2: Postcard mailed notification (after admin action)
  - "Your postcard has been sent!"
  - Includes image of postcard
- Email templates with You've Got Mail branding

**Dependencies:** PR #14 (uses same email service)

**Complexity:** Low-Medium (~2 hours)

---

### PR #16: Order Tracking + Admin Actions
**Brief:** Add order database and admin interface for tracking/marking orders as mailed.

**Deliverables:**
- `orders` Firestore collection
- Order schema: status (pending/mailed/cancelled), timestamps, etc.
- Admin page/modal to view pending orders
- "Mark as Mailed" button (owner only)
- Trigger user notification email on status change
- Order history for users (optional)

**Dependencies:** PR #11 (order creation)

**Complexity:** Medium (~3 hours)

---

## Priority Order for School Project

**Core Requirements (Must Complete):**
1. PR #1: Pencil tool ← **START HERE** (core drawing feature)
2. PR #2: Spray paint tool (for clouds/textures)
3. PR #3: Fill bucket tool (complete Paint toolset)
4. PR #4: Clippy chat UI ← **REQUIRED FOR DEMO** (school project needs AI)
5. PR #5: AI drawing prompts ← **REQUIRED FOR DEMO** (main feature)
6. PR #6: Canvas size (polish, can be done anytime)
7. PR #7: Stroke width selector (polish)
8. PR #8: Canvas sharing (collaboration demo)

**Stretch Goals (If Time Permits):**
9. PR #9: Canvas limit (nice-to-have)
10. PR #10: Stripe integration (monetization)
11. PR #11: Send Postcard form (full business flow)
12. PR #12: PNG export (for physical postcards)
13. PR #13: Postcard back template
14. PR #14: Email to owner
15. PR #15: User emails
16. PR #16: Order tracking

---

**Total Core Time Estimate:** ~20-25 hours

**Total with Stretch Goals:** ~60-70 hours

**Recommended Sprint Plan (School Project):**
- **Week 1:** PRs #1-3 (Paint tools) + PR #6 (canvas size)
- **Week 2:** PRs #4-5 (AI chat + drawing) ← **Focus here for demo**
- **Week 3:** PRs #7-8 (polish + sharing)
- **Week 4:** Stretch goals if time (PRs #9-16)

---

## Notes for Agents Creating PRDs

When creating a detailed PRD from these briefs using `docs/prd-template.md`:

1. Reference the full feature context in `docs/prd-full-features.md`
2. Follow the existing codebase patterns (see Canvas.tsx, CanvasContext.tsx)
3. All new shapes must sync in real-time (<100ms)
4. All drawing must be 60 FPS smooth
5. Use Konva.js for canvas rendering
6. Store all shapes in Firestore `canvases/main/shapes/` collection
7. AI service calls should be deterministic and testable
8. Include comprehensive test scenarios (manual + automated)
9. Payment flows should use Stripe test mode first
10. All emails should be templated and branded

---

**Last Updated:** 2025-10-18

