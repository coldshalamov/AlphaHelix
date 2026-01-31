import React, { memo } from 'react';

const DefaultIcon = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const EmptyState = memo(function EmptyState({
  title = "No items found",
  description = "We couldn't find anything to show here.",
  icon,
  onRetry,
  retryLabel = "Refresh"
}) {
  return (
    <div className="card text-center animate-fade-in-up" style={{ padding: 'var(--space-12) var(--space-6)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div
        style={{
          width: '64px',
          height: '64px',
          background: 'rgba(255, 184, 0, 0.1)',
          color: 'var(--amber-uncertainty)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 'var(--space-4)',
          border: '1px solid var(--amber-uncertainty)'
        }}
      >
        {icon || <DefaultIcon />}
      </div>
      <h3 className="font-semibold" style={{ marginBottom: 'var(--space-2)' }}>{title}</h3>
      <p className="helper" style={{ maxWidth: '400px', margin: '0 auto var(--space-6)' }}>
        {description}
      </p>
      {onRetry && (
        <button className="button outline" onClick={onRetry}>
          {retryLabel}
        </button>
      )}
    </div>
  );
});

export default EmptyState;
