// Shared validation constants for financial inputs
// Used by Bank.jsx and BettingWidget.jsx to ensure consistency and prevent object reallocation

// Regex for typing: allows incomplete decimals like "10."
export const VALID_DECIMAL_REGEX = /^\d*\.?\d*$/;

// Regex for submission: requires valid decimal format (e.g., "10.0" or "10")
// Note: "10." is technically valid in JS but often rejected by parsers expecting full precision
export const INPUT_SANITIZATION_REGEX = /^\d*\.?\d+$/;

// Maximum input length to prevent DoS/overflow and maintain UI integrity
// 50 chars is sufficient for 18-decimal precision + large integers
export const MAX_INPUT_LENGTH = 50;
