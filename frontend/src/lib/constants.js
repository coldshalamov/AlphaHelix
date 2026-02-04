/**
 * Security & Validation Constants
 */

// Regex to allow typing a decimal number (allows empty string, digits, optional dot, optional digits)
export const INPUT_SANITIZATION_REGEX = /^\d*\.?\d*$/;

// Regex to validate a complete decimal number (requires at least one digit after dot if dot exists)
// Note: This matches Bank.jsx logic: /^\d*\.?\d+$/
// It rejects "1." but accepts "1.0", ".5", "123"
export const VALID_DECIMAL_REGEX = /^\d*\.?\d+$/;

// Maximum allowed input length for financial inputs to prevent DoS/memory issues
export const MAX_INPUT_LENGTH = 50;
