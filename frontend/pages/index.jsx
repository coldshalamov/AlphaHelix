import Link from 'next/link';

export default function Home() {
  return (
    <div className="grid section">
      <div className="card">
        <h1 className="text-2xl font-bold">Welcome to AlphaHelix</h1>
        <p className="helper">
          Stake HLX on truth claims using a commit-reveal flow. Use the Bank to swap ETH/HLX and explore the Markets to commit and
          reveal your bets.
        </p>
        <div className="nav-links" style={{ marginTop: '1rem' }}>
          <Link className="button primary" href="/bank">
            Go to Bank
          </Link>
          <Link className="button secondary" href="/markets">
            Browse Markets
          </Link>
        </div>
      </div>
    </div>
  );
}
