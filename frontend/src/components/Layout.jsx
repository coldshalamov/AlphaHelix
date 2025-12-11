import Link from 'next/link';
import { useAccount } from 'wagmi';

export default function Layout({ children }) {
  const { address, isConnected } = useAccount();
  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected';

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
          <div className="badge">
            <span>{isConnected ? shortAddress : 'Connect wallet in your browser'}</span>
          </div>
        </div>
      </header>
      <main className="container">{children}</main>
    </div>
  );
}
