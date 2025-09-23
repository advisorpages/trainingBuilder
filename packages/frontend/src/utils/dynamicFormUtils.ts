export type FieldType = 'text' | 'textarea' | 'array' | 'email' | 'headline' | 'unknown';

export interface FieldConfig {
  type: FieldType;
  label: string;
  priority: number;
  component: string;
  isMultiline?: boolean;
  maxLength?: number;
  placeholder?: string;
}

// Define which fields get special treatment with enhanced UI
export const CURATED_FIELDS: Record<string, FieldConfig> = {
  headlines: {
    type: 'headline',
    label: 'Headlines',
    priority: 1,
    component: 'HeadlineSelector',
    placeholder: 'Select from generated headlines'
  },
  description: {
    type: 'textarea',
    label: 'Enhanced Description',
    priority: 2,
    component: 'TextArea',
    isMultiline: true,
    placeholder: 'Detailed session description'
  },
  keyBenefits: {
    type: 'array',
    label: 'Key Benefits',
    priority: 3,
    component: 'ArrayEditor',
    placeholder: 'Add benefit'
  },
  callToAction: {
    type: 'text',
    label: 'Call to Action',
    priority: 4,
    component: 'TextInput',
    maxLength: 100,
    placeholder: 'Enter compelling call-to-action'
  },
  emailCopy: {
    type: 'email',
    label: 'Email Marketing Copy',
    priority: 5,
    component: 'EmailEditor',
    isMultiline: true,
    placeholder: 'Full email content'
  },
  socialMedia: {
    type: 'array',
    label: 'Social Media Posts',
    priority: 6,
    component: 'ArrayEditor',
    placeholder: 'Add social media post'
  },
  heroHeadline: {
    type: 'text',
    label: 'Hero Headline',
    priority: 7,
    component: 'TextInput',
    maxLength: 120,
    placeholder: 'Primary landing page headline'
  },
  heroSubheadline: {
    type: 'text',
    label: 'Hero Subheadline',
    priority: 8,
    component: 'TextInput',
    maxLength: 200,
    placeholder: 'Supporting subheadline'
  }
};

/**
 * Detect the appropriate field type based on the value and field name
 */
export function detectFieldType(fieldName: string, value: any): FieldType {
  // Check if it's a curated field first
  if (CURATED_FIELDS[fieldName]) {
    return CURATED_FIELDS[fieldName].type;
  }

  // Auto-detect based on value type and content
  if (Array.isArray(value)) {
    return 'array';
  }

  if (typeof value === 'string') {
    // Check for email content patterns
    if (fieldName.toLowerCase().includes('email') ||
        value.includes('Subject:') ||
        value.includes('@') && value.length > 100) {
      return 'email';
    }

    // Check for headline patterns
    if (fieldName.toLowerCase().includes('headline') ||
        fieldName.toLowerCase().includes('title')) {
      return 'headline';
    }

    // Check if it should be a textarea (long content)
    if (value.length > 150 || value.includes('\n')) {
      return 'textarea';
    }

    return 'text';
  }

  return 'unknown';
}

/**
 * Generate a human-readable label from a field name
 */
export function generateFieldLabel(fieldName: string): string {
  if (CURATED_FIELDS[fieldName]) {
    return CURATED_FIELDS[fieldName].label;
  }

  // Convert camelCase to readable format
  return fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

/**
 * Get all dynamic fields (those not in curated list)
 */
export function getDynamicFields(content: Record<string, any>): Record<string, any> {
  const dynamicFields: Record<string, any> = {};

  Object.keys(content).forEach(key => {
    if (!CURATED_FIELDS[key] && content[key] !== null && content[key] !== undefined) {
      dynamicFields[key] = content[key];
    }
  });

  return dynamicFields;
}

/**
 * Get curated fields that exist in the content
 */
export function getCuratedFields(content: Record<string, any>): Record<string, any> {
  const curatedFields: Record<string, any> = {};

  Object.keys(CURATED_FIELDS).forEach(key => {
    if (content[key] !== null && content[key] !== undefined) {
      curatedFields[key] = content[key];
    }
  });

  return curatedFields;
}

/**
 * Validate field value based on its configuration
 */
export function validateFieldValue(fieldName: string, value: any): string | null {
  const config = CURATED_FIELDS[fieldName];

  if (!config) {
    return null; // No validation for dynamic fields
  }

  if (config.type === 'array' && !Array.isArray(value)) {
    return `${config.label} must be an array`;
  }

  if (config.type === 'text' && typeof value !== 'string') {
    return `${config.label} must be a string`;
  }

  if (config.maxLength && typeof value === 'string' && value.length > config.maxLength) {
    return `${config.label} must be less than ${config.maxLength} characters`;
  }

  return null;
}

/**
 * Get field priority for sorting
 */
export function getFieldPriority(fieldName: string): number {
  return CURATED_FIELDS[fieldName]?.priority || 999;
}