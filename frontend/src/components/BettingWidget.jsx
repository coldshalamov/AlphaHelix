import { useEffect, useMemo, useState, useCallback, memo } from 'react';
import {
  useAccount,
  useChainId,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
  usePublicClient,
} from 'wagmi';
import { encodePacked, keccak256, parseEther } from 'viem';
import contracts from '@/config/contracts.json';
import { marketAbi, tokenAbi } from '@/abis';
import Spinner from './Spinner';
import Countdown from './Countdown';

const CHOICES = [
  { value: 1, label: 'YES' },
  { value: 0, label: 'NO' },
  { value: 2, label: 'UNALIGNED' },
];

function BettingWidget({
  marketId,
  commitEnd,
  revealEnd,
  marketState,
  resolved,
  outcome,
  tie,
  expectedChainId,
}) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { writeContractAsync, isPending } = useWriteContract();

  const [amount, setAmount] = useState('');
  const [choice, setChoice] = useState(1);
  const [storedBet, setStoredBet] = useState(null);
  const [status, setStatus] = useState('');
  const [txHash, setTxHash] = useState(undefined);

  // Track what the current txHash actually represents
  const [pendingAction, setPendingAction] = useState(''); // 'approve' | 'commit' | 'reveal'
  const [pendingBet, setPendingBet] = useState(null);

  const { data: allowance } = useReadContract({
    address: contracts.AlphaHelixToken,
    abi: tokenAbi,
    functionName: 'allowance',
    args: address ? [address, contracts.HelixMarket] : undefined,
    query: { enabled: Boolean(address) },
  });

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: Boolean(txHash) },
  });

  const isLocked = isPending || isConfirming;

  const commitEndSeconds = useMemo(() => Number(commitEnd || 0n), [commitEnd]);
  const revealEndSeconds = useMemo(() => Number(revealEnd || 0n), [revealEnd]);

  const storageKey = useMemo(() => {
    if (marketId === undefined || !address) return null;
    return `helix_bet_${marketId}_${address}`;
  }, [address, marketId]);

  const isWrongNetwork = chainId && expectedChainId && chainId !== expectedChainId;

  const persistBet = useCallback(
    (data) => {
      if (!storageKey || typeof window === 'undefined') return;
      localStorage.setItem(storageKey, JSON.stringify(data));
      setStoredBet(data);
    },
    [storageKey],
  );

  const clearStoredBet = useCallback(() => {
    if (storageKey && typeof window !== 'undefined') localStorage.removeItem(storageKey);
    setStoredBet(null);
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey || typeof window === 'undefined') return;
    const saved = localStorage.getItem(storageKey);
    if (saved) setStoredBet(JSON.parse(saved));
  }, [storageKey]);

  useEffect(() => {
    if (!txHash) return;

    if (isConfirming) {
      setStatus('Transaction pending...');
      return;
    }

    if (isSuccess) {
      if (pendingAction === 'commit' && pendingBet) {
        persistBet(pendingBet);
        setPendingBet(null);
        setStatus('Commit confirmed. Salt saved locally for reveal.');
      } else if (pendingAction === 'reveal') {
        clearStoredBet();
        setStatus('Reveal confirmed and local commit cleared.');
      } else if (pendingAction === 'approve') {
        setStatus('Approve confirmed.');
      } else {
        setStatus('Transaction confirmed.');
      }

      setPendingAction('');
    }
  }, [
    clearStoredBet,
    isConfirming,
    isSuccess,
    pendingAction,
    pendingBet,
    persistBet,
    txHash,
  ]);

  const handleCommit = async () => {
    if (!isConnected) return setStatus('Connect your wallet to commit.');
    if (isWrongNetwork) return setStatus('Wrong network selected. Switch to the Helix deployment chain.');
    if (!amount) return setStatus('Enter an amount of HLX to stake.');
    if (typeof window === 'undefined' || !window.crypto) return setStatus('Secure random generator unavailable.');

    let amountValue;
    try {
      amountValue = parseEther(amount);
    } catch {
      return setStatus('Invalid HLX amount.');
    }
    if (amountValue <= 0n) return setStatus('Enter an amount greater than zero.');

    try {
      setStatus('');

      // Create salt + commitment hash
      const randomBuffer = new Uint8Array(32);
      window.crypto.getRandomValues(randomBuffer);
      const salt = BigInt(
        '0x' + Array.from(randomBuffer).map((b) => b.toString(16).padStart(2, '0')).join(''),
      );
      const hash = keccak256(encodePacked(['uint8', 'uint256', 'address'], [Number(choice), salt, address]));
      const betData = { marketId, salt: salt.toString(), choice: Number(choice), amount, hash };

      // If allowance is insufficient, approve first and *wait for it*
      if (!allowance || allowance < amountValue) {
        setPendingAction('approve');
        const approveHash = await writeContractAsync({
          address: contracts.AlphaHelixToken,
          abi: tokenAbi,
          functionName: 'approve',
          args: [contracts.HelixMarket, amountValue],
        });
        setTxHash(approveHash);

        // Wait for approval receipt explicitly so we don't confuse receipts
        if (!publicClient) throw new Error('Public client unavailable to confirm approval.');
        await publicClient.waitForTransactionReceipt({ hash: approveHash });
      }

      // Now commit
      setPendingBet(betData);
      setPendingAction('commit');

      const commitHash = await writeContractAsync({
        address: contracts.HelixMarket,
        abi: marketAbi,
        functionName: 'commitBet',
        args: [BigInt(marketId), hash, amountValue],
      });
      setTxHash(commitHash);
      setStatus('Commit sent. Keep this device to reveal later.');
    } catch (err) {
      setPendingAction('');
      setPendingBet(null);
      setStatus(err?.shortMessage || err?.message || 'Commit failed');
    }
  };

  const handleReveal = async () => {
    if (!isConnected) return setStatus('Connect your wallet to reveal.');
    if (isWrongNetwork) return setStatus('Wrong network selected. Switch to the Helix deployment chain.');
    if (!storedBet) return setStatus('No locally stored commit found; you may have used a different browser.');

    try {
      setStatus('');
      setPendingAction('reveal');

      const revealHash = await writeContractAsync({
        address: contracts.HelixMarket,
        abi: marketAbi,
        functionName: 'revealBet',
        args: [BigInt(marketId), storedBet.choice, BigInt(storedBet.salt)],
      });
      setTxHash(revealHash);
      setStatus('Reveal submitted.');
    } catch (err) {
      setPendingAction('');
      setStatus(err?.shortMessage || err?.message || 'Reveal failed');
    }
  };

  if (!isConnected) {
    return (
      <div className="card" style={{ borderColor: '#e5e7eb' }}>
        <h3 className="font-semibold">Connect to participate</h3>
        <p className="helper">Connect your wallet to commit, reveal, or claim.</p>
      </div>
    );
  }

  if (isWrongNetwork) {
    return (
      <div className="card" style={{ borderColor: '#fee2e2' }}>
        <h3 className="font-semibold">Wrong network</h3>
        <p className="helper">Switch to the configured Helix chain to continue.</p>
      </div>
    );
  }

  if (marketState === 'REVEAL') {
    return (
      <div className="card" style={{ borderColor: '#fef3c7' }}>
        <h3 className="font-semibold">Reveal phase</h3>
        <Countdown targetSeconds={revealEndSeconds} render={(t) => <div className="helper">{t} remaining</div>} />

        {storedBet ? (
          <div className="section">
            <div className="label">Stored choice</div>
            <div className="value">
              {CHOICES.find((c) => c.value === storedBet.choice)?.label || 'Unknown'} ({storedBet.amount} HLX)
            </div>

            <button className="button secondary" style={{ marginTop: '0.75rem' }} onClick={handleReveal} disabled={isPending || isConfirming}>
              {isPending || isConfirming ? (
                <>
                  <Spinner />
                  Revealing...
                </>
              ) : (
                'Reveal my bet'
              )}
            </button>
          </div>
        ) : (
          <p className="helper">No locally stored commit found; you may have used a different browser or device.</p>
        )}

        {status && (
          <div id="status-message" className="status" role="status" aria-live="polite">
            {status}
          </div>
        )}
      </div>
    );
  }

  if (marketState === 'CLOSED' || marketState === 'AFTER_REVEAL_NOT_RESOLVED') {
    return (
      <div className="card" style={{ borderColor: '#e5e7eb' }}>
        <h3 className="font-semibold">Market finalized</h3>
        <p className="helper">
          {resolved
            ? tie
              ? 'Outcome: Tie. Claim refunds from the detail card.'
              : `Outcome: ${outcome ? 'YES' : 'NO'} wins. Claim any winnings below.`
            : 'Reveal window closed. Awaiting on-chain resolution.'}
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="font-semibold">Commit phase</h3>
      <Countdown targetSeconds={commitEndSeconds} render={(t) => <div className="helper">{t} remaining</div>} />
      <p className="helper">Choose a side and commit HLX before the commit window closes.</p>

      <div className="grid" style={{ marginTop: '0.75rem', gap: '0.5rem' }}>
        <fieldset className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.25rem', border: 'none', padding: 0, margin: 0, minWidth: 0 }}>
          <legend className="visually-hidden">Select outcome</legend>
          {CHOICES.map((c) => (
            <label
              key={c.value}
              className={`button ${choice === c.value ? 'primary' : 'secondary'}`}
              style={{
                margin: 0,
                opacity: isLocked ? 0.6 : 1,
                cursor: isLocked ? 'not-allowed' : 'pointer',
              }}
            >
              <input
                type="radio"
                name="choice"
                value={c.value}
                checked={choice === c.value}
                onChange={() => setChoice(c.value)}
                className="visually-hidden"
                disabled={isLocked}
              />
              {c.label}
            </label>
          ))}
        </fieldset>

        <div>
          <label htmlFor="bet-amount" className="label" style={{ display: 'block', marginBottom: '0.25rem' }}>
            Amount to Stake
          </label>
          <input
            id="bet-amount"
            type="number"
            min="0"
            step="0.01"
            className="input"
            placeholder="Amount of HLX"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            aria-describedby="status-message"
            disabled={isLocked}
          />
        </div>

        <button className="button primary" onClick={handleCommit} disabled={isLocked}>
          {isPending || isConfirming ? (
            <>
              <Spinner />
              {pendingAction === 'approve' ? 'Approving HLX...' : 'Committing...'}
            </>
          ) : (
            'Commit bet'
          )}
        </button>
      </div>

      {storedBet && <div className="status" role="status">Commit saved locally. Keep this device for reveal.</div>}

      {status && (
        <div id="status-message" className="status" role="status" aria-live="polite">
          {status}
        </div>
      )}
    </div>
  );
}

export default memo(BettingWidget);
