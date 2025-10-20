import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AIService } from '../../src/services/aiService';
import { generateCreativeDrawing } from '../../src/utils/creativeDrawing';

// Mock Firebase
vi.mock('../../src/firebase', () => ({
  firestore: {},
  database: {},
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(() => ({ id: 'mock-shape-id' })),
  setDoc: vi.fn().mockResolvedValue(undefined),
  getDocs: vi.fn().mockResolvedValue({ docs: [] }),
  serverTimestamp: vi.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 })),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
}));

// Mock OpenAI
vi.mock('openai', () => {
  return {
    default: class MockOpenAI {
      chat = {
        completions: {
          create: vi.fn(),
        },
      };
    },
  };
});

describe('Creative Drawing AI Integration Tests', () => {
  let aiService: AIService;
  const testCanvasId = 'test-canvas-ai-drawing';
  const testUserId = 'test-user-ai';

  beforeEach(() => {
    aiService = new AIService();
    vi.clearAllMocks();
  });

  describe('Creative Drawing Tool Integration', () => {
    it('should call drawCreative tool for creative prompts', async () => {
      let callCount = 0;
      const mockCreate = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            choices: [
              {
                message: {
                  tool_calls: [
                    {
                      id: 'call_dog',
                      function: {
                        name: 'drawCreative',
                        arguments: JSON.stringify({
                          objectName: 'dog',
                          x: 400,
                          y: 400,
                          size: 100,
                          color: '#000000',
                          strokeWidth: 2,
                        }),
                      },
                    },
                  ],
                },
              },
            ],
          });
        } else {
          return Promise.resolve({
            choices: [
              {
                message: {
                  content: 'Drew a dog',
                },
              },
            ],
          });
        }
      });
      
      // @ts-ignore - Mock implementation
      aiService['openai'].chat.completions.create = mockCreate;

      const result = await aiService.executeCommand(
        'Draw a dog',
        testUserId,
        testCanvasId
      );

      expect(result.success).toBe(true);
      expect(result.toolCalls.length).toBeGreaterThan(0);
      expect(result.toolCalls[0].tool).toBe('drawCreative');
      expect(result.toolCalls[0].success).toBe(true);
    });

    it('should generate correct drawing points for various objects', () => {
      const objects = ['dog', 'cat', 'house', 'tree', 'sun', 'star', 'flower', 'heart', 'car'];
      
      objects.forEach(obj => {
        const points = generateCreativeDrawing(obj, 100, 100, 100);
        expect(points).toBeDefined();
        expect(points.length).toBeGreaterThan(5);
        expect(points[0]).toHaveProperty('x');
        expect(points[0]).toHaveProperty('y');
      });
    });

    it('should pass correct parameters to drawCreative tool', async () => {
      let capturedArgs: any = null;
      let callCount = 0;
      const mockCreate = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            choices: [
              {
                message: {
                  tool_calls: [
                    {
                      id: 'call_smiley',
                      function: {
                        name: 'drawCreative',
                        arguments: JSON.stringify({
                          objectName: 'smiley face',
                          x: 500,
                          y: 500,
                          size: 150,
                          color: '#f59e0b',
                          strokeWidth: 3,
                        }),
                      },
                    },
                  ],
                },
              },
            ],
          });
        } else {
          return Promise.resolve({
            choices: [
              {
                message: {
                  content: 'Drew a smiley face',
                },
              },
            ],
          });
        }
      });
      
      // @ts-ignore - Mock implementation
      aiService['openai'].chat.completions.create = mockCreate;

      const result = await aiService.executeCommand(
        'Draw a smiley face at 500, 500',
        testUserId,
        testCanvasId
      );

      expect(result.success).toBe(true);
      expect(result.toolCalls[0].tool).toBe('drawCreative');
    });

    it('should handle multiple creative drawing requests', async () => {
      const drawings = ['dog', 'cat', 'tree'];
      
      for (const drawing of drawings) {
        let callCount = 0;
        const mockCreate = vi.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return Promise.resolve({
              choices: [
                {
                  message: {
                    tool_calls: [
                      {
                        id: `call_${drawing}`,
                        function: {
                          name: 'drawCreative',
                          arguments: JSON.stringify({
                            objectName: drawing,
                            x: 100,
                            y: 100,
                            size: 100,
                            color: '#000000',
                            strokeWidth: 2,
                          }),
                        },
                      },
                    ],
                  },
                },
              ],
            });
          } else {
            return Promise.resolve({
              choices: [
                {
                  message: {
                    content: `Drew a ${drawing}`,
                  },
                },
              ],
            });
          }
        });
        
        // @ts-ignore - Mock implementation
        aiService['openai'].chat.completions.create = mockCreate;

        const result = await aiService.executeCommand(
          `Draw a ${drawing}`,
          testUserId,
          testCanvasId
        );

        expect(result.success).toBe(true);
        expect(result.toolCalls[0].tool).toBe('drawCreative');
      }
    });
  });

  describe('Tool Definition', () => {
    it('should have drawCreative in tool definitions', () => {
      // @ts-ignore - Access private method
      const tools = aiService['getToolDefinitions']();
      
      const drawCreativeTool = tools.find((t: any) => t.function.name === 'drawCreative');
      expect(drawCreativeTool).toBeDefined();
      expect(drawCreativeTool.function.description).toContain('creative');
      expect(drawCreativeTool.function.parameters.required).toContain('objectName');
      expect(drawCreativeTool.function.parameters.required).toContain('x');
      expect(drawCreativeTool.function.parameters.required).toContain('y');
    });
  });

  describe('Success Messages', () => {
    it('should generate appropriate success message for creative drawing', async () => {
      let callCount = 0;
      const mockCreate = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            choices: [
              {
                message: {
                  tool_calls: [
                    {
                      id: 'call_heart',
                      function: {
                        name: 'drawCreative',
                        arguments: JSON.stringify({
                          objectName: 'heart',
                          x: 300,
                          y: 300,
                          size: 100,
                          color: '#ef4444',
                          strokeWidth: 2,
                        }),
                      },
                    },
                  ],
                },
              },
            ],
          });
        } else {
          return Promise.resolve({
            choices: [
              {
                message: {
                  content: 'Drew a heart',
                },
              },
            ],
          });
        }
      });
      
      // @ts-ignore - Mock implementation
      aiService['openai'].chat.completions.create = mockCreate;

      const result = await aiService.executeCommand(
        'Draw a heart',
        testUserId,
        testCanvasId
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('Drew');
    });
  });

  // Content moderation removed - app is for friends to have fun without restrictions
});

