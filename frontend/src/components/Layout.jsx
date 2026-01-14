import { useState } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';

export default function Layout({ children }) {
  const { address, isConnected } = useAccount();
  const [copied, setCopied] = useState(false);
  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected';

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div>
      <header className="header">
        <div className="navbar">
          <div className="brand">AlphaHelix</div>
          <nav className="nav-links">
            <Link href="/">Home</Link>
            <Link href="/bank">Bank</Link>
            <Link href="/markets">Markets</Link>
          </nav>
          {isConnected ? (
            <button
              className="badge"
              onClick={handleCopy}
              type="button"
              aria-label="Copy wallet address"
              style={{
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: '0.85rem',
              }}
            >
              <span>{copied ? 'Copied!' : shortAddress}</span>
            </button>
          ) : (
            <div className="badge">
              <span>Connect wallet in your browser</span>
            </div>
          )}
        </div>
      </header>
      <main className="container">{children}</main>
    </div>
  );
}
