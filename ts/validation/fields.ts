// Form Field Validation and Management
// Port of Palm OS Field.c and SetField.c functionality

/**
 * Field validation result
 */
export interface FieldValidationResult {
  isValid: boolean;
  value?: any;
  error?: string;
}

/**
 * Field configuration options
 */
export interface FieldOptions {
  required?: boolean;
  minValue?: number;
  maxValue?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  transform?: (value: string) => any;
}

/**
 * Simulated form field data structure
 * Represents Palm OS form field state
 */
export interface FormField {
  id: string;
  value: string;
  focused: boolean;
  maxSize: number;
  validation?: FieldOptions;
}

/**
 * Checkbox state management
 * Port of Palm OS checkbox functionality
 */
export interface CheckboxField {
  id: string;
  checked: boolean;
}

/**
 * Trigger list (dropdown) state
 * Port of Palm OS trigger list functionality  
 */
export interface TriggerListField {
  id: string;
  selectedIndex: number;
  options: string[];
}

/**
 * Form state container
 */
export class FormState {
  private fields: Map<string, FormField> = new Map();
  private checkboxes: Map<string, CheckboxField> = new Map(); 
  private triggerLists: Map<string, TriggerListField> = new Map();
  private focusedField: string | null = null;

  /**
   * Set text field value with size limits and focus control
   * Port of Palm OS SetField() function
   */
  public setField(id: string, value: string, maxSize: number = 256, focus: boolean = false): void {
    // Ensure value fits within size limit
    const trimmedValue = value.substring(0, maxSize - 1); // Leave room for null terminator
    
    if (focus) {
      // Clear focus from other fields first
      for (const [otherId, otherField] of this.fields) {
        if (otherId !== id) {
          otherField.focused = false;
        }
      }
      this.focusedField = id;
    }
    
    this.fields.set(id, {
      id,
      value: trimmedValue,
      focused: focus,
      maxSize
    });
  }

  /**
   * Get field value and clean up resources
   * Port of Palm OS GetField() function
   */
  public getField(id: string): string | null {
    const field = this.fields.get(id);
    if (!field) return null;
    
    const value = field.value;
    
    // In Palm OS, this would free the memory handle
    // Here we just clear the field to simulate resource cleanup
    this.fields.delete(id);
    
    return value;
  }

  /**
   * Set checkbox state
   * Port of Palm OS SetCheckBox() function
   */
  public setCheckBox(id: string, checked: boolean): void {
    this.checkboxes.set(id, {
      id,
      checked
    });
  }

  /**
   * Get checkbox state
   * Port of Palm OS GetCheckBox() function
   */
  public getCheckBox(id: string): boolean {
    const checkbox = this.checkboxes.get(id);
    return checkbox ? checkbox.checked : false;
  }

  /**
   * Set trigger list selection
   * Port of Palm OS SetTriggerList() function
   */
  public setTriggerList(id: string, selectedIndex: number, options: string[] = []): void {
    this.triggerLists.set(id, {
      id,
      selectedIndex: Math.max(0, Math.min(selectedIndex, options.length - 1)),
      options: [...options]
    });
  }

  /**
   * Get trigger list selection
   * Port of Palm OS GetTriggerList() function
   */
  public getTriggerList(id: string): number {
    const triggerList = this.triggerLists.get(id);
    return triggerList ? triggerList.selectedIndex : -1;
  }

  /**
   * Get trigger list selected value
   */
  public getTriggerListValue(id: string): string | null {
    const triggerList = this.triggerLists.get(id);
    if (!triggerList || triggerList.selectedIndex < 0 || triggerList.selectedIndex >= triggerList.options.length) {
      return null;
    }
    return triggerList.options[triggerList.selectedIndex];
  }

  /**
   * Set focus to a specific field
   */
  public setFocus(fieldId: string): boolean {
    if (this.fields.has(fieldId)) {
      this.focusedField = fieldId;
      const field = this.fields.get(fieldId)!;
      field.focused = true;
      
      // Clear focus from other fields
      for (const [id, otherField] of this.fields) {
        if (id !== fieldId) {
          otherField.focused = false;
        }
      }
      return true;
    }
    return false;
  }

  /**
   * Get currently focused field ID
   */
  public getFocusedField(): string | null {
    return this.focusedField;
  }

  /**
   * Clear all form data
   */
  public clear(): void {
    this.fields.clear();
    this.checkboxes.clear();
    this.triggerLists.clear();
    this.focusedField = null;
  }

  /**
   * Check if form has any data
   */
  public isEmpty(): boolean {
    return this.fields.size === 0 && this.checkboxes.size === 0 && this.triggerLists.size === 0;
  }

  /**
   * Get all field IDs
   */
  public getFieldIds(): string[] {
    return Array.from(this.fields.keys());
  }

  /**
   * Get field info without removing it
   */
  public peekField(id: string): FormField | null {
    return this.fields.get(id) || null;
  }
}

/**
 * Validate text input field
 */
