# PR-1 TODO — Debouncing & Batching Firestore Operations

**Branch**: `feat/pr-1-debounce-batch-firestore`  
**Source PRD**: `collabcanvas/docs/prds/pr-1-prd.md`  
**Owner (Agent)**: Building Agent (Coder)

---

## 0. Clarifying Questions & Assumptions

### Questions
- None - PRD is comprehensive and all requirements are clear

### Assumptions
- Existing service method signatures will be preserved where possible for backward compatibility
- 500ms debounce is optimal for balance between write reduction and user experience
- beforeunload event handling works consistently across modern browsers (Chrome, Firefox, Safari)
- Firestore batch size limit of 500 operations is more than sufficient for our use case
- Console logging for debugging is acceptable (no need for advanced telemetry in MVP)

---

## 1. Repo Prep & Baseline Measurement

### Task 1.1: Environment Setup

- [ ] Create branch `feat/pr-1-debounce-batch-firestore` from `feat/agents`
- [ ] Confirm Firebase emulators running (Firestore on port 8080)
- [ ] Confirm Vite dev server running
- [ ] Open 2 browser windows for multi-user testing
- [ ] Verify existing tests pass before starting changes

**Test Gate**: All existing tests pass, emulators running, dev environment ready

---

### Task 1.2: Measure Baseline Metrics (CRITICAL - Do First!)

**Purpose**: Establish current performance baseline to validate improvements after implementation.

- [ ] **Test 1: Single shape drag (30 seconds)**
  - Open browser console
  - Run baseline measurement script:
    ```javascript
    // Inject write counter
    let writeCount = 0;
    const originalUpdate = canvasService.updateShape;
    canvasService.updateShape = function(...args) {
      writeCount++;
      console.log(`Write #${writeCount}`);
      return originalUpdate.apply(this, args);
    };
    
    // Instructions
    console.log('Drag a shape continuously for 30 seconds. Timer starting now...');
    setTimeout(() => {
      console.log(`BASELINE RESULT: ${writeCount} writes in 30 seconds`);
      console.log(`Expected after optimization: <60 writes (${((1 - 60/writeCount) * 100).toFixed(1)}% reduction)`);
    }, 30000);
    ```
  - Create a rectangle shape
  - Drag it continuously in circles for 30 seconds
  - Record final write count: **_____** writes
  - Expected baseline: 300-500 writes

- [ ] **Test 2: Multi-shape move (10 seconds)**
  - Reset counter
  - Create 3 shapes
  - Select all 3 shapes
  - Drag them together for 10 seconds
  - Record write count: **_____** writes
  - Expected baseline: ~600 writes (3 shapes × 200 frames)

- [ ] **Test 3: Typical editing session (5 minutes)**
  - Reset counter
  - Perform typical editing: create shapes, move them, resize, change colors
  - After 5 minutes, record write count: **_____** writes
  - Expected baseline: 1,000-2,000 writes

- [ ] **Test 4: Multi-user performance**
  - Open 3 browser windows (3 users)
  - All 3 users drag shapes simultaneously for 30 seconds
  - Observe and note:
    - UI lag/stuttering: **Yes / No**
    - Frame rate drops: **Yes / No**
    - Console errors: **Yes / No**

- [ ] **Document baseline results**
  - Create file: `docs/performance/pr-1-baseline.md`
  - Record all measurements
  - Include screenshots of console logs
  - Add timestamp and git commit SHA

**Acceptance**: Baseline metrics documented, clear targets established for post-implementation comparison

**Sample baseline documentation:**
```markdown
# PR #1 Baseline Metrics

**Date**: 2025-10-19
**Commit**: abc123def
**Tester**: [Your Name]

## Write Frequency Tests

### Test 1: 30-Second Single Shape Drag
- **Result**: 487 Firestore writes
- **Frame rate**: 60 FPS maintained
- **Target after optimization**: <60 writes (87.7% reduction)

### Test 2: 10-Second Multi-Shape Drag (3 shapes)
- **Result**: 612 Firestore writes
- **Target after optimization**: <60 writes (90.2% reduction)

### Test 3: 5-Minute Editing Session
- **Result**: 1,847 Firestore writes
- **Activities**: Created 10 shapes, moved/resized/recolored multiple times
- **Target after optimization**: <200 writes (89.2% reduction)

## Multi-User Performance

### Test 4: 3 Concurrent Users
- **UI Lag**: Yes - noticeable stuttering
- **Frame drops**: Yes - dropped to ~45 FPS
- **Console errors**: None
- **Target after optimization**: Smooth 60 FPS with 5+ users

