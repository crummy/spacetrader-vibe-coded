// String Formatting and Display Utilities
// Port of Palm OS Draw.c formatting functions

/**
 * Rectangle bounds for drawing operations
 */
export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Text alignment options for centered drawing
 */
export const TextAlignment = {
  Left: 'left',
  Center: 'center', 
  Right: 'right'
} as const;

export type TextAlignment = typeof TextAlignment[keyof typeof TextAlignment];

/**
 * Format number with appropriate singular/plural text
 * Port of Palm OS SBufMultiples() function
 */
export function formatMultiples(count: number, baseText: string): string {
  if (count === 1) {
    return `${count} ${baseText}`;
  } else {
    return `${count} ${baseText}s`;
  }
}

/**
 * Format number with text, omitting count for singular values
 * Port of Palm OS SBufShortMultiples() function  
 */
export function formatShortMultiples(count: number, baseText: string): string {
  if (count === 1) {
    return baseText;
  } else {
    return `${count} ${baseText}s`;
  }
}

/**
 * Validate rectangle bounds to ensure positive dimensions
 */
export function validateRectangle(rect: Rectangle): Rectangle {
  return {
    x: rect.x,
    y: rect.y,
    width: Math.max(0, rect.width),
    height: Math.max(0, rect.height)
  };
}

/**
 * Check if a point is within rectangle bounds
 */
export function isPointInRectangle(x: number, y: number, rect: Rectangle): boolean {
  return x >= rect.x && 
         x < rect.x + rect.width &&
         y >= rect.y && 
         y < rect.y + rect.height;
}

/**
 * Calculate text width for a given string (simplified version)
 * In Palm OS this used font metrics, here we approximate
 */
export function calculateTextWidth(text: string, fontSize: number = 12): number {
  // Approximate character width based on font size
  // Most Palm OS fonts were monospace-ish
  return text.length * (fontSize * 0.6);
}

/**
 * Calculate centered X position for text within a given width
 * Port of Palm OS DrawCharsCentered logic
 */
export function calculateCenteredX(text: string, containerWidth: number, fontSize: number = 12): number {
  const textWidth = calculateTextWidth(text, fontSize);
  return Math.floor((containerWidth - textWidth) / 2);
}

/**
 * Word wrap text to fit within specified width
 * Port of Palm OS text wrapping logic from DisplayPage and DisplayHeadline
 */
export function wordWrap(text: string, maxWidth: number, fontSize: number = 12): string[] {
  if (!text) return [];
  
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = calculateTextWidth(testLine, fontSize);
    
    if (testWidth <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        // Single word too long, force it
        lines.push(word);
      }
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}

/**
 * Break text at word boundaries, preferring spaces or hyphens
 * Port of Palm OS DisplayPage word breaking logic
 */
export function findWordBreakpoint(text: string, maxLength: number): number {
  if (text.length <= maxLength) return text.length;
  
  let breakpoint = maxLength;
  
  // Look backwards for good break points
  while (breakpoint > 0) {
    const char = text[breakpoint];
    if (char === ' ') {
      return breakpoint;
    }
    if (char === '-' && breakpoint < maxLength) {
      return breakpoint + 1; // Include the hyphen
    }
    breakpoint--;
  }
  
  // No good break point found, force break at maxLength
  return Math.min(maxLength, text.length);
}

/**
 * Format text for display with word wrapping and line limits
 * Port of Palm OS DisplayHeadline functionality
 */
export interface DisplayTextOptions {
  maxWidth: number;
  maxLines?: number;
  fontSize?: number;
  indent?: number;
  secondaryIndent?: number;
}

