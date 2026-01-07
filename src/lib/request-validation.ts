import { NextResponse } from "next/server";

/**
 * Validation error response type
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Result of parsing JSON from request
 */
export type ParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: NextResponse };

/**
 * Safely parse JSON from request body
 * Returns a NextResponse error if parsing fails
 */
export async function safeParseJSON<T = Record<string, unknown>>(
  request: Request
): Promise<ParseResult<T>> {
  try {
    const data = await request.json();
    return { success: true, data: data as T };
  } catch {
    return {
      success: false,
      error: NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      ),
    };
  }
}

/**
 * Validation constraints for string fields
 */
export interface StringConstraints {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  patternMessage?: string;
}

/**
 * Validation constraints for number fields
 */
export interface NumberConstraints {
  required?: boolean;
  min?: number;
  max?: number;
  integer?: boolean;
}

/**
 * Validate a string field
 */
export function validateString(
  value: unknown,
  fieldName: string,
  constraints: StringConstraints = {}
): ValidationError | null {
  const { required = false, minLength, maxLength, pattern, patternMessage } = constraints;

  if (value === undefined || value === null || value === "") {
    if (required) {
      return { field: fieldName, message: `${fieldName} is required` };
    }
    return null; // Optional field not provided
  }

  if (typeof value !== "string") {
    return { field: fieldName, message: `${fieldName} must be a string` };
  }

  if (minLength !== undefined && value.length < minLength) {
    return { field: fieldName, message: `${fieldName} must be at least ${minLength} characters` };
  }

  if (maxLength !== undefined && value.length > maxLength) {
    return { field: fieldName, message: `${fieldName} must be at most ${maxLength} characters` };
  }

  if (pattern && !pattern.test(value)) {
    return { field: fieldName, message: patternMessage || `${fieldName} has invalid format` };
  }

  return null;
}

/**
 * Validate a number field
 */
export function validateNumber(
  value: unknown,
  fieldName: string,
  constraints: NumberConstraints = {}
): ValidationError | null {
  const { required = false, min, max, integer = false } = constraints;

  if (value === undefined || value === null || value === "") {
    if (required) {
      return { field: fieldName, message: `${fieldName} is required` };
    }
    return null; // Optional field not provided
  }

  const num = typeof value === "string" ? parseFloat(value) : value;

  if (typeof num !== "number" || isNaN(num)) {
    return { field: fieldName, message: `${fieldName} must be a valid number` };
  }

  if (integer && !Number.isInteger(num)) {
    return { field: fieldName, message: `${fieldName} must be an integer` };
  }

  if (min !== undefined && num < min) {
    return { field: fieldName, message: `${fieldName} must be at least ${min}` };
  }

  if (max !== undefined && num > max) {
    return { field: fieldName, message: `${fieldName} must be at most ${max}` };
  }

  return null;
}

/**
 * Validate an enum field
 */
export function validateEnum(
  value: unknown,
  fieldName: string,
  allowedValues: readonly string[],
  required = false
): ValidationError | null {
  if (value === undefined || value === null || value === "") {
    if (required) {
      return { field: fieldName, message: `${fieldName} is required` };
    }
    return null;
  }

  if (typeof value !== "string") {
    return { field: fieldName, message: `${fieldName} must be a string` };
  }

  if (!allowedValues.includes(value)) {
    return {
      field: fieldName,
      message: `${fieldName} must be one of: ${allowedValues.join(", ")}`,
    };
  }

  return null;
}

/**
 * Collect validation errors and return response if any
 */
export function collectErrors(
  errors: (ValidationError | null)[]
): NextResponse | null {
  const actualErrors = errors.filter((e): e is ValidationError => e !== null);

  if (actualErrors.length === 0) {
    return null;
  }

  return NextResponse.json(
    {
      error: "Validation failed",
      details: actualErrors,
    },
    { status: 400 }
  );
}

// Common validation constants
export const LIMITS = {
  NAME_MAX: 100,
  TITLE_MAX: 200,
  DESCRIPTION_MAX: 2000,
  EMAIL_MAX: 254,
  NOTES_MAX: 5000,
  POINTS_MAX: 100000,
  POINTS_MIN: -100000,
  PIN_LENGTH: 4,
} as const;

// Common patterns
export const PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  HEX_COLOR: /^#[0-9A-Fa-f]{6}$/,
  TIME_24H: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
} as const;
