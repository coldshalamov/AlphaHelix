import { useMemo, memo, useState, useEffect } from 'react';
import Link from 'next/link';
import { formatEther } from 'viem';
import { useReadContract, useReadContracts } from 'wagmi';
import contracts from '@/config/contracts.json';
import { marketAbi } from '@/abis';
import { formatTimestamp } from '@/lib/formatters';

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
  const commitDate = formatTimestamp(commitEndTime);
  const revealDate = formatTimestamp(revealEndTime);

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
  const [page, setPage] = useState(0);
  const { data: marketCount } = useReadContract({
    address: contracts.HelixMarket,
    abi: marketAbi,
    functionName: 'marketCount',
  });

  const numericCount = useMemo(() => (marketCount ? Number(marketCount) : 0), [marketCount]);

  // BOLT: Added useEffect to safely reset the page state if the total count decreases (e.g., due to a network switch), preventing out-of-bounds rendering errors.
  useEffect(() => {
    if (numericCount > 0 && page * PAGE_SIZE >= numericCount) {
      setPage(Math.max(0, Math.ceil(numericCount / PAGE_SIZE) - 1));
    }
  }, [numericCount, page]);

  // BOLT: Replaced unbounded Wagmi useReadContracts multicall with offset pagination to prevent O(N) payload explosions and RPC limits.
  const contractCalls = useMemo(() => {
    if (!numericCount) return [];
    const start = page * PAGE_SIZE;
    const end = Math.min(start + PAGE_SIZE, numericCount);

    const calls = [];
    for (let i = start; i < end; i++) {
      calls.push({
        address: contracts.HelixMarket,
        abi: marketAbi,
        functionName: 'markets',
        args: [BigInt(i)],
      });
    }
    return calls;
  }, [numericCount, page]);

  const { data: marketsResults, isLoading, error: queryError } = useReadContracts({
    contracts: contractCalls,
    query: {
      enabled: contractCalls.length > 0,
    },
  });

  const markets = useMemo(() => {
    if (!marketsResults) return [];
    return marketsResults
      .map((res, index) => {
        if (res.status !== 'success') return null;
        const data = res.result;
        // BOLT: Derive the ID directly from the input contracts array to ensure data consistency during page transitions.
        const id = Number(contractCalls[index].args[0]);
        const [ipfsCid, commitEndTime, revealEndTime, yesPool, noPool, unalignedPool, resolved, outcome, tie, originator] =
          data;
        return {
          id,
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
  }, [marketsResults, contractCalls]);

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

      {Math.ceil(numericCount / PAGE_SIZE) > 1 && (
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem', alignItems: 'center' }}>
          <button
            className="button secondary"
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            Previous
          </button>
          <span className="helper">Page {page + 1} of {Math.ceil(numericCount / PAGE_SIZE)}</span>
          <button
            className="button secondary"
            onClick={() => setPage(p => Math.min(Math.ceil(numericCount / PAGE_SIZE) - 1, p + 1))}
            disabled={page >= Math.ceil(numericCount / PAGE_SIZE) - 1}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
