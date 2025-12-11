import { useEffect, useMemo, useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { encodePacked, keccak256, parseEther } from 'viem';
import contracts from '@/config/contracts.json';
import { marketAbi, tokenAbi } from '@/abis';

const CHOICES = [
  { value: 1, label: 'YES' },
  { value: 0, label: 'NO' },
  { value: 2, label: 'UNALIGNED' },
];

export default function BettingWidget({ marketId, commitEnd, revealEnd }) {
  const { address } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();
  const [amount, setAmount] = useState('');
  const [choice, setChoice] = useState(1);
  const [phase, setPhase] = useState('COMMIT');
  const [storedBet, setStoredBet] = useState(null);
  const [status, setStatus] = useState('');
  const [txHash, setTxHash] = useState();

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

  useEffect(() => {
    const updatePhase = () => {
      const now = Math.floor(Date.now() / 1000);
      if (now < commitEndSeconds) setPhase('COMMIT');
      else if (now < revealEndSeconds) setPhase('REVEAL');
      else setPhase('ENDED');
    };
    updatePhase();
    const id = setInterval(updatePhase, 4000);
    return () => clearInterval(id);
  }, [commitEndSeconds, revealEndSeconds]);

  useEffect(() => {
    if (address && marketId !== undefined) {
      const key = `helix_bet_${marketId}_${address}`;
      const saved = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
      if (saved) setStoredBet(JSON.parse(saved));
    }
  }, [address, marketId]);

  useEffect(() => {
    if (isConfirming) setStatus('Transaction pending...');
    else if (isSuccess) setStatus('Transaction confirmed');
  }, [isConfirming, isSuccess]);

  const persistBet = (data) => {
    if (!address) return;
    const key = `helix_bet_${marketId}_${address}`;
    localStorage.setItem(key, JSON.stringify(data));
    setStoredBet(data);
  };

  const handleCommit = async () => {
    if (!amount) {
      setStatus('Enter an amount of HLX to stake.');
      return;
    }
    if (typeof window === 'undefined' || !window.crypto) {
      setStatus('Secure random generator unavailable.');
      return;
    }
    try {
      setStatus('');
      const randomBuffer = new Uint8Array(32);
      window.crypto.getRandomValues(randomBuffer);
      const salt = BigInt('0x' + Array.from(randomBuffer).map((b) => b.toString(16).padStart(2, '0')).join(''));
      const hash = keccak256(encodePacked(['uint8', 'uint256', 'address'], [Number(choice), salt, address]));
      const betData = { marketId, salt: salt.toString(), choice: Number(choice), amount, hash };
      persistBet(betData);

      const amountValue = parseEther(amount);
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
      setStatus('Commit sent. Keep your device to reveal later.');
    } catch (err) {
      setStatus(err?.shortMessage || err?.message || 'Commit failed');
    }
  };

  const handleReveal = async () => {
    if (!storedBet) {
      setStatus('No stored bet found for this market.');
      return;
    }
    try {
      setStatus('');
      const revealHash = await writeContractAsync({
        address: contracts.HelixMarket,
        abi: marketAbi,
        functionName: 'revealBet',
        args: [BigInt(marketId), storedBet.choice, BigInt(storedBet.salt)],
      });
      setTxHash(revealHash);
      setStatus('Reveal submitted.');
    } catch (err) {
      setStatus(err?.shortMessage || err?.message || 'Reveal failed');
    }
  };

  if (phase === 'COMMIT') {
    return (
      <div className="card">
        <h3 className="font-semibold">Commit phase</h3>
        <p className="helper">Choose a side and commit HLX before the commit window closes.</p>
        <div className="grid" style={{ marginTop: '0.75rem', gap: '0.5rem' }}>
          <select className="input" value={choice} onChange={(e) => setChoice(Number(e.target.value))}>
            {CHOICES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <input
            type="number"
            min="0"
            step="0.01"
            className="input"
            placeholder="Amount of HLX"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <button className="button primary" onClick={handleCommit} disabled={isPending}>
            {isPending ? 'Submitting...' : 'Commit bet'}
          </button>
        </div>
        {storedBet && <div className="status">Commit saved locally. Keep this device for reveal.</div>}
        {status && <div className="status">{status}</div>}
      </div>
    );
  }

  if (phase === 'REVEAL') {
    return (
      <div className="card" style={{ borderColor: '#fef3c7' }}>
        <h3 className="font-semibold">Reveal phase</h3>
        {storedBet ? (
          <div className="section">
            <div className="label">Stored choice</div>
            <div className="value">
              {CHOICES.find((c) => c.value === storedBet.choice)?.label || 'Unknown'} ({storedBet.amount} HLX)
            </div>
            <button className="button secondary" style={{ marginTop: '0.75rem' }} onClick={handleReveal} disabled={isPending}>
              {isPending ? 'Revealing...' : 'Reveal my bet'}
            </button>
          </div>
        ) : (
          <p className="helper">No locally stored commitment found for this address and market.</p>
        )}
        {status && <div className="status">{status}</div>}
      </div>
    );
  }

  return (
    <div className="card" style={{ borderColor: '#e5e7eb' }}>
      <h3 className="font-semibold">Market closed</h3>
      <p className="helper">Commit and reveal windows have ended.</p>
    </div>
  );
}
