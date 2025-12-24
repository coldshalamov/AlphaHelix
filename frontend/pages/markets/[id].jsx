import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { formatEther } from 'viem';
import { useAccount, useChainId, useReadContracts, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import contracts from '@/config/contracts.json';
import { marketAbi } from '@/abis';
import Spinner from '@/components/Spinner';
import Countdown from '@/components/Countdown';

const BettingWidget = dynamic(() => import('@/components/BettingWidget'), { ssr: false });

export default function MarketDetailPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const router = useRouter();
  const { id } = router.query;
  const expectedChainId = useMemo(() => Number(process.env.NEXT_PUBLIC_CHAIN_ID || 31337), []);

  const marketId = useMemo(() => {
    if (id === undefined) return undefined;
    try {
      return BigInt(id);
    } catch (err) {
      return undefined;
    }
  }, [id]);

  // Optimization: Batch multiple contract reads into a single multicall/RPC request
  // This reduces network waterfall and synchronizes loading states
  const { data: readResults, isLoading: isReading, error: readError } = useReadContracts({
    contracts: useMemo(() => {
      const contractConfig = {
        address: contracts.HelixMarket,
        abi: marketAbi,
      };

      return [
        {
          ...contractConfig,
          functionName: 'markets',
          args: marketId !== undefined ? [marketId] : undefined,
        },
        // Conditional user data fetches
        ...(marketId !== undefined && address ? [
          {
            ...contractConfig,
            functionName: 'bets',
            args: [marketId, address, 1], // Yes bet
          },
          {
            ...contractConfig,
            functionName: 'bets',
            args: [marketId, address, 0], // No bet
          },
          {
            ...contractConfig,
            functionName: 'bets',
            args: [marketId, address, 2], // Unaligned bet
          },
          {
            ...contractConfig,
            functionName: 'committedAmount',
            args: [marketId, address],
          }
        ] : [])
      ];
    }, [marketId, address]),
    query: {
       enabled: marketId !== undefined,
       // Use refetchInterval to simulate live updates (replacing watch: true which is deprecated/unavailable in v2 useReadContract props)
       refetchInterval: 5000
    }
  });

  const market = readResults?.[0]?.result;

  // Destructure based on whether address was present.
  // If address is missing, these will be undefined as the array is shorter.
  // Note: We check address presence to align indices.
  const userResultsBaseIndex = 1;
  const yesBet = address ? readResults?.[userResultsBaseIndex]?.result : undefined;
  const noBet = address ? readResults?.[userResultsBaseIndex + 1]?.result : undefined;
  const unalignedBet = address ? readResults?.[userResultsBaseIndex + 2]?.result : undefined;
  const committedBalance = address ? readResults?.[userResultsBaseIndex + 3]?.result : undefined;

  const isLoading = isReading;
  const error = readError;

  const { writeContractAsync, isPending: isClaimPending } = useWriteContract();
  const [status, setStatus] = useState('');
  const [txHash, setTxHash] = useState();
  const { isLoading: isClaimConfirming, isSuccess: isClaimSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const [marketState, setMarketState] = useState('UNKNOWN');

  const marketData = market || [];
  const commitEndTime = marketData[1];
  const revealEndTime = marketData[2];
  const resolved = marketData[6];

  useEffect(() => {
    if (!commitEndTime || !revealEndTime) return;

    let timer;

    const checkState = () => {
      const now = Math.floor(Date.now() / 1000);
      const commitEndSeconds = Number(commitEndTime);
      const revealEndSeconds = Number(revealEndTime);

      if (now < commitEndSeconds) {
        setMarketState('COMMIT');
        const ms = (commitEndSeconds - now) * 1000;
        if (ms < 2147483647) timer = setTimeout(checkState, ms + 1000);
      } else if (now < revealEndSeconds) {
        setMarketState('REVEAL');
        const ms = (revealEndSeconds - now) * 1000;
        if (ms < 2147483647) timer = setTimeout(checkState, ms + 1000);
      } else if (resolved) {
        setMarketState('CLOSED');
      } else {
        setMarketState('AFTER_REVEAL_NOT_RESOLVED');
      }
    };

    checkState();
    return () => clearTimeout(timer);
  }, [commitEndTime, revealEndTime, resolved]);

  useEffect(() => {
    if (isClaimConfirming) setStatus('Claim transaction pending...');
    else if (isClaimSuccess) setStatus('Claim confirmed. Balances will refresh shortly.');
  }, [isClaimConfirming, isClaimSuccess]);

  if (!id) return <div className="status">Loading market...</div>;
  if (error) return <div className="status">Failed to load market.</div>;
  if (isLoading || !market) return <div className="status">Fetching market data...</div>;

  const [ipfsCid, , , yesPool, noPool, unalignedPool, , outcome, tie, originator] = market;

  const claimable = (() => {
    if (!resolved || !address) return 0n;
    if (tie) {
      return (yesBet || 0n) + (noBet || 0n) + (unalignedBet || 0n);
    }
    if (outcome) return yesBet || 0n;
    return noBet || 0n;
  })();

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
            <Countdown
              targetSeconds={Number(commitEndTime)}
              render={(t) => <div className="helper">Time left: {t}</div>}
            />
          </div>
          <div>
            <div className="label">Reveal end</div>
            <div className="value">{new Date(Number(revealEndTime) * 1000).toLocaleString()}</div>
            <Countdown
              targetSeconds={Number(revealEndTime)}
              render={(t) => <div className="helper">Time left: {t}</div>}
            />
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
              {isClaimPending || isClaimConfirming ? (
                <>
                  <Spinner />
                  Claiming...
                </>
              ) : (
                'Claim winnings / refund'
              )}
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
