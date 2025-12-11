import { useEffect, useMemo, useState } from 'react';
import { useAccount, useChainId, useReadContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { encodePacked, keccak256, parseEther } from 'viem';
import contracts from '@/config/contracts.json';
import { marketAbi, tokenAbi } from '@/abis';

const CHOICES = [
  { value: 1, label: 'YES' },
  { value: 0, label: 'NO' },
  { value: 2, label: 'UNALIGNED' },
];

export default function BettingWidget({
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
  const { writeContractAsync, isPending } = useWriteContract();
  const [amount, setAmount] = useState('');
  const [choice, setChoice] = useState(1);
  const [storedBet, setStoredBet] = useState(null);
  const [status, setStatus] = useState('');
  const [txHash, setTxHash] = useState();
  const [countdown, setCountdown] = useState('');
  const [pendingAction, setPendingAction] = useState('');
  const [pendingBet, setPendingBet] = useState(null);

  const { data: allowance } = useReadContract({
    address: contracts.AlphaHelixToken,
    abi: tokenAbi,
    functionName: 'allowance',
    args: address ? [address, contracts.HelixMarket] : undefined,
    query: { enabled: Boolean(address) },
  });

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const commitEndSeconds = useMemo(() => Number(commitEnd || 0n), [commitEnd]);
  const revealEndSeconds = useMemo(() => Number(revealEnd || 0n), [revealEnd]);
  const storageKey = useMemo(() => {
    if (marketId === undefined || !address) return null;
    return `helix_bet_${marketId}_${address}`;
  }, [address, marketId]);
  const isWrongNetwork = chainId && expectedChainId && chainId !== expectedChainId;

  const persistBet = (data) => {
    if (!storageKey || typeof window === 'undefined') return;
    localStorage.setItem(storageKey, JSON.stringify(data));
    setStoredBet(data);
  };

  const clearStoredBet = () => {
    if (storageKey && typeof window !== 'undefined') {
      localStorage.removeItem(storageKey);
    }
    setStoredBet(null);
  };

  useEffect(() => {
    if (storageKey && typeof window !== 'undefined') {
      const saved = localStorage.getItem(storageKey);
      if (saved) setStoredBet(JSON.parse(saved));
    }
  }, [storageKey]);

  useEffect(() => {
    const updateCountdown = () => {
      const now = Math.floor(Date.now() / 1000);
      if (marketState === 'COMMIT' && commitEndSeconds > now) {
        setCountdown(formatDuration(commitEndSeconds - now));
      } else if (marketState === 'REVEAL' && revealEndSeconds > now) {
        setCountdown(formatDuration(revealEndSeconds - now));
      } else {
        setCountdown('');
      }
    };
    updateCountdown();
    const id = setInterval(updateCountdown, 1000);
    return () => clearInterval(id);
  }, [commitEndSeconds, revealEndSeconds, marketState]);

  useEffect(() => {
    if (isConfirming) setStatus('Transaction pending...');
    else if (isSuccess) {
      if (pendingAction === 'commit' && pendingBet) {
        persistBet(pendingBet);
        setStatus('Commit confirmed. Salt saved locally for reveal.');
        setPendingBet(null);
      } else if (pendingAction === 'reveal') {
        clearStoredBet();
        setStatus('Reveal confirmed and local commit cleared.');
      } else {
        setStatus('Transaction confirmed');
      }
      setPendingAction('');
    }
  }, [clearStoredBet, isConfirming, isSuccess, pendingAction, pendingBet, persistBet]);

  const handleCommit = async () => {
    if (!isConnected) {
      setStatus('Connect your wallet to commit.');
      return;
    }
    if (isWrongNetwork) {
      setStatus('Wrong network selected. Switch to the Helix deployment chain.');
      return;
    }
    if (!amount) {
      setStatus('Enter an amount of HLX to stake.');
      return;
    }
    if (typeof window === 'undefined' || !window.crypto) {
      setStatus('Secure random generator unavailable.');
      return;
    }
    let amountValue;
    try {
      amountValue = parseEther(amount);
    } catch (err) {
      setStatus('Invalid HLX amount.');
      return;
    }
    if (amountValue <= 0n) {
      setStatus('Enter an amount greater than zero.');
      return;
    }
    try {
      setStatus('');
      const randomBuffer = new Uint8Array(32);
      window.crypto.getRandomValues(randomBuffer);
      const salt = BigInt('0x' + Array.from(randomBuffer).map((b) => b.toString(16).padStart(2, '0')).join(''));
      const hash = keccak256(encodePacked(['uint8', 'uint256', 'address'], [Number(choice), salt, address]));
      const betData = { marketId, salt: salt.toString(), choice: Number(choice), amount, hash };
      setPendingBet(betData);
      setPendingAction('commit');

      if (!allowance || allowance < amountValue) {
        const approveHash = await writeContractAsync({
          address: contracts.AlphaHelixToken,
          abi: tokenAbi,
          functionName: 'approve',
          args: [contracts.HelixMarket, amountValue],
        });
        setTxHash(approveHash);
      }

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
      setStatus(err?.shortMessage || err?.message || 'Commit failed');
    }
  };

  const handleReveal = async () => {
    if (!isConnected) {
      setStatus('Connect your wallet to reveal.');
      return;
    }
    if (isWrongNetwork) {
      setStatus('Wrong network selected. Switch to the Helix deployment chain.');
      return;
    }
    if (!storedBet) {
      setStatus('No locally stored commit found; you may have used a different browser.');
      return;
    }
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
        {countdown && <div className="helper">{countdown} remaining</div>}
        {storedBet ? (
          <div className="section">
            <div className="label">Stored choice</div>
            <div className="value">
              {CHOICES.find((c) => c.value === storedBet.choice)?.label || 'Unknown'} ({storedBet.amount} HLX)
            </div>
            <button
              className="button secondary"
              style={{ marginTop: '0.75rem' }}
              onClick={handleReveal}
              disabled={isPending || isConfirming}
            >
              {isPending || isConfirming ? 'Revealing...' : 'Reveal my bet'}
            </button>
          </div>
        ) : (
          <p className="helper">No locally stored commit found; you may have used a different browser or device.</p>
        )}
        {status && <div className="status">{status}</div>}
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
      {countdown && <div className="helper">{countdown} remaining</div>}
      <p className="helper">Choose a side and commit HLX before the commit window closes.</p>
      <div className="grid" style={{ marginTop: '0.75rem', gap: '0.5rem' }}>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.25rem' }}>
          {CHOICES.map((c) => (
            <label key={c.value} className={`button ${choice === c.value ? 'primary' : 'secondary'}`} style={{ margin: 0 }}>
              <input
                type="radio"
                name="choice"
                value={c.value}
                checked={choice === c.value}
                onChange={() => setChoice(c.value)}
                style={{ display: 'none' }}
              />
              {c.label}
            </label>
          ))}
        </div>
        <input
          type="number"
          min="0"
          step="0.01"
          className="input"
          placeholder="Amount of HLX"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <button
          className="button primary"
          onClick={handleCommit}
          disabled={isPending || isConfirming || !amount}
        >
          {isPending || isConfirming ? 'Submitting...' : 'Commit bet'}
        </button>
      </div>
      {storedBet && <div className="status">Commit saved locally. Keep this device for reveal.</div>}
      {status && <div className="status">{status}</div>}
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
