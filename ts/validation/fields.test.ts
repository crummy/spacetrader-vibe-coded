// Form Field Validation and Management Tests

import { strict as assert } from 'node:assert';
import { test, describe } from 'node:test';
import {
  FormState,
  validateTextField,
  validateNumberField,
  validateIntegerField,
  validateForm,
  isFormValid,
  getFirstError,
  formatFieldValue,
  FieldPatterns,
  CommonFieldValidations
} from './fields.ts';
import type { FieldOptions } from './fields.ts';

describe('Form Field Validation and Management', () => {
  
  describe('FormState Basic Operations', () => {
    test('setField and getField should work correctly', () => {
      const form = new FormState();
      
      // Set a field
      form.setField('test', 'hello world', 50, false);
      
      // Get the field value
      const value = form.getField('test');
      assert.equal(value, 'hello world');
      
      // Field should be removed after getting
      const valueAgain = form.getField('test');
      assert.equal(valueAgain, null);
    });
    
    test('setField should enforce size limits', () => {
      const form = new FormState();
      
      // Set field with size limit
      const longText = 'This is a very long text that exceeds the limit';
      form.setField('limited', longText, 20, false);
      
      const value = form.getField('limited');
      assert.ok(value!.length < 20, 'Value should be truncated to size limit');
      assert.equal(value, longText.substring(0, 19)); // Size - 1 for null terminator
    });
    
    test('setField should handle focus correctly', () => {
      const form = new FormState();
      
      // Set field with focus
      form.setField('focused', 'test', 50, true);
      assert.equal(form.getFocusedField(), 'focused');
      
      // Set another field with focus
      form.setField('other', 'other test', 50, true);
      assert.equal(form.getFocusedField(), 'other');
      
      // Previous field should lose focus
      const focusedField = form.peekField('focused');
      assert.equal(focusedField?.focused, false);
    });
    
    test('peekField should not remove field', () => {
      const form = new FormState();
      form.setField('persistent', 'test value', 50, false);
      
      // Peek should return value without removing
      const peeked = form.peekField('persistent');
      assert.equal(peeked?.value, 'test value');
      
      // Field should still exist
      const stillThere = form.peekField('persistent');
      assert.equal(stillThere?.value, 'test value');
      
      // Get should remove it
      const gotten = form.getField('persistent');
      assert.equal(gotten, 'test value');
      
      // Now it should be gone
      const gone = form.peekField('persistent');
      assert.equal(gone, null);
    });
  });

  describe('Checkbox Operations', () => {
    test('setCheckBox and getCheckBox should work correctly', () => {
      const form = new FormState();
      
      // Set checkbox true
      form.setCheckBox('option1', true);
      assert.equal(form.getCheckBox('option1'), true);
      
      // Set checkbox false
      form.setCheckBox('option2', false);
      assert.equal(form.getCheckBox('option2'), false);
      
      // Non-existent checkbox should return false
      assert.equal(form.getCheckBox('nonexistent'), false);
    });
    
    test('checkbox state should persist until cleared', () => {
      const form = new FormState();
      
      form.setCheckBox('persistent', true);
      assert.equal(form.getCheckBox('persistent'), true);
      assert.equal(form.getCheckBox('persistent'), true); // Should still be there
      
      form.clear();
      assert.equal(form.getCheckBox('persistent'), false); // Gone after clear
    });
  });

  describe('Trigger List Operations', () => {
    test('setTriggerList and getTriggerList should work correctly', () => {
      const form = new FormState();
      const options = ['Option A', 'Option B', 'Option C'];
      
      // Set trigger list
      form.setTriggerList('dropdown', 1, options);
      assert.equal(form.getTriggerList('dropdown'), 1);
      assert.equal(form.getTriggerListValue('dropdown'), 'Option B');
    });
    
    test('setTriggerList should clamp index to valid range', () => {
      const form = new FormState();
      const options = ['One', 'Two', 'Three'];
      
      // Index too high
      form.setTriggerList('test', 10, options);
      assert.equal(form.getTriggerList('test'), 2); // Should be clamped to max
      
      // Negative index
      form.setTriggerList('test', -5, options);
      assert.equal(form.getTriggerList('test'), 0); // Should be clamped to min
    });
    
    test('getTriggerListValue should handle invalid selections', () => {
      const form = new FormState();
      
      // Non-existent trigger list
      assert.equal(form.getTriggerListValue('nonexistent'), null);
      
      // Empty options
      form.setTriggerList('empty', 0, []);
      assert.equal(form.getTriggerListValue('empty'), null);
    });
  });

  describe('Form State Management', () => {
    test('isEmpty should work correctly', () => {
      const form = new FormState();
      assert.equal(form.isEmpty(), true);
      
      form.setField('test', 'value', 50);
      assert.equal(form.isEmpty(), false);
      
      form.getField('test'); // Remove field
      assert.equal(form.isEmpty(), true);
      
      form.setCheckBox('check', true);
      assert.equal(form.isEmpty(), false);
      
      form.clear();
      assert.equal(form.isEmpty(), true);
    });
    
    test('getFieldIds should return all field IDs', () => {
      const form = new FormState();
      
      form.setField('field1', 'value1', 50);
      form.setField('field2', 'value2', 50);
      form.setField('field3', 'value3', 50);
      
      const ids = form.getFieldIds();
      assert.equal(ids.length, 3);
      assert.ok(ids.includes('field1'));
      assert.ok(ids.includes('field2'));
      assert.ok(ids.includes('field3'));
    });
    
    test('clear should remove all data', () => {
      const form = new FormState();
      
      form.setField('field', 'value', 50, true);
      form.setCheckBox('check', true);
      form.setTriggerList('list', 1, ['A', 'B']);
      
      assert.equal(form.isEmpty(), false);
      assert.equal(form.getFocusedField(), 'field');
      
      form.clear();
      
      assert.equal(form.isEmpty(), true);
      assert.equal(form.getFocusedField(), null);
      assert.equal(form.getCheckBox('check'), false);
      assert.equal(form.getTriggerList('list'), -1);
    });
  });

  describe('Text Field Validation', () => {
    test('should validate required fields', () => {
      const required: FieldOptions = { required: true };
      
      assert.equal(validateTextField('', required).isValid, false);
      assert.equal(validateTextField('   ', required).isValid, false);
      assert.equal(validateTextField('valid', required).isValid, true);
    });
    
    test('should validate field length', () => {
      const lengthOptions: FieldOptions = { minLength: 3, maxLength: 10 };
      
      assert.equal(validateTextField('ab', lengthOptions).isValid, false); // Too short
      assert.equal(validateTextField('abc', lengthOptions).isValid, true);  // Min length
      assert.equal(validateTextField('1234567890', lengthOptions).isValid, true); // Max length
      assert.equal(validateTextField('12345678901', lengthOptions).isValid, false); // Too long
    });
    
    test('should validate patterns', () => {
      const alphaNumeric: FieldOptions = { pattern: FieldPatterns.ALPHANUMERIC };
      
      assert.equal(validateTextField('abc123', alphaNumeric).isValid, true);
      assert.equal(validateTextField('abc 123', alphaNumeric).isValid, true); // Spaces allowed
      assert.equal(validateTextField('abc-123', alphaNumeric).isValid, false); // Dash not allowed
      assert.equal(validateTextField('abc@123', alphaNumeric).isValid, false); // Special chars not allowed
    });
    
    test('should apply transformations', () => {
      const upperCaseTransform: FieldOptions = {
        transform: (value: string) => value.toUpperCase()
      };
      
      const result = validateTextField('hello', upperCaseTransform);
      assert.equal(result.isValid, true);
      assert.equal(result.value, 'HELLO');
    });
    
    test('should handle transformation errors', () => {
      const errorTransform: FieldOptions = {
        transform: (value: string) => {
          if (value === 'error') throw new Error('Test error');
          return value;
        }
      };
      
      assert.equal(validateTextField('error', errorTransform).isValid, false);
      assert.equal(validateTextField('ok', errorTransform).isValid, true);
    });
  });

  describe('Number Field Validation', () => {
    test('should validate numeric input', () => {
      assert.equal(validateNumberField('123').isValid, true);
      assert.equal(validateNumberField('123.45').isValid, true);
      assert.equal(validateNumberField('-123').isValid, true);
      assert.equal(validateNumberField('abc').isValid, false);
      assert.equal(validateNumberField('12abc').isValid, false);
    });
    
    test('should validate number ranges', () => {
      const rangeOptions: FieldOptions = { minValue: 0, maxValue: 100 };
      
      assert.equal(validateNumberField('-1', rangeOptions).isValid, false); // Below min
      assert.equal(validateNumberField('0', rangeOptions).isValid, true);   // At min
      assert.equal(validateNumberField('50', rangeOptions).isValid, true);  // In range
      assert.equal(validateNumberField('100', rangeOptions).isValid, true); // At max
      assert.equal(validateNumberField('101', rangeOptions).isValid, false); // Above max
    });
    
    test('should handle empty values for optional fields', () => {
      const result = validateNumberField('');
      assert.equal(result.isValid, true);
      assert.equal(result.value, undefined);
    });
    
    test('should require values for required fields', () => {
      const required: FieldOptions = { required: true };
      
      assert.equal(validateNumberField('', required).isValid, false);
      assert.equal(validateNumberField('123', required).isValid, true);
    });
  });

  describe('Integer Field Validation', () => {
    test('should validate integer input', () => {
      assert.equal(validateIntegerField('123').isValid, true);
      assert.equal(validateIntegerField('123.0').isValid, true);  // Integer represented as decimal
      assert.equal(validateIntegerField('123.5').isValid, false); // Not an integer
      assert.equal(validateIntegerField('-123').isValid, true);
    });
    
    test('should validate integer ranges', () => {
      const rangeOptions: FieldOptions = { minValue: 1, maxValue: 10 };
      
      assert.equal(validateIntegerField('0', rangeOptions).isValid, false);
      assert.equal(validateIntegerField('5', rangeOptions).isValid, true);
      assert.equal(validateIntegerField('11', rangeOptions).isValid, false);
    });
  });

  describe('Field Patterns', () => {
    test('NUMERIC pattern should work correctly', () => {
      assert.ok(FieldPatterns.NUMERIC.test('123'));
      assert.ok(FieldPatterns.NUMERIC.test('-123'));
      assert.ok(FieldPatterns.NUMERIC.test('123.45'));
      assert.ok(FieldPatterns.NUMERIC.test('-123.45'));
      assert.ok(!FieldPatterns.NUMERIC.test('abc'));
      assert.ok(!FieldPatterns.NUMERIC.test('12abc'));
    });
    
    test('INTEGER pattern should work correctly', () => {
      assert.ok(FieldPatterns.INTEGER.test('123'));
      assert.ok(FieldPatterns.INTEGER.test('-123'));
      assert.ok(!FieldPatterns.INTEGER.test('123.45'));
      assert.ok(!FieldPatterns.INTEGER.test('abc'));
    });
    
    test('POSITIVE_INTEGER pattern should work correctly', () => {
      assert.ok(FieldPatterns.POSITIVE_INTEGER.test('123'));
      assert.ok(!FieldPatterns.POSITIVE_INTEGER.test('-123'));
      assert.ok(!FieldPatterns.POSITIVE_INTEGER.test('123.45'));
      assert.ok(!FieldPatterns.POSITIVE_INTEGER.test('0')); // Zero is not positive
    });
    
    test('NAME pattern should allow typical name characters', () => {
      assert.ok(FieldPatterns.NAME.test('John Doe'));
      assert.ok(FieldPatterns.NAME.test("O'Connor"));
      assert.ok(FieldPatterns.NAME.test('Smith-Jones'));
      assert.ok(FieldPatterns.NAME.test('Dr. Smith'));
      assert.ok(!FieldPatterns.NAME.test('John123')); // Numbers not allowed
      assert.ok(!FieldPatterns.NAME.test('John@Doe')); // Special chars not allowed
    });
    
    test('COORDINATE pattern should handle game coordinates', () => {
      assert.ok(FieldPatterns.COORDINATE.test('100'));
      assert.ok(FieldPatterns.COORDINATE.test('-50'));
      assert.ok(FieldPatterns.COORDINATE.test('0'));
      assert.ok(!FieldPatterns.COORDINATE.test('12.5'));
      assert.ok(!FieldPatterns.COORDINATE.test('abc'));
    });
  });

  describe('Common Field Validations', () => {
    test('PLAYER_NAME validation should work correctly', () => {
      const validation = CommonFieldValidations.PLAYER_NAME;
      
      assert.equal(validateTextField('', validation).isValid, false); // Required
      assert.equal(validateTextField('John Doe', validation).isValid, true);
      assert.equal(validateTextField('A very long name that exceeds twenty chars', validation).isValid, false); // Too long
      assert.equal(validateTextField('Player123', validation).isValid, false); // Numbers not allowed in name pattern
    });
    
    test('CREDITS validation should work correctly', () => {
      const validation = CommonFieldValidations.CREDITS;
      
      const result1 = validateNumberField('1000', validation);
      assert.equal(result1.isValid, true);
      assert.equal(result1.value, 1000);
      
      assert.equal(validateNumberField('-100', validation).isValid, false); // Negative not allowed
      assert.equal(validateNumberField('1000000000', validation).isValid, false); // Too high
    });
    
    test('COORDINATE validation should work correctly', () => {
      const validation = CommonFieldValidations.COORDINATE;
      
      const result = validateNumberField('50', validation);
      assert.equal(result.isValid, true);
      assert.equal(result.value, 50);
      
      assert.equal(validateNumberField('', validation).isValid, false); // Required
      assert.equal(validateNumberField('200', validation).isValid, false); // Out of range
      assert.equal(validateNumberField('-200', validation).isValid, false); // Out of range
    });
  });

  describe('Form Validation', () => {
    test('validateForm should validate all fields', () => {
      const form = new FormState();
      form.setField('name', 'Test Player', 50);
      form.setField('credits', '1000', 20);
      form.setField('invalid', '', 10);
      
      const validations = {
        name: CommonFieldValidations.PLAYER_NAME,
        credits: CommonFieldValidations.CREDITS,
        invalid: { required: true }
      };
      
      const results = validateForm(form, validations);
      
      assert.equal(results.name.isValid, true);
      assert.equal(results.credits.isValid, true);
      assert.equal(results.invalid.isValid, false);
    });
    
    test('isFormValid should check all results', () => {
      const allValid = {
        field1: { isValid: true },
        field2: { isValid: true }
      };
      assert.equal(isFormValid(allValid), true);
      
      const someInvalid = {
        field1: { isValid: true },
        field2: { isValid: false, error: 'Error' }
      };
      assert.equal(isFormValid(someInvalid), false);
    });
    
    test('getFirstError should return first error message', () => {
      const results = {
        field1: { isValid: true },
        field2: { isValid: false, error: 'First error' },
        field3: { isValid: false, error: 'Second error' }
      };
      
      assert.equal(getFirstError(results), 'First error');
      
      const noErrors = {
        field1: { isValid: true },
        field2: { isValid: true }
      };
      assert.equal(getFirstError(noErrors), null);
    });
  });

  describe('Field Value Formatting', () => {
    test('should format different value types correctly', () => {
      assert.equal(formatFieldValue(null, 'text'), '');
      assert.equal(formatFieldValue(undefined, 'text'), '');
      assert.equal(formatFieldValue('hello', 'text'), 'hello');
      assert.equal(formatFieldValue(123, 'text'), '123');
      
      assert.equal(formatFieldValue(1234, 'credits'), '1,234');
      assert.equal(formatFieldValue(50, 'percentage'), '50%');
      assert.equal(formatFieldValue(3.14159, 'number'), '3.14159');
    });
  });

  describe('Integration Scenarios', () => {
    test('should handle complete form workflow', () => {
      const form = new FormState();
      
      // Fill out a player registration form
      form.setField('playerName', 'Captain Smith', 30, true);
      form.setField('shipName', 'Enterprise', 30, false);
      form.setField('startingCredits', '2000', 20, false);
      form.setCheckBox('easyMode', true);
      form.setTriggerList('difficulty', 0, ['Beginner', 'Easy', 'Normal', 'Hard', 'Impossible']);
      
      // Validate the form
      const validations = {
        playerName: CommonFieldValidations.PLAYER_NAME,
        shipName: CommonFieldValidations.SHIP_NAME,
        startingCredits: CommonFieldValidations.CREDITS
      };
      
      const results = validateForm(form, validations);
      assert.equal(isFormValid(results), true);
      
      // Extract values
      const playerName = form.getField('playerName');
      const shipName = form.getField('shipName');
      const credits = form.getField('startingCredits');
      const easyMode = form.getCheckBox('easyMode');
      const difficulty = form.getTriggerListValue('difficulty');
      
      assert.equal(playerName, 'Captain Smith');
      assert.equal(shipName, 'Enterprise');
      assert.equal(credits, '2000');
      assert.equal(easyMode, true);
      assert.equal(difficulty, 'Beginner');
    });
    
    test('should handle field size limits like Palm OS', () => {
      const form = new FormState();
      
      // Palm OS NAMELEN was 20 characters
      const longName = 'ThisIsAVeryLongNameThatExceeds20Characters';
      form.setField('name', longName, 21); // 20 + null terminator
      
      const result = form.getField('name');
      assert.ok(result!.length <= 20, 'Should be truncated to Palm OS limits');
    });
    
    test('should handle focus management like Palm OS forms', () => {
      const form = new FormState();
      
      form.setField('field1', 'value1', 50, false);
      form.setField('field2', 'value2', 50, true); // This gets focus
      form.setField('field3', 'value3', 50, false);
      
      assert.equal(form.getFocusedField(), 'field2');
      
      // Move focus to another field
      form.setFocus('field3');
      assert.equal(form.getFocusedField(), 'field3');
      
      // Check that field2 lost focus
      assert.equal(form.peekField('field2')?.focused, false);
      assert.equal(form.peekField('field3')?.focused, true);
    });
  });
});
