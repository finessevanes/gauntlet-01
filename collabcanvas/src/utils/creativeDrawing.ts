/**
 * Creative Drawing Utility
 * Generates simple, child-like path drawings for common objects
 * Used by AI to handle creative drawing prompts like "draw a dog", "draw a smiley face", etc.
 */

export interface Point {
  x: number;
  y: number;
}

/**
 * Generate a simple drawing based on the object name
 * Returns an array of points that form a child-like drawing
 */
export function generateCreativeDrawing(
  objectName: string,
  x: number,
  y: number,
  size: number = 100
): Point[] {
  const normalized = objectName.toLowerCase().trim();
  
  // Try to match common objects (with synonyms)
  if (normalized.includes('dog') || normalized.includes('puppy') || normalized.includes('doggy')) {
    return generateDog(x, y, size);
  }
  
  if (normalized.includes('cat') || normalized.includes('kitty') || normalized.includes('kitten')) {
    return generateCat(x, y, size);
  }
  
  if (normalized.includes('face') || normalized.includes('smiley') || normalized.includes('smile')) {
    return generateSmileyFace(x, y, size);
  }
  
  if (normalized.includes('house') || normalized.includes('home')) {
    return generateHouse(x, y, size);
  }
  
  if (normalized.includes('tree')) {
    return generateTree(x, y, size);
  }
  
  if (normalized.includes('sun')) {
    return generateSun(x, y, size);
  }
  
  if (normalized.includes('star')) {
    return generateStar(x, y, size);
  }
  
  if (normalized.includes('flower')) {
    return generateFlower(x, y, size);
  }
  
  if (normalized.includes('heart')) {
    return generateHeart(x, y, size);
  }
  
  if (normalized.includes('car')) {
    return generateCar(x, y, size);
  }
  
  // Silly/funny anatomy drawings (very simple, childish style)
  if (normalized.includes('penis') || normalized.includes('dick') || normalized.includes('cock')) {
    return generateSillyAnatomy(x, y, size, 'male');
  }
  
  if (normalized.includes('boob') || normalized.includes('breast') || normalized.includes('tit')) {
    return generateSillyAnatomy(x, y, size, 'boobs');
  }
  
  if (normalized.includes('butt') || normalized.includes('ass')) {
    return generateSillyAnatomy(x, y, size, 'butt');
  }
  
  // Default: draw a simple stick figure
  return generateStickFigure(x, y, size);
}

/**
 * Simple dog drawing
 */
function generateDog(x: number, y: number, size: number): Point[] {
  const s = size / 100; // Scale factor
  
  return [
    // Body (rectangle-ish)
    { x: x + 30 * s, y: y + 40 * s },
    { x: x + 70 * s, y: y + 40 * s },
    { x: x + 70 * s, y: y + 60 * s },
    { x: x + 30 * s, y: y + 60 * s },
    { x: x + 30 * s, y: y + 40 * s },
    
    // Head (circle-ish)
    { x: x + 20 * s, y: y + 30 * s },
    { x: x + 10 * s, y: y + 20 * s },
    { x: x + 20 * s, y: y + 10 * s },
    { x: x + 30 * s, y: y + 15 * s },
    { x: x + 35 * s, y: y + 25 * s },
    { x: x + 30 * s, y: y + 35 * s },
    { x: x + 30 * s, y: y + 40 * s },
    
    // Legs (4 lines)
    { x: x + 35 * s, y: y + 60 * s },
    { x: x + 35 * s, y: y + 80 * s },
    { x: x + 35 * s, y: y + 60 * s },
    { x: x + 45 * s, y: y + 60 * s },
    { x: x + 45 * s, y: y + 80 * s },
    { x: x + 45 * s, y: y + 60 * s },
    { x: x + 55 * s, y: y + 60 * s },
    { x: x + 55 * s, y: y + 80 * s },
    { x: x + 55 * s, y: y + 60 * s },
    { x: x + 65 * s, y: y + 60 * s },
    { x: x + 65 * s, y: y + 80 * s },
    
    // Tail
    { x: x + 70 * s, y: y + 45 * s },
    { x: x + 85 * s, y: y + 35 * s },
  ];
}

