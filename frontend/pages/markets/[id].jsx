import { useMemo } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { formatEther } from 'viem';
import { useReadContract } from 'wagmi';
import contracts from '@/config/contracts.json';
import { marketAbi } from '@/abis';

const BettingWidget = dynamic(() => import('@/components/BettingWidget'), { ssr: false });

export default function MarketDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const marketId = useMemo(() => {
    if (id === undefined) return undefined;
    try {
      return BigInt(id);
    } catch (err) {
      return undefined;
    }
  }, [id]);

  const { data: market, error, isLoading } = useReadContract({
    address: contracts.HelixMarket,
    abi: marketAbi,
    functionName: 'markets',
    args: marketId !== undefined ? [marketId] : undefined,
    query: { enabled: marketId !== undefined },
  });

  if (!id) return <div className="status">Loading market...</div>;
  if (error) return <div className="status">Failed to load market.</div>;
  if (isLoading || !market) return <div className="status">Fetching market data...</div>;

  const [ipfsCid, commitEndTime, revealEndTime, yesPool, noPool, unalignedPool, resolved, outcome, tie, originator] = market;

  return (
    <div className="grid section">
      <div className="card">
        <div className="label">Market #{id}</div>
        <h2 className="text-xl font-bold" style={{ marginTop: '0.25rem' }}>
          {ipfsCid || 'Untitled statement'}
        </h2>
        <div className="table-like" style={{ marginTop: '0.75rem' }}>
          <div>
            <div className="label">Commit end</div>
            <div className="value">{new Date(Number(commitEndTime) * 1000).toLocaleString()}</div>
          </div>
          <div>
            <div className="label">Reveal end</div>
            <div className="value">{new Date(Number(revealEndTime) * 1000).toLocaleString()}</div>
          </div>
          <div>
            <div className="label">Originator</div>
            <div className="value">{originator}</div>
          </div>
        </div>

        <div className="table-like" style={{ marginTop: '0.75rem' }}>
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

        {resolved && (
          <div className="status" style={{ marginTop: '0.75rem' }}>
            Outcome: {tie ? 'Tie (refund)' : outcome ? 'YES wins' : 'NO wins'}
          </div>
        )}
      </div>

      <BettingWidget marketId={marketId} commitEnd={commitEndTime} revealEnd={revealEndTime} />
    </div>
  );
}
