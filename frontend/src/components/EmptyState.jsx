import { memo } from 'react';

function EmptyState({ title, description, onRetry }) {
  return (
    <div className="card text-center" style={{ padding: 'var(--space-12) var(--space-6)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }} role="presentation">
        📭
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="helper" style={{ maxWidth: '400px', margin: '0 auto var(--space-6)' }}>
        {description}
      </p>
      {onRetry && (
        <button className="button outline" onClick={onRetry}>
          Refresh
        </button>
      )}
    </div>
  );
}

export default memo(EmptyState);
