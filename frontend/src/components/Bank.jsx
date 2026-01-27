import { useEffect, useMemo, useState, useCallback, memo } from 'react';
import { useAccount, useBalance, useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient, useChainId, useSwitchChain } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import contracts from '@/config/contracts.json';
import { reserveAbi, tokenAbi } from '@/abis';
import Spinner from './Spinner';

// BOLT: Extracted and memoized BuyCard to prevent re-renders when typing in Sell input
const BuyCard = memo(function BuyCard({
  buyAmount,
  handleBuyAmountChange,
  isBuyError,
  activeAction,
  ethBalance,
  handleMaxBuy,
  handleBuy
}) {
  return (
    <div className="card" style={{ borderColor: '#dbeafe' }}>
      <h3 className="font-semibold">Buy HLX</h3>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <label htmlFor="buy-amount" className="helper">
          Enter ETH to spend
        </label>
        <button
          type="button"
          onClick={handleMaxBuy}
          className="badge"
          aria-label="Buy with maximum safe ETH"
          disabled={!ethBalance || Boolean(activeAction)}
        >
          Max
        </button>
      </div>
      <div style={{ position: 'relative' }}>
        <input
          id="buy-amount"
          type="number"
          inputMode="decimal"
          autoComplete="off"
          min="0"
          step="0.01"
          maxLength="50"
          className="input"
          placeholder="0.1"
          value={buyAmount}
          onChange={handleBuyAmountChange}
          aria-label="Amount of ETH to spend"
          aria-describedby="bank-status buy-amount-unit"
          aria-invalid={isBuyError}
          disabled={Boolean(activeAction)}
          style={{
            paddingRight: '3.5rem',
            ...(isBuyError ? { borderColor: 'var(--danger)' } : {})
          }}
        />
        <span
          id="buy-amount-unit"
          className="font-mono text-secondary"
          style={{
            position: 'absolute',
            right: '1rem',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            fontSize: '0.9em'
          }}
        >
          ETH
        </span>
      </div>
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
  );
});

// BOLT: Extracted and memoized SellCard to prevent re-renders when typing in Buy input
const SellCard = memo(function SellCard({
  sellAmount,
  handleSellAmountChange,
  isSellError,
  activeAction,
  handleMaxSell,
  handleSell
}) {
  return (
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
          aria-label="Sell maximum available HLX"
          disabled={Boolean(activeAction)}
        >
          Max
        </button>
      </div>
      <div style={{ position: 'relative' }}>
        <input
          id="sell-amount"
          type="number"
          inputMode="decimal"
          autoComplete="off"
          min="0"
          step="0.01"
          maxLength="50"
          className="input"
          placeholder="100"
          value={sellAmount}
          onChange={handleSellAmountChange}
          aria-label="Amount of HLX to sell"
          aria-describedby="bank-status sell-amount-unit"
          aria-invalid={isSellError}
          disabled={Boolean(activeAction)}
          style={{
            paddingRight: '3.5rem',
            ...(isSellError ? { borderColor: 'var(--danger)' } : {})
          }}
        />
        <span
          id="sell-amount-unit"
          className="font-mono text-secondary"
          style={{
            position: 'absolute',
            right: '1rem',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            fontSize: '0.9em'
          }}
        >
          HLX
        </span>
      </div>
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
  );
});

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
  const { switchChain, isPending: isSwitching } = useSwitchChain();

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
    const val = e.target.value;
    // Strict sanitization: allow empty string or valid decimal fragments
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      // SENTINEL: Increased limit to 50
      if (val.length <= 50) setBuyAmount(val);
    }
  }, []);

  const handleSellAmountChange = useCallback((e) => {
    const val = e.target.value;
    // Strict sanitization: allow empty string or valid decimal fragments
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      // SENTINEL: Increased limit to 50
      if (val.length <= 50) setSellAmount(val);
    }
  }, []);

  const handleCopy = useCallback(() => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [address]);

  const handleMaxBuy = useCallback(() => {
    if (ethBalance) {
      // Leave 0.01 ETH for gas
      const buffer = 10000000000000000n;
      const val = ethBalance.value - buffer;
      const safeValue = val > 0n ? val : 0n;
      setBuyAmount(formatEther(safeValue));
    }
  }, [ethBalance]);

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
            <button
              className="button primary"
              onClick={() => switchChain({ chainId: expectedChainId })}
              disabled={isSwitching}
              style={{ marginTop: '0.75rem' }}
            >
              {isSwitching ? (
                <>
                  <Spinner />
                  Switching...
                </>
              ) : (
                'Switch Network'
              )}
            </button>
          </div>
        )}

        <div className="grid two" style={{ marginTop: '1.5rem', opacity: isWrongNetwork ? 0.5 : 1, pointerEvents: isWrongNetwork ? 'none' : 'auto' }}>
          <BuyCard
            buyAmount={buyAmount}
            handleBuyAmountChange={handleBuyAmountChange}
            isBuyError={isBuyError}
            activeAction={activeAction}
            ethBalance={ethBalance}
            handleMaxBuy={handleMaxBuy}
            handleBuy={handleBuy}
          />
          <SellCard
            sellAmount={sellAmount}
            handleSellAmountChange={handleSellAmountChange}
            isSellError={isSellError}
            activeAction={activeAction}
            handleMaxSell={handleMaxSell}
            handleSell={handleSell}
          />
        </div>

        <div id="bank-status" role="status" aria-live="polite">
          {liveStatus ? <div className="status">{liveStatus}</div> : null}
        </div>
      </div>
  );
}

export default memo(Bank);
