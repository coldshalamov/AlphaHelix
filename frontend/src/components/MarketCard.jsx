import { memo } from 'react';
import Link from 'next/link';
import { formatEther } from 'viem';

const DATE_FORMATTER = new Intl.DateTimeFormat('default', {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
});

function MarketCard({ market, id }) {
  const commitDate = DATE_FORMATTER.format(new Date(market.commitEndTime * 1000));
  const revealDate = DATE_FORMATTER.format(new Date(market.revealEndTime * 1000));

  return (
    <div className="card">
      <div className="label">Statement #{id}</div>
      <h3 className="font-semibold" style={{ marginTop: '0.25rem' }}>
        {market.ipfsCid || 'No CID provided'}
      </h3>
      <div className="table-like" style={{ marginTop: '0.5rem' }}>
        <div>
          <div className="label">Commit ends</div>
          <div className="value">{commitDate}</div>
        </div>
        <div>
          <div className="label">Reveal ends</div>
          <div className="value">{revealDate}</div>
        </div>
      </div>
      <div className="table-like" style={{ marginTop: '0.5rem' }}>
        <div>
          <div className="label">YES Pool</div>
          <div className="value">{formatEther(market.yesPool)} HLX</div>
        </div>
        <div>
          <div className="label">NO Pool</div>
          <div className="value">{formatEther(market.noPool)} HLX</div>
        </div>
        <div>
          <div className="label">UNALIGNED Pool</div>
          <div className="value">{formatEther(market.unalignedPool)} HLX</div>
        </div>
      </div>
      <Link className="button primary" style={{ marginTop: '0.75rem', display: 'inline-block' }} href={`/markets/${id}`}>
        View details
      </Link>
    </div>
  );
}

export default memo(MarketCard);
