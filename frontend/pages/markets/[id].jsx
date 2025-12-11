import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { formatEther } from 'viem';
import { useAccount, useChainId, useReadContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import contracts from '@/config/contracts.json';
import { marketAbi } from '@/abis';

const BettingWidget = dynamic(() => import('@/components/BettingWidget'), { ssr: false });

export default function MarketDetailPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const router = useRouter();
  const { id } = router.query;
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  const expectedChainId = useMemo(() => Number(process.env.NEXT_PUBLIC_CHAIN_ID || 31337), []);

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
    watch: true,
  });

  const { data: yesBet } = useReadContract({
    address: contracts.HelixMarket,
    abi: marketAbi,
    functionName: 'bets',
    args: marketId !== undefined && address ? [marketId, address, 1] : undefined,
    query: { enabled: marketId !== undefined && Boolean(address) },
    watch: true,
  });

  const { data: noBet } = useReadContract({
    address: contracts.HelixMarket,
    abi: marketAbi,
    functionName: 'bets',
    args: marketId !== undefined && address ? [marketId, address, 0] : undefined,
    query: { enabled: marketId !== undefined && Boolean(address) },
    watch: true,
  });

  const { data: unalignedBet } = useReadContract({
    address: contracts.HelixMarket,
    abi: marketAbi,
    functionName: 'bets',
    args: marketId !== undefined && address ? [marketId, address, 2] : undefined,
    query: { enabled: marketId !== undefined && Boolean(address) },
    watch: true,
  });

  const { data: committedBalance } = useReadContract({
    address: contracts.HelixMarket,
    abi: marketAbi,
    functionName: 'committedAmount',
    args: marketId !== undefined && address ? [marketId, address] : undefined,
    query: { enabled: marketId !== undefined && Boolean(address) },
    watch: true,
  });

  const { writeContractAsync, isPending: isClaimPending } = useWriteContract();
  const [status, setStatus] = useState('');
  const [txHash, setTxHash] = useState();
  const { isLoading: isClaimConfirming, isSuccess: isClaimSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    const timer = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isClaimConfirming) setStatus('Claim transaction pending...');
    else if (isClaimSuccess) setStatus('Claim confirmed. Balances will refresh shortly.');
  }, [isClaimConfirming, isClaimSuccess]);

  if (!id) return <div className="status">Loading market...</div>;
  if (error) return <div className="status">Failed to load market.</div>;
  if (isLoading || !market) return <div className="status">Fetching market data...</div>;

  const [ipfsCid, commitEndTime, revealEndTime, yesPool, noPool, unalignedPool, resolved, outcome, tie, originator] = market;

  const marketState = useMemo(() => {
    if (!commitEndTime || !revealEndTime) return 'UNKNOWN';
    const commitEndSeconds = Number(commitEndTime);
    const revealEndSeconds = Number(revealEndTime);
    if (now < commitEndSeconds) return 'COMMIT';
    if (now >= commitEndSeconds && now < revealEndSeconds) return 'REVEAL';
    if (now >= revealEndSeconds && resolved) return 'CLOSED';
    if (now >= revealEndSeconds && !resolved) return 'AFTER_REVEAL_NOT_RESOLVED';
    return 'UNKNOWN';
  }, [commitEndTime, revealEndTime, now, resolved]);

  const commitCountdown = useMemo(() => {
    if (!commitEndTime) return null;
    const secondsLeft = Number(commitEndTime) - now;
    return secondsLeft > 0 ? formatDuration(secondsLeft) : null;
  }, [commitEndTime, now]);

  const revealCountdown = useMemo(() => {
    if (!revealEndTime) return null;
    const secondsLeft = Number(revealEndTime) - now;
    return secondsLeft > 0 ? formatDuration(secondsLeft) : null;
  }, [revealEndTime, now]);

  const claimable = useMemo(() => {
    if (!resolved || !address) return 0n;
    if (tie) {
      return (yesBet || 0n) + (noBet || 0n) + (unalignedBet || 0n);
    }
    if (outcome) return yesBet || 0n;
    return noBet || 0n;
  }, [address, noBet, outcome, resolved, tie, unalignedBet, yesBet]);

  const handleClaim = async () => {
    if (!address) {
      setStatus('Connect a wallet to claim.');
      return;
    }
    if (chainId && chainId !== expectedChainId) {
      setStatus('Wrong network selected. Switch to the configured Helix chain.');
      return;
    }
    setStatus('');
    try {
      const hash = await writeContractAsync({
        address: contracts.HelixMarket,
        abi: marketAbi,
        functionName: 'claim',
        args: [marketId],
      });
      setTxHash(hash);
    } catch (err) {
      setStatus(err?.shortMessage || err?.message || 'Claim failed (you may have nothing to claim).');
    }
  };

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
            {commitCountdown && <div className="helper">Time left: {commitCountdown}</div>}
          </div>
          <div>
            <div className="label">Reveal end</div>
            <div className="value">{new Date(Number(revealEndTime) * 1000).toLocaleString()}</div>
            {revealCountdown && <div className="helper">Time left: {revealCountdown}</div>}
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

        <div className="status" style={{ marginTop: '0.75rem' }}>
          Phase: {marketState === 'AFTER_REVEAL_NOT_RESOLVED' ? 'Awaiting resolution' : marketState}
        </div>
        {resolved && (
          <div className="status" style={{ marginTop: '0.75rem' }}>
            Outcome: {tie ? 'Tie (refund)' : outcome ? 'YES wins' : 'NO wins'}
          </div>
        )}

        <div className="table-like" style={{ marginTop: '0.75rem' }}>
          <div>
            <div className="label">Your revealed YES</div>
            <div className="value">{yesBet ? `${formatEther(yesBet)} HLX` : '—'}</div>
          </div>
          <div>
            <div className="label">Your revealed NO</div>
            <div className="value">{noBet ? `${formatEther(noBet)} HLX` : '—'}</div>
          </div>
          <div>
            <div className="label">Your UNALIGNED</div>
            <div className="value">{unalignedBet ? `${formatEther(unalignedBet)} HLX` : '—'}</div>
          </div>
          <div>
            <div className="label">Committed (unrevealed)</div>
            <div className="value">{committedBalance ? `${formatEther(committedBalance)} HLX` : '—'}</div>
          </div>
        </div>

        {isConnected && (
          <div className="card" style={{ marginTop: '0.75rem', borderColor: '#e5e7eb' }}>
            <div className="label">Claim status</div>
            <div className="value">
              {resolved
                ? claimable > 0n
                  ? `${formatEther(claimable)} HLX ready to claim`
                  : 'Nothing claimable or already claimed'
                : 'Claims open after resolution.'}
            </div>
            <button
              className="button primary"
              style={{ marginTop: '0.5rem' }}
              onClick={handleClaim}
              disabled={
                !resolved || claimable === 0n || isClaimPending || isClaimConfirming || (chainId && chainId !== expectedChainId)
              }
            >
              {isClaimPending || isClaimConfirming ? 'Claiming...' : 'Claim winnings / refund'}
            </button>
            {chainId && chainId !== expectedChainId && (
              <div className="helper">Wrong network detected. Switch chains to claim.</div>
            )}
            {status && <div className="status">{status}</div>}
          </div>
        )}
      </div>

      <BettingWidget
        marketId={marketId}
        commitEnd={commitEndTime}
        revealEnd={revealEndTime}
        marketState={marketState}
        resolved={resolved}
        outcome={outcome}
        tie={tie}
        expectedChainId={expectedChainId}
      />
    </div>
  );
}

function formatDuration(seconds) {
  const s = Math.max(0, seconds);
  const minutes = Math.floor(s / 60);
  const secs = s % 60;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0) parts.push(`${mins}m`);
  parts.push(`${secs}s`);
  return parts.join(' ');
}
