# PRD: Advanced AI Features (Shape Generation) — End-to-End Delivery

**Feature**: AI Shape Generation

**Version**: 1.0

**Status**: Ready for Development

**Agent**: Delilah

**Target Release**: Phase 4

**Links**: [Action Plan], [Test Plan], [Designs], [Tracking Issue], [Agent TODOs] (`docs/todos/pr-17-todo.md`)

---

## 1. Summary

Enhance AI capabilities to generate and modify shapes on the canvas based on natural language prompts from users. Users can ask the AI assistant to "draw a red circle in the center", "make the circle bigger", or "arrange these shapes in a row" and the AI will parse the request, create or modify shapes with correct parameters, and provide visual feedback in the chat interface.

---

## 2. Problem & Goals

- **User Problem**: Users want to quickly create shapes through natural language commands rather than manually drawing each shape
- **Why Now**: Phase 4 enhancement to make the AI assistant more interactive and useful for canvas creation
- **Goals** (ordered, measurable):
  - [ ] G1 — Users can generate shapes via natural language prompts in AI chat
  - [ ] G2 — AI-generated shapes appear on canvas in real-time (<100ms sync)
  - [ ] G3 — Chat interface shows shape creation confirmations and feedback

---

## 3. Non-Goals / Out of Scope

- [ ] Not doing complex multi-shape compositions (e.g., "draw a house with windows") - focus on single shapes
- [ ] Not doing advanced shape manipulation (rotation, complex transforms) - basic modifications only
- [ ] Not doing professional image generation - any drawing/image generation uses pencil tool and should look like a child drew it
- [ ] Not doing complex layout algorithms - basic arrangement using existing group functionality

---

## 4. Success Metrics

- **User-visible**: Users can generate shapes via chat in <5 seconds from prompt to canvas
- **System**: <100ms sync peer-to-peer, AI response <3 seconds, shape creation <2 seconds
- **Quality**: 0 blocking bugs, all acceptance gates pass, works with existing AI chat functionality

---

## 5. Users & Stories

- As a **designer**, I want to quickly create shapes via text commands so that I can rapidly prototype ideas
- As a **collaborator**, I want to see AI-generated shapes appear in real-time so that I can understand what others are creating
- As a **user**, I want clear feedback when shapes are created so that I know my AI commands worked
- As a **power user**, I want to specify exact parameters (color, size, position) so that I can create precise shapes

---

## 6. Experience Specification (UX)

- **Entry points and flows**: AI chat input field, type natural language prompt, press Enter or click send
- **Visual behavior**: AI responds with confirmation message, shape appears on canvas, chat shows "Created [shape type] at [position]"
- **Loading/disabled/locked states**: "AI is creating shapes..." indicator during processing, disabled input during AI processing
- **Accessibility**: Screen reader announces shape creation, keyboard navigation works
- **Performance**: AI response <3 seconds, shape creation <2 seconds, network sync <100ms

---

## 7. Functional Requirements (Must/Should)

- **MUST**: Parse natural language prompts for shape creation and modification (circle, rectangle, triangle, text)
- **MUST**: Extract shape parameters (color, size, position) from prompts
- **MUST**: Generate and modify shapes using existing CanvasService methods
- **MUST**: Support basic shape modifications (resize, move, color changes)
- **MUST**: Show confirmation messages in chat interface
- **MUST**: Real-time sync to other clients in <100ms
- **SHOULD**: Support common color names (red, blue, green, etc.)
- **SHOULD**: Support position keywords (center, top-left, bottom-right, etc.)
- **SHOULD**: Support basic layout commands using existing group functionality
- **SHOULD**: Handle creative drawing requests (animals, faces, objects) using pencil tool
- **SHOULD**: Handle ambiguous prompts with clarification requests

**Acceptance gates embedded per requirement:**

