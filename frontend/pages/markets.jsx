import { useMemo, useState, useEffect, memo } from 'react';
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
          <div className="value">{formatEther(yesPool)} HLX</div>
        </div>
        <div>
          <div className="label">NO Pool</div>
          <div className="value">{formatEther(noPool)} HLX</div>
        </div>
        <div>
          <div className="label">UNALIGNED Pool</div>
          <div className="value">{formatEther(unalignedPool)} HLX</div>
        </div>
      </div>
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

const PAGE_SIZE = 10;

export default function MarketsPage() {
  const { data: marketCount } = useReadContract({
    address: contracts.HelixMarket,
    abi: marketAbi,
    functionName: 'marketCount',
  });

  const numericCount = useMemo(() => (marketCount ? Number(marketCount) : 0), [marketCount]);

  const [page, setPage] = useState(0);

  useEffect(() => {
    // Reset page if total count drops and current page is out of bounds
    if (page * PAGE_SIZE >= numericCount && numericCount > 0) {
      setPage(0);
    }
  }, [numericCount, page]);

  const start = page * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, numericCount);
  const length = Math.max(0, end - start);

  // BOLT: Replaced manual Promise.all loop with useReadContracts.
  // This enables multicall batching (1 RPC call instead of N) and standardizes data fetching.
  const { data: marketsResults, isLoading, error: queryError } = useReadContracts({
    contracts: useMemo(() => {
      if (length <= 0) return [];
      return Array.from({ length }).map((_, i) => ({
        address: contracts.HelixMarket,
        abi: marketAbi,
        functionName: 'markets',
        args: [BigInt(start + i)],
      }));
    }, [length, start]),
    query: {
      enabled: length > 0,
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
          id: start + i,
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
  }, [marketsResults, start]);

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

      {numericCount > PAGE_SIZE && (
        <div className="pagination" style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'center' }}>
          <button
            className="button outline"
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            Previous
          </button>
          <span className="helper" style={{ alignSelf: 'center' }}>
            Page {page + 1} of {Math.ceil(numericCount / PAGE_SIZE)}
          </span>
          <button
            className="button outline"
            onClick={() => setPage(p => p + 1)}
            disabled={end >= numericCount}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