/**
 * Simple cat drawing
 */
function generateCat(x: number, y: number, size: number): Point[] {
  const s = size / 100;
  
  return [
    // Body
    { x: x + 30 * s, y: y + 50 * s },
    { x: x + 70 * s, y: y + 50 * s },
    { x: x + 70 * s, y: y + 70 * s },
    { x: x + 30 * s, y: y + 70 * s },
    { x: x + 30 * s, y: y + 50 * s },
    
    // Head (circle)
    { x: x + 25 * s, y: y + 40 * s },
    { x: x + 15 * s, y: y + 30 * s },
    { x: x + 15 * s, y: y + 20 * s },
    { x: x + 25 * s, y: y + 10 * s },
    { x: x + 35 * s, y: y + 10 * s },
    { x: x + 45 * s, y: y + 20 * s },
    { x: x + 45 * s, y: y + 30 * s },
    { x: x + 35 * s, y: y + 40 * s },
    { x: x + 30 * s, y: y + 50 * s },
    
    // Ears (two triangles)
    { x: x + 20 * s, y: y + 15 * s },
    { x: x + 15 * s, y: y + 5 * s },
    { x: x + 25 * s, y: y + 10 * s },
    { x: x + 35 * s, y: y + 10 * s },
    { x: x + 40 * s, y: y + 5 * s },
    { x: x + 35 * s, y: y + 15 * s },
    
    // Tail
    { x: x + 70 * s, y: y + 55 * s },
    { x: x + 85 * s, y: y + 50 * s },
    { x: x + 90 * s, y: y + 40 * s },
  ];
}

/**
 * Smiley face
 */
function generateSmileyFace(x: number, y: number, size: number): Point[] {
  const s = size / 100;
  const cx = x + 50 * s;
  const cy = y + 50 * s;
  const r = 40 * s;
  
  const circle: Point[] = [];
  // Draw circle
  for (let i = 0; i <= 32; i++) {
    const angle = (i / 32) * Math.PI * 2;
    circle.push({
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
    });
  }
  
  // Add eyes (two small circles)
  const leftEye: Point[] = [];
  for (let i = 0; i <= 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    leftEye.push({
      x: cx - 15 * s + Math.cos(angle) * 5 * s,
      y: cy - 10 * s + Math.sin(angle) * 5 * s,
    });
  }
  
  const rightEye: Point[] = [];
  for (let i = 0; i <= 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    rightEye.push({
      x: cx + 15 * s + Math.cos(angle) * 5 * s,
      y: cy - 10 * s + Math.sin(angle) * 5 * s,
    });
  }
  
  // Add smile (arc)
  const smile: Point[] = [];
  for (let i = 0; i <= 16; i++) {
    const angle = Math.PI / 6 + (i / 16) * (Math.PI * 2 / 3);
    smile.push({
      x: cx + Math.cos(angle) * 25 * s,
      y: cy + Math.sin(angle) * 25 * s,
    });
  }
  
  return [...circle, ...leftEye, ...rightEye, ...smile];
}

/**
 * Simple house
 */
function generateHouse(x: number, y: number, size: number): Point[] {
  const s = size / 100;
  
  return [
    // Square base
    { x: x + 20 * s, y: y + 40 * s },
    { x: x + 80 * s, y: y + 40 * s },
    { x: x + 80 * s, y: y + 90 * s },
    { x: x + 20 * s, y: y + 90 * s },
    { x: x + 20 * s, y: y + 40 * s },
    
    // Roof (triangle)
    { x: x + 10 * s, y: y + 40 * s },
    { x: x + 50 * s, y: y + 10 * s },
    { x: x + 90 * s, y: y + 40 * s },
    
    // Door
    { x: x + 40 * s, y: y + 60 * s },
    { x: x + 60 * s, y: y + 60 * s },
    { x: x + 60 * s, y: y + 90 * s },
    { x: x + 40 * s, y: y + 90 * s },
    { x: x + 40 * s, y: y + 60 * s },
  ];
}

