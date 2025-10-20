import { describe, it, expect } from 'vitest';
import { generateCreativeDrawing } from '../../../src/utils/creativeDrawing';

describe('Silly Anatomy Drawings', () => {
  it('should generate penis drawing', () => {
    const points = generateCreativeDrawing('penis', 100, 100, 100);
    expect(points).toBeDefined();
    expect(points.length).toBeGreaterThan(10);
    expect(points[0]).toHaveProperty('x');
    expect(points[0]).toHaveProperty('y');
  });

  it('should handle synonyms for penis', () => {
    const penis1 = generateCreativeDrawing('penis', 100, 100, 100);
    const penis2 = generateCreativeDrawing('dick', 100, 100, 100);
    const penis3 = generateCreativeDrawing('cock', 100, 100, 100);
    
    expect(penis1.length).toBe(penis2.length);
    expect(penis2.length).toBe(penis3.length);
  });

  it('should generate boobs drawing', () => {
    const points = generateCreativeDrawing('boobs', 100, 100, 100);
    expect(points).toBeDefined();
    expect(points.length).toBeGreaterThan(20);
  });

  it('should handle synonyms for boobs', () => {
    const boobs1 = generateCreativeDrawing('boobs', 100, 100, 100);
    const boobs2 = generateCreativeDrawing('breasts', 100, 100, 100);
    const boobs3 = generateCreativeDrawing('tits', 100, 100, 100);
    
    expect(boobs1.length).toBe(boobs2.length);
    expect(boobs2.length).toBe(boobs3.length);
  });

  it('should generate butt drawing', () => {
    const points = generateCreativeDrawing('butt', 100, 100, 100);
    expect(points).toBeDefined();
    expect(points.length).toBeGreaterThan(20);
  });

  it('should handle synonyms for butt', () => {
    const butt1 = generateCreativeDrawing('butt', 100, 100, 100);
    const butt2 = generateCreativeDrawing('ass', 100, 100, 100);
    
    expect(butt1.length).toBe(butt2.length);
  });

  it('should scale drawings based on size parameter', () => {
    const small = generateCreativeDrawing('penis', 100, 100, 50);
    const large = generateCreativeDrawing('penis', 100, 100, 200);
    
    expect(small.length).toBe(large.length); // Same number of points
    // But different positions (scaled)
    expect(small[0].x).not.toBe(large[0].x);
  });
});

