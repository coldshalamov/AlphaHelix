import React from 'react';

export default function EmptyState({
  icon,
  title = 'No data found',
  description,
  actionLabel,
  onAction
}) {
  return (
    <div className="empty-state text-center">
      <div className="empty-icon">
        {icon || (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      <h3 className="empty-title">{title}</h3>
      {description && <p className="empty-description">{description}</p>}
      {actionLabel && onAction && (
        <button className="button outline" onClick={onAction}>
          {actionLabel}
        </button>
      )}

      <style jsx>{`
        .empty-state {
          padding: var(--space-12) var(--space-6);
          background: var(--color-bg-secondary);
          border: 1px dashed var(--color-border);
          border-radius: var(--radius-xl);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin-top: var(--space-6);
        }

        .empty-icon {
          color: var(--color-text-tertiary);
          margin-bottom: var(--space-4);
          background: var(--charcoal-elevated);
          padding: var(--space-4);
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .empty-title {
          font-size: var(--text-lg);
          font-weight: var(--font-semibold);
          color: var(--color-text-primary);
          margin-bottom: var(--space-2);
        }

        .empty-description {
          color: var(--color-text-secondary);
          max-width: 400px;
          margin-bottom: var(--space-6);
          line-height: var(--leading-relaxed);
        }
      `}</style>
    </div>
  );
}