/**
 * Simple tree
 */
function generateTree(x: number, y: number, size: number): Point[] {
  const s = size / 100;
  
  return [
    // Trunk
    { x: x + 45 * s, y: y + 60 * s },
    { x: x + 55 * s, y: y + 60 * s },
    { x: x + 55 * s, y: y + 90 * s },
    { x: x + 45 * s, y: y + 90 * s },
    { x: x + 45 * s, y: y + 60 * s },
    
    // Foliage (circle)
    { x: x + 50 * s, y: y + 20 * s },
    { x: x + 70 * s, y: y + 30 * s },
    { x: x + 75 * s, y: y + 50 * s },
    { x: x + 60 * s, y: y + 65 * s },
    { x: x + 40 * s, y: y + 65 * s },
    { x: x + 25 * s, y: y + 50 * s },
    { x: x + 30 * s, y: y + 30 * s },
    { x: x + 50 * s, y: y + 20 * s },
  ];
}

/**
 * Simple sun
 */
function generateSun(x: number, y: number, size: number): Point[] {
  const s = size / 100;
  const cx = x + 50 * s;
  const cy = y + 50 * s;
  const r = 25 * s;
  
  const points: Point[] = [];
  
  // Draw circle
  for (let i = 0; i <= 24; i++) {
    const angle = (i / 24) * Math.PI * 2;
    points.push({
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
    });
  }
  
  // Add rays (8 lines radiating outward)
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    points.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
    points.push({ x: cx + Math.cos(angle) * (r + 15 * s), y: cy + Math.sin(angle) * (r + 15 * s) });
    points.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
  }
  
  return points;
}

/**
 * Simple star (5-pointed)
 */
function generateStar(x: number, y: number, size: number): Point[] {
  const s = size / 100;
  const cx = x + 50 * s;
  const cy = y + 50 * s;
  const outerR = 40 * s;
  const innerR = 16 * s;
  
  const points: Point[] = [];
  
  for (let i = 0; i <= 10; i++) {
    const angle = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    points.push({
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
    });
  }
  
  return points;
}

/**
 * Simple flower
 */
function generateFlower(x: number, y: number, size: number): Point[] {
  const s = size / 100;
  const cx = x + 50 * s;
  const cy = y + 40 * s;
  
  const points: Point[] = [];
  
  // Draw 5 petals (circles around center)
  for (let p = 0; p < 5; p++) {
    const petalAngle = (p / 5) * Math.PI * 2;
    const petalCx = cx + Math.cos(petalAngle) * 20 * s;
    const petalCy = cy + Math.sin(petalAngle) * 20 * s;
    
    for (let i = 0; i <= 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      points.push({
        x: petalCx + Math.cos(angle) * 12 * s,
        y: petalCy + Math.sin(angle) * 12 * s,
      });
    }
  }
  
  // Center circle
  for (let i = 0; i <= 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    points.push({
      x: cx + Math.cos(angle) * 8 * s,
      y: cy + Math.sin(angle) * 8 * s,
    });
  }
  
  // Stem
  points.push({ x: cx, y: cy });
  points.push({ x: cx, y: y + 90 * s });
  
  return points;
}

/**
 * Simple heart
 */
function generateHeart(x: number, y: number, size: number): Point[] {
  const s = size / 100;
  const cx = x + 50 * s;
  const cy = y + 40 * s;
  
  const points: Point[] = [];
  
  // Heart shape using parametric equation
  for (let t = 0; t <= 1; t += 0.05) {
    const angle = t * Math.PI * 2;
    const heartX = 16 * Math.pow(Math.sin(angle), 3);
    const heartY = -(13 * Math.cos(angle) - 5 * Math.cos(2 * angle) - 2 * Math.cos(3 * angle) - Math.cos(4 * angle));
    
    points.push({
      x: cx + heartX * 2 * s,
      y: cy + heartY * 2 * s,
    });
  }
  
  return points;
}

