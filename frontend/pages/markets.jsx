import { useMemo } from 'react';
import Link from 'next/link';
import { useReadContract, useReadContracts } from 'wagmi';
import contracts from '@/config/contracts.json';
import { marketAbi } from '@/abis';
import MarketCard from '@/components/MarketCard';

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
          <MarketCard key={m.id} market={m} id={m.id} />
        ))}
      </div>
      {!isLoading && markets.length === 0 && !error && <p className="helper">No markets found.</p>}
    </div>
  );
}
