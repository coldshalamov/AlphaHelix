import { useState, useCallback } from 'react';

export default function CopyButton({
  text,
  label,
  successText = 'Copied!',
  className = 'badge',
  children,
  ...props
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    if (text) {
      navigator.clipboard.writeText(text)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch((err) => console.error('Failed to copy:', err));
    }
  }, [text]);

  return (
    <button
      type="button"
      className={className}
      onClick={handleCopy}
      aria-label={copied ? successText : label}
      aria-live="polite"
      {...props}
    >
      <span>{copied ? `✓ ${successText}` : children}</span>
    </button>
  );
}
