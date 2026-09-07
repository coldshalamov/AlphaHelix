import { useState, useCallback } from 'react';

/**
 * A reusable button component that handles copy-to-clipboard functionality
 * with accessible feedback.
 *
 * @param {string} value - The text content to copy to clipboard
 * @param {string} ariaLabel - Accessible label for the button (default state)
 * @param {string} className - CSS classes for styling
 * @param {React.ReactNode} children - The button content (default state)
 * @param {string} successText - The text to display upon successful copy
 * @param {object} props - Additional props passed to the button element
 */
export default function CopyButton({
  value,
  ariaLabel,
  className = '',
  children,
  successText = '✓ Copied!',
  ...props
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [value]);

  return (
    <button
      type="button"
      className={className}
      onClick={handleCopy}
      aria-label={copied ? successText : ariaLabel}
      aria-live="polite"
      {...props}
    >
      {copied ? successText : children}
    </button>
  );
}