- [Gate] When User A types "draw a red circle" → AI creates red circle on canvas and shows confirmation in chat within 5 seconds
- [Gate] When User A types "make the circle bigger" → AI resizes existing circle and shows confirmation in chat within 5 seconds
- [Gate] Error case: Invalid prompts show helpful error message; no partial shape creation/modification
- [Gate] Performance: AI response <3 seconds, shape creation/modification <2 seconds, sync <100ms

---

## 8. Data Model

No new data model changes - uses existing shape schema:

```typescript
{
  id: string,
  type: "rectangle | circle | triangle | text",
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  text?: string, // for text shapes
  createdBy: string,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  zIndex: number,
  lockedBy?: string,
  lockedAt?: Timestamp
}
```

- **Validation rules**: Same as existing shapes - valid coordinates, colors, dimensions
- **Indexing/queries**: Uses existing shape queries and real-time sync

---

## 9. API / Service Contracts

Extend existing AIService with shape generation capabilities:

```typescript
// AIService additions
interface ShapeGenerationRequest {
  prompt: string,
  canvasId: string,
  userId: string
}

interface ShapeGenerationResponse {
  success: boolean,
  shapesCreated: Array<{
    type: string,
    x: number,
    y: number,
    width: number,
    height: number,
    color: string,
    text?: string
  }>,
  message: string,
  error?: string
}

// New method
generateShapesFromPrompt(request: ShapeGenerationRequest): Promise<ShapeGenerationResponse>

// Enhanced system prompt for shape generation
getShapeGenerationPrompt(canvasState: Shape[]): string
```

- **Pre-conditions**: User authenticated, valid canvas context, AI service available
- **Post-conditions**: Shapes created in Firestore, chat message added, real-time sync triggered
- **Error handling**: Invalid prompts return helpful error messages, network errors retry once

---

## 10. UI Components to Create/Modify

- `src/services/aiService.ts` — Add shape generation prompt parsing and execution
- `src/components/Chat/ChatInterface.tsx` — Add shape creation confirmation messages
- `src/utils/aiPrompts.ts` — Add shape generation system prompts and parsing logic
- `src/services/canvasService.ts` — Ensure existing createShape methods work with AI-generated parameters
- `src/hooks/useAI.ts` — Add shape generation state and error handling

---

## 11. Integration Points

- Uses existing `CanvasService` for shape creation
- Extends existing `AIService` with shape generation capabilities
- Integrates with existing chat interface for user feedback
- Uses existing Firestore real-time sync for shape propagation

---

## 12. Test Plan & Acceptance Gates

Define BEFORE implementation. Use checkboxes; each sub-task must have a gate.

- **Happy Path**
  - [ ] User types "draw a red circle" → AI creates red circle on canvas
  - [ ] User types "make the circle bigger" → AI resizes existing circle
  - [ ] Gate: Shape appears/modifies in <5 seconds total (AI + creation/modification + sync)
  - [ ] Gate: Chat shows confirmation message
  - [ ] Gate: Other users see shape changes in real-time

- **Edge Cases**
  - [ ] Ambiguous prompts ("draw a circle") → AI asks for clarification
  - [ ] Invalid prompts ("draw a unicorn") → AI shows helpful error message
  - [ ] Network errors → AI shows retry message
  - [ ] Creative drawing prompts ("draw a smiley face", "draw a dog", "draw a cat") → AI uses pencil tool to create child-like drawings

- **Multi-User**
  - [ ] User A generates shape → User B sees shape in <100ms
  - [ ] Multiple users generate shapes simultaneously → no conflicts
  - [ ] AI responses don't interfere with manual shape creation

- **Performance**
  - [ ] AI response <3 seconds for simple prompts
  - [ ] Shape creation <2 seconds after AI response
  - [ ] Works with 50+ existing shapes on canvas

---

## 13. Definition of Done (End-to-End)

- [ ] AIService shape generation methods implemented and unit-tested
- [ ] Chat interface shows shape creation confirmations
- [ ] Real-time sync verified across 2 browsers (<100ms)
- [ ] AI prompt parsing handles common shape requests
- [ ] Test Plan checkboxes all pass
- [ ] Integration with existing AI chat functionality
- [ ] Error handling for invalid prompts and network issues