## Conclusion
Current system performs excessive Firestore writes. Every frame of drag operation writes to database. Clear opportunity for 85-90% write reduction with debouncing.
```

---

## 2. Service Layer — Core Debouncing Logic

### Task 2.1: Add Debounce State Management to CanvasService

- [ ] Add private class properties to `canvasService`:
  ```typescript
  private pendingUpdates: Map<string, ShapeUpdateInput> = new Map();
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private readonly defaultDebounceMs = 500;
  ```
- [ ] Add utility method to check if updates are pending:
  ```typescript
  private hasPendingUpdates(): boolean {
    return this.pendingUpdates.size > 0;
  }
  ```

**Acceptance**: Properties compile without errors, basic structure in place

---

### Task 2.2: Implement debouncedUpdateShape Method

- [ ] Create new method in `canvasService`:
  ```typescript
  debouncedUpdateShape(
    shapeId: string, 
    updates: ShapeUpdateInput,
    options: { debounceMs?: number; flush?: boolean } = {}
  ): void {
    const debounceMs = options.debounceMs ?? this.defaultDebounceMs;
    
    // If flush requested, commit immediately
    if (options.flush) {
      this.updateShape(shapeId, updates);
      return;
    }
    
    // Cancel existing debounce timer for this shape
    if (this.debounceTimers.has(shapeId)) {
      clearTimeout(this.debounceTimers.get(shapeId)!);
    }
    
    // Merge updates if already pending for this shape
    const existingUpdates = this.pendingUpdates.get(shapeId) || {};
    this.pendingUpdates.set(shapeId, { ...existingUpdates, ...updates });
    
    // Set new debounce timer
    const timer = setTimeout(() => {
      this.commitPendingUpdate(shapeId);
    }, debounceMs);
    
    this.debounceTimers.set(shapeId, timer);
    
    console.log(`⏱️  Debounced update for shape ${shapeId}, pending: ${this.pendingUpdates.size}`);
  }
  ```

- [ ] Create helper method `commitPendingUpdate`:
  ```typescript
  private async commitPendingUpdate(shapeId: string): Promise<void> {
    const updates = this.pendingUpdates.get(shapeId);
    if (!updates) return;
    
    // Clear from pending
    this.pendingUpdates.delete(shapeId);
    this.debounceTimers.delete(shapeId);
    
    try {
      await this.updateShape(shapeId, updates);
      console.log(`✅ Committed debounced update for shape ${shapeId}`);
    } catch (error) {
      console.error(`❌ Failed to commit update for shape ${shapeId}:`, error);
      throw error;
    }
  }
  ```

**Acceptance**: Method compiles, basic debounce logic works, pending updates tracked correctly

---

### Task 2.3: Implement debouncedBatchUpdateShapes Method

- [ ] Create new method in `canvasService`:
  ```typescript
  debouncedBatchUpdateShapes(
    updates: Array<{ shapeId: string; updates: ShapeUpdateInput }>,
    options: { debounceMs?: number; flush?: boolean } = {}
  ): void {
    const debounceMs = options.debounceMs ?? this.defaultDebounceMs;
    
    // If flush requested, commit immediately
    if (options.flush) {
      this.batchUpdateShapes(updates);
      return;
    }
    
    // Add all updates to pending queue (merging if needed)
    updates.forEach(({ shapeId, updates: shapeUpdates }) => {
      // Cancel existing timer for this shape
      if (this.debounceTimers.has(shapeId)) {
        clearTimeout(this.debounceTimers.get(shapeId)!);
        this.debounceTimers.delete(shapeId);
      }
      
      // Merge with existing pending updates
      const existingUpdates = this.pendingUpdates.get(shapeId) || {};
      this.pendingUpdates.set(shapeId, { ...existingUpdates, ...shapeUpdates });
    });
    
    // Set single timer to commit entire batch
    const batchTimerId = 'batch_' + Date.now();
    const timer = setTimeout(() => {
      this.commitPendingBatch();
    }, debounceMs);
    
    this.debounceTimers.set(batchTimerId, timer);
    
    console.log(`⏱️  Debounced batch update (${updates.length} shapes), pending: ${this.pendingUpdates.size}`);
  }
  ```

- [ ] Create helper method `commitPendingBatch`:
  ```typescript
  private async commitPendingBatch(): Promise<void> {
    if (this.pendingUpdates.size === 0) return;
    
    // Convert pending updates to batch format
    const updates = Array.from(this.pendingUpdates.entries()).map(([shapeId, updates]) => ({
      shapeId,
      updates,
    }));
    
    // Clear pending updates and timers
    this.pendingUpdates.clear();
    // Clear all batch timers
    Array.from(this.debounceTimers.keys())
      .filter(key => key.startsWith('batch_'))
      .forEach(key => {
        clearTimeout(this.debounceTimers.get(key)!);
        this.debounceTimers.delete(key);
      });
    
    try {
      await this.batchUpdateShapes(updates);
      console.log(`✅ Committed batch update (${updates.length} shapes)`);
    } catch (error) {
      console.error(`❌ Failed to commit batch update:`, error);
      throw error;
    }
  }
  ```

**Acceptance**: Batch updates collected properly, single Firestore write for multiple shapes

---

### Task 2.4: Implement flushPendingUpdates Method

- [ ] Create public method in `canvasService`:
  ```typescript
  async flushPendingUpdates(): Promise<void> {
    console.log(`🚀 Flushing ${this.pendingUpdates.size} pending updates`);
    
    // Clear all debounce timers
    this.debounceTimers.forEach((timer) => clearTimeout(timer));
    this.debounceTimers.clear();
    
    // If no pending updates, return early
    if (this.pendingUpdates.size === 0) {
      console.log('✅ No pending updates to flush');
      return;
    }
    
    // Commit all pending updates as a single batch
    await this.commitPendingBatch();
  }
  ```

**Acceptance**: All pending updates commit immediately, timers cleared, no memory leaks

---

### Task 2.5: Add Text-Specific Debounce for Text Content

- [ ] Add separate debounce timer tracking for text content:
  ```typescript
  private textDebounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private readonly textDebounceMs = 300; // Shorter than shape properties
  ```

- [ ] Create `debouncedUpdateShapeText` method:
  ```typescript
  debouncedUpdateShapeText(
    shapeId: string, 
    text: string,
    options: { flush?: boolean } = {}
  ): void {
    // If flush requested, commit immediately
    if (options.flush) {
      this.updateShapeText(shapeId, text);
      return;
    }
    
    // Cancel existing text debounce timer for this shape
    if (this.textDebounceTimers.has(shapeId)) {
      clearTimeout(this.textDebounceTimers.get(shapeId)!);
    }
    
    // Set new debounce timer
    const timer = setTimeout(async () => {
      try {
        await this.updateShapeText(shapeId, text);
        this.textDebounceTimers.delete(shapeId);
        console.log(`✅ Committed text update for shape ${shapeId}`);
      } catch (error) {
        console.error(`❌ Failed to commit text update:`, error);
      }
    }, this.textDebounceMs);
    
    this.textDebounceTimers.set(shapeId, timer);
    
    console.log(`⏱️  Debounced text update for shape ${shapeId} (300ms)`);
  }
  ```

- [ ] Update `flushPendingUpdates` to include text timers:
  ```typescript
  // Add to flushPendingUpdates method:
  this.textDebounceTimers.forEach((timer) => clearTimeout(timer));
  this.textDebounceTimers.clear();
  ```

**Acceptance**: Text content updates debounce separately with 300ms delay, flush works for text

---

## 3. Hook Layer — Integrate Debounced Methods

### Task 3.1: Update useCanvas Hook to Use Debounced Methods

- [ ] Open `src/hooks/useCanvas.ts`
- [ ] Modify `updateShape` wrapper to use debounced version:
  ```typescript
  const updateShape = useCallback(
    (shapeId: string, updates: ShapeUpdateInput) => {
      if (!user) return;
      
      // Update local state immediately (optimistic)
      setShapes(prevShapes =>
        prevShapes.map(shape =>
          shape.id === shapeId ? { ...shape, ...updates } : shape
        )
      );
      
      // Debounced Firestore write
      canvasService.debouncedUpdateShape(shapeId, updates);
    },
    [user]
  );
  ```

- [ ] Modify `batchUpdateShapes` wrapper to use debounced version:
  ```typescript
  const batchUpdateShapes = useCallback(
    (updates: Array<{ shapeId: string; updates: ShapeUpdateInput }>) => {
      if (!user) return;
      
      // Update local state immediately (optimistic)
      setShapes(prevShapes =>
        prevShapes.map(shape => {
          const update = updates.find(u => u.shapeId === shape.id);
          return update ? { ...shape, ...update.updates } : shape;
        })
      );
      
      // Debounced Firestore write
      canvasService.debouncedBatchUpdateShapes(updates);
    },
    [user]
  );
  ```

- [ ] Add new `flushPendingUpdates` wrapper:
  ```typescript
  const flushPendingUpdates = useCallback(async () => {
    try {
      await canvasService.flushPendingUpdates();
    } catch (error) {
      console.error('Error flushing pending updates:', error);
      toast.error('Failed to save changes');
    }
  }, []);
  ```

- [ ] Export `flushPendingUpdates` from hook

**Acceptance**: Hook methods use debounced service methods, optimistic updates work, flush method available

---

### Task 3.2: Add Flush on Selection Change

- [ ] In `useCanvas.ts`, add effect to flush when selection changes:
  ```typescript
  // Flush pending updates when selection changes
  useEffect(() => {
    if (selectedShapeId || selectedShapes.length > 0) {
      console.log('🔄 Selection changed, flushing pending updates');
      canvasService.flushPendingUpdates().catch(error => {
        console.error('Error flushing on selection change:', error);
      });
    }
  }, [selectedShapeId, selectedShapes]);
  ```

**Acceptance**: Changing selection triggers immediate flush of pending updates

---

### Task 3.3: Add Flush on Tool Change

- [ ] In `useCanvas.ts`, add effect to flush when activeTool changes:
  ```typescript
  // Flush pending updates when tool changes
  useEffect(() => {
    console.log(`🔧 Tool changed to ${activeTool}, flushing pending updates`);
    canvasService.flushPendingUpdates().catch(error => {
      console.error('Error flushing on tool change:', error);
    });
  }, [activeTool]);
  ```

**Acceptance**: Changing tool (pan, rectangle, circle, etc.) triggers immediate flush

---

## 4. Context Layer — beforeunload Handler

### Task 4.1: Add beforeunload Event Handler in CanvasContext

- [ ] Open `src/contexts/CanvasContext.tsx`
- [ ] Add effect to handle page unload:
  ```typescript
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // Check if there are pending updates
      if (canvasService['pendingUpdates'].size > 0) {
        console.log('⚠️  Page unloading with pending updates, flushing...');
        
        // Attempt to flush synchronously (best effort)
        canvasService.flushPendingUpdates().catch(error => {
          console.error('Failed to flush on unload:', error);
        });
        
        // Show browser warning if writes are pending
        event.preventDefault();
        event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return event.returnValue;
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
  ```

**Acceptance**: Closing tab/window with pending updates triggers flush and shows warning

---

## 5. Component Layer — Text Editing Integration

### Task 5.1: Update Text Editing to Use Debounced Text Method

- [ ] Open `src/components/Canvas/TextEditorOverlay.tsx` (or wherever text editing happens)
- [ ] Find the text content change handler
- [ ] Replace immediate `updateShapeText` call with debounced version:
  ```typescript
  const handleTextChange = (newText: string) => {
    setLocalText(newText); // Update local state immediately
    canvasService.debouncedUpdateShapeText(shapeId, newText); // Debounced write
  };
  ```

- [ ] On blur or Enter key, flush immediately:
  ```typescript
  const handleBlur = () => {
    canvasService.debouncedUpdateShapeText(shapeId, localText, { flush: true });
    exitTextEditMode();
  };
  
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      canvasService.debouncedUpdateShapeText(shapeId, localText, { flush: true });
      exitTextEditMode();
    }
  };
  ```

**Acceptance**: Text content updates debounce during typing, flush on blur/Enter

---

## 6. Testing — Unit Tests

### Task 6.1: Test Debounce Logic

- [ ] Create test file `tests/unit/services/debouncing.test.ts`
- [ ] Test: Single shape update debounces correctly
  ```typescript
  test('debouncedUpdateShape delays write by 500ms', async () => {
    const shapeId = 'test-shape-1';
    const updates = { x: 100, y: 100 };
    
    // Call debounced update
    canvasService.debouncedUpdateShape(shapeId, updates);
    
    // Verify no immediate write
    expect(mockUpdateShape).not.toHaveBeenCalled();
    
    // Wait 500ms
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Verify write occurred
    expect(mockUpdateShape).toHaveBeenCalledWith(shapeId, updates);
  });
  ```

- [ ] Test: Multiple rapid updates merge correctly
  ```typescript
  test('rapid updates merge into single write', async () => {
    const shapeId = 'test-shape-1';
    
    // Make 5 rapid updates
    canvasService.debouncedUpdateShape(shapeId, { x: 100 });
    canvasService.debouncedUpdateShape(shapeId, { y: 200 });
    canvasService.debouncedUpdateShape(shapeId, { width: 50 });
    canvasService.debouncedUpdateShape(shapeId, { height: 75 });
    canvasService.debouncedUpdateShape(shapeId, { color: '#ff0000' });
    
    // Wait for debounce
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Verify single merged write
    expect(mockUpdateShape).toHaveBeenCalledTimes(1);
    expect(mockUpdateShape).toHaveBeenCalledWith(shapeId, {
      x: 100,
      y: 200,
      width: 50,
      height: 75,
      color: '#ff0000',
    });
  });
  ```

- [ ] Test: flushPendingUpdates commits immediately
  ```typescript
  test('flushPendingUpdates commits immediately', async () => {
    const shapeId = 'test-shape-1';
    const updates = { x: 100, y: 100 };
    
    // Call debounced update
    canvasService.debouncedUpdateShape(shapeId, updates);
    
    // Flush immediately
    await canvasService.flushPendingUpdates();
    
    // Verify write occurred without waiting for debounce
    expect(mockUpdateShape).toHaveBeenCalledWith(shapeId, updates);
  });
  ```

**Acceptance**: All unit tests pass, debounce logic verified

---

### Task 6.2: Test Batch Update Logic

- [ ] Test: Batch updates collected correctly
  ```typescript
  test('batch updates merge multiple shapes', async () => {
    const updates = [
      { shapeId: 'shape-1', updates: { x: 100 } },
      { shapeId: 'shape-2', updates: { x: 200 } },
      { shapeId: 'shape-3', updates: { x: 300 } },
    ];
    
    canvasService.debouncedBatchUpdateShapes(updates);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Verify single batch write
    expect(mockBatchUpdateShapes).toHaveBeenCalledTimes(1);
    expect(mockBatchUpdateShapes).toHaveBeenCalledWith(updates);
  });
  ```

**Acceptance**: Batch update tests pass

---

### Task 6.3: Test Text Debounce

- [ ] Test: Text content debounces with 300ms delay
  ```typescript
  test('text content debounces with 300ms', async () => {
    const shapeId = 'text-shape-1';
    const text = 'Hello World';
    
    canvasService.debouncedUpdateShapeText(shapeId, text);
    
    // Verify no immediate write
    expect(mockUpdateShapeText).not.toHaveBeenCalled();
    
    // Wait 300ms
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Verify write occurred
    expect(mockUpdateShapeText).toHaveBeenCalledWith(shapeId, text);
  });
  ```

- [ ] Test: Flush option bypasses debounce for text
  ```typescript
  test('flush option commits text immediately', async () => {
    const shapeId = 'text-shape-1';
    const text = 'Immediate text';
    
    canvasService.debouncedUpdateShapeText(shapeId, text, { flush: true });
    
    // Verify immediate write
    expect(mockUpdateShapeText).toHaveBeenCalledWith(shapeId, text);
  });
  ```

**Acceptance**: Text-specific debounce tests pass

---

## 7. Testing — Integration Tests

### Task 7.1: Multi-User Concurrent Editing Test

- [ ] Create test file `tests/integration/debounce-multi-user.test.ts`
- [ ] Test: User A drags shape, User B sees update after debounce
  ```typescript
  test('remote user sees update after debounce period', async () => {
    // User A drags shape
    const shapeId = await userA.createShape({ x: 0, y: 0, width: 100, height: 100 });
    userA.updateShape(shapeId, { x: 50, y: 50 });
    
    // Immediately check User B - should not see update yet (optimistic on A only)
    const shapesB_immediate = await userB.getShapes();
    const shapeB_immediate = shapesB_immediate.find(s => s.id === shapeId);
    expect(shapeB_immediate.x).toBe(0); // Original position
    
    // Wait 600ms (debounce + sync time)
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Check User B again - should now see update
    const shapesB_after = await userB.getShapes();
    const shapeB_after = shapesB_after.find(s => s.id === shapeId);
    expect(shapeB_after.x).toBe(50);
    expect(shapeB_after.y).toBe(50);
  });
  ```

**Acceptance**: Integration test passes, confirms multi-user sync works with debouncing

---

### Task 7.2: Selection Change Flush Test

- [ ] Test: Changing selection flushes pending updates
  ```typescript
  test('changing selection flushes pending updates', async () => {
    const shape1Id = await user.createShape({ x: 0, y: 0, width: 100, height: 100 });
    const shape2Id = await user.createShape({ x: 200, y: 200, width: 100, height: 100 });
    
    // Select and drag shape 1
    user.selectShape(shape1Id);
    user.updateShape(shape1Id, { x: 50, y: 50 });
    
    // Immediately change selection to shape 2 (should flush shape 1)
    user.selectShape(shape2Id);
    
    // Wait briefly for flush
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verify shape 1 update committed (not still pending)
    const shapes = await user.getShapes();
    const shape1 = shapes.find(s => s.id === shape1Id);
    expect(shape1.x).toBe(50);
  });
  ```

**Acceptance**: Selection change triggers immediate flush

---

### Task 7.3: Tool Switch Flush Test

- [ ] Test: Switching tools flushes pending updates
  ```typescript
  test('switching tools flushes pending updates', async () => {
    const shapeId = await user.createShape({ x: 0, y: 0, width: 100, height: 100 });
    
    // Drag shape in pan mode
    user.setActiveTool('pan');
    user.updateShape(shapeId, { x: 100, y: 100 });
    
    // Switch to rectangle tool (should flush)
    user.setActiveTool('rectangle');
    
    // Wait briefly for flush
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verify update committed
    const shapes = await user.getShapes();
    const shape = shapes.find(s => s.id === shapeId);
    expect(shape.x).toBe(100);
  });
  ```

**Acceptance**: Tool switch triggers immediate flush

---

## 8. Performance Testing

### Task 8.1: Measure Write Reduction

- [ ] Create performance test `tests/performance/write-reduction.test.ts`
- [ ] Test: Count Firestore writes during 30-second drag session
  ```typescript
  test('write reduction: 30 second continuous drag', async () => {
    const shapeId = await user.createShape({ x: 0, y: 0, width: 100, height: 100 });
    
    let writeCount = 0;
    mockUpdateShape.mockImplementation(() => {
      writeCount++;
    });
    
    // Simulate continuous drag for 30 seconds (60 updates per second)
    const updateInterval = setInterval(() => {
      user.updateShape(shapeId, { 
        x: Math.random() * 1000, 
        y: Math.random() * 1000 
      });
    }, 16); // ~60 FPS
    
    await new Promise(resolve => setTimeout(resolve, 30000));
    clearInterval(updateInterval);
    
    // Wait for final debounce
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log(`Total writes: ${writeCount} (expected <60 for 90%+ reduction)`);
    
    // Verify write reduction (1800 updates / 500ms = ~60 writes max)
    expect(writeCount).toBeLessThan(60);
    
    // Calculate reduction percentage
    const totalUpdates = (30000 / 16); // ~1875 updates
    const reduction = ((totalUpdates - writeCount) / totalUpdates) * 100;
    console.log(`Write reduction: ${reduction.toFixed(1)}%`);
    expect(reduction).toBeGreaterThan(80);
  });
  ```

**Acceptance**: Performance test confirms 80%+ write reduction

---

### Task 8.2: Measure Batch Sizes

- [ ] Add logging to track batch sizes during editing session
- [ ] Test: Monitor batch sizes during typical editing
  ```typescript
  test('batch size analysis', async () => {
    const batchSizes: number[] = [];
    
    // Mock batch update to track sizes
    mockBatchUpdateShapes.mockImplementation((updates) => {
      batchSizes.push(updates.length);
    });
    
    // Simulate typical editing: create 5 shapes, move them around
    const shapeIds = await Promise.all([
      user.createShape({ x: 0, y: 0, width: 100, height: 100 }),
      user.createShape({ x: 100, y: 100, width: 100, height: 100 }),
      user.createShape({ x: 200, y: 200, width: 100, height: 100 }),
      user.createShape({ x: 300, y: 300, width: 100, height: 100 }),
      user.createShape({ x: 400, y: 400, width: 100, height: 100 }),
    ]);
    
    // Select all and move together
    user.selectShapes(shapeIds);
    user.batchUpdateShapes(shapeIds.map(id => ({
      shapeId: id,
      updates: { x: 500, y: 500 }
    })));
    
    // Wait for batch commit
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Analyze batch sizes
    const avgBatchSize = batchSizes.reduce((a, b) => a + b, 0) / batchSizes.length;
    console.log(`Average batch size: ${avgBatchSize.toFixed(1)}`);
    console.log(`Batch sizes: ${batchSizes.join(', ')}`);
    
    // Verify reasonable batching
    expect(avgBatchSize).toBeGreaterThan(1); // Not all single updates
    expect(avgBatchSize).toBeLessThan(50); // Not runaway batching
  });
  ```

**Acceptance**: Batch size analysis shows average 5-10 updates per batch

---

## 9. Edge Case Testing

### Task 9.1: Test Page Unload Flush

- [ ] Manual test (cannot easily automate):
  - Open canvas in browser
  - Create and drag a shape
  - Immediately close browser tab
  - Reopen canvas
  - Verify shape is in final dragged position (not original position)

**Acceptance**: beforeunload handler flushes pending updates successfully

---

### Task 9.2: Test Network Failure Handling

- [ ] Test: Batch write failure shows error toast
  ```typescript
  test('network failure shows error toast', async () => {
    const shapeId = await user.createShape({ x: 0, y: 0, width: 100, height: 100 });
    
    // Mock network failure
    mockUpdateShape.mockRejectedValueOnce(new Error('Network error'));
    
    // Make update
    user.updateShape(shapeId, { x: 100, y: 100 });
    
    // Wait for debounce
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Verify error was logged
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to commit'),
      expect.any(Error)
    );
  });
  ```

**Acceptance**: Network failures log errors without crashing app

---

### Task 9.3: Test Rapid Selection Changes

- [ ] Test: Rapid selection changes don't cause race conditions
  ```typescript
  test('rapid selection changes handled correctly', async () => {
    const shape1Id = await user.createShape({ x: 0, y: 0, width: 100, height: 100 });
    const shape2Id = await user.createShape({ x: 200, y: 200, width: 100, height: 100 });
    const shape3Id = await user.createShape({ x: 400, y: 400, width: 100, height: 100 });
    
    // Rapidly switch selections with updates
    user.selectShape(shape1Id);
    user.updateShape(shape1Id, { x: 50 });
    
    user.selectShape(shape2Id); // Should flush shape1
    user.updateShape(shape2Id, { x: 250 });
    
    user.selectShape(shape3Id); // Should flush shape2
    user.updateShape(shape3Id, { x: 450 });
    
    // Wait for all flushes
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verify all updates committed correctly
    const shapes = await user.getShapes();
    expect(shapes.find(s => s.id === shape1Id).x).toBe(50);
    expect(shapes.find(s => s.id === shape2Id).x).toBe(250);
    expect(shapes.find(s => s.id === shape3Id).x).toBe(450);
  });
  ```

**Acceptance**: Rapid selection changes don't cause lost updates or corruption

---

## 10. Performance Monitoring & Logging

### Task 10.1: Add Performance Logging

- [ ] Add batch size logging to `commitPendingBatch`:
  ```typescript
  console.log(`📊 Batch commit stats:`, {
    shapeCount: updates.length,
    timestamp: Date.now(),
    timeSinceLastBatch: this.lastBatchTime ? Date.now() - this.lastBatchTime : 'N/A'
  });
  this.lastBatchTime = Date.now();
  ```

- [ ] Add debounce cancellation tracking:
  ```typescript
  // In debouncedUpdateShape, when clearing timer:
  if (this.debounceTimers.has(shapeId)) {
    console.log(`🔄 Debounce cancelled for shape ${shapeId} (new update received)`);
    this.debounceCount = (this.debounceCount || 0) + 1;
  }
  ```

**Acceptance**: Comprehensive logging helps debug and monitor performance

---

## 11. Documentation

### Task 11.1: Update Architecture Doc

- [ ] Open `collabcanvas/docs/architecture.md`
- [ ] Add section on debouncing strategy:
  ```markdown
  ### Debouncing and Batching Strategy
  
  All shape property updates are debounced with a 500ms delay to reduce Firestore writes:
  - Position, size, rotation, color changes debounce for 500ms
  - Text content changes debounce for 300ms (shorter for better UX)
  - Multiple updates to same shape merge into single write
  - Pending updates flush immediately on:
    - Selection changes
    - Tool switches
    - Page unload (beforeunload event)
  
  **Write Reduction**: 80-90% reduction in Firestore operations during active editing
  **User Experience**: <16ms local updates (optimistic), <600ms remote sync (debounce + network)
  ```

**Acceptance**: Architecture doc updated with debouncing details

---

### Task 11.2: Add Code Comments

- [ ] Add JSDoc comments to all new methods in `canvasService.ts`:
  ```typescript
  /**
   * Update shape with debouncing to reduce Firestore writes.
   * 
   * Local state updates immediately (optimistic), but Firestore write is delayed
   * by 500ms. If multiple updates occur within the debounce window, they are
   * merged into a single write.
   * 
   * @param shapeId - ID of shape to update
   * @param updates - Partial shape properties to update
   * @param options - Debounce options (debounceMs, flush)
   * 
   * @example
   * // Updates are debounced and merged
   * canvasService.debouncedUpdateShape('shape-1', { x: 100 });
   * canvasService.debouncedUpdateShape('shape-1', { y: 200 });
   * // Result: Single write with { x: 100, y: 200 } after 500ms
   */
  ```

**Acceptance**: All new methods have clear documentation

---

## 12. Final Testing & Validation

### Task 12.1: Post-Implementation Baseline Comparison (CRITICAL!)

**Purpose**: Measure actual improvements and compare against baseline metrics from Task 1.2

- [ ] **Test 1: Single shape drag (30 seconds) - REPEAT BASELINE**
  - Run the same measurement script from Task 1.2
  - Drag shape continuously for 30 seconds
  - Record final write count: **_____** writes
  - **Compare**: 
    - Baseline: **_____** writes (from Task 1.2)
    - After optimization: **_____** writes
    - **Reduction**: **_____%**
  - **Target**: <60 writes (90%+ reduction)
  - **Status**: ✅ Pass / ❌ Fail

- [ ] **Test 2: Multi-shape move (10 seconds) - REPEAT BASELINE**
  - Create 3 shapes, select all, drag for 10 seconds
  - Record write count: **_____** writes
  - **Compare**:
    - Baseline: **_____** writes
    - After optimization: **_____** writes
    - **Reduction**: **_____%**
  - **Target**: <60 writes
  - **Status**: ✅ Pass / ❌ Fail

- [ ] **Test 3: 5-Minute editing session - REPEAT BASELINE**
  - Perform same editing activities as baseline test
  - Record write count: **_____** writes
  - **Compare**:
    - Baseline: **_____** writes
    - After optimization: **_____** writes
    - **Reduction**: **_____%**
  - **Target**: <200 writes
  - **Status**: ✅ Pass / ❌ Fail

- [ ] **Test 4: Multi-user performance - REPEAT BASELINE**
  - 3 users drag shapes simultaneously for 30 seconds
  - **Compare**:
    - Baseline UI lag: Yes/No
    - After optimization UI lag: Yes/No
    - Baseline frame drops: Yes/No
    - After optimization frame drops: Yes/No
  - **Target**: Smooth 60 FPS, no lag
  - **Status**: ✅ Pass / ❌ Fail

- [ ] **Update baseline comparison document**
  - Update `docs/performance/pr-1-baseline.md` with "After" results
  - Create side-by-side comparison table
  - Include screenshots showing write reduction
  - Calculate actual improvement percentages

**Acceptance**: All metrics show 80%+ improvement, documented comparison proves success

**Sample updated documentation:**
```markdown
# PR #1 Performance Comparison

