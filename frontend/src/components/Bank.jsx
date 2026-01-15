import { useEffect, useMemo, useState, useCallback, memo } from 'react';
import { useAccount, useBalance, useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient, useChainId } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import contracts from '@/config/contracts.json';
import { reserveAbi, tokenAbi } from '@/abis';
import Spinner from './Spinner';

function Bank() {
  const { address } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const [buyAmount, setBuyAmount] = useState('');
  const [sellAmount, setSellAmount] = useState('');
  const [status, setStatus] = useState('');
  const [txHash, setTxHash] = useState();
  const [activeAction, setActiveAction] = useState(null); // 'buy' | 'sell'
  const [copied, setCopied] = useState(false);

  const { data: ethBalance } = useBalance({ address });
  const { data: hlxBalance } = useReadContract({
    address: contracts.AlphaHelixToken,
    abi: tokenAbi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) },
  });

  const { writeContractAsync, isPending: isWriting } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const expectedChainId = useMemo(() => Number(process.env.NEXT_PUBLIC_CHAIN_ID || 31337), []);
  const isWrongNetwork = chainId && expectedChainId && chainId !== expectedChainId;

  useEffect(() => {
    if (isConfirming) setStatus('Transaction pending...');
    else if (isSuccess) {
      setStatus('Transaction confirmed');
      setActiveAction(null);
    }
  }, [isConfirming, isSuccess]);

  const formattedHlx = useMemo(() => {
    if (!hlxBalance) return '0';
    try {
      return formatEther(hlxBalance);
    } catch (err) {
      return hlxBalance.toString();
    }
  }, [hlxBalance]);

  const shortAddress = useMemo(() => address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected', [address]);

  const liveStatus = useMemo(() => {
    // One message, one announcer.
    if (isConfirming) return 'Awaiting confirmation...';
    if (isSuccess) return 'Latest transaction confirmed.';
    return status;
  }, [isConfirming, isSuccess, status]);

  const isBuyError = useMemo(() => {
    if (!status) return false;
    return ['Enter an amount of ETH to spend.', 'Buy failed'].some(msg => status.includes(msg));
  }, [status]);

  const isSellError = useMemo(() => {
    if (!status) return false;
    return ['Enter an amount of HLX to sell.', 'Sell failed', 'Invalid amount format'].some(msg => status.includes(msg));
  }, [status]);

  // BOLT: Memoized to prevent function recreation on every render,
  // ensuring stable props for child inputs.
  const handleBuyAmountChange = useCallback((e) => {
    if (e.target.value.length <= 20) setBuyAmount(e.target.value);
  }, []);

  const handleSellAmountChange = useCallback((e) => {
    if (e.target.value.length <= 20) setSellAmount(e.target.value);
  }, []);

  const handleCopy = useCallback(() => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [address]);

  const handleBuy = useCallback(async () => {
    setStatus('');
    setActiveAction('buy');
    if (!buyAmount) {
      setStatus('Enter an amount of ETH to spend.');
      setActiveAction(null);
      return;
    }
    // Validate format before parsing to avoid exceptions
    if (!/^\d*\.?\d+$/.test(buyAmount)) {
      setStatus('Invalid amount format.');
      setActiveAction(null);
      return;
    }

    try {
      setActiveAction('buy');
      const hash = await writeContractAsync({
        address: contracts.HelixReserve,
        abi: reserveAbi,
        functionName: 'buy',
        value: parseEther(buyAmount),
      });
      setTxHash(hash);
    } catch (err) {
      setActiveAction(null);
      setStatus(err?.shortMessage || err?.message || 'Buy failed');
    }
  }, [buyAmount, writeContractAsync]);

  const handleMaxSell = useCallback(() => {
    if (formattedHlx) {
      setSellAmount(formattedHlx);
    }
  }, [formattedHlx]);

  const handleSell = useCallback(async () => {
    setStatus('');
    setActiveAction('sell');
    if (!sellAmount) {
      setStatus('Enter an amount of HLX to sell.');
      setActiveAction(null);
      return;
    }
    // Validate format before parsing
    if (!/^\d*\.?\d+$/.test(sellAmount)) {
      setStatus('Invalid amount format.');
      setActiveAction(null);
      return;
    }

    try {
      setActiveAction('sell');
      const hlxValue = parseEther(sellAmount);

      // Step 1: Approve
      setStatus('Approving HLX...');
      const approveHash = await writeContractAsync({
        address: contracts.AlphaHelixToken,
        abi: tokenAbi,
        functionName: 'approve',
        args: [contracts.HelixReserve, hlxValue],
      });
      // Note: We don't setTxHash here to avoid global loading state for approval
      setStatus('Waiting for approval confirmation...');
      if (!publicClient) throw new Error('Public client unavailable.');
      await publicClient.waitForTransactionReceipt({ hash: approveHash });

      setStatus('Selling HLX...');
      const sellHash = await writeContractAsync({
        address: contracts.HelixReserve,
        abi: reserveAbi,
        functionName: 'sell',
        args: [hlxValue],
      });
      setTxHash(sellHash);
    } catch (err) {
      setActiveAction(null);
      setStatus(err?.shortMessage || err?.message || 'Sell failed');
    }
  }, [sellAmount, publicClient, writeContractAsync]);

  return (
    <div className="bank-container">
      <h2>Helix Bank</h2>
      <p>Swap ETH for HLX on the reserve contract.</p>

      <div className="wallet-info table-like">
        <div>
          <strong className="label" style={{ display: 'block', marginBottom: '0.25rem' }}>Wallet</strong>
          {address ? (
            <button
              className="badge"
              onClick={handleCopy}
              type="button"
              aria-label="Copy wallet address"
              style={{
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: '0.9rem',
                padding: '0.25rem 0.75rem',
              }}
            >
              <span>{copied ? 'Copied!' : shortAddress}</span>
            </button>
          ) : (
            <span>Not connected</span>
          )}
        </div>
        <div>
          <strong className="label" style={{ display: 'block', marginBottom: '0.25rem' }}>ETH Balance</strong>
          <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>{ethBalance ? `${Number(ethBalance.formatted).toFixed(4)} ${ethBalance.symbol}` : '—'}</span>
        </div>
        <div>
          <strong className="label" style={{ display: 'block', marginBottom: '0.25rem' }}>HLX Balance</strong>
          <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>{formattedHlx} HLX</span>
        </div>
      </div>

        {isWrongNetwork && (
          <div className="card" style={{ marginTop: '1.5rem', borderColor: '#fee2e2' }}>
            <h3 className="font-semibold">Wrong network</h3>
            <p className="helper">Switch to the configured Helix chain to continue.</p>
          </div>
        )}

        <div className="grid two" style={{ marginTop: '1.5rem', opacity: isWrongNetwork ? 0.5 : 1, pointerEvents: isWrongNetwork ? 'none' : 'auto' }}>
          <div className="card" style={{ borderColor: '#dbeafe' }}>
            <h3 className="font-semibold">Buy HLX</h3>
            <label htmlFor="buy-amount" className="helper" style={{ display: 'block', marginBottom: '0.5rem' }}>
              Enter ETH to spend
            </label>
            <input
              id="buy-amount"
              type="number"
              inputMode="decimal"
              autoComplete="off"
              min="0"
              step="0.01"
              maxLength="20"
              className="input"
              placeholder="0.1"
              value={buyAmount}
              onChange={handleBuyAmountChange}
              aria-label="Amount of ETH to spend"
              aria-describedby="bank-status"
              aria-invalid={isBuyError}
              disabled={Boolean(activeAction)}
              style={isBuyError ? { borderColor: 'var(--danger)' } : {}}
            />
            <button
              className="button primary"
              style={{ marginTop: '0.75rem' }}
              onClick={handleBuy}
              disabled={Boolean(activeAction)}
            >
              {activeAction === 'buy' ? (
                <>
                  <Spinner />
                  Processing...
                </>
              ) : (
                'Buy HLX'
              )}
            </button>
          </div>

          <div className="card" style={{ borderColor: '#ffe4e6' }}>
            <h3 className="font-semibold">Sell HLX</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label htmlFor="sell-amount" className="helper">
                Approve and sell HLX back to ETH
              </label>
              <button
                type="button"
                onClick={handleMaxSell}
                className="badge"
                style={{ cursor: 'pointer', border: 'none' }}
                aria-label="Sell maximum available HLX"
                disabled={Boolean(activeAction)}
              >
                Max
              </button>
            </div>
            <input
              id="sell-amount"
              type="number"
              inputMode="decimal"
              autoComplete="off"
              min="0"
              step="0.01"
              maxLength="20"
              className="input"
              placeholder="100"
              value={sellAmount}
              onChange={handleSellAmountChange}
              aria-label="Amount of HLX to sell"
              aria-describedby="bank-status"
              aria-invalid={isSellError}
              disabled={Boolean(activeAction)}
              style={isSellError ? { borderColor: 'var(--danger)' } : {}}
            />
            <button
              className="button danger"
              style={{ marginTop: '0.75rem' }}
              onClick={handleSell}
              disabled={Boolean(activeAction)}
            >
              {activeAction === 'sell' ? (
                <>
                  <Spinner />
                  Processing...
                </>
              ) : (
                'Approve & Sell'
              )}
            </button>
            <p className="helper">Allowances reset each time for simplicity.</p>
          </div>
        </div>

        <div id="bank-status" role="status" aria-live="polite">
          {liveStatus ? <div className="status">{liveStatus}</div> : null}
        </div>
      </div>
  );
}

export default memo(Bank);