---

## 14. Risks & Mitigations

- **Risk**: AI prompt parsing accuracy → **Mitigation**: Start with simple, common patterns; add more complex parsing iteratively
- **Risk**: AI response latency → **Mitigation**: Optimize prompts, consider response caching for common requests
- **Risk**: Shape parameter extraction errors → **Mitigation**: Provide clear error messages, fallback to default values
- **Risk**: Integration with existing AI chat → **Mitigation**: Extend existing AIService rather than replacing it

---

## 15. Rollout & Telemetry

- **Feature flag**: No (direct release)
- **Metrics**: Shape generation usage, AI response times, user satisfaction with generated shapes
- **Manual validation steps post-deploy**: Test common prompts, verify real-time sync, check error handling

---

## 16. Open Questions

- Q1: Should AI-generated shapes have a different visual indicator (e.g., different border)?
- Q2: What's the maximum complexity of prompts we should support?
- Q3: Should we log AI-generated shapes differently for analytics?

---

## 17. Appendix: Out-of-Scope Backlog

Items explicitly deferred for future work with brief rationale.

- [ ] Complex multi-shape compositions - requires advanced AI prompt parsing
- [ ] Shape modification via AI - requires shape selection and editing logic
- [ ] AI-powered layout suggestions - requires layout algorithm integration
- [ ] Image generation - requires different AI model and integration
- [ ] Voice commands - requires speech-to-text integration

---

## Preflight Questionnaire (Complete Before Generating This PRD)

Answer succinctly; these drive the vertical slice and acceptance gates.

1. **What is the smallest end-to-end user outcome we must deliver in this PR?**
   - User can type "draw a red circle" in AI chat and see a red circle appear on canvas

2. **Who is the primary user and what is their critical action?**
   - Designer/creator who wants to quickly generate shapes via natural language

3. **Must-have vs nice-to-have: what gets cut first if time tight?**
   - Must-have: Basic shape generation (circle, rectangle, triangle), real-time sync, chat feedback
   - Nice-to-have: Complex positioning, advanced color names, multi-shape compositions

4. **Real-time collaboration requirements (peers, <100ms sync)?**
   - Yes, AI-generated shapes must sync to all collaborators in <100ms

5. **Performance constraints (FPS, shape count, latency targets)?**
   - AI response <3 seconds, shape creation <2 seconds, sync <100ms, works with 50+ existing shapes

6. **Error/edge cases we must handle (validation, conflicts, offline)?**
   - Invalid prompts, ambiguous requests, network failures, AI service unavailability

7. **Data model changes needed (new fields/collections)?**
   - No new data model - uses existing shape schema

8. **Service APIs required (create/update/delete/subscribe)?**
   - Extend AIService with generateShapesFromPrompt(), enhance existing CanvasService integration

9. **UI entry points and states (empty, loading, locked, error):**
   - AI chat input, confirmation messages, loading indicators, error messages

10. **Accessibility/keyboard expectations:**
    - Screen reader support for shape creation confirmations, keyboard navigation

11. **Security/permissions implications:**
    - Same as existing shapes - users can create shapes they generate

12. **Dependencies or blocking integrations:**
    - Depends on existing AIService, CanvasService, Chat interface

13. **Rollout strategy (flag, migration) and success metrics:**
    - Direct release, monitor AI response times and user satisfaction

14. **What is explicitly out of scope for this iteration?**
    - Complex multi-shape compositions, shape modification, image generation, voice commands

---

## Authoring Notes

- Write the Test Plan before coding; every sub-task needs a pass/fail gate.
- Favor a vertical slice that ships standalone; avoid partial features depending on later PRs.
- Keep contracts deterministic in the service layer; UI is a thin wrapper.
- Focus on reliable AI prompt parsing and clear user feedback.

---
