# Test File Template

**Purpose:** Template for creating test files for new features

**Test Type:** Integration + Unit tests using Vitest

---

## File Naming Convention

```
tests/integration/{feature-name}.test.ts
tests/unit/services/{service-name}.test.ts
tests/unit/utils/{util-name}.test.ts
```

**Examples:**
- `tests/integration/pencil-tool.test.ts`
- `tests/unit/services/canvasService-path.test.ts`
- `tests/unit/utils/lineSmoothing.test.ts`

---

## Integration Test Template

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../setup';
import Canvas from '../../src/components/Canvas/Canvas';

describe('{Feature Name} - Integration Tests', () => {
  beforeEach(async () => {
    // Setup: Initialize test environment
    // - Clear Firestore emulator data
    // - Reset auth state
    // - Create test user
  });

  afterEach(async () => {
    // Cleanup: Reset state after each test
    // - Clear created shapes
    // - Sign out test user
  });

  describe('User Simulation Tests (Does it click?)', () => {
    it('should {action} when {user does something}', async () => {
      // ARRANGE: Setup the test scenario
      const { container } = renderWithProviders(<Canvas />);
      
      // ACT: Perform user action
      const toolButton = screen.getByTitle('{Tool Name}');
      fireEvent.click(toolButton);
      
      // Simulate drawing/interaction
      const canvas = container.querySelector('canvas');
      fireEvent.mouseDown(canvas!, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(canvas!, { clientX: 200, clientY: 200 });
      fireEvent.mouseUp(canvas!, { clientX: 200, clientY: 200 });
      
      // ASSERT: Verify expected outcome
      await waitFor(() => {
        expect(screen.getByTestId('shape-{id}')).toBeInTheDocument();
      });
    });

    it('should handle {edge case}', async () => {
      // Test edge case: empty canvas, invalid input, etc.
    });
  });

  describe('State Inspection Tests (Is the logic correct?)', () => {
    it('should save {data} to Firestore', async () => {
      // ARRANGE: Setup
      const { container } = renderWithProviders(<Canvas />);
      
      // ACT: Perform action that creates data
      // ... user interaction code ...
      
      // ASSERT: Check Firestore for correct data
      await waitFor(async () => {
        const snapshot = await getDoc(doc(firestore, 'canvases/main/shapes/{id}'));
        const data = snapshot.data();
        
        expect(data).toBeDefined();
        expect(data?.type).toBe('{expected-type}');
        expect(data?.createdBy).toBe('test-user-id');
        expect(data?.createdAt).toBeDefined();
        // ... more assertions ...
      });
    });

    it('should sync changes in <100ms', async () => {
      // ARRANGE: Start timing
      const startTime = Date.now();
      
      // ACT: Create/update shape
      // ... action code ...
      
      // ASSERT: Check sync latency
      await waitFor(async () => {
        const snapshot = await getDoc(doc(firestore, 'canvases/main/shapes/{id}'));
        expect(snapshot.exists()).toBe(true);
        
        const syncTime = Date.now() - startTime;
        expect(syncTime).toBeLessThan(100); // Must sync in <100ms
      });
    });
  });

  describe('Multi-User Collaboration Tests', () => {
    it('should sync {action} across users', async () => {
      // ARRANGE: Setup 2 users
      const user1 = await createTestUser('user1');
      const user2 = await createTestUser('user2');
      
      // Render 2 instances (simulating 2 browser windows)
      const { container: canvas1 } = renderWithProviders(<Canvas />, { user: user1 });
      const { container: canvas2 } = renderWithProviders(<Canvas />, { user: user2 });
      
      // ACT: User 1 performs action
      // ... user 1 interaction ...
      
      // ASSERT: User 2 sees the change
      await waitFor(() => {
        // Check that canvas2 has the new shape/change
        expect(canvas2.querySelector('[data-shape-id="{id}"]')).toBeInTheDocument();
      }, { timeout: 150 }); // Allow <100ms + small buffer
    });
  });
});
```

---

## Unit Test Template (Service Layer)

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { canvasService } from '../../src/services/canvasService';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../../src/firebase';

describe('CanvasService - {Feature} Methods', () => {
  beforeEach(async () => {
    // Clear Firestore emulator data
    // Setup test environment
  });

  afterEach(async () => {
    // Cleanup
  });

  describe('create{Shape}()', () => {
    it('should create {shape} with valid data', async () => {
      // ARRANGE
      const shapeData = {
        x: 100,
        y: 100,
        width: 200,
        height: 150,
        color: '#ff0000',
        createdBy: 'test-user-id',
      };

      // ACT
      const shapeId = await canvasService.create{Shape}(shapeData);

      // ASSERT
      expect(shapeId).toBeDefined();
      expect(typeof shapeId).toBe('string');

      // Verify in Firestore
      const snapshot = await getDoc(doc(firestore, `canvases/main/shapes/${shapeId}`));
      const data = snapshot.data();

      expect(data).toBeDefined();
      expect(data?.type).toBe('{shape-type}');
      expect(data?.x).toBe(100);
      expect(data?.y).toBe(100);
      expect(data?.color).toBe('#ff0000');
      expect(data?.createdBy).toBe('test-user-id');
      expect(data?.createdAt).toBeDefined();
    });

    it('should reject invalid data', async () => {
      // Test validation: missing required fields, out-of-bounds values, etc.
      const invalidData = {
        x: -100, // negative x should be rejected
        y: 100,
        color: '#ff0000',
      };

      await expect(
        canvasService.create{Shape}(invalidData)
      ).rejects.toThrow();
    });
  });

  describe('update{Shape}()', () => {
    it('should update {shape} properties', async () => {
      // ARRANGE: Create a shape first
      const shapeId = await canvasService.create{Shape}({
        x: 100,
        y: 100,
        width: 200,
        height: 150,
        color: '#ff0000',
        createdBy: 'test-user-id',
      });

      // ACT: Update the shape
      await canvasService.update{Shape}(shapeId, {
        x: 150,
        color: '#00ff00',
      });

      // ASSERT: Verify updates in Firestore
      const snapshot = await getDoc(doc(firestore, `canvases/main/shapes/${shapeId}`));
      const data = snapshot.data();

      expect(data?.x).toBe(150);
      expect(data?.color).toBe('#00ff00');
      expect(data?.y).toBe(100); // Unchanged
      expect(data?.updatedAt).toBeDefined();
    });
  });
});
```

---

## Unit Test Template (Utils/Helpers)

```typescript
import { describe, it, expect } from 'vitest';
import { {utilFunction} } from '../../src/utils/{utilFile}';

describe('{Util Name}', () => {
  describe('{functionName}()', () => {
    it('should {expected behavior} when {condition}', () => {
      // ARRANGE
      const input = { /* test data */ };

      // ACT
      const result = {utilFunction}(input);

      // ASSERT
      expect(result).toBe({expected});
      // or
      expect(result).toEqual({expected});
      // or
      expect(result).toMatchObject({expected});
    });

    it('should handle edge case: {scenario}', () => {
      // Test: empty input, null, undefined, extreme values, etc.
      expect({utilFunction}(null)).toBe({expected});
    });
  });
});
```

---

## Test Helpers & Setup

### Render with Providers
```typescript
// tests/setup.ts
export function renderWithProviders(
  component: React.ReactElement,
  options?: { user?: User }
) {
  return render(
    <AuthProvider initialUser={options?.user}>
      <CanvasProvider>
        {component}
      </CanvasProvider>
    </AuthProvider>
  );
}
```

### Create Test User
```typescript
export async function createTestUser(userId: string = 'test-user') {
  const auth = getAuth();
  const userCredential = await signInAnonymously(auth);
  return userCredential.user;
}
```

### Clear Firestore Data
```typescript
export async function clearFirestoreData() {
  const shapesSnapshot = await getDocs(collection(firestore, 'canvases/main/shapes'));
  const deletePromises = shapesSnapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(deletePromises);
}
```

---

## Running Tests

```bash
# Run all tests
npm run test

# Run specific test file
npm run test tests/integration/pencil-tool.test.ts

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

---

## Checklist for Test Files

- [ ] Test file created at correct path
- [ ] All imports present (vitest, testing-library, firebase)
- [ ] Setup/teardown properly configured
- [ ] User Simulation tests written (interaction → outcome)
- [ ] State Inspection tests written (data → Firestore)
- [ ] Multi-user tests written (sync across users)
- [ ] Edge cases tested (empty, invalid, extreme)
- [ ] Performance tested (sync <100ms)
- [ ] All tests pass locally
- [ ] No console errors/warnings during tests

---

## Common Test Assertions

```typescript
// DOM assertions
expect(element).toBeInTheDocument();
expect(element).toHaveTextContent('text');
expect(element).toHaveAttribute('data-id', 'value');

// Firestore assertions
expect(snapshot.exists()).toBe(true);
expect(data?.field).toBe(value);
expect(data?.array).toHaveLength(5);

// Timing assertions
expect(syncTime).toBeLessThan(100);

// Error assertions
await expect(asyncFunction()).rejects.toThrow('error message');
```

---

**Remember:** Write tests BEFORE marking the feature as complete. Tests prove the feature works correctly.

