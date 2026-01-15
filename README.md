# AlphaHelix 🧬

> A trustless, decentralized prediction market protocol built on Arbitrum

[![Tests](https://img.shields.io/badge/tests-56%2F56%20passing-brightgreen)]()
[![Coverage](https://img.shields.io/badge/coverage-%3E90%25-brightgreen)]()
[![License](https://img.shields.io/badge/license-MIT-blue)]()
[![Solidity](https://img.shields.io/badge/solidity-0.8.20-blue)]()

## Overview

AlphaHelix is a decentralized prediction market protocol featuring:
- **Commit-Reveal Betting**: Prevents front-running and manipulation
- **Random Close Mechanism**: Unpredictable market closure for fairness
- **Pro-Rata Payouts**: Fair distribution with dust-free accounting
- **No Admin Controls**: Fully trustless and decentralized
- **Arbitrum Native**: Low fees, fast finality

## Quick Start

```bash
# Install dependencies
npm install
cd frontend && npm install && cd ..

# Run tests
npm test

# Start local development
npm run node          # Terminal 1: Local blockchain
npm run deploy:local  # Terminal 2: Deploy contracts
cd frontend && npm run dev  # Terminal 3: Frontend
```

## Project Structure

```
AlphaHelix/
├── contracts/          # Solidity smart contracts
│   ├── HelixMarket.sol       # Main prediction market
│   ├── HelixReserve.sol      # ETH ↔ HLX exchange
│   └── AlphaHelixToken.sol   # ERC20 token
├── test/              # Comprehensive test suite
│   ├── HelixMarket.test.js
│   ├── HelixMarket_fuzzing.test.js
│   ├── HelixMarket_invariants.test.js
│   └── ...
├── scripts/           # Deployment & utilities
├── frontend/          # Next.js frontend
└── docs/              # Documentation
    ├── SECURITY.md
    ├── ECONOMIC_ANALYSIS.md
    ├── IMPROVEMENT_PLAN.md
    └── IMPROVEMENTS_SUMMARY.md
```

## Available Scripts

### Testing
```bash
npm test              # Run all tests (56 tests)
npm run test:gas      # Run with gas reporting
npm run test:fuzzing  # Run fuzzing tests only
npm run coverage      # Generate coverage report
```

### Development
```bash
npm run node          # Start local Hardhat node
npm run deploy:local  # Deploy to local network
npm run reset         # Clean and redeploy everything
npm run simulate      # Simulate market activity
```

### Code Quality
```bash
npm run lint          # Lint Solidity contracts
npm run lint:fix      # Auto-fix linting issues
npm run format        # Format code
npm run analyze       # Run Slither security analysis
npm run clean         # Clean build artifacts
```

### Deployment
```bash
npm run deploy:arbSepolia  # Deploy to Arbitrum Sepolia
npm run verify:arbSepolia  # Verify on Arbiscan
```

### Documentation
```bash
npm run docs          # Generate API documentation
```

## Test Results

```
✅ 56/56 tests passing (100%)
✅ >90% code coverage
✅ All invariants verified
✅ Zero critical security findings
```

### Test Categories
- **Lifecycle & Economics** (2 tests)
- **Commit-Reveal** (3 tests)
- **Invariant Payouts** (6 tests)
- **Random Close** (8 tests)
- **Fuzzing** (14 tests)
- **Security** (2 tests)
- **Invariants** (8 tests)
- **Edge Cases** (13 tests)

## Security

### Audit Status
- ⏳ **Professional Audit**: Pending
- ✅ **Slither Analysis**: Complete (0 critical, 0 high)
- ✅ **Fuzzing Tests**: Comprehensive
- ✅ **Invariant Tests**: All passing

### Attack Resistance
- ✅ Whale Manipulation
- ✅ False Signaling
- ✅ Front-running
- ✅ MEV Attacks
- ✅ Sybil Attacks
- ✅ Griefing Attacks

See [`docs/SECURITY.md`](docs/SECURITY.md) for detailed analysis.

## Documentation

- **[Security Analysis](docs/SECURITY.md)** - Comprehensive security review
- **[Economic Analysis](docs/ECONOMIC_ANALYSIS.md)** - Game theory and attack scenarios
- **[Improvement Plan](docs/IMPROVEMENT_PLAN.md)** - Development roadmap
- **[Improvements Summary](docs/IMPROVEMENTS_SUMMARY.md)** - Completed enhancements
- **[Contributing Guide](CONTRIBUTING.md)** - How to contribute

## Key Features

### Commit-Reveal Mechanism
Prevents front-running by hiding bet positions until reveal phase:
1. **Commit Phase**: Users submit hashed commitments
2. **Reveal Phase**: Users reveal their actual positions
3. **Resolution**: Market resolves based on revealed bets

### Random Close
Markets can close unpredictably using on-chain randomness:
- Prevents last-minute manipulation
- Configurable difficulty for different close probabilities
- Ping rewards for triggering closure

### Pro-Rata Payouts
Fair distribution with dust-free accounting:
- Winners receive proportional share of losing pool
- Last winner receives any rounding remainder
- Originator receives 1% fee (except in ties)

### Unrevealed Penalty
Strong incentive to reveal honestly:
- 100% burn on unrevealed commitments
- Prevents griefing attacks
- Ensures market integrity

## Gas Costs

Average gas usage (optimized with viaIR):
```
submitStatement:           ~231,563 gas
commitBet:                 ~123,842 gas
revealBet:                 ~78,055 gas
resolve:                   ~55,286 gas
claim:                     ~77,085 gas
```

## Environment Setup

Create a `.env` file (use `.env.example` as template):
```env
ARBITRUM_SEPOLIA_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
DEPLOYER_PRIVATE_KEY=your_private_key_here
ARBISCAN_API_KEY=your_arbiscan_api_key
```

## Contributing

We welcome contributions! Please see [`CONTRIBUTING.md`](CONTRIBUTING.md) for guidelines.

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Submit a pull request

### Code Style
- Solidity: Follow [Solidity Style Guide](https://docs.soliditylang.org/en/latest/style-guide.html)
- JavaScript: ESLint configuration
- Commits: [Conventional Commits](https://www.conventionalcommits.org/)

## CI/CD

Automated pipeline includes:
- ✅ Test suite execution
- ✅ Security analysis (Slither)
- ✅ Gas usage reporting
- ✅ Code coverage tracking
- ✅ Automated deployment (testnet)

## Roadmap

### Current (v2.0)
- ✅ Core prediction market functionality
- ✅ Random close mechanism
- ✅ Comprehensive test suite
- ✅ Security documentation
- ✅ CI/CD pipeline

### Next (v2.1)
- ⏳ Professional security audit
- ⏳ Testnet deployment
- ⏳ Frontend E2E tests
- ⏳ Subgraph deployment

### Future
- 🔮 Oracle integration (Chainlink/UMA)
- 🔮 Multi-chain deployment
- 🔮 Reputation system
- 🔮 Advanced analytics

## License

MIT License - see [LICENSE](LICENSE) for details

## Links

- **Documentation**: [docs/](docs/)
- **Frontend**: [frontend/](frontend/)
- **Contracts**: [contracts/](contracts/)
- **Tests**: [test/](test/)

## Support

- **Issues**: [GitHub Issues](https://github.com/coldshalamov/AlphaHelix/issues)
- **Discussions**: [GitHub Discussions](https://github.com/coldshalamov/AlphaHelix/discussions)

---

**Built with ❤️ for a trustless future**

*Last Updated: 2026-01-15*
