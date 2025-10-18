import OpenAI from 'openai';
import { canvasService } from './canvasService';
import { getSystemPrompt } from '../utils/aiPrompts';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../utils/constants';
import { doc, getDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { firestore } from '../firebase';

interface CommandResult {
  success: boolean;
  message: string;
  toolCalls: any[];
}

export class AIService {
  private openai: OpenAI;
  
  constructor() {
    this.openai = new OpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true
    });
  }
  
  async executeCommand(prompt: string, userId: string): Promise<CommandResult> {
    try {
      // 1. Build conversation messages (don't pass shapes - let AI call getCanvasState for fresh data)
      const messages: any[] = [
        { role: "system", content: getSystemPrompt([]) }, // Empty array - AI will call getCanvasState
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
          const results = await this.executeToolCalls(message.tool_calls, userId);
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
      console.warn('⚠️ Hit max iterations in function calling loop');
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
  
  private async executeToolCalls(toolCalls: any[], userId: string) {
    const results = [];
    console.log(`🤖 AI making ${toolCalls.length} tool call(s):`, toolCalls.map(c => c.function.name));
    
    for (const call of toolCalls) {
      try {
        console.log(`🔧 Executing: ${call.function.name}`, JSON.parse(call.function.arguments));
        const result = await this.executeSingleTool(call, userId);
        console.log(`✅ ${call.function.name} succeeded:`, result);
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

  /**
   * Helper function to arrange shapes in a horizontal row with even spacing
   */
  private async arrangeInRow(shapeIds: string[], startX: number = 100, startY: number = 100, spacing: number = 50): Promise<void> {
    try {
      // Fetch all shapes
      const shapeDocs = await Promise.all(
        shapeIds.map(id => getDoc(doc(firestore, 'canvases/main/shapes', id)))
      );

      const shapes = shapeDocs
        .filter(docSnap => docSnap.exists())
        .map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as any));

      if (shapes.length === 0) {
        throw new Error('No valid shapes found to arrange');
      }

      // Sort shapes by x position (left to right)
      shapes.sort((a, b) => a.x - b.x);

      // Calculate total width needed
      let totalWidth = 0;
      shapes.forEach(shape => {
        const shapeWidth = shape.width || (shape.radius ? shape.radius * 2 : 100);
        totalWidth += shapeWidth;
      });
      totalWidth += spacing * (shapes.length - 1);

      // Calculate starting position to center the row
      const rowStartX = startX;

      // Update positions with batch write
      const batch = writeBatch(firestore);
      let currentX = rowStartX;

      shapes.forEach((shape) => {
        const shapeWidth = shape.width || (shape.radius ? shape.radius * 2 : 100);
        const shapeRef = doc(firestore, 'canvases/main/shapes', shape.id);
        
        // Calculate new position
        let newX = currentX;
        let newY = startY;

        // For circles, adjust x to account for center positioning
        if (shape.type === 'circle' && shape.radius) {
          newX = currentX + shape.radius;
        }

        // For other shapes, y might need adjustment for center alignment
        if (shape.type !== 'circle') {
          newY = startY;
        } else {
          newY = startY;
        }

        batch.update(shapeRef, {
          x: newX,
          y: newY,
          updatedAt: serverTimestamp(),
        });

        // Move to next position
        currentX += shapeWidth + spacing;
      });

      await batch.commit();
      console.log(`✅ Arranged ${shapes.length} shapes in horizontal row`);
    } catch (error) {
      console.error('❌ Error arranging shapes in row:', error);
      throw error;
    }
  }

  private async executeSingleTool(call: any, userId: string) {
    const { name, arguments: argsStr } = call.function;
    const args = JSON.parse(argsStr);
    
    switch (name) {
      case 'createRectangle':
        this.validatePosition(args.x, args.y, 'rectangle');
        return await canvasService.createShape({
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
        return await canvasService.createCircle({
          x: args.x,
          y: args.y,
          radius: args.radius,
          color: args.color,
          createdBy: userId
        });
        
      case 'createTriangle':
        this.validatePosition(args.x, args.y, 'triangle');
        return await canvasService.createTriangle({
          x: args.x,
          y: args.y,
          width: args.width,
          height: args.height,
          color: args.color,
          createdBy: userId
        });
        
      case 'createText':
        this.validatePosition(args.x, args.y, 'text');
        return await canvasService.createText({
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
      
      // MANIPULATION TOOLS
      case 'moveShape':
        return await canvasService.updateShape(args.shapeId, {
          x: args.x,
          y: args.y
        });
        
      case 'resizeShape':
        if (args.radius !== undefined) {
          // Circle resize
          return await canvasService.resizeCircle(args.shapeId, args.radius);
        } else {
          // Rectangle/Triangle resize
          return await canvasService.resizeShape(
            args.shapeId,
            args.width,
            args.height
          );
        }
        
      case 'rotateShape':
        return await canvasService.rotateShape(
          args.shapeId,
          args.rotation
        );
        
      case 'duplicateShape':
        return await canvasService.duplicateShape(args.shapeId, userId);
        
      case 'deleteShape':
        return await canvasService.deleteShape(args.shapeId);
        
      case 'getCanvasState':
        // Get shapes and sort by last interaction (updatedAt desc)
        const shapes = await canvasService.getShapes();
        return shapes.sort((a, b) => {
          const timeA = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : (a.createdAt?.toMillis ? a.createdAt.toMillis() : 0);
          const timeB = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : (b.createdAt?.toMillis ? b.createdAt.toMillis() : 0);
          return timeB - timeA; // Descending (last touched first)
        });

      // ADVANCED TOOLS
      case 'groupShapes':
        const groupId = await canvasService.groupShapes(args.shapeIds, userId, args.name);
        // Return group info for success message formatting
        return { groupId, name: args.name || `Group ${groupId.slice(0, 6)}` };
        
      case 'alignShapes':
        return await canvasService.alignShapes(args.shapeIds, args.alignment);
        
      case 'arrangeShapesInRow':
        return await this.arrangeInRow(args.shapeIds, args.startX, args.startY, args.spacing);
        
      case 'bringToFront':
        return await canvasService.bringToFront(args.shapeId);
        
      case 'addComment':
        return await canvasService.addComment(args.shapeId, args.text, userId, args.username || 'User');
        
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
      const result = actionResults[0];
      switch (tool) {
        case 'createRectangle': return '✓ Created 1 rectangle';
        case 'createCircle': return '✓ Created 1 circle';
        case 'createTriangle': return '✓ Created 1 triangle';
        case 'createText': return '✓ Created 1 text element';
        case 'moveShape': return '✓ Moved shape to new position';
        case 'resizeShape': return '✓ Resized shape';
        case 'rotateShape': return '✓ Rotated shape';
        case 'duplicateShape': return '✓ Duplicated shape';
        case 'deleteShape': return '✓ Deleted shape';
        case 'groupShapes': {
          // Get group name from result if available
          const groupName = result.result?.name || 'shapes';
          return `✓ Grouped shapes as "${groupName}"`;
        }
        case 'alignShapes': return '✓ Aligned shapes';
        case 'arrangeShapesInRow': return '✓ Arranged shapes in horizontal row';
        case 'bringToFront': return '✓ Brought shape to front';
        case 'addComment': return '✓ Added comment';
        default: return '✓ Action completed';
      }
    }
    
    // Multi-step operations - check for semantic pattern creation (creation + grouping)
    const creationCount = toolNames.filter(t => 
      ['createRectangle', 'createCircle', 'createTriangle', 'createText'].includes(t)
    ).length;
    
    const hasGrouping = toolNames.includes('groupShapes');
    
    // If we created multiple elements AND grouped them, this is a semantic pattern
    if (creationCount > 1 && hasGrouping) {
      // Find the groupShapes result to get the group name
      const groupResult = actionResults.find(r => r.tool === 'groupShapes');
      const groupName = groupResult?.result?.name || 'elements';
      return `✓ Created ${groupName} (${creationCount} elements grouped)`;
    }
    
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
      },
      
      // ADVANCED TOOLS
      {
        type: "function" as const,
        function: {
          name: "groupShapes",
          description: "Groups multiple shapes together so they move as one unit. MUST call getCanvasState first to get shapeIds.",
          parameters: {
            type: "object",
            properties: {
              shapeIds: { type: "array", items: { type: "string" }, description: "Array of shape IDs to group together" },
              name: { type: "string", description: "Optional name for the group" }
            },
            required: ["shapeIds"]
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "alignShapes",
          description: "Aligns multiple shapes along a common edge or center. MUST call getCanvasState first to get shapeIds.",
          parameters: {
            type: "object",
            properties: {
              shapeIds: { type: "array", items: { type: "string" }, description: "Array of shape IDs to align" },
              alignment: { 
                type: "string", 
                enum: ["left", "center", "right", "top", "middle", "bottom"],
                description: "Alignment type: left, center, right, top, middle, or bottom"
              }
            },
            required: ["shapeIds", "alignment"]
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "arrangeShapesInRow",
          description: "Arranges multiple shapes in a horizontal row with even spacing. CRITICAL for layout commands. MUST call getCanvasState first to get shapeIds.",
          parameters: {
            type: "object",
            properties: {
              shapeIds: { type: "array", items: { type: "string" }, description: "Array of shape IDs to arrange in a row" },
              startX: { type: "number", description: "Starting X position for the row (default 100)" },
              startY: { type: "number", description: "Y position for all shapes in the row (default 100)" },
              spacing: { type: "number", description: "Spacing between shapes in pixels (default 50)" }
            },
            required: ["shapeIds"]
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "bringToFront",
          description: "Brings a shape to the front (highest z-index). MUST call getCanvasState first to get shapeId.",
          parameters: {
            type: "object",
            properties: {
              shapeId: { type: "string", description: "ID of the shape to bring to front" }
            },
            required: ["shapeId"]
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "addComment",
          description: "Adds a comment to a specific shape for collaboration. MUST call getCanvasState first to get shapeId.",
          parameters: {
            type: "object",
            properties: {
              shapeId: { type: "string", description: "ID of the shape to comment on" },
              text: { type: "string", description: "Comment text" },
              username: { type: "string", description: "Username of the commenter" }
            },
            required: ["shapeId", "text"]
          }
        }
      }
    ];
  }
}