## Results Summary

| Test | Before | After | Reduction | Target | Status |
|------|--------|-------|-----------|--------|--------|
| 30s drag | 487 writes | 58 writes | 88.1% | >80% | ✅ PASS |
| 10s multi-drag | 612 writes | 52 writes | 91.5% | >80% | ✅ PASS |
| 5min session | 1,847 writes | 187 writes | 89.9% | >80% | ✅ PASS |
| 3 users lag | Yes | No | N/A | No lag | ✅ PASS |

## Conclusion
✅ All targets met. Write reduction: 88-92% across all scenarios.
Performance significantly improved for multi-user scenarios.
```

---

### Task 12.2: Manual Multi-Browser Testing

- [ ] Open 2 browser windows side-by-side
- [ ] Window 1: Drag shape continuously for 5 seconds
- [ ] Window 2: Observe update appears within 600ms after drag stops
- [ ] Verify Chrome DevTools Network tab shows <10 Firestore writes (vs baseline)
- [ ] Test with 3 simultaneous users dragging different shapes
- [ ] Verify all updates sync correctly without conflicts

**Acceptance**: Manual testing confirms 600ms sync latency and write reduction

---

### Task 12.2: Performance Profiling

- [ ] Use Chrome DevTools Performance tab
- [ ] Record 30-second editing session with continuous dragging
- [ ] Verify 60 FPS maintained during drag operations
- [ ] Verify no memory leaks (heap size stable)
- [ ] Verify no excessive garbage collection

**Acceptance**: Performance profile shows 60 FPS and stable memory usage

---

### Task 12.3: Run Full Test Suite

- [ ] Run all unit tests: `npm test`
- [ ] Run integration tests: `npm run test:integration`
- [ ] Run performance tests: `npm run test:performance`
- [ ] Verify all tests pass with 100% success rate
- [ ] Fix any failing tests

**Acceptance**: All tests pass, no regressions

---

## 13. Cleanup & PR Preparation

### Task 13.1: Remove Debug Logging

- [ ] Review all console.log statements
- [ ] Keep essential logs (batch commits, errors)
- [ ] Remove verbose debug logs or put behind feature flag
- [ ] Ensure no sensitive data in logs

**Acceptance**: Clean, production-ready logging

---

### Task 13.2: Code Review Self-Check

- [ ] Review all changed files for code quality
- [ ] Check for TypeScript errors: `npm run typecheck`
- [ ] Check for linting errors: `npm run lint`
- [ ] Verify no commented-out code
- [ ] Verify consistent code style

**Acceptance**: Code passes all quality checks

---

### Task 13.3: Create PR Description

- [ ] Write PR description using this template:
  ```markdown
  # PR #1: Debouncing & Batching Firestore Operations
  
  ## Summary
  Implements debouncing and batching for all Firestore write operations to reduce database writes by 80-90% during active editing sessions. This establishes a critical performance foundation before adding AI chat functionality in Phase 3.
  
  ## Changes
  - Added debounced update methods to `canvasService.ts`
  - Implemented batch collection and atomic commits
  - Added flush mechanisms for selection/tool changes and page unload
  - Integrated optimistic UI updates in `useCanvas` hook
  - Added comprehensive unit and integration tests
  
  ## Testing
  - ✅ Unit tests for debounce logic (500ms delay, update merging)
  - ✅ Integration tests for multi-user sync
  - ✅ Performance tests confirm 80%+ write reduction
  - ✅ Edge case tests (selection changes, tool switches, page unload)
  - ✅ Manual testing with 2-3 concurrent users
  
  ## Performance Impact
  - **Write reduction**: 80-90% fewer Firestore operations
  - **Local responsiveness**: 60 FPS maintained during drag operations
  - **Remote sync latency**: <600ms (500ms debounce + 100ms network)
  - **Batch efficiency**: Average 5-10 updates per batch
  
  ## Known Limitations
  - Remote users see changes 500ms after editing stops (acceptable tradeoff)
  - beforeunload handler may not work in all browsers (graceful degradation)
  
  ## Related
  - Closes #1
  - Blocks PR #2, PR #3
  - PRD: `collabcanvas/docs/prds/pr-1-prd.md`
  - TODO: `collabcanvas/docs/todos/pr-1-todo.md`
  ```

**Acceptance**: PR description is clear, comprehensive, and includes test results

---

## 14. Deployment Validation

### Task 14.1: Deploy to Staging/Preview

- [ ] Push branch to GitHub
- [ ] Create PR
- [ ] Wait for Vercel preview deployment
- [ ] Test preview URL with 2 users
- [ ] Verify all functionality works in production-like environment

**Acceptance**: Preview deployment works correctly

---

### Task 14.2: Monitor Initial Production Metrics

- [ ] After merge, monitor Firestore usage in Firebase Console
- [ ] Verify write operations decreased significantly
- [ ] Monitor error rates for batch write failures
- [ ] Check user reports for any sync issues

**Acceptance**: Production metrics confirm expected performance improvements

---

## Summary Checklist

- [ ] All code changes implemented and tested
- [ ] Unit tests pass (debounce logic, batching, text debounce)
- [ ] Integration tests pass (multi-user, selection/tool changes)
- [ ] Performance tests confirm 80%+ write reduction
- [ ] Edge cases handled (network failures, page unload, rapid changes)
- [ ] Documentation updated (architecture, code comments)
- [ ] PR created with comprehensive description
- [ ] Manual testing confirms smooth multi-user experience
- [ ] No regressions in existing functionality
- [ ] Performance monitoring confirms targets met

---

**Total Estimated Time**: 2-3 hours  
**Complexity**: Complex  
**Priority**: Critical (Phase 1 foundation)  
**Blocks**: PR #2 (Shape Rendering), PR #3 (Connection Status)

