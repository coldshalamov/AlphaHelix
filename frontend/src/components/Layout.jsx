import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useAccount, useConnect } from 'wagmi';
import bannerHelix from '../assets/banner_helix.jpg';

export default function Layout({ children, className = '' }) {
  const { address, isConnected } = useAccount();
  const { connectors, connect, status } = useConnect();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected';

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isActive = (path) => router.pathname === path;

  return (
    <div className={`${className} app-font-wrapper`}>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <header className="header">
        <div className="header-banner">
          <Link href="/">
            <div className="banner-crop">
              <Image
                src={bannerHelix}
                alt="AlphaHelix"
                className="header-banner-image"
                priority
              />
            </div>
          </Link>
        </div>
        <div className="navbar">
          <nav className="nav-links">
            <Link
              href="/"
              className={`nav-link ${isActive('/') ? 'active' : ''}`}
              aria-current={isActive('/') ? 'page' : undefined}
            >
              Home
            </Link>
            <Link
              href="/bank"
              className={`nav-link ${isActive('/bank') ? 'active' : ''}`}
              aria-current={isActive('/bank') ? 'page' : undefined}
            >
              Bank
            </Link>
            <Link
              href="/markets"
              className={`nav-link ${isActive('/markets') ? 'active' : ''}`}
              aria-current={isActive('/markets') ? 'page' : undefined}
            >
              Markets
            </Link>
          </nav>
          {isConnected ? (
            <button
              className="badge cyan"
              onClick={handleCopy}
              type="button"
              aria-label="Copy wallet address"
              style={{
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <span>{copied ? '✓ Copied!' : shortAddress}</span>
            </button>
          ) : (
            <button
              className="badge"
              onClick={() => connect({ connector: connectors[0] })}
              type="button"
              disabled={status === 'pending'}
              aria-label={status === 'pending' ? 'Connecting wallet' : 'Connect wallet'}
              style={{
                border: 'none',
                cursor: status === 'pending' ? 'not-allowed' : 'pointer',
                opacity: status === 'pending' ? 0.7 : 1,
              }}
            >
              <span>{status === 'pending' ? 'Connecting...' : 'Connect Wallet'}</span>
            </button>
          )}
        </div>
      </header>
      <main id="main-content" className="container">
        {children}
      </main>

      <style jsx>{`
        .header-banner {
          width: 100%;
          background: var(--charcoal-bg);
          padding: 0;
          border-bottom: 1px solid var(--color-border);
        }

        .banner-crop {
          width: 100%;
          max-width: 1200px;
          height: 120px;
          margin: 0 auto;
          overflow: hidden;
          position: relative;
        }

        .header-banner-image {
          width: 100%;
          height: auto;
          display: block;
          cursor: pointer;
          transition: opacity var(--transition-base);
          position: absolute;
          top: 0;
          left: 0;
        }

        .header-banner-image:hover {
          opacity: 0.9;
        }

        @media (max-width: 768px) {
          .banner-crop {
            height: 80px;
          }
        }
      `}</style>
    </div>
  );
}
