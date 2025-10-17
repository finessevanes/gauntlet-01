import OpenAI from 'openai';
import { canvasService } from './canvasService';
import { getSystemPrompt } from '../utils/aiPrompts';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../utils/constants';

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
      // 1. Get current canvas state for context
      const shapes = await canvasService.getShapes();
      
      // 2. Call OpenAI with function tools
      const response = await this.openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          { role: "system", content: getSystemPrompt(shapes) },
          { role: "user", content: prompt }
        ],
        tools: this.getToolDefinitions(),
        tool_choice: "auto",
        temperature: 0.7,
        max_tokens: 500
      });
      
      const message = response.choices[0].message;
      
      // 3. Execute tool calls
      if (message.tool_calls && message.tool_calls.length > 0) {
        const results = await this.executeToolCalls(message.tool_calls, userId);
        return {
          success: true,
          message: this.generateSuccessMessage(results),
          toolCalls: results
        };
      } else {
        return {
          success: false,
          message: message.content || "I couldn't understand that command.",
          toolCalls: []
        };
      }
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
    for (const call of toolCalls) {
      try {
        const result = await this.executeSingleTool(call, userId);
        results.push({
          tool: call.function.name,
          success: true,
          result: result
        });
      } catch (error: any) {
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
        `⚠️ Position out of bounds: (${x}, ${y}). Canvas bounds are 0-${CANVAS_WIDTH} × 0-${CANVAS_HEIGHT} pixels.`
      );
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
        return await canvasService.createText(
          args.text,
          args.x,
          args.y,
          args.color || '#000000',
          userId,
          {
            fontSize: args.fontSize || 16,
            fontWeight: args.fontWeight || 'normal',
            fontStyle: args.fontStyle || 'normal',
            textDecoration: args.textDecoration || 'none'
          }
        );
        
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
    
    const toolNames = results.map(r => r.tool);
    
    // Generate specific messages based on tools used
    if (toolNames.includes('createRectangle') && toolNames.length === 1) {
      return '✓ Created 1 rectangle';
    }
    
    if (toolNames.includes('createCircle') && toolNames.length === 1) {
      return '✓ Created 1 circle';
    }
    
    if (toolNames.includes('createTriangle') && toolNames.length === 1) {
      return '✓ Created 1 triangle';
    }
    
    if (toolNames.includes('createText') && toolNames.length === 1) {
      return '✓ Created text layer';
    }
    
    // Multi-step operations
    const shapeCount = toolNames.filter(t => 
      ['createRectangle', 'createCircle', 'createTriangle'].includes(t)
    ).length;
    const textCount = toolNames.filter(t => t === 'createText').length;
    
    if (shapeCount > 1 || textCount > 1) {
      return `✓ Created ${shapeCount + textCount} elements`;
    }
    
    return `✓ Completed ${successCount} actions`;
  }
  
  private getToolDefinitions() {
    return [
      {
        type: "function",
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
        type: "function",
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
        type: "function",
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
        type: "function",
        function: {
          name: "createText",
          description: "Creates a text layer at specified position with optional fontSize, color, and formatting.",
          parameters: {
            type: "object",
            properties: {
              text: { type: "string", description: "Text content to display" },
              x: { type: "number", description: "X position in pixels" },
              y: { type: "number", description: "Y position in pixels" },
              fontSize: { type: "number", description: "Font size in pixels (default 16)" },
              color: { type: "string", description: "Text color hex code (default #000000)" },
              fontWeight: { 
                type: "string", 
                enum: ["normal", "bold"], 
                description: "Font weight (default normal)" 
              },
              fontStyle: { 
                type: "string", 
                enum: ["normal", "italic"], 
                description: "Font style (default normal)" 
              },
              textDecoration: { 
                type: "string", 
                enum: ["none", "underline"], 
                description: "Text decoration (default none)" 
              }
            },
            required: ["text", "x", "y"]
          }
        }
      }
    ];
  }
}