/**
 * Simple car
 */
function generateCar(x: number, y: number, size: number): Point[] {
  const s = size / 100;
  
  const points: Point[] = [
    // Body
    { x: x + 10 * s, y: y + 50 * s },
    { x: x + 90 * s, y: y + 50 * s },
    { x: x + 90 * s, y: y + 70 * s },
    { x: x + 10 * s, y: y + 70 * s },
    { x: x + 10 * s, y: y + 50 * s },
    
    // Cabin
    { x: x + 30 * s, y: y + 30 * s },
    { x: x + 70 * s, y: y + 30 * s },
    { x: x + 70 * s, y: y + 50 * s },
    { x: x + 30 * s, y: y + 50 * s },
    { x: x + 30 * s, y: y + 30 * s },
  ];
  
  // Wheels (two circles)
  const wheel1: Point[] = [];
  for (let i = 0; i <= 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    wheel1.push({
      x: x + 25 * s + Math.cos(angle) * 10 * s,
      y: y + 70 * s + Math.sin(angle) * 10 * s,
    });
  }
  
  const wheel2: Point[] = [];
  for (let i = 0; i <= 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    wheel2.push({
      x: x + 75 * s + Math.cos(angle) * 10 * s,
      y: y + 70 * s + Math.sin(angle) * 10 * s,
    });
  }
  
  return [...points, ...wheel1, ...wheel2];
}

/**
 * Simple stick figure
 */
function generateStickFigure(x: number, y: number, size: number): Point[] {
  const s = size / 100;
  
  return [
    // Head (circle)
    { x: x + 50 * s, y: y + 10 * s },
    { x: x + 60 * s, y: y + 15 * s },
    { x: x + 60 * s, y: y + 25 * s },
    { x: x + 50 * s, y: y + 30 * s },
    { x: x + 40 * s, y: y + 25 * s },
    { x: x + 40 * s, y: y + 15 * s },
    { x: x + 50 * s, y: y + 10 * s },
    
    // Body (line)
    { x: x + 50 * s, y: y + 30 * s },
    { x: x + 50 * s, y: y + 60 * s },
    
    // Arms (two lines)
    { x: x + 30 * s, y: y + 45 * s },
    { x: x + 50 * s, y: y + 40 * s },
    { x: x + 70 * s, y: y + 45 * s },
    
    // Legs (two lines)
    { x: x + 50 * s, y: y + 60 * s },
    { x: x + 35 * s, y: y + 90 * s },
    { x: x + 50 * s, y: y + 60 * s },
    { x: x + 65 * s, y: y + 90 * s },
  ];
}

/**
 * Silly anatomy drawings (very simple, cartoonish, for humor)
 */
