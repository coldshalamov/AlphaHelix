import { useState, useCallback } from 'react';

export default function CopyButton({
  value,
  label, // Optional: text to show when not copied. If not provided, value is shown.
  successLabel = '✓ Copied!',
  ariaLabel = 'Copy to clipboard',
  className = 'badge',
  style = {},
  onCopy // Optional: callback for when copy happens
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard && value) {
      try {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        if (onCopy) onCopy();
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  }, [value, onCopy]);

  return (
    <button
      type="button"
      className={className}
      onClick={handleCopy}
      aria-label={copied ? successLabel : ariaLabel}
      style={{ cursor: 'pointer', ...style }}
    >
      <span>{copied ? successLabel : (label || value)}</span>
    </button>
  );
}
