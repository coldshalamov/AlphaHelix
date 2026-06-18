import { useState, useCallback } from 'react';

/**
 * A reusable button component for copying text to the clipboard.
 *
 * @param {string} text - The text to copy to the clipboard.
 * @param {string} [label="Copy to clipboard"] - The aria-label for the button.
 * @param {string} [successText="Copied!"] - The text to display upon successful copy.
 * @param {string} [className="badge"] - The CSS class for styling. Defaults to "badge".
 * @param {React.ReactNode} children - The default content of the button (e.g., text or icon).
 */
export default function CopyButton({
  text,
  label = "Copy to clipboard",
  successText = "Copied!",
  className = "badge",
  children
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [text]);

  return (
    <button
      type="button"
      className={`${className} ${copied ? 'success' : ''}`}
      onClick={handleCopy}
      aria-label={copied ? successText : label}
      disabled={!text}
      style={{ cursor: 'pointer' }}
    >
      {copied ? (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>{successText}</span>
        </>
      ) : (
        <>
           {/* If no children provided, show a default copy icon */}
           {!children && (
             <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
               <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
               <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
             </svg>
           )}
           {children}
        </>
      )}
    </button>
  );
}
