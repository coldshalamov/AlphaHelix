import { useMemo, memo, useState, useEffect } from 'react';
import Link from 'next/link';
import { formatEther } from 'viem';
import { useReadContract, useReadContracts } from 'wagmi';
import contracts from '@/config/contracts.json';
import { marketAbi } from '@/abis';
import { dateTimeFormatter } from '@/lib/formatters';

const PAGE_SIZE = 10;

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

export default function MarketsPage() {
  const [page, setPage] = useState(0);

  const { data: marketCount } = useReadContract({
    address: contracts.HelixMarket,
    abi: marketAbi,
    functionName: 'marketCount',
  });

  const numericCount = useMemo(() => (marketCount ? Number(marketCount) : 0), [marketCount]);
  const totalPages = Math.ceil(numericCount / PAGE_SIZE);

  // BOLT: Added useEffect to prevent out-of-bounds rendering if chain switch reduces marketCount
  useEffect(() => {
    if (numericCount > 0 && page * PAGE_SIZE >= numericCount) {
      setPage(0);
    }
  }, [numericCount, page]);

  // BOLT: Replaced manual Promise.all loop with useReadContracts.
  // This enables multicall batching (1 RPC call instead of N) and standardizes data fetching.
  // ⚡ BOLT: Implemented offset pagination to limit unbounded array map on marketCount which causes O(N) payload explosion
  const { data: marketsResults, isLoading, error: queryError } = useReadContracts({
    contracts: useMemo(() => {
      if (!numericCount) return [];
      const offset = page * PAGE_SIZE;
      const length = Math.min(PAGE_SIZE, numericCount - offset);
      if (length <= 0) return [];

      return Array.from({ length }).map((_, i) => ({
        address: contracts.HelixMarket,
        abi: marketAbi,
        functionName: 'markets',
        args: [BigInt(offset + i)],
      }));
    }, [numericCount, page]),
    query: {
      enabled: numericCount > 0,
    },
  });

  const markets = useMemo(() => {
    if (!marketsResults) return [];
    const offset = page * PAGE_SIZE;
    return marketsResults
      .map((res, i) => {
        if (res.status !== 'success') return null;
        const data = res.result;
        const [ipfsCid, commitEndTime, revealEndTime, yesPool, noPool, unalignedPool, resolved, outcome, tie, originator] =
          data;
        return {
          id: offset + i,
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
  }, [marketsResults, page]);

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

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
          <button
            className="button outline"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            Previous
          </button>
          <span style={{ display: 'flex', alignItems: 'center' }} className="helper">
            Page {page + 1} of {totalPages}
          </span>
          <button
            className="button outline"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