export function formatDisplayText(text: string, options: DisplayTextOptions): string[] {
  const {
    maxWidth,
    maxLines = Infinity,
    fontSize = 12,
    indent = 0,
    secondaryIndent = indent
  } = options;
  
  if (!text) return [];
  
  const availableWidth = maxWidth - indent;
  const secondaryWidth = maxWidth - secondaryIndent;
  
  // Handle single line case first
  const singleLineWidth = calculateTextWidth(text, fontSize);
  if (singleLineWidth <= availableWidth) {
    return [text];
  }
  
  // Need to wrap - check if we have space for multiple lines
  if (maxLines < 2) {
    return []; // Can't fit
  }
  
  // Find break point for first line
  const firstLineMaxChars = Math.floor(availableWidth / (fontSize * 0.6));
  const breakpoint = findWordBreakpoint(text, firstLineMaxChars);
  
  if (breakpoint === 0) return []; // Can't fit anything
  
  const firstLine = text.substring(0, breakpoint).trim();
  const remainder = text.substring(breakpoint).trim();
  
  if (!remainder) {
    return [firstLine];
  }
  
  // Format second line with secondary indent
  const secondLineMaxChars = Math.floor(secondaryWidth / (fontSize * 0.6));
  const secondBreakpoint = findWordBreakpoint(remainder, secondLineMaxChars);
  const secondLine = remainder.substring(0, secondBreakpoint).trim();
  
  return [firstLine, secondLine];
}

/**
 * Clamp coordinates to valid screen bounds
 * Prevents drawing outside visible area
 */
export function clampToScreen(x: number, y: number, screenWidth: number = 160, screenHeight: number = 160): { x: number, y: number } {
  return {
    x: Math.max(0, Math.min(x, screenWidth - 1)),
    y: Math.max(0, Math.min(y, screenHeight - 1))
  };
}

/**
 * Calculate text position for different alignments
 */
export function calculateTextPosition(
  text: string,
  x: number,
  y: number,
  alignment: TextAlignment,
  containerWidth?: number,
  fontSize: number = 12
): { x: number, y: number } {
  let finalX = x;
  
  if (alignment === TextAlignment.Center && containerWidth !== undefined) {
    finalX = x + calculateCenteredX(text, containerWidth, fontSize);
  } else if (alignment === TextAlignment.Right && containerWidth !== undefined) {
    const textWidth = calculateTextWidth(text, fontSize);
    finalX = x + containerWidth - textWidth;
  }
  
  return { x: finalX, y };
}

/**
 * Parse and format debug values for display
 * Port of Palm OS debug alert functionality
 */
export function formatDebugValues(a: number | string, b?: number | string, c?: number | string): string {
  const values: string[] = [];
  
  if (typeof a === 'number') {
    values.push(a.toString());
  } else if (a !== undefined) {
    values.push(a);
  }
  
  if (typeof b === 'number') {
    values.push(b.toString());
  } else if (b !== undefined) {
    values.push(b);
  }
  
  if (typeof c === 'number') {
    values.push(c.toString());
  } else if (c !== undefined) {
    values.push(c);
  }
  
  return values.join(' | ');
}

/**
 * Validate text fits within bounds and truncate if necessary
 */
export function validateTextBounds(text: string, maxWidth: number, fontSize: number = 12): string {
  const textWidth = calculateTextWidth(text, fontSize);
  
  if (textWidth <= maxWidth) {
    return text;
  }
  
  // Find maximum characters that fit
  const charWidth = fontSize * 0.6;
  const maxChars = Math.floor(maxWidth / charWidth);
  
  if (maxChars <= 3) {
    return text.substring(0, Math.max(1, maxChars));
  }
  
  // Truncate with ellipsis if space allows
  return text.substring(0, maxChars - 3) + '...';
}

/**
 * Format scrolling controls state
 * Port of Palm OS ScrollButton logic
 */
export interface ScrollState {
  canScrollUp: boolean;
  canScrollDown: boolean;
  currentPage: number;
  totalPages: number;
}

export function getScrollState(
  currentOffset: number,
  totalItems: number,
  itemsPerPage: number
): ScrollState {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const currentPage = Math.floor(currentOffset / itemsPerPage) + 1;
  
  return {
    canScrollUp: currentOffset > 0,
    canScrollDown: currentOffset + itemsPerPage < totalItems,
    currentPage,
    totalPages
  };
}

/**
 * Constants for Palm OS display dimensions and layout
 */
export const PALM_SCREEN = {
  WIDTH: 160,
  HEIGHT: 160,
  NEWS_INDENT1: 8,    // Primary text indent
  NEWS_INDENT2: 16,   // Secondary text indent
  LINE_HEIGHT: 11,    // Standard line height
  HEADER_HEIGHT: 15   // Header line height
} as const;
