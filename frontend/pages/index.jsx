import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Home() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-background" />
        <div className="container">
          <div className="hero-content">
            <h1 className={`hero-title ${isVisible ? 'animate-fade-in-up' : ''}`}>
              Truth Through
              <span className="text-cyan"> Consensus</span>
            </h1>
            <p className={`hero-description ${isVisible ? 'animate-fade-in-up stagger-2' : ''}`}>
              AlphaHelix is a decentralized prediction market where facts are verified through
              financial consensus. Stake HLX on truth claims using cryptographic commit-reveal flows.
            </p>
            <div className={`hero-actions ${isVisible ? 'animate-fade-in-up stagger-3' : ''}`}>
              <Link href="/markets" className="button primary">
                Explore Markets
              </Link>
              <Link href="/bank" className="button outline">
                Get HLX Tokens
              </Link>
            </div>

            {/* Floating Stats */}
            <div className="hero-stats">
              <div className={`stat-card ${isVisible ? 'animate-scale-in stagger-4' : ''}`}>
                <div className="stat-value font-mono text-cyan">56</div>
                <div className="stat-label">Tests Passing</div>
              </div>
              <div className={`stat-card ${isVisible ? 'animate-scale-in stagger-5' : ''}`}>
                <div className="stat-value font-mono text-amber">100%</div>
                <div className="stat-label">Security Score</div>
              </div>
              <div className={`stat-card ${isVisible ? 'animate-scale-in stagger-6' : ''}`}>
                <div className="stat-value font-mono text-cyan">∞</div>
                <div className="stat-label">Truth Nodes</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section">
        <div className="container">
          <h2 className="section-title text-center">How It Works</h2>
          <p className="section-description text-center">
            A three-phase mechanism ensures truth emerges from independent consensus
          </p>

          <div className="grid three" style={{ marginTop: 'var(--space-12)' }}>
            <div className="feature-card">
              <div className="feature-icon cyan">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <path d="M20 5L25 15H15L20 5Z" stroke="currentColor" strokeWidth="2" />
                  <circle cx="20" cy="20" r="12" stroke="currentColor" strokeWidth="2" />
                  <path d="M20 20L20 32" stroke="currentColor" strokeWidth="2" />
                </svg>
              </div>
              <h3 className="feature-title">1. Commit</h3>
              <p className="feature-description">
                Submit a cryptographic hash of your prediction. Your choice remains hidden,
                preventing herd behavior and front-running attacks.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon amber">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <rect x="8" y="8" width="24" height="24" stroke="currentColor" strokeWidth="2" />
                  <path d="M8 20H32M20 8V32" stroke="currentColor" strokeWidth="2" />
                  <circle cx="20" cy="20" r="4" fill="currentColor" />
                </svg>
              </div>
              <h3 className="feature-title">2. Reveal</h3>
              <p className="feature-description">
                After the commit window closes, reveal your original prediction. Unrevealed
                commitments are burned to ensure honest participation.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon cyan">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <path d="M20 8L28 16L20 24L12 16L20 8Z" stroke="currentColor" strokeWidth="2" />
                  <path d="M20 16L28 24L20 32L12 24L20 16Z" stroke="currentColor" strokeWidth="2" />
                </svg>
              </div>
              <h3 className="feature-title">3. Resolve</h3>
              <p className="feature-description">
                The side with more capital wins. Truth emerges as the Schelling point where
                rational actors coordinate. Winners claim the pool.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why AlphaHelix */}
      <section className="section bg-elevated">
        <div className="container">
          <div className="split-content">
            <div className="split-text">
              <h2 className="section-title">Epistemology as Infrastructure</h2>
              <p className="section-description">
                AlphaHelix isn't just a prediction market—it's an <strong>Epistemology Operating System</strong>.
                Facts are logically dependent on each other, creating a web of consistency that makes
                lying exponentially expensive.
              </p>
              <ul className="feature-list">
                <li>
                  <span className="feature-bullet text-cyan">✓</span>
                  <strong>No Oracles:</strong> Truth is determined by consensus, not centralized authorities
                </li>
                <li>
                  <span className="feature-bullet text-cyan">✓</span>
                  <strong>Attack Resistant:</strong> 56 passing tests including fuzzing and invariant checks
                </li>
                <li>
                  <span className="feature-bullet text-cyan">✓</span>
                  <strong>Fully Decentralized:</strong> No admin controls, no pause functions, no trust required
                </li>
                <li>
                  <span className="feature-bullet text-cyan">✓</span>
                  <strong>Meta-Markets:</strong> Create markets about other markets to audit logical consistency
                </li>
              </ul>
              <Link href="/markets" className="button primary" style={{ marginTop: 'var(--space-6)' }}>
                Start Verifying Truth
              </Link>
            </div>
            <div className="split-visual">
              <div className="network-preview">
                <div className="network-node animate-network-pulse" style={{ top: '20%', left: '30%' }} />
                <div className="network-node animate-network-pulse" style={{ top: '50%', left: '60%', animationDelay: '0.5s' }} />
                <div className="network-node animate-network-pulse" style={{ top: '70%', left: '20%', animationDelay: '1s' }} />
                <div className="network-node animate-network-pulse" style={{ top: '40%', left: '80%', animationDelay: '1.5s' }} />
                <svg className="network-lines" width="100%" height="100%">
                  <line x1="30%" y1="20%" x2="60%" y2="50%" stroke="var(--cyan-truth)" strokeWidth="1" opacity="0.3" />
                  <line x1="60%" y1="50%" x2="20%" y2="70%" stroke="var(--amber-uncertainty)" strokeWidth="1" opacity="0.3" />
                  <line x1="20%" y1="70%" x2="80%" y2="40%" stroke="var(--cyan-truth)" strokeWidth="1" opacity="0.3" />
                  <line x1="80%" y1="40%" x2="30%" y2="20%" stroke="var(--amber-uncertainty)" strokeWidth="1" opacity="0.3" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        .home-page {
          min-height: 100vh;
        }

        .hero {
          position: relative;
          min-height: 80vh;
          display: flex;
          align-items: center;
          overflow: hidden;
        }

        .hero-background {
          position: absolute;
          inset: 0;
          background-image: url('/images/hero_dna.jpg');
          background-size: cover;
          background-position: center;
          opacity: 0.4;
          z-index: 0;
        }

        .hero-background::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(15, 15, 15, 0.3) 0%, var(--charcoal-bg) 100%);
        }

        .hero-content {
          position: relative;
          z-index: 1;
          max-width: 800px;
          margin: 0 auto;
          text-align: center;
        }

        .hero-title {
          font-size: clamp(2.5rem, 5vw, 4.5rem);
          margin-bottom: var(--space-6);
          opacity: 0;
        }

        .hero-description {
          font-size: var(--text-xl);
          color: var(--color-text-secondary);
          margin-bottom: var(--space-8);
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
          opacity: 0;
        }

        .hero-actions {
          display: flex;
          gap: var(--space-4);
          justify-content: center;
          flex-wrap: wrap;
          opacity: 0;
        }

        .hero-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: var(--space-4);
          margin-top: var(--space-16);
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }

        .stat-card {
          background: rgba(26, 26, 26, 0.8);
          backdrop-filter: blur(10px);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          padding: var(--space-6);
          text-align: center;
          opacity: 0;
        }

        .stat-value {
          font-size: var(--text-4xl);
          font-weight: var(--font-bold);
          margin-bottom: var(--space-2);
        }

        .stat-label {
          font-size: var(--text-sm);
          color: var(--color-text-tertiary);
          text-transform: uppercase;
          letter-spacing: var(--tracking-wider);
        }

        .section-title {
          font-size: var(--text-4xl);
          margin-bottom: var(--space-4);
        }

        .section-description {
          font-size: var(--text-lg);
          color: var(--color-text-secondary);
          max-width: 600px;
          margin: 0 auto;
        }

        .feature-card {
          background: var(--color-bg-secondary);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          padding: var(--space-8);
          text-align: center;
          transition: transform var(--transition-base), border-color var(--transition-base);
        }

        .feature-card:hover {
          transform: translateY(-4px);
          border-color: var(--cyan-truth);
        }

        .feature-icon {
          width: 80px;
          height: 80px;
          margin: 0 auto var(--space-6);
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-full);
          background: rgba(0, 217, 255, 0.1);
          border: 2px solid var(--cyan-truth);
        }

        .feature-icon.cyan {
          color: var(--cyan-truth);
        }

        .feature-icon.amber {
          color: var(--amber-uncertainty);
          background: rgba(255, 184, 0, 0.1);
          border-color: var(--amber-uncertainty);
        }

        .feature-title {
          font-size: var(--text-2xl);
          margin-bottom: var(--space-3);
        }

        .feature-description {
          color: var(--color-text-secondary);
          line-height: var(--leading-relaxed);
        }

        .bg-elevated {
          background: var(--color-bg-elevated);
        }

        .split-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-12);
          align-items: center;
        }

        @media (max-width: 768px) {
          .split-content {
            grid-template-columns: 1fr;
          }
        }

        .feature-list {
          list-style: none;
          margin: var(--space-6) 0;
        }

        .feature-list li {
          display: flex;
          gap: var(--space-3);
          margin-bottom: var(--space-4);
          align-items: flex-start;
        }

        .feature-bullet {
          font-size: var(--text-xl);
          flex-shrink: 0;
        }

        .split-visual {
          position: relative;
          height: 400px;
        }

        .network-preview {
          position: relative;
          width: 100%;
          height: 100%;
          background: var(--color-bg-secondary);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-2xl);
          overflow: hidden;
        }

        .network-node {
          position: absolute;
          width: 20px;
          height: 20px;
          background: var(--cyan-truth);
          border-radius: 50%;
          box-shadow: 0 0 20px var(--cyan-truth);
        }

        .network-lines {
          position: absolute;
          inset: 0;
        }
      `}</style>
    </div>
  );
}
