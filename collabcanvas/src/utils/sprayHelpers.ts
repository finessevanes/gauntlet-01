/**
 * Spray Paint Tool - Particle Generation and Helpers
 * 
 * This module provides utilities for generating and managing spray paint particles.
 * Uses uniform random distribution within a circular area for natural-looking spray effects.
 */

/**
 * Generate random particles within a circular area
 * Uses polar coordinates with square root transformation for uniform distribution
 * 
 * @param centerX - Center X position (absolute canvas coordinates)
 * @param centerY - Center Y position (absolute canvas coordinates)
 * @param radius - Spray radius (10-50px)
 * @param density - Number of particles to generate per call
 * @param particleSize - Size of each particle (1-3px)
 * @returns Array of particle objects with absolute x, y coordinates and size
 */
export function generateSprayParticles(
  centerX: number,
  centerY: number,
  radius: number,
  density: number,
  particleSize: number
): Array<{x: number, y: number, size: number}> {
  const particles: Array<{x: number, y: number, size: number}> = [];
  
  for (let i = 0; i < density; i++) {
    // Generate random angle (0 to 2π)
    const angle = Math.random() * 2 * Math.PI;
    
    // Generate random radius with square root for uniform area distribution
    // Without sqrt, particles would cluster at center
    const r = Math.sqrt(Math.random()) * radius;
    
    // Convert polar to Cartesian coordinates
    const x = centerX + r * Math.cos(angle);
    const y = centerY + r * Math.sin(angle);
    
    particles.push({ x, y, size: particleSize });
  }
  
  return particles;
}

/**
 * Calculate bounding box from particle positions
 * 
 * @param particles - Array of particle objects with x, y coordinates
 * @returns Bounding box with x, y, width, height
 */
export function calculateParticleBoundingBox(
  particles: Array<{x: number, y: number, size: number}>
): { x: number, y: number, width: number, height: number } {
  if (particles.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  
  const xs = particles.map(p => p.x);
  const ys = particles.map(p => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}

/**
 * Convert particle positions to relative coordinates
 * (relative to a given origin point)
 * 
 * @param particles - Array of particles with absolute x, y coordinates
 * @param originX - Origin X coordinate
 * @param originY - Origin Y coordinate
 * @returns Array of particles with relative coordinates
 */
export function makeParticlesRelative(
  particles: Array<{x: number, y: number, size: number}>,
  originX: number,
  originY: number
): Array<{x: number, y: number, size: number}> {
  return particles.map(p => ({
    x: p.x - originX,
    y: p.y - originY,
    size: p.size
  }));
}

/**
 * Convert particle positions from relative to absolute coordinates
 * (add origin offset to relative coordinates)
 * 
 * @param particles - Array of particles with relative x, y coordinates
 * @param originX - Origin X coordinate
 * @param originY - Origin Y coordinate
 * @returns Array of particles with absolute coordinates
 */
export function makeParticlesAbsolute(
  particles: Array<{x: number, y: number, size: number}>,
  originX: number,
  originY: number
): Array<{x: number, y: number, size: number}> {
  return particles.map(p => ({
    x: p.x + originX,
    y: p.y + originY,
    size: p.size
  }));
}

