import OpenAI from 'openai';
import { canvasService } from './canvasService';
import { groupService } from './groupService';
import { getSystemPrompt } from '../utils/aiPrompts';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../utils/constants';
import { generateCreativeDrawing } from '../utils/creativeDrawing';

interface CommandResult {
  success: boolean;
  message: string;
  toolCalls: any[];
}

interface ViewportInfo {
  centerX: number;
  centerY: number;
  scale: number;
}

export class AIService {
  private openai: OpenAI;
  
  constructor() {
    this.openai = new OpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true
    });
  }
  
  async executeCommand(prompt: string, userId: string, canvasId: string, viewport?: ViewportInfo): Promise<CommandResult> {
    try {
      // 1. Build conversation messages (don't pass shapes - let AI call getCanvasState for fresh data)
      const messages: any[] = [
        { role: "system", content: getSystemPrompt([], viewport) }, // Empty array - AI will call getCanvasState
        { role: "user", content: prompt }
      ];
      
      let allResults: any[] = [];
      let iterations = 0;
      const MAX_ITERATIONS = 5; // Prevent infinite loops
      
      // 3. Loop until we get a final text response (multi-turn function calling)
      while (iterations < MAX_ITERATIONS) {
        iterations++;
        
        const response = await this.openai.chat.completions.create({
          model: "gpt-4-turbo-preview",
          messages: messages,
          tools: this.getToolDefinitions(),
          tool_choice: "auto",
          temperature: 0.7,
          max_tokens: 500
        });
        
        const message = response.choices[0].message;
        
        // If there are tool calls, execute them and continue the loop
        if (message.tool_calls && message.tool_calls.length > 0) {
          // Add the assistant's message with tool calls to conversation
          messages.push(message);
          
          // Execute all tool calls
          const results = await this.executeToolCalls(message.tool_calls, userId, canvasId);
          allResults.push(...results);
          
          // Add tool results to conversation for next iteration
          for (let i = 0; i < message.tool_calls.length; i++) {
            const toolCall = message.tool_calls[i];
            const result = results[i];
            
            // Format result content - OpenAI requires a string
            let content: string;
            if (result.success) {
              // If result is undefined or null, send success message
              if (result.result === undefined || result.result === null) {
                content = JSON.stringify({ success: true });
              } else {
                content = JSON.stringify(result.result);
              }
            } else {
              content = JSON.stringify({ error: result.error });
            }
            
            messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: content
            });
          }
          
          // Continue loop to get next response from AI
          continue;
        } else {
          // No more tool calls - we have a final response
          if (allResults.length > 0) {
            // Check if multiple shapes were created - auto-group them
            const createdShapes = allResults.filter(r => 
              r.success && r.result && ['createRectangle', 'createCircle', 'createTriangle', 'createText', 'drawCreative'].includes(r.tool)
            );
            
            if (createdShapes.length > 1) {
              const shapeIds = createdShapes.map(r => r.result);
              try {
                await groupService.groupShapes(canvasId, shapeIds, userId, 'AI Drawing');
              } catch (error) {
                console.error('❌ Failed to group AI shapes:', error);
              }
            }
            
            // We executed tools, return success
            return {
              success: true,
              message: this.generateSuccessMessage(allResults),
              toolCalls: allResults
            };
          } else {
            // No tools were executed, return the text response
            return {
              success: false,
              message: message.content || "I couldn't understand that command.",
              toolCalls: []
            };
          }
        }
      }
      
      // If we hit max iterations, return what we have
      return {
        success: allResults.length > 0,
        message: this.generateSuccessMessage(allResults),
        toolCalls: allResults
      };
      
    } catch (error) {
      console.error('AI execution error:', error);
      return {
        success: false,
        message: "⚠️ AI service error. Please try again.",
        toolCalls: []
      };
    }
  }
  
  private async executeToolCalls(toolCalls: any[], userId: string, canvasId: string) {
    const results = [];
    
    for (const call of toolCalls) {
      try {
        const result = await this.executeSingleTool(call, userId, canvasId);
        results.push({
          tool: call.function.name,
          success: true,
          result: result
        });
      } catch (error: any) {
        console.error(`❌ ${call.function.name} failed:`, error.message);
        results.push({
          tool: call.function.name,
          success: false,
          error: error.message
        });
      }
    }
    return results;
  }
  
  private validatePosition(x: number, y: number, shapeName: string): void {
    if (x < 0 || x > CANVAS_WIDTH || y < 0 || y > CANVAS_HEIGHT) {
      throw new Error(
        `⚠️ ${shapeName} position out of bounds: (${x}, ${y}). Canvas bounds are 0-${CANVAS_WIDTH} × 0-${CANVAS_HEIGHT} pixels.`
      );
    }
  }

  private async executeSingleTool(call: any, userId: string, canvasId: string) {
    const { name, arguments: argsStr } = call.function;
    const args = JSON.parse(argsStr);
    
    switch (name) {
      case 'createRectangle':
        this.validatePosition(args.x, args.y, 'rectangle');
        return await canvasService.createShape(canvasId, {
          type: 'rectangle',
          x: args.x,
          y: args.y,
          width: args.width,
          height: args.height,
          color: args.color,
          rotation: 0,
          createdBy: userId,
        });
        
      case 'createCircle':
        this.validatePosition(args.x, args.y, 'circle');
        return await canvasService.createCircle(canvasId, {
          x: args.x,
          y: args.y,
          radius: args.radius,
          color: args.color,
          createdBy: userId
        });
        
      case 'createTriangle':
        this.validatePosition(args.x, args.y, 'triangle');
        return await canvasService.createTriangle(canvasId, {
          x: args.x,
          y: args.y,
          width: args.width,
          height: args.height,
          color: args.color,
          createdBy: userId
        });
        
      case 'createText':
        this.validatePosition(args.x, args.y, 'text');
        return await canvasService.createText(canvasId, {
          x: args.x,
          y: args.y,
          color: args.color,
          createdBy: userId,
          text: args.text,
          fontSize: args.fontSize || 24,
          fontWeight: args.fontWeight || 'normal',
          fontStyle: args.fontStyle || 'normal',
          textDecoration: args.textDecoration || 'none'
        });
      
      case 'drawCreative':
        this.validatePosition(args.x, args.y, 'drawing');
        // Generate simple path drawing for the object
        const points = generateCreativeDrawing(
          args.objectName,
          args.x,
          args.y,
          args.size || 100
        );
        
        return await canvasService.createPath(canvasId, {
          points,
          strokeWidth: args.strokeWidth || 2,
          color: args.color || '#000000'
        }, userId);
      
      // MANIPULATION TOOLS
      case 'moveShape':
        return await canvasService.updateShape(canvasId, args.shapeId, {
          x: args.x,
          y: args.y
        });
        
      case 'resizeShape':
        if (args.radius !== undefined) {
          // Circle resize
          return await canvasService.resizeCircle(canvasId, args.shapeId, args.radius);
        } else {
          // Rectangle/Triangle resize
          return await canvasService.resizeShape(
            canvasId,
            args.shapeId,
            args.width,
            args.height
          );
        }
        
      case 'rotateShape':
        return await canvasService.rotateShape(
          canvasId,
          args.shapeId,
          args.rotation
        );
        
      case 'duplicateShape':
        return await canvasService.duplicateShape(canvasId, args.shapeId, userId);
        
      case 'deleteShape':
        return await canvasService.deleteShape(canvasId, args.shapeId);
        
      case 'getCanvasState':
        // Get shapes and sort by last interaction (updatedAt desc)
        const shapes = await canvasService.getShapes(canvasId);
        return shapes.sort((a, b) => {
          const timeA = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : (a.createdAt?.toMillis ? a.createdAt.toMillis() : 0);
          const timeB = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : (b.createdAt?.toMillis ? b.createdAt.toMillis() : 0);
          return timeB - timeA; // Descending (last touched first)
        });
        
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }
  
  private generateSuccessMessage(results: any[]): string {
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    if (failCount > 0) {
      const errors = results.filter(r => !r.success).map(r => r.error).join(', ');
      return `⚠️ Completed ${successCount} actions, but ${failCount} failed: ${errors}`;
    }
    
    // Filter out getCanvasState calls (they're just helper calls, not user-visible actions)
    const actionResults = results.filter(r => r.tool !== 'getCanvasState');
    const toolNames = actionResults.map(r => r.tool);
    
    // If only getCanvasState was called, something went wrong
    if (toolNames.length === 0) {
      return '✓ Retrieved canvas state';
    }
    
    // Single tool messages
    if (toolNames.length === 1) {
      const tool = toolNames[0];
      switch (tool) {
        case 'createRectangle': return '✓ Created 1 rectangle';
        case 'createCircle': return '✓ Created 1 circle';
        case 'createTriangle': return '✓ Created 1 triangle';
        case 'createText': return '✓ Created 1 text element';
        case 'drawCreative': return '✓ Drew your requested object';
        case 'moveShape': return '✓ Moved shape to new position';
        case 'resizeShape': return '✓ Resized shape';
        case 'rotateShape': return '✓ Rotated shape';
        case 'duplicateShape': return '✓ Duplicated shape';
        case 'deleteShape': return '✓ Deleted shape';
        default: return '✓ Action completed';
      }
    }
    
    // Multi-step operations
    const creationCount = toolNames.filter(t => 
      ['createRectangle', 'createCircle', 'createTriangle', 'createText'].includes(t)
    ).length;
    
    if (creationCount > 1) {
      return `✓ Created ${creationCount} elements`;
    }
    
    return `✓ Completed ${toolNames.length} actions`;
  }
  
  private getToolDefinitions() {
    return [
      {
        type: "function" as const,
        function: {
          name: "createRectangle",
          description: "Creates a rectangle on the canvas at specified position with given dimensions and color.",
          parameters: {
            type: "object",
            properties: {
              x: { type: "number", description: "X position in pixels (0-5000)" },
              y: { type: "number", description: "Y position in pixels (0-5000)" },
              width: { type: "number", description: "Width in pixels (minimum 10)" },
              height: { type: "number", description: "Height in pixels (minimum 10)" },
              color: { type: "string", description: "Hex color code like #3b82f6" }
            },
            required: ["x", "y", "width", "height", "color"]
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "createCircle",
          description: "Creates a circle on the canvas at specified center position with given radius and color.",
          parameters: {
            type: "object",
            properties: {
              x: { type: "number", description: "Center X position in pixels (0-5000)" },
              y: { type: "number", description: "Center Y position in pixels (0-5000)" },
              radius: { type: "number", description: "Radius in pixels (minimum 5)" },
              color: { type: "string", description: "Hex color code like #ef4444" }
            },
            required: ["x", "y", "radius", "color"]
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "createTriangle",
          description: "Creates a triangle on the canvas at specified position with given dimensions and color.",
          parameters: {
            type: "object",
            properties: {
              x: { type: "number", description: "Top vertex X position in pixels (0-5000)" },
              y: { type: "number", description: "Top vertex Y position in pixels (0-5000)" },
              width: { type: "number", description: "Base width in pixels (minimum 10)" },
              height: { type: "number", description: "Height in pixels (minimum 10)" },
              color: { type: "string", description: "Hex color code like #10b981" }
            },
            required: ["x", "y", "width", "height", "color"]
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "createText",
          description: "Creates a text element on the canvas at specified position with given text content and styling.",
          parameters: {
            type: "object",
            properties: {
              x: { type: "number", description: "X position in pixels (0-5000)" },
              y: { type: "number", description: "Y position in pixels (0-5000)" },
              color: { type: "string", description: "Hex color code like #000000" },
              text: { type: "string", description: "The text content to display" },
              fontSize: { type: "number", description: "Font size in pixels (default 24)" },
              fontWeight: { type: "string", description: "Font weight: 'normal' or 'bold'" },
              fontStyle: { type: "string", description: "Font style: 'normal' or 'italic'" },
              textDecoration: { type: "string", description: "Text decoration: 'none' or 'underline'" }
            },
            required: ["x", "y", "color", "text"]
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "drawCreative",
          description: "Creates a simple, child-like drawing of common objects using pencil tool paths. Use this for creative drawing requests like 'draw a dog', 'draw a smiley face', 'draw a house', etc. Supported objects: dog, cat, face/smiley, house, tree, sun, star, flower, heart, car, stick figure. Be creative and have fun with any drawing requests!",
          parameters: {
            type: "object",
            properties: {
              objectName: { type: "string", description: "The object to draw (e.g., 'dog', 'cat', 'smiley face', 'house', 'tree', 'sun', 'star', 'flower', 'heart', 'car', or anything else the user requests)" },
              x: { type: "number", description: "Top-left X position in pixels (0-5000)" },
              y: { type: "number", description: "Top-left Y position in pixels (0-5000)" },
              size: { type: "number", description: "Size of the drawing in pixels (default 100)" },
              color: { type: "string", description: "Hex color code for the drawing (default #000000)" },
              strokeWidth: { type: "number", description: "Stroke width in pixels 1-10 (default 2)" }
            },
            required: ["objectName", "x", "y"]
          }
        }
      },
      
      // MANIPULATION TOOLS
      {
        type: "function" as const,
        function: {
          name: "moveShape",
          description: "Moves an existing shape to a new position. MUST call getCanvasState first to find the shapeId.",
          parameters: {
            type: "object",
            properties: {
              shapeId: { type: "string", description: "ID of the shape to move" },
              x: { type: "number", description: "New X position" },
              y: { type: "number", description: "New Y position" }
            },
            required: ["shapeId", "x", "y"]
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "resizeShape",
          description: "Changes the dimensions of a shape. For rectangles/triangles use width/height, for circles use radius. MUST call getCanvasState first to find the shapeId.",
          parameters: {
            type: "object",
            properties: {
              shapeId: { type: "string", description: "ID of the shape to resize" },
              width: { type: "number", description: "New width in pixels (for rectangles/triangles)" },
              height: { type: "number", description: "New height in pixels (for rectangles/triangles)" },
              radius: { type: "number", description: "New radius in pixels (for circles)" }
            },
            required: ["shapeId"]
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "rotateShape",
          description: "Rotates a shape by specified degrees. MUST call getCanvasState first to find the shapeId.",
          parameters: {
            type: "object",
            properties: {
              shapeId: { type: "string", description: "ID of the shape to rotate" },
              rotation: { type: "number", description: "Rotation angle in degrees (0-360)" }
            },
            required: ["shapeId", "rotation"]
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "duplicateShape",
          description: "Creates a copy of an existing shape with a small offset. MUST call getCanvasState first to find the shapeId.",
          parameters: {
            type: "object",
            properties: {
              shapeId: { type: "string", description: "ID of the shape to duplicate" }
            },
            required: ["shapeId"]
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "deleteShape",
          description: "Deletes a shape from the canvas. MUST call getCanvasState first to find the shapeId.",
          parameters: {
            type: "object",
            properties: {
              shapeId: { type: "string", description: "ID of the shape to delete" }
            },
            required: ["shapeId"]
          }
        }
      },
      
      // CANVAS STATE TOOL
      {
        type: "function" as const,
        function: {
          name: "getCanvasState",
          description: "Returns all shapes currently on canvas. ALWAYS call this FIRST before manipulating existing shapes to get their IDs and properties.",
          parameters: {
            type: "object",
            properties: {},
            required: []
          }
        }
      }
    ];
  }
}

