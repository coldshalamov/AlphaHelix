import { useMemo, memo } from 'react';
import Link from 'next/link';
import { formatEther } from 'viem';
import { useReadContract, useReadContracts } from 'wagmi';
import contracts from '@/config/contracts.json';
import { marketAbi } from '@/abis';
import { dateTimeFormatter } from '@/lib/formatters';

// BOLT: Replaced .toLocaleString() with shared dateTimeFormatter to prevent
// re-initializing localization data on every render.
// BOLT: Changed props to primitives to ensure React.memo works correctly.
// Passing the `market` object caused re-renders because the object reference changed
// on every parent update, even if data was identical.
const MarketCard = memo(function MarketCard({
  id,
  ipfsCid,
  commitEndTime,
  revealEndTime,
  yesPool,
  noPool,
  unalignedPool,
}) {
  const commitDate = dateTimeFormatter.format(new Date(commitEndTime * 1000));
  const revealDate = dateTimeFormatter.format(new Date(revealEndTime * 1000));

  return (
    <div className="card">
      <div className="label">Statement #{id}</div>
      <h3 className="font-semibold" style={{ marginTop: '0.25rem' }}>
        {ipfsCid || 'No CID provided'}
      </h3>
      <dl className="table-like" style={{ marginTop: '0.5rem' }}>
        <div>
          <dt className="label">Commit ends</dt>
          <dd className="value" style={{ margin: 0 }}>{commitDate}</dd>
        </div>
        <div>
          <dt className="label">Reveal ends</dt>
          <dd className="value" style={{ margin: 0 }}>{revealDate}</dd>
        </div>
      </dl>
      <dl className="table-like" style={{ marginTop: '0.5rem' }}>
        <div>
          <dt className="label">YES Pool</dt>
          <dd className="value" style={{ margin: 0 }}>{formatEther(yesPool)} HLX</dd>
        </div>
        <div>
          <dt className="label">NO Pool</dt>
          <dd className="value" style={{ margin: 0 }}>{formatEther(noPool)} HLX</dd>
        </div>
        <div>
          <dt className="label">UNALIGNED Pool</dt>
          <dd className="value" style={{ margin: 0 }}>{formatEther(unalignedPool)} HLX</dd>
        </div>
      </dl>
      <Link
        className="button primary"
        style={{ marginTop: '0.75rem', display: 'inline-block' }}
        href={`/markets/${id}`}
        aria-label={`View details for Statement #${id}`}
      >
        View details
      </Link>
    </div>
  );
});

export default function MarketsPage() {
  const { data: marketCount } = useReadContract({
    address: contracts.HelixMarket,
    abi: marketAbi,
    functionName: 'marketCount',
  });

  const numericCount = useMemo(() => (marketCount ? Number(marketCount) : 0), [marketCount]);

  // BOLT: Replaced manual Promise.all loop with useReadContracts.
  // This enables multicall batching (1 RPC call instead of N) and standardizes data fetching.
  const { data: marketsResults, isLoading, error: queryError } = useReadContracts({
    contracts: useMemo(() => {
      if (!numericCount) return [];
      return Array.from({ length: numericCount }).map((_, i) => ({
        address: contracts.HelixMarket,
        abi: marketAbi,
        functionName: 'markets',
        args: [BigInt(i)],
      }));
    }, [numericCount]),
    query: {
      enabled: numericCount > 0,
    },
  });

  const markets = useMemo(() => {
    if (!marketsResults) return [];
    return marketsResults
      .map((res, i) => {
        if (res.status !== 'success') return null;
        const data = res.result;
        const [ipfsCid, commitEndTime, revealEndTime, yesPool, noPool, unalignedPool, resolved, outcome, tie, originator] =
          data;
        return {
          id: i,
          ipfsCid,
          commitEndTime: Number(commitEndTime),
          revealEndTime: Number(revealEndTime),
          yesPool,
          noPool,
          unalignedPool,
          resolved,
          outcome,
          tie,
          originator,
        };
      })
      .filter((m) => m !== null);
  }, [marketsResults]);

  const error = queryError ? (queryError?.shortMessage || queryError?.message || 'Unable to load markets') : '';

  return (
    <div className="grid section">
      <div className="card">
        <h2 className="text-xl font-bold">Markets</h2>
        <p className="helper">Live statements pulled directly from the HelixMarket contract.</p>
      </div>
      {isLoading && <div className="status">Loading markets...</div>}
      {error && <div className="status">{error}</div>}
      <div className="grid two">
        {markets.map((m) => (
          <MarketCard
            key={m.id}
            id={m.id}
            ipfsCid={m.ipfsCid}
            commitEndTime={m.commitEndTime}
            revealEndTime={m.revealEndTime}
            yesPool={m.yesPool}
            noPool={m.noPool}
            unalignedPool={m.unalignedPool}
          />
        ))}
      </div>
      {!isLoading && markets.length === 0 && !error && <p className="helper">No markets found.</p>}
    </div>
  );
}
