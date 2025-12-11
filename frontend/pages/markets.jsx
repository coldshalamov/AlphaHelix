import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { formatEther } from 'viem';
import { usePublicClient, useReadContract } from 'wagmi';
import contracts from '@/config/contracts.json';
import { marketAbi } from '@/abis';

function MarketCard({ market, id }) {
  const commitDate = new Date(market.commitEndTime * 1000).toLocaleString();
  const revealDate = new Date(market.revealEndTime * 1000).toLocaleString();
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

export default function MarketsPage() {
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const publicClient = usePublicClient();

  const { data: marketCount } = useReadContract({
    address: contracts.HelixMarket,
    abi: marketAbi,
    functionName: 'marketCount',
  });

  const numericCount = useMemo(() => (marketCount ? Number(marketCount) : 0), [marketCount]);

  useEffect(() => {
    const fetchMarkets = async () => {
      if (!publicClient || numericCount === 0) {
        setMarkets([]);
        return;
      }
      setLoading(true);
      setError('');
      try {
        const rows = [];
        for (let i = 0; i < numericCount; i++) {
          const data = await publicClient.readContract({
            address: contracts.HelixMarket,
            abi: marketAbi,
            functionName: 'markets',
            args: [BigInt(i)],
          });
          const [ipfsCid, commitEndTime, revealEndTime, yesPool, noPool, unalignedPool, resolved, outcome, tie, originator] = data;
          rows.push({
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
          });
        }
        setMarkets(rows);
      } catch (err) {
        setError(err?.shortMessage || err?.message || 'Unable to load markets');
      } finally {
        setLoading(false);
      }
    };

    fetchMarkets();
  }, [numericCount, publicClient]);

  return (
    <div className="grid section">
      <div className="card">
        <h2 className="text-xl font-bold">Markets</h2>
        <p className="helper">Live statements pulled directly from the HelixMarket contract.</p>
      </div>
      {loading && <div className="status">Loading markets...</div>}
      {error && <div className="status">{error}</div>}
      <div className="grid two">
        {markets.map((m) => (
          <MarketCard key={m.id} market={m} id={m.id} />
        ))}
      </div>
      {!loading && markets.length === 0 && <p className="helper">No markets found.</p>}
    </div>
  );
}
