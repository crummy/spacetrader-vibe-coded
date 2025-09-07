// String Formatting and Display Utilities Tests

import { strict as assert } from 'node:assert';
import { test, describe } from 'node:test';
import {
  formatMultiples,
  formatShortMultiples,
  validateRectangle,
  isPointInRectangle,
  calculateTextWidth,
  calculateCenteredX,
  wordWrap,
  findWordBreakpoint,
  formatDisplayText,
  clampToScreen,
  calculateTextPosition,
  formatDebugValues,
  validateTextBounds,
  getScrollState,
  TextAlignment,
  PALM_SCREEN
} from './formatting.ts';
import type { Rectangle, DisplayTextOptions } from './formatting.ts';

describe('String Formatting and Display Utilities', () => {
  
  describe('Text Formatting', () => {
    test('formatMultiples should handle singular and plural correctly', () => {
      assert.equal(formatMultiples(0, 'item'), '0 items');
      assert.equal(formatMultiples(1, 'item'), '1 item');
      assert.equal(formatMultiples(2, 'item'), '2 items');
      assert.equal(formatMultiples(5, 'credit'), '5 credits');
      assert.equal(formatMultiples(1, 'ship'), '1 ship');
      assert.equal(formatMultiples(10, 'weapon'), '10 weapons');
    });
    
    test('formatShortMultiples should omit count for singular', () => {
      assert.equal(formatShortMultiples(1, 'item'), 'item');
      assert.equal(formatShortMultiples(0, 'item'), '0 items');
      assert.equal(formatShortMultiples(2, 'item'), '2 items');
      assert.equal(formatShortMultiples(5, 'credit'), '5 credits');
      assert.equal(formatShortMultiples(1, 'ship'), 'ship');
    });
    
    test('should handle empty and special text', () => {
      assert.equal(formatMultiples(1, ''), '1 ');
      assert.equal(formatShortMultiples(2, ''), '2 s');
      assert.equal(formatMultiples(1, 'fish'), '1 fish'); // Stays same in plural
    });
  });

  describe('Rectangle Operations', () => {
    test('validateRectangle should ensure positive dimensions', () => {
      const validRect: Rectangle = { x: 10, y: 20, width: 50, height: 30 };
      assert.deepEqual(validateRectangle(validRect), validRect);
      
      const invalidRect: Rectangle = { x: 10, y: 20, width: -50, height: -30 };
      const expected: Rectangle = { x: 10, y: 20, width: 0, height: 0 };
      assert.deepEqual(validateRectangle(invalidRect), expected);
    });
    
    test('isPointInRectangle should detect containment correctly', () => {
      const rect: Rectangle = { x: 10, y: 20, width: 50, height: 30 };
      
      // Inside
      assert.equal(isPointInRectangle(30, 35, rect), true);
      assert.equal(isPointInRectangle(10, 20, rect), true); // Top-left corner
      assert.equal(isPointInRectangle(59, 49, rect), true); // Bottom-right edge
      
      // Outside
      assert.equal(isPointInRectangle(9, 35, rect), false);   // Left of rect
      assert.equal(isPointInRectangle(61, 35, rect), false);  // Right of rect  
      assert.equal(isPointInRectangle(30, 19, rect), false);  // Above rect
      assert.equal(isPointInRectangle(30, 51, rect), false);  // Below rect
      assert.equal(isPointInRectangle(60, 50, rect), false);  // At exact boundary
    });
  });

  describe('Text Width and Positioning', () => {
    test('calculateTextWidth should return reasonable approximations', () => {
      assert.equal(calculateTextWidth('', 12), 0);
      assert.ok(Math.abs(calculateTextWidth('A', 12) - 7.2) < 0.1); // 12 * 0.6
      assert.equal(calculateTextWidth('Hello', 12), 36); // 5 * 12 * 0.6
      assert.equal(calculateTextWidth('Test', 10), 24); // 4 * 10 * 0.6
    });
    
    test('calculateCenteredX should center text properly', () => {
      // Text width of 'Hello' at font 12 = 36, container 100
      // Center position = (100 - 36) / 2 = 32
      assert.equal(calculateCenteredX('Hello', 100, 12), 32);
      
      // Text exactly fits container
      assert.ok(Math.abs(calculateCenteredX('AB', 14.4, 12) - 0) < 0.1); // 2 * 7.2 = 14.4
      
      // Text wider than container (should return negative)
      assert.ok(Math.abs(calculateCenteredX('Very long text', 50, 12) + 26.4) < 0.5);
    });
    
    test('calculateTextPosition should handle different alignments', () => {
      const text = 'Test'; // Width = 28.8 at fontSize 12
      const containerWidth = 100;
      
      // Left alignment
      let pos = calculateTextPosition(text, 10, 20, TextAlignment.Left, containerWidth);
      assert.deepEqual(pos, { x: 10, y: 20 });
      
      // Center alignment
      pos = calculateTextPosition(text, 10, 20, TextAlignment.Center, containerWidth);
      assert.ok(Math.abs(pos.x - 45.6) < 1.0 && pos.y === 20); // 10 + (100-28.8)/2
      
      // Right alignment  
      pos = calculateTextPosition(text, 10, 20, TextAlignment.Right, containerWidth);
      assert.deepEqual(pos, { x: 81.2, y: 20 }); // 10 + 100 - 28.8
    });
  });

  describe('Word Wrapping', () => {
    test('wordWrap should handle simple cases', () => {
      assert.deepEqual(wordWrap('', 100), []);
      assert.deepEqual(wordWrap('short', 100), ['short']);
      assert.deepEqual(wordWrap('one two three', 100), ['one two three']);
    });
    
    test('wordWrap should break long lines', () => {
      // With width calculations: 'one' = 21.6, 'two' = 21.6, 'three' = 36
      // 'one two' = 50.4 (exceeds maxWidth 50), so each word goes on separate line
      const result = wordWrap('one two three', 50, 12);
      assert.equal(result.length, 3);
      assert.equal(result[0], 'one');
      assert.equal(result[1], 'two');
      assert.equal(result[2], 'three');
    });
    
    test('wordWrap should handle single long words', () => {
      const result = wordWrap('superlongwordthatcannotbebroken', 50, 12);
      assert.equal(result.length, 1);
      assert.equal(result[0], 'superlongwordthatcannotbebroken');
    });
    
    test('findWordBreakpoint should prefer good break points', () => {
      // Test space break
      assert.equal(findWordBreakpoint('hello world test', 10), 5); // Break at space after 'hello'
      
      // Test hyphen break  
      assert.equal(findWordBreakpoint('multi-part-word', 8), 6); // Break after 'multi-'
      
      // Test forced break
      assert.equal(findWordBreakpoint('nospaces', 5), 5); // Force break at position 5
      
      // Test text shorter than limit
      assert.equal(findWordBreakpoint('short', 10), 5); // Return full length
    });
  });

  describe('Display Text Formatting', () => {
    test('formatDisplayText should handle single line text', () => {
      const options: DisplayTextOptions = { maxWidth: 100, fontSize: 12 };
      const result = formatDisplayText('short text', options);
      
      assert.equal(result.length, 1);
      assert.equal(result[0], 'short text');
    });
    
    test('formatDisplayText should handle wrapping with indents', () => {
      const options: DisplayTextOptions = {
        maxWidth: 80,
        indent: 10,
        secondaryIndent: 20,
        fontSize: 12
      };
      
      // Long text that needs wrapping
      const longText = 'This is a very long text that will need to be wrapped across multiple lines';
      const result = formatDisplayText(longText, options);
      
      assert.ok(result.length > 0, 'Should return some lines');
      assert.ok(result.length <= 2, 'Should not exceed 2 lines by default');
    });
    
    test('formatDisplayText should respect maxLines limit', () => {
      const options: DisplayTextOptions = {
        maxWidth: 30, // Very narrow to force many breaks
        maxLines: 1,
        fontSize: 12
      };
      
      const result = formatDisplayText('This text is too long for one narrow line', options);
      assert.equal(result.length, 0, 'Should return empty array when cannot fit in maxLines');
    });
    
    test('formatDisplayText should handle empty text', () => {
      const options: DisplayTextOptions = { maxWidth: 100 };
      assert.deepEqual(formatDisplayText('', options), []);
    });
  });

  describe('Screen and Coordinate Utilities', () => {
    test('clampToScreen should keep coordinates in bounds', () => {
      // Default Palm screen size
      assert.deepEqual(clampToScreen(80, 80), { x: 80, y: 80 });
      assert.deepEqual(clampToScreen(-10, 50), { x: 0, y: 50 });
      assert.deepEqual(clampToScreen(50, -10), { x: 50, y: 0 });
      assert.deepEqual(clampToScreen(200, 80), { x: 159, y: 80 });
      assert.deepEqual(clampToScreen(80, 200), { x: 80, y: 159 });
      assert.deepEqual(clampToScreen(-10, -10), { x: 0, y: 0 });
    });
    
    test('clampToScreen should work with custom dimensions', () => {
      assert.deepEqual(clampToScreen(150, 200, 320, 240), { x: 150, y: 200 });
      assert.deepEqual(clampToScreen(350, 250, 320, 240), { x: 319, y: 239 });
    });
  });

  describe('Text Validation and Truncation', () => {
    test('validateTextBounds should preserve text that fits', () => {
      assert.equal(validateTextBounds('OK', 100, 12), 'OK');
      assert.equal(validateTextBounds('', 100, 12), '');
    });
    
    test('validateTextBounds should truncate long text', () => {
      // Text too wide should be truncated
      const longText = 'This is a very long string that will not fit';
      const result = validateTextBounds(longText, 50, 12);
      
      assert.ok(result.length < longText.length, 'Should be shorter than original');
      assert.ok(result.includes('...') || result.length <= 7, 'Should have ellipsis or be very short');
    });
    
    test('validateTextBounds should handle very small widths', () => {
      const result = validateTextBounds('Test', 10, 12); // Very narrow
      assert.ok(result.length <= 2, 'Should be very short');
      assert.ok(!result.includes('...'), 'Should not have ellipsis in tiny space');
    });
  });

  describe('Debug and Utility Functions', () => {
    test('formatDebugValues should format various value types', () => {
      assert.equal(formatDebugValues(42), '42');
      assert.equal(formatDebugValues(1, 2, 3), '1 | 2 | 3');
      assert.equal(formatDebugValues('hello', 'world'), 'hello | world');
      assert.equal(formatDebugValues(42, 'test', 3.14), '42 | test | 3.14');
      assert.equal(formatDebugValues('single'), 'single');
    });
    
    test('formatDebugValues should handle undefined values', () => {
      assert.equal(formatDebugValues(1, undefined, 3), '1 | 3');
      assert.equal(formatDebugValues(2), '2');
    });
  });

  describe('Scrolling State', () => {
    test('getScrollState should calculate pagination correctly', () => {
      // 100 items, 10 per page = 10 pages
      let state = getScrollState(0, 100, 10);
      assert.deepEqual(state, {
        canScrollUp: false,
        canScrollDown: true,
        currentPage: 1,
        totalPages: 10
      });
      
      // Middle page
      state = getScrollState(50, 100, 10);
      assert.deepEqual(state, {
        canScrollUp: true,
        canScrollDown: true,
        currentPage: 6,
        totalPages: 10
      });
      
      // Last page
      state = getScrollState(90, 100, 10);
      assert.deepEqual(state, {
        canScrollUp: true,
        canScrollDown: false,
        currentPage: 10,
        totalPages: 10
      });
    });
    
    test('getScrollState should handle edge cases', () => {
      // Empty list
      let state = getScrollState(0, 0, 10);
      assert.deepEqual(state, {
        canScrollUp: false,
        canScrollDown: false,
        currentPage: 1,
        totalPages: 0
      });
      
      // Single partial page
      state = getScrollState(0, 5, 10);
      assert.deepEqual(state, {
        canScrollUp: false,
        canScrollDown: false,
        currentPage: 1,
        totalPages: 1
      });
    });
  });

  describe('Constants and Configuration', () => {
    test('PALM_SCREEN constants should have expected values', () => {
      assert.equal(PALM_SCREEN.WIDTH, 160);
      assert.equal(PALM_SCREEN.HEIGHT, 160);
      assert.equal(PALM_SCREEN.NEWS_INDENT1, 8);
      assert.equal(PALM_SCREEN.NEWS_INDENT2, 16);
      assert.equal(PALM_SCREEN.LINE_HEIGHT, 11);
      assert.equal(PALM_SCREEN.HEADER_HEIGHT, 15);
    });
  });

  describe('Integration and Real-world Scenarios', () => {
    test('should handle Palm OS news display scenario', () => {
      const newsText = 'Galactic News Flash: Pirates spotted near Jupiter trading routes';
      const options: DisplayTextOptions = {
        maxWidth: PALM_SCREEN.WIDTH - (PALM_SCREEN.NEWS_INDENT1 * 2),
        maxLines: 2,
        indent: PALM_SCREEN.NEWS_INDENT1,
        secondaryIndent: PALM_SCREEN.NEWS_INDENT2,
        fontSize: 12
      };
      
      const lines = formatDisplayText(newsText, options);
      assert.ok(lines.length > 0, 'Should format news text');
      assert.ok(lines.length <= 2, 'Should respect line limits');
    });
    
    test('should handle centered button text', () => {
      const buttonText = 'OK';
      const buttonWidth = 50;
      const centeredX = calculateCenteredX(buttonText, buttonWidth, 12);
      
      assert.ok(centeredX >= 0, 'Centered position should be reasonable');
      assert.ok(centeredX < buttonWidth, 'Should be within button bounds');
    });
    
    test('should handle scrollable list display', () => {
      const totalItems = 25;
      const itemsPerPage = 8;
      
      // Test different scroll positions
      for (let offset = 0; offset < totalItems; offset += itemsPerPage) {
        const state = getScrollState(offset, totalItems, itemsPerPage);
        
        assert.ok(state.currentPage >= 1, 'Page should be 1-based');
        assert.ok(state.currentPage <= state.totalPages, 'Current page should not exceed total');
        assert.equal(typeof state.canScrollUp, 'boolean', 'Should have boolean scroll state');
        assert.equal(typeof state.canScrollDown, 'boolean', 'Should have boolean scroll state');
      }
    });
  });
});