function generateSillyAnatomy(x: number, y: number, size: number, type: 'male' | 'boobs' | 'butt'): Point[] {
  const s = size / 100;
  
  if (type === 'male') {
    // Simple, silly phallic shape
    return [
      // Shaft (rectangle)
      { x: x + 40 * s, y: y + 20 * s },
      { x: x + 60 * s, y: y + 20 * s },
      { x: x + 60 * s, y: y + 70 * s },
      { x: x + 40 * s, y: y + 70 * s },
      { x: x + 40 * s, y: y + 20 * s },
      
      // Tip (rounded top)
      { x: x + 35 * s, y: y + 20 * s },
      { x: x + 30 * s, y: y + 10 * s },
      { x: x + 50 * s, y: y + 5 * s },
      { x: x + 70 * s, y: y + 10 * s },
      { x: x + 65 * s, y: y + 20 * s },
      
      // Balls (two circles)
      { x: x + 35 * s, y: y + 70 * s },
      { x: x + 30 * s, y: y + 75 * s },
      { x: x + 30 * s, y: y + 85 * s },
      { x: x + 35 * s, y: y + 90 * s },
      { x: x + 45 * s, y: y + 90 * s },
      { x: x + 45 * s, y: y + 70 * s },
      
      { x: x + 55 * s, y: y + 70 * s },
      { x: x + 55 * s, y: y + 90 * s },
      { x: x + 65 * s, y: y + 90 * s },
      { x: x + 70 * s, y: y + 85 * s },
      { x: x + 70 * s, y: y + 75 * s },
      { x: x + 65 * s, y: y + 70 * s },
    ];
  } else if (type === 'boobs') {
    // Two circles side by side
    const points: Point[] = [];
    
    // Left boob
    for (let i = 0; i <= 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      points.push({
        x: x + 30 * s + Math.cos(angle) * 20 * s,
        y: y + 50 * s + Math.sin(angle) * 20 * s,
      });
    }
    
    // Right boob
    for (let i = 0; i <= 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      points.push({
        x: x + 70 * s + Math.cos(angle) * 20 * s,
        y: y + 50 * s + Math.sin(angle) * 20 * s,
      });
    }
    
    return points;
  } else if (type === 'butt') {
    // Two circles with a crack line
    const points: Point[] = [];
    
    // Left cheek
    for (let i = 0; i <= 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      points.push({
        x: x + 30 * s + Math.cos(angle) * 25 * s,
        y: y + 50 * s + Math.sin(angle) * 25 * s,
      });
    }
    
    // Right cheek
    for (let i = 0; i <= 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      points.push({
        x: x + 70 * s + Math.cos(angle) * 25 * s,
        y: y + 50 * s + Math.sin(angle) * 25 * s,
      });
    }
    
    // Crack line
    points.push({ x: x + 50 * s, y: y + 30 * s });
    points.push({ x: x + 50 * s, y: y + 70 * s });
    
    return points;
  }
  
  return generateStickFigure(x, y, size);
}

/**
 * Get a list of supported drawing objects
 */
export function getSupportedDrawings(): string[] {
  return [
    'dog', 'cat', 'face', 'smiley', 'house', 'tree', 'sun', 
    'star', 'flower', 'heart', 'car', 'stick figure',
    'penis', 'boobs', 'butt' // silly anatomy for humor
  ];
}

/**
 * Check if an object name is supported for creative drawing
 */
export function isSupportedDrawing(objectName: string): boolean {
  const normalized = objectName.toLowerCase().trim();
  
  // Check for direct matches and synonyms
  if (normalized.includes('dog') || normalized.includes('puppy') || normalized.includes('doggy')) {
    return true;
  }
  if (normalized.includes('cat') || normalized.includes('kitty') || normalized.includes('kitten')) {
    return true;
  }
  if (normalized.includes('face') || normalized.includes('smiley') || normalized.includes('smile')) {
    return true;
  }
  if (normalized.includes('house') || normalized.includes('home')) {
    return true;
  }
  if (normalized.includes('tree')) {
    return true;
  }
  if (normalized.includes('sun')) {
    return true;
  }
  if (normalized.includes('star')) {
    return true;
  }
  if (normalized.includes('flower')) {
    return true;
  }
  if (normalized.includes('heart')) {
    return true;
  }
  if (normalized.includes('car')) {
    return true;
  }
  if (normalized.includes('stick') || normalized.includes('figure')) {
    return true;
  }
  // Silly anatomy drawings
  if (normalized.includes('penis') || normalized.includes('dick') || normalized.includes('cock')) {
    return true;
  }
  if (normalized.includes('boob') || normalized.includes('breast') || normalized.includes('tit')) {
    return true;
  }
  if (normalized.includes('butt') || normalized.includes('ass')) {
    return true;
  }
  
  return false;
}

