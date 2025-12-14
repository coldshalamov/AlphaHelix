import { useEffect, useMemo, useState } from 'react';
import { useAccount, useBalance, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import contracts from '@/config/contracts.json';
import { reserveAbi, tokenAbi } from '@/abis';
import Spinner from './Spinner';

export default function Bank() {
  const { address } = useAccount();
  const [buyAmount, setBuyAmount] = useState('');
  const [sellAmount, setSellAmount] = useState('');
  const [status, setStatus] = useState('');
  const [txHash, setTxHash] = useState();

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

  useEffect(() => {
    if (isConfirming) setStatus('Transaction pending...');
    else if (isSuccess) setStatus('Transaction confirmed');
  }, [isConfirming, isSuccess]);

  const formattedHlx = useMemo(() => {
    if (!hlxBalance) return '0';
    try {
      return formatEther(hlxBalance);
    } catch (err) {
      return hlxBalance.toString();
    }
  }, [hlxBalance]);

  const handleBuy = async () => {
    setStatus('');
    try {
      const hash = await writeContractAsync({
        address: contracts.HelixReserve,
        abi: reserveAbi,
        functionName: 'buy',
        value: buyAmount ? parseEther(buyAmount) : undefined,
      });
      setTxHash(hash);
    } catch (err) {
      setStatus(err?.shortMessage || err?.message || 'Buy failed');
    }
  };

  const handleSell = async () => {
    setStatus('');
    try {
      const hlxValue = parseEther(sellAmount || '0');
      const approveHash = await writeContractAsync({
        address: contracts.AlphaHelixToken,
        abi: tokenAbi,
        functionName: 'approve',
        args: [contracts.HelixReserve, hlxValue],
      });
      setTxHash(approveHash);
      const sellHash = await writeContractAsync({
        address: contracts.HelixReserve,
        abi: reserveAbi,
        functionName: 'sell',
        args: [hlxValue],
      });
      setTxHash(sellHash);
    } catch (err) {
      setStatus(err?.shortMessage || err?.message || 'Sell failed');
    }
  };

  return (
    <div className="grid section">
      <div className="card">
        <h2 className="text-xl font-bold">Helix Bank</h2>
        <p className="helper">Swap ETH for HLX on the reserve contract.</p>

        <div className="table-like" style={{ marginTop: '1rem' }}>
          <div>
            <div className="label">Wallet</div>
            <div className="value">{address || 'Not connected'}</div>
          </div>
          <div>
            <div className="label">ETH Balance</div>
            <div className="value">
              {ethBalance ? `${ethBalance.formatted} ${ethBalance.symbol}` : '—'}
            </div>
          </div>
          <div>
            <div className="label">HLX Balance</div>
            <div className="value">{formattedHlx} HLX</div>
          </div>
        </div>

        <div className="grid two" style={{ marginTop: '1.5rem' }}>
          <div className="card" style={{ borderColor: '#dbeafe' }}>
            <h3 className="font-semibold">Buy HLX</h3>
            <p className="helper">Enter ETH to spend.</p>
            <input
              type="number"
              min="0"
              step="0.01"
              className="input"
              placeholder="0.1"
              value={buyAmount}
              onChange={(e) => setBuyAmount(e.target.value)}
            />
            <button
              className="button primary"
              style={{ marginTop: '0.75rem' }}
              onClick={handleBuy}
              disabled={isWriting || !buyAmount}
            >
              {isWriting ? (
                <>
                  <Spinner />
                  Submitting...
                </>
              ) : (
                'Buy HLX'
              )}
            </button>
          </div>

          <div className="card" style={{ borderColor: '#ffe4e6' }}>
            <h3 className="font-semibold">Sell HLX</h3>
            <p className="helper">Approve and sell HLX back to ETH.</p>
            <input
              type="number"
              min="0"
              step="0.01"
              className="input"
              placeholder="100"
              value={sellAmount}
              onChange={(e) => setSellAmount(e.target.value)}
            />
            <button
              className="button danger"
              style={{ marginTop: '0.75rem' }}
              onClick={handleSell}
              disabled={isWriting || !sellAmount}
            >
              {isWriting ? (
                <>
                  <Spinner />
                  Submitting...
                </>
              ) : (
                'Approve & Sell'
              )}
            </button>
            <p className="helper">Allowances reset each time for simplicity.</p>
          </div>
        </div>

        {status && <div className="status">{status}</div>}
        {isConfirming && <div className="status">Awaiting confirmation...</div>}
        {isSuccess && <div className="status">Latest transaction confirmed.</div>}
      </div>
    </div>
  );
}