export function validateTextField(value: string, options: FieldOptions = {}): FieldValidationResult {
  // Required field check
  if (options.required && (!value || value.trim().length === 0)) {
    return { isValid: false, error: 'Field is required' };
  }

  // Length validation
  if (options.minLength !== undefined && value.length < options.minLength) {
    return { isValid: false, error: `Minimum length is ${options.minLength}` };
  }

  if (options.maxLength !== undefined && value.length > options.maxLength) {
    return { isValid: false, error: `Maximum length is ${options.maxLength}` };
  }

  // Pattern validation
  if (options.pattern && !options.pattern.test(value)) {
    return { isValid: false, error: 'Invalid format' };
  }

  // Transform value if specified
  let finalValue: any = value;
  if (options.transform) {
    try {
      finalValue = options.transform(value);
    } catch (error) {
      return { isValid: false, error: 'Invalid value format' };
    }
  }

  return { isValid: true, value: finalValue };
}

/**
 * Validate numeric input field
 */
export function validateNumberField(value: string, options: FieldOptions = {}): FieldValidationResult {
  // Required field check
  if (options.required && (!value || value.trim().length === 0)) {
    return { isValid: false, error: 'Field is required' };
  }

  if (!value || value.trim().length === 0) {
    return { isValid: true, value: undefined };
  }

  // Check numeric pattern first
  if (!/^-?\d+(\.\d+)?$/.test(value.trim())) {
    return { isValid: false, error: 'Must be a valid number' };
  }

  // Parse number
  const numValue = parseFloat(value);
  if (isNaN(numValue)) {
    return { isValid: false, error: 'Must be a valid number' };
  }

  // Range validation
  if (options.minValue !== undefined && numValue < options.minValue) {
    return { isValid: false, error: `Minimum value is ${options.minValue}` };
  }

  if (options.maxValue !== undefined && numValue > options.maxValue) {
    return { isValid: false, error: `Maximum value is ${options.maxValue}` };
  }

  return { isValid: true, value: numValue };
}

/**
 * Validate integer input field
 */
export function validateIntegerField(value: string, options: FieldOptions = {}): FieldValidationResult {
  // Use number validation first
  const result = validateNumberField(value, options);
  if (!result.isValid) return result;

  if (result.value !== undefined) {
    // Check if it's actually an integer
    if (!Number.isInteger(result.value)) {
      return { isValid: false, error: 'Must be a whole number' };
    }
  }

  return result;
}

/**
 * Common field validation patterns
 */
export const FieldPatterns = {
  // Palm OS commonly used alphanumeric for ship/player names
  ALPHANUMERIC: /^[a-zA-Z0-9\s]+$/,
  
  // Numeric only (for amounts, coordinates, etc.)
  NUMERIC: /^-?\d+(\.\d+)?$/,
  
  // Integer only
  INTEGER: /^-?\d+$/,
  
  // Positive integer (common for quantities, prices)
  POSITIVE_INTEGER: /^[1-9]\d*$/,
  
  // Palm OS typical name field (letters, spaces, some punctuation)
  NAME: /^[a-zA-Z\s\-'.]+$/,
  
  // Coordinates (can be negative)
  COORDINATE: /^-?\d+$/,
  
  // Credits/money (positive numbers only)
  CREDITS: /^\d+$/
} as const;

/**
 * Pre-defined field validation configurations for common Space Trader fields
 */
export const CommonFieldValidations = {
  PLAYER_NAME: {
    required: true,
    minLength: 1,
    maxLength: 20, // NAMELEN from Palm OS
    pattern: FieldPatterns.NAME
  },
  
  SHIP_NAME: {
    required: true,
    minLength: 1,
    maxLength: 20,
    pattern: FieldPatterns.ALPHANUMERIC
  },
  
  CREDITS: {
    required: false,
    minValue: 0,
    maxValue: 999999999, // Reasonable credit limit
    transform: (value: string) => parseInt(value, 10)
  },
  
  QUANTITY: {
    required: false,
    minValue: 0,
    maxValue: 1000, // Reasonable quantity limit
    transform: (value: string) => parseInt(value, 10)
  },
  
  COORDINATE: {
    required: true,
    minValue: -150,
    maxValue: 150, // Palm OS galaxy coordinates
    transform: (value: string) => parseInt(value, 10)
  },
  
  PERCENTAGE: {
    required: false,
    minValue: 0,
    maxValue: 100,
    transform: (value: string) => parseInt(value, 10)
  }
} as const;

/**
 * Validate all fields in a form
 */
export function validateForm(form: FormState, validations: Record<string, FieldOptions>): Record<string, FieldValidationResult> {
  const results: Record<string, FieldValidationResult> = {};
  
  for (const [fieldId, options] of Object.entries(validations)) {
    const field = form.peekField(fieldId);
    if (field) {
      results[fieldId] = validateTextField(field.value, options);
    }
  }
  
  return results;
}

/**
 * Check if form validation results are all valid
 */
export function isFormValid(validationResults: Record<string, FieldValidationResult>): boolean {
  return Object.values(validationResults).every(result => result.isValid);
}

/**
 * Get first validation error message
 */
export function getFirstError(validationResults: Record<string, FieldValidationResult>): string | null {
  for (const result of Object.values(validationResults)) {
    if (!result.isValid && result.error) {
      return result.error;
    }
  }
  return null;
}

/**
 * Format field value for display
 */
export function formatFieldValue(value: any, type: 'text' | 'number' | 'credits' | 'percentage'): string {
  if (value === null || value === undefined) return '';
  
  switch (type) {
    case 'credits':
      return typeof value === 'number' ? value.toLocaleString() : String(value);
    case 'percentage':
      return typeof value === 'number' ? `${value}%` : String(value);
    case 'number':
      return typeof value === 'number' ? value.toString() : String(value);
    case 'text':
    default:
      return String(value);
  }
}
