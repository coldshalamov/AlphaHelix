import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { formatEther } from 'viem';
import { useAccount, useChainId, useReadContract, useReadContracts, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import contracts from '@/config/contracts.json';
import { marketAbi, tokenAbi } from '@/abis';
import { dateTimeFormatter } from '@/lib/formatters';
import Spinner from '@/components/Spinner';
import Countdown from '@/components/Countdown';

const BettingWidget = dynamic(() => import('@/components/BettingWidget'), { ssr: false });

const renderTimeLeft = (t) => <div className="helper">Time left: {t}</div>;

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

  const contractConfig = useMemo(() => ({
    address: contracts.HelixMarket,
    abi: marketAbi,
  }), []);

  // BOLT: Split market data fetch from user data fetch.
  // This ensures stable market data is not refetched when user connects/disconnects wallet.
  const { data: marketData, isLoading: isMarketLoading, error: marketError } = useReadContract({
    ...contractConfig,
    functionName: 'markets',
    args: marketId !== undefined ? [marketId] : undefined,
    query: {
      enabled: marketId !== undefined,
      // Smart polling: stop if resolved
      refetchInterval: (data) => {
        const resolved = data?.[6];
        return resolved ? false : 5000;
      }
    }
  });

  const userContractsArray = useMemo(() => {
    if (marketId === undefined || !address) return [];
    return [
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
      },
      {
         address: contracts.AlphaHelixToken,
         abi: tokenAbi,
         functionName: 'allowance',
         args: [address, contracts.HelixMarket],
      },
      {
         address: contracts.AlphaHelixToken,
         abi: tokenAbi,
         functionName: 'balanceOf',
         args: [address],
      }
    ];
  }, [contractConfig, marketId, address]);

  const { data: userDataResults, isLoading: isUserLoading, refetch: refetchUser } = useReadContracts({
    contracts: userContractsArray,
    query: {
       enabled: !!address && !!marketId,
       // Stop polling user data if market is resolved (unless we need to track claims, but claim status is usually static until action)
       refetchInterval: (data) => {
         // We can use marketData from the other hook here
         const resolved = marketData?.[6];
         return resolved ? false : 5000;
       }
    }
  });

  // Combine loading states (market data is critical, user data is secondary but needed for interaction)
  // We block rendering only on market data. User data can load progressively or we can wait.
  // Previously it waited for everything. Let's wait for everything to avoid UI jumps.
  const isLoading = isMarketLoading || (address && isUserLoading);
  const error = marketError; // User data error might be less critical or handled separately?
  // Actually, keep it simple:
  // const error = marketError || (address && userDataResults?.error);
  // userDataResults doesn't have a top level error property in the same way? useReadContracts returns error?
  // Yes, it has error property.

  const { writeContractAsync, isPending: isClaimPending } = useWriteContract();
  const [status, setStatus] = useState('');
  const [txHash, setTxHash] = useState();
  const { isLoading: isClaimConfirming, isSuccess: isClaimSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const [marketState, setMarketState] = useState('UNKNOWN');

  const market = marketData; // Directly from useReadContract
  const resolved = market?.[6];
  const commitEndTime = market?.[1];
  const revealEndTime = market?.[2];

  // Destructure user results
  const yesBet = userDataResults?.[0]?.result;
  const noBet = userDataResults?.[1]?.result;
  const unalignedBet = userDataResults?.[2]?.result;
  const committedBalance = userDataResults?.[3]?.result;
  const allowance = userDataResults?.[4]?.result;
  const hlxBalance = userDataResults?.[5]?.result;

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
    else if (isClaimSuccess) {
      setStatus('Claim confirmed. Balances will refresh shortly.');
      refetchUser();
    }
  }, [isClaimConfirming, isClaimSuccess, refetchUser]);

  if (!id) return <div className="status">Loading market...</div>;
  if (error) return <div className="status">Failed to load market.</div>;
  if (isMarketLoading || !market) return <div className="status">Fetching market data...</div>;

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
            <div className="value">{dateTimeFormatter.format(new Date(Number(commitEndTime) * 1000))}</div>
            <Countdown
              targetSeconds={Number(commitEndTime)}
              render={renderTimeLeft}
            />
          </div>
          <div>
            <div className="label">Reveal end</div>
            <div className="value">{dateTimeFormatter.format(new Date(Number(revealEndTime) * 1000))}</div>
            <Countdown
              targetSeconds={Number(revealEndTime)}
              render={renderTimeLeft}
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
        allowance={allowance}
        committedAmount={committedBalance}
        hlxBalance={hlxBalance}
      />
    </div>
  );
}
