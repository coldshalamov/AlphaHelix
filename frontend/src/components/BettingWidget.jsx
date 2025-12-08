import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { parseEther, keccak256, encodePacked, toBytes } from 'viem'; // utility from viem
import contracts from '../config/contracts.json';

// ABI Snippet
const MarketABI = [
  { inputs: [{ internalType: 'uint256', name: 'marketId', type: 'uint256' }, { internalType: 'bytes32', name: 'commitHash', type: 'bytes32' }, { internalType: 'uint256', name: 'amount', type: 'uint256' }], name: 'commitBet', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ internalType: 'uint256', name: 'marketId', type: 'uint256' }, { internalType: 'uint8', name: 'choice', type: 'uint8' }, { internalType: 'uint256', name: 'salt', type: 'uint256' }], name: 'revealBet', outputs: [], stateMutability: 'nonpayable', type: 'function' },
    { inputs: [{ internalType: 'address', name: 'spender', type: 'address' }, { internalType: 'uint256', name: 'amount', type: 'uint256' }], name: 'approve', outputs: [{ internalType: 'bool', name: '', type: 'bool' }], stateMutability: 'nonpayable', type: 'function' }
];
const TokenABI = [
    { inputs: [{ internalType: 'address', name: 'spender', type: 'address' }, { internalType: 'uint256', name: 'amount', type: 'uint256' }], name: 'approve', outputs: [{ internalType: 'bool', name: '', type: 'bool' }], stateMutability: 'nonpayable', type: 'function' }
];


export default function BettingWidget({ marketId, commitEnd, revealEnd }) {
  const { address } = useAccount();
  const { writeContract } = useWriteContract();

  const [amount, setAmount] = useState('');
  const [choice, setChoice] = useState('1'); // Default YES (1). 0=NO, 2=UNALIGNED
  const [phase, setPhase] = useState('COMMIT'); // COMMIT, REVEAL, ENDED
  const [storedBet, setStoredBet] = useState(null);

  useEffect(() => {
    const checkPhase = () => {
      const now = Math.floor(Date.now() / 1000);
      if (now < commitEnd) setPhase('COMMIT');
      else if (now < revealEnd) setPhase('REVEAL');
      else setPhase('ENDED');
    };
    checkPhase();
    const interval = setInterval(checkPhase, 5000);
    return () => clearInterval(interval);
  }, [commitEnd, revealEnd]);

  useEffect(() => {
    // Check localStorage for existing commit
    if (address && marketId) {
      const key = `helix_bet_${marketId}_${address}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        setStoredBet(JSON.parse(saved));
      }
    }
  }, [address, marketId]);

  const handleCommit = async () => {
    if (!amount) return;

    // 1. Generate Salt
    const randomBuffer = new Uint8Array(32);
    crypto.getRandomValues(randomBuffer);
    const salt = BigInt('0x' + Array.from(randomBuffer).map(b => b.toString(16).padStart(2, '0')).join(''));

    // 2. Hash
    // solidity: keccak256(abi.encodePacked(choice, salt, msg.sender))
    // viem: keccak256(encodePacked(['uint8', 'uint256', 'address'], [choice, salt, address]))
    const hash = keccak256(encodePacked(['uint8', 'uint256', 'address'], [parseInt(choice), salt, address]));

    // 3. Save to storage
    const betData = {
      marketId,
      salt: salt.toString(), // Store as string to avoid JSON issues
      choice: parseInt(choice),
      amount,
      hash
    };
    localStorage.setItem(`helix_bet_${marketId}_${address}`, JSON.stringify(betData));
    setStoredBet(betData);

    // 4. Approve Token (Assuming user needs to approve market)
    // In a real app, check allowance. Here we just blast approve for simplicity or assume it.
    writeContract({
        address: contracts.AlphaHelixToken,
        abi: TokenABI,
        functionName: 'approve',
        args: [contracts.HelixMarket, parseEther(amount)],
    });

    // 5. Commit
    writeContract({
      address: contracts.HelixMarket,
      abi: MarketABI,
      functionName: 'commitBet',
      args: [marketId, hash, parseEther(amount)],
    });
  };

  const handleReveal = () => {
    if (!storedBet) return alert("No local bet found to reveal!");

    writeContract({
      address: contracts.HelixMarket,
      abi: MarketABI,
      functionName: 'revealBet',
      args: [marketId, storedBet.choice, BigInt(storedBet.salt)],
    });
  };

  if (phase === 'COMMIT') {
    return (
      <div className="p-4 border rounded bg-gray-50">
        <h3 className="font-bold">Commit Phase</h3>
        <div className="flex gap-2 my-2">
          <select value={choice} onChange={(e) => setChoice(e.target.value)} className="border p-2">
            <option value="1">YES</option>
            <option value="0">NO</option>
            <option value="2">UNALIGNED</option>
          </select>
          <input
            type="number"
            placeholder="Amount HLX"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="border p-2"
          />
        </div>
        <button onClick={handleCommit} className="bg-blue-600 text-white px-4 py-2 rounded">Commit Bet</button>
        {storedBet && <p className="text-xs text-green-600 mt-2">Bet locally saved.</p>}
      </div>
    );
  }

  if (phase === 'REVEAL') {
    return (
      <div className="p-4 border rounded bg-yellow-50">
        <h3 className="font-bold">Reveal Phase</h3>
        {storedBet ? (
          <div>
            <p>You have a saved bet: {storedBet.choice === 1 ? 'YES' : storedBet.choice === 0 ? 'NO' : 'UNALIGNED'} ({storedBet.amount} HLX)</p>
            <button onClick={handleReveal} className="bg-yellow-600 text-white px-4 py-2 rounded mt-2">Reveal My Bet</button>
          </div>
        ) : (
          <p>No local bet found for this market.</p>
        )}
      </div>
    );
  }

  return <div className="p-4 border rounded">Market Closed</div>;
}
