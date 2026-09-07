// Constants for input validation and sanitation
// Defined at module level to avoid recompilation on every render/event loop

// Allows digits, optional decimal point, and digits after decimal.
// Used for onChange to allow typing intermediate states (e.g., "1.", "0.0")
export const DECIMAL_INPUT_REGEX = /^\d*\.?\d*$/;

// Strictly checks for valid decimal number format for submission.
// Ensures there are digits.
export const VALID_DECIMAL_REGEX = /^\d*\.?\d+$/;
