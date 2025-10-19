/**
 * Integration Tests: Spray Paint Tool
 * 
 * Tests the complete spray tool workflow: user simulation, state inspection, and multi-user sync
 * Target: <100ms sync latency, 60 FPS performance, smooth particle generation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../setup';
import Canvas from '../../src/components/Canvas/Canvas';
import type { ShapeData } from '../../src/services/canvasService';

describe('Spray Paint Tool - Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('User Simulation ("Does it click?")', () => {
    it('should activate spray tool when button is clicked', async () => {
      const { container } = await renderWithProviders(<Canvas />);
      
      // Find and click spray tool button (💨 icon)
      const sprayButton = screen.getByTitle(/Spray Paint Tool/i);
      expect(sprayButton).toBeInTheDocument();
      
      sprayButton.click();
      
      // Button should show active state (visually highlighted)
      await waitFor(() => {
        expect(sprayButton).toHaveClass('active');
      });
    });

    it('should generate particles when user clicks and drags', async () => {
      const { container } = await renderWithProviders(<Canvas />);
      
      // Activate spray tool
      const sprayButton = screen.getByTitle(/Spray Paint Tool/i);
      sprayButton.click();
      
      // Simulate mouse down
      const canvas = container.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
      
      // Simulate spraying gesture (mouse down, move, up)
      canvas!.dispatchEvent(new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 100,
        bubbles: true
      }));
      
      // Wait for particles to be generated
      await waitFor(() => {
        // Check if particles are being rendered (preview)
        const circles = container.querySelectorAll('circle');
        expect(circles.length).toBeGreaterThan(0);
      });
      
      // Mouse up should finalize spray
      canvas!.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      
      // Spray should be saved
      await waitFor(() => {
        expect(screen.getByTestId(/spray-shape/i)).toBeInTheDocument();
      }, { timeout: 200 });
    });

    it('should show preview particles during spraying', async () => {
      const { container } = await renderWithProviders(<Canvas />);
      
      // Activate spray tool
      const sprayButton = screen.getByTitle(/Spray Paint Tool/i);
      sprayButton.click();
      
      const canvas = container.querySelector('canvas');
      
      // Start spraying
      canvas!.dispatchEvent(new MouseEvent('mousedown', {
        clientX: 150,
        clientY: 150,
        bubbles: true
      }));
      
      // Preview particles should appear immediately
      await waitFor(() => {
        const previewCircles = container.querySelectorAll('[data-preview="true"]');
        expect(previewCircles.length).toBeGreaterThan(0);
      });
      
      // Move mouse to generate more particles
      canvas!.dispatchEvent(new MouseEvent('mousemove', {
        clientX: 160,
        clientY: 160,
        bubbles: true
      }));
      
      await waitFor(() => {
        const previewCircles = container.querySelectorAll('[data-preview="true"]');
        expect(previewCircles.length).toBeGreaterThan(5); // Should have generated more
      });
    });
  });

  describe('State Inspection ("Is the logic correct?")', () => {
    it('should save spray to Firestore with correct structure', async () => {
      const { getFirestoreMock } = await renderWithProviders(<Canvas />);
      
      // Activate spray tool and spray
      const sprayButton = screen.getByTitle(/Spray Paint Tool/i);
      sprayButton.click();
      
      const canvas = screen.getByRole('canvas');
      
      // Spray particles
      canvas.dispatchEvent(new MouseEvent('mousedown', { clientX: 200, clientY: 200 }));
      await new Promise(resolve => setTimeout(resolve, 50)); // Let particles generate
      canvas.dispatchEvent(new MouseEvent('mouseup'));
      
      // Wait for Firestore write
      await waitFor(() => {
        const writes = getFirestoreMock().getWrites();
        expect(writes.length).toBeGreaterThan(0);
        
        const sprayWrite = writes.find((w: any) => w.data.type === 'spray');
        expect(sprayWrite).toBeDefined();
      }, { timeout: 150 });
      
      // Verify spray structure
      const writes = getFirestoreMock().getWrites();
      const sprayWrite = writes.find((w: any) => w.data.type === 'spray');
      
      expect(sprayWrite.data).toMatchObject({
        type: 'spray',
        color: expect.any(String),
        particles: expect.arrayContaining([
          expect.objectContaining({
            x: expect.any(Number),
            y: expect.any(Number),
            size: expect.any(Number)
          })
        ]),
        sprayRadius: expect.any(Number),
        particleSize: expect.any(Number),
        x: expect.any(Number),
        y: expect.any(Number),
        width: expect.any(Number),
        height: expect.any(Number),
        createdBy: expect.any(String),
        createdAt: expect.anything(),
        updatedAt: expect.anything(),
        zIndex: expect.any(Number)
      });
    });

    it('should generate particles within circular spray radius', async () => {
      const { getFirestoreMock } = await renderWithProviders(<Canvas />);
      
      // Activate spray tool and spray at specific location
      const sprayButton = screen.getByTitle(/Spray Paint Tool/i);
      sprayButton.click();
      
      const canvas = screen.getByRole('canvas');
      const centerX = 300;
      const centerY = 300;
      
      canvas.dispatchEvent(new MouseEvent('mousedown', { 
        clientX: centerX, 
        clientY: centerY 
      }));
      canvas.dispatchEvent(new MouseEvent('mouseup'));
      
      await waitFor(() => {
        const writes = getFirestoreMock().getWrites();
        const sprayWrite = writes.find((w: any) => w.data.type === 'spray');
        expect(sprayWrite).toBeDefined();
      });
      
      const sprayWrite = getFirestoreMock().getWrites().find((w: any) => w.data.type === 'spray');
      const particles = sprayWrite.data.particles;
      const sprayRadius = sprayWrite.data.sprayRadius;
      
      // Verify all particles are within the spray radius from center
      particles.forEach((particle: {x: number, y: number, size: number}) => {
        // Calculate absolute positions (particles are relative to spray's x, y)
        const absoluteX = particle.x + sprayWrite.data.x;
        const absoluteY = particle.y + sprayWrite.data.y;
        
        // Distance from spray center
        const distance = Math.sqrt(
          Math.pow(absoluteX - centerX, 2) + Math.pow(absoluteY - centerY, 2)
        );
        
        expect(distance).toBeLessThanOrEqual(sprayRadius);
      });
    });

    it('should sync spray to Firestore in <100ms', async () => {
      const { getFirestoreMock } = await renderWithProviders(<Canvas />);
      
      const startTime = performance.now();
      
      // Spray
      const sprayButton = screen.getByTitle(/Spray Paint Tool/i);
      sprayButton.click();
      
      const canvas = screen.getByRole('canvas');
      canvas.dispatchEvent(new MouseEvent('mousedown', { clientX: 100, clientY: 100 }));
      canvas.dispatchEvent(new MouseEvent('mouseup'));
      
      // Wait for sync
      await waitFor(() => {
        const writes = getFirestoreMock().getWrites();
        expect(writes.some((w: any) => w.data.type === 'spray')).toBe(true);
      }, { timeout: 150 });
      
      const endTime = performance.now();
      const syncLatency = endTime - startTime;
      
      expect(syncLatency).toBeLessThan(100);
    });

    it('should reject invalid spray data (empty particles)', async () => {
      // This tests service layer validation
      const { canvasService } = await renderWithProviders(<Canvas />);
      
      await expect(
        canvasService.createSpray({
          particles: [],
          color: '#ff0000',
          sprayRadius: 20,
          particleSize: 2,
          createdBy: 'test-user'
        })
      ).rejects.toThrow('Spray must have at least 1 particle');
    });

    it('should reject invalid spray radius', async () => {
      const { canvasService } = await renderWithProviders(<Canvas />);
      
      await expect(
        canvasService.createSpray({
          particles: [{x: 0, y: 0, size: 2}],
          color: '#ff0000',
          sprayRadius: 5, // Too small (min is 10)
          particleSize: 2,
          createdBy: 'test-user'
        })
      ).rejects.toThrow('Spray radius must be between 10 and 50 pixels');
    });
  });

  describe('Multi-User Collaboration Tests', () => {
    it('should sync spray across users in <100ms', async () => {
      const { container: container1, getFirestoreMock } = await renderWithProviders(<Canvas />, { 
        user: { uid: 'user-1', email: 'user1@test.com' } 
      });
      
      const { container: container2 } = await renderWithProviders(<Canvas />, { 
        user: { uid: 'user-2', email: 'user2@test.com' } 
      });
      
      const startTime = performance.now();
      
      // User 1 sprays
      const sprayButton1 = container1.querySelector('[title*="Spray Paint"]');
      sprayButton1!.click();
      
      const canvas1 = container1.querySelector('canvas');
      canvas1!.dispatchEvent(new MouseEvent('mousedown', { clientX: 100, clientY: 100 }));
      canvas1!.dispatchEvent(new MouseEvent('mouseup'));
      
      // User 2 should see the spray within 100ms
      await waitFor(() => {
        const spray = container2.querySelector('[data-type="spray"]');
        expect(spray).toBeInTheDocument();
      }, { timeout: 150 });
      
      const endTime = performance.now();
      const syncTime = endTime - startTime;
      
      expect(syncTime).toBeLessThan(100);
    });

    it('should support multiple users spraying simultaneously', async () => {
      const { getFirestoreMock } = await renderWithProviders(<Canvas />, { 
        user: { uid: 'user-1' } 
      });
      
      await renderWithProviders(<Canvas />, { 
        user: { uid: 'user-2' } 
      });
      
      // Both users spray at same time (no conflicts expected)
      // Each spray is an independent Firestore document
      
      await waitFor(() => {
        const writes = getFirestoreMock().getWrites();
        const sprays = writes.filter((w: any) => w.data.type === 'spray');
        expect(sprays.length).toBeGreaterThanOrEqual(2);
      });
    });
  });

  describe('Performance Tests', () => {
    it('should maintain 60 FPS during spraying with 50+ shapes', async () => {
      const { container, canvasService } = await renderWithProviders(<Canvas />);
      
      // Create 50 shapes
      for (let i = 0; i < 50; i++) {
        await canvasService.createShape({
          type: 'rectangle',
          x: i * 20,
          y: i * 10,
          width: 50,
          height: 50,
          color: '#ff0000',
          createdBy: 'test-user'
        });
      }
      
      await waitFor(() => {
        expect(container.querySelectorAll('[data-type="rectangle"]').length).toBe(50);
      });
      
      // Start spraying and measure FPS
      const sprayButton = screen.getByTitle(/Spray Paint Tool/i);
      sprayButton.click();
      
      const canvas = container.querySelector('canvas');
      
      const frameTimings: number[] = [];
      let lastFrameTime = performance.now();
      
      const measureFrame = () => {
        const currentTime = performance.now();
        const frameDuration = currentTime - lastFrameTime;
        frameTimings.push(frameDuration);
        lastFrameTime = currentTime;
        
        if (frameTimings.length < 60) {
          requestAnimationFrame(measureFrame);
        }
      };
      
      canvas!.dispatchEvent(new MouseEvent('mousedown', { clientX: 100, clientY: 100 }));
      requestAnimationFrame(measureFrame);
      
      // Spray for 1 second
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      canvas!.dispatchEvent(new MouseEvent('mouseup'));
      
      // Calculate average FPS
      const avgFrameDuration = frameTimings.reduce((a, b) => a + b, 0) / frameTimings.length;
      const avgFPS = 1000 / avgFrameDuration;
      
      expect(avgFPS).toBeGreaterThanOrEqual(55); // Allow small margin (55 FPS+)
    });

    it('should handle very long spray (1000+ particles) efficiently', async () => {
      const { getFirestoreMock } = await renderWithProviders(<Canvas />);
      
      const sprayButton = screen.getByTitle(/Spray Paint Tool/i);
      sprayButton.click();
      
      const canvas = screen.getByRole('canvas');
      
      canvas.dispatchEvent(new MouseEvent('mousedown', { clientX: 200, clientY: 200 }));
      
      // Hold for 3 seconds to generate many particles
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      canvas.dispatchEvent(new MouseEvent('mouseup'));
      
      await waitFor(() => {
        const writes = getFirestoreMock().getWrites();
        const sprayWrite = writes.find((w: any) => w.data.type === 'spray');
        expect(sprayWrite).toBeDefined();
      });
      
      const sprayWrite = getFirestoreMock().getWrites().find((w: any) => w.data.type === 'spray');
      
      // Should have generated many particles
      expect(sprayWrite.data.particles.length).toBeGreaterThan(100);
      
      // Should still save successfully
      expect(sprayWrite.data.type).toBe('spray');
    });
  });

  describe('Visual Tests (Rendering)', () => {
    it('should render spray with correct color', async () => {
      const { container } = await renderWithProviders(<Canvas />);
      
      // Set color to green
      const greenColor = screen.getByTitle(/Green/i);
      greenColor.click();
      
      // Spray
      const sprayButton = screen.getByTitle(/Spray Paint Tool/i);
      sprayButton.click();
      
      const canvas = container.querySelector('canvas');
      canvas!.dispatchEvent(new MouseEvent('mousedown', { clientX: 100, clientY: 100 }));
      canvas!.dispatchEvent(new MouseEvent('mouseup'));
      
      await waitFor(() => {
        const sprayShape = container.querySelector('[data-type="spray"]');
        expect(sprayShape).toHaveAttribute('fill', '#10b981'); // Green color
      });
    });

    it('should render particles at correct size', async () => {
      const { container, getFirestoreMock } = await renderWithProviders(<Canvas />);
      
      const sprayButton = screen.getByTitle(/Spray Paint Tool/i);
      sprayButton.click();
      
      const canvas = container.querySelector('canvas');
      canvas!.dispatchEvent(new MouseEvent('mousedown', { clientX: 100, clientY: 100 }));
      canvas!.dispatchEvent(new MouseEvent('mouseup'));
      
      await waitFor(() => {
        const writes = getFirestoreMock().getWrites();
        const sprayWrite = writes.find((w: any) => w.data.type === 'spray');
        expect(sprayWrite).toBeDefined();
      });
      
      const sprayWrite = getFirestoreMock().getWrites().find((w: any) => w.data.type === 'spray');
      
      // All particles should have consistent size
      expect(sprayWrite.data.particleSize).toBe(2); // Default particle size
      sprayWrite.data.particles.forEach((p: any) => {
        expect(p.size).toBe(2);
      });
    });

    it('should support spray selection, move, and delete', async () => {
      const { container } = await renderWithProviders(<Canvas />);
      
      // Create spray
      const sprayButton = screen.getByTitle(/Spray Paint Tool/i);
      sprayButton.click();
      
      const canvas = container.querySelector('canvas');
      canvas!.dispatchEvent(new MouseEvent('mousedown', { clientX: 100, clientY: 100 }));
      canvas!.dispatchEvent(new MouseEvent('mouseup'));
      
      await waitFor(() => {
        expect(container.querySelector('[data-type="spray"]')).toBeInTheDocument();
      });
      
      // Select spray
      const selectButton = screen.getByTitle(/Select/i);
      selectButton.click();
      
      const sprayShape = container.querySelector('[data-type="spray"]');
      sprayShape!.click();
      
      // Should show selection indicator
      await waitFor(() => {
        expect(sprayShape).toHaveClass('selected');
      });
      
      // Delete spray
      const deleteButton = screen.getByTitle(/Delete/i);
      deleteButton.click();
      
      await waitFor(() => {
        expect(container.querySelector('[data-type="spray"]')).not.toBeInTheDocument();
      });
    });
  });
});

