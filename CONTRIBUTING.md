# Contributing to AlphaHelix

Thank you for your interest in contributing to AlphaHelix! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Style](#code-style)
- [Testing Requirements](#testing-requirements)
- [Pull Request Process](#pull-request-process)
- [Security](#security)

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors.

### Our Standards

- Be respectful and constructive
- Focus on what is best for the community
- Show empathy towards other community members
- Accept constructive criticism gracefully

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Git
- A code editor (VS Code recommended)

### Initial Setup

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/AlphaHelix.git
   cd AlphaHelix
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd frontend && npm install && cd ..
   ```

3. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Run tests**
   ```bash
   npm test
   ```

5. **Start local development**
   ```bash
   npm run node          # Terminal 1: Local blockchain
   npm run deploy:local  # Terminal 2: Deploy contracts
   cd frontend && npm run dev  # Terminal 3: Frontend
   ```

## Development Workflow

### Branch Naming

Use descriptive branch names following this pattern:
- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `test/description` - Test additions/improvements
- `refactor/description` - Code refactoring

Example: `feature/add-oracle-integration`

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `test`: Test additions/changes
- `refactor`: Code refactoring
- `style`: Code style changes (formatting)
- `chore`: Build process or auxiliary tool changes

**Examples:**
```
feat(market): add random close mechanism
fix(reserve): handle edge case in sell function
docs(api): update NatSpec comments
test(fuzzing): add extreme ratio tests
```

### Pre-commit Hooks

Pre-commit hooks are automatically installed via Husky. They will:
1. Run all tests
2. Check code formatting
3. Verify no linting errors

If checks fail, the commit will be aborted. Fix the issues and try again.

## Code Style

### Solidity

Follow the [Solidity Style Guide](https://docs.soliditylang.org/en/latest/style-guide.html):

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Brief contract description
/// @notice Detailed explanation for users
/// @dev Technical details for developers
contract MyContract {
    /// @notice State variable description
    uint256 public myVariable;

    /// @notice Function description
    /// @param paramName Parameter description
    /// @return returnName Return value description
    function myFunction(uint256 paramName) external returns (uint256 returnName) {
        // Implementation
    }
}
```

**Key Points:**
- Use NatSpec comments for all public/external functions
- Follow naming conventions (camelCase for functions, PascalCase for contracts)
- Keep functions focused and small
- Use explicit visibility modifiers
- Prefer `require` over `assert` for input validation

### JavaScript/TypeScript

Follow the project's ESLint configuration:

```javascript
// Use const/let, never var
const myConstant = 42;
let myVariable = "hello";

// Use async/await over promises
async function myFunction() {
  const result = await someAsyncOperation();
  return result;
}

// Use descriptive names
function calculateProRataPayout(stake, totalPool) {
  return (stake * totalPool) / totalStake;
}
```

### Testing

```javascript
describe("Feature Name", function () {
  // Use descriptive test names
  it("should handle edge case correctly", async function () {
    // Arrange
    const { contract, user } = await loadFixture(deployFixture);
    
    // Act
    await contract.connect(user).someFunction();
    
    // Assert
    expect(await contract.someState()).to.equal(expectedValue);
  });
});
```

## Testing Requirements

### All Contributions Must Include Tests

- **New Features:** Add comprehensive tests covering happy path and edge cases
- **Bug Fixes:** Add regression test demonstrating the bug and fix
- **Refactoring:** Ensure existing tests pass

### Test Categories

1. **Unit Tests** (`test/*.test.js`)
   - Test individual functions
   - Mock external dependencies
   - Fast execution

2. **Integration Tests** (`test/*_integration.test.js`)
   - Test contract interactions
   - Use real deployments
   - Test full workflows

3. **Fuzzing Tests** (`test/*_fuzzing.test.js`)
   - Test with random inputs
   - Test extreme values
   - Test invariants

4. **Security Tests** (`test/*_security.test.js`)
   - Test attack scenarios
   - Test access controls
   - Test reentrancy protection

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- test/HelixMarket.test.js

# Run with coverage
npm run coverage

# Run with gas reporting
REPORT_GAS=true npm test
```

### Coverage Requirements

- Minimum 90% line coverage
- Minimum 85% branch coverage
- All critical paths must be tested

## Pull Request Process

### Before Submitting

1. **Update from main**
   ```bash
   git checkout main
   git pull upstream main
   git checkout your-branch
   git rebase main
   ```

2. **Run full test suite**
   ```bash
   npm test
   npm run coverage
   ```

3. **Check for linting errors**
   ```bash
   npm run lint
   ```

4. **Update documentation**
   - Update README if needed
   - Update API docs if needed
   - Add/update inline comments

### Submitting the PR

1. **Push to your fork**
   ```bash
   git push origin your-branch
   ```

2. **Create Pull Request on GitHub**
   - Use a descriptive title
   - Fill out the PR template completely
   - Link related issues
   - Add screenshots/videos if applicable

3. **PR Template**
   ```markdown
   ## Description
   Brief description of changes

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing
   - [ ] All tests pass
   - [ ] New tests added
   - [ ] Coverage maintained/improved

   ## Checklist
   - [ ] Code follows style guidelines
   - [ ] Self-reviewed code
   - [ ] Commented complex code
   - [ ] Updated documentation
   - [ ] No new warnings
   - [ ] Added tests
   - [ ] All tests pass
   ```

### Review Process

1. **Automated Checks**
   - CI/CD pipeline runs tests
   - Coverage report generated
   - Gas usage analyzed

2. **Code Review**
   - At least one maintainer approval required
   - Address all review comments
   - Keep discussion professional

3. **Merge**
   - Squash and merge for clean history
   - Delete branch after merge

## Security

### Reporting Vulnerabilities

**DO NOT** create public issues for security vulnerabilities.

Instead:
1. Email security@alphahelix.io (or create private security advisory on GitHub)
2. Include detailed description
3. Include steps to reproduce
4. Allow 90 days for fix before public disclosure

### Security Best Practices

When contributing:
- Never commit private keys or secrets
- Use `.env` for sensitive configuration
- Follow checks-effects-interactions pattern
- Use `nonReentrant` modifier for external calls
- Validate all inputs
- Handle edge cases (0 values, max values, etc.)
- Consider gas optimization vs security tradeoffs

## Development Scripts

### Available Scripts

```bash
# Development
npm run node          # Start local Hardhat node
npm run deploy:local  # Deploy to local network
npm run reset         # Clean and redeploy everything

# Testing
npm test              # Run all tests
npm run coverage      # Generate coverage report
npm run test:gas      # Run tests with gas reporting

# Deployment
npm run deploy:arbSepolia  # Deploy to Arbitrum Sepolia
npm run verify:arbSepolia  # Verify on Arbiscan

# Utilities
npm run simulate      # Simulate market activity
npm run docs          # Generate documentation
```

### Useful Commands

```bash
# Compile contracts
npx hardhat compile

# Clean artifacts
npx hardhat clean

# Run Slither analysis
slither .

# Format code
npm run format

# Lint code
npm run lint
```

## Project Structure

```
AlphaHelix/
├── contracts/          # Solidity contracts
│   ├── HelixMarket.sol
│   ├── HelixReserve.sol
│   └── AlphaHelixToken.sol
├── test/              # Test files
│   ├── HelixMarket.test.js
│   ├── HelixMarket_fuzzing.test.js
│   └── ...
├── scripts/           # Deployment & utility scripts
│   ├── deploy.js
│   ├── reset-dev.js
│   └── simulate-market.js
├── frontend/          # React frontend
│   ├── src/
│   └── public/
├── docs/              # Documentation
│   ├── SECURITY.md
│   ├── IMPROVEMENT_PLAN.md
│   └── api/
└── hardhat.config.js  # Hardhat configuration
```

## Getting Help

- **Documentation:** Check `/docs` directory
- **Issues:** Search existing issues before creating new ones
- **Discussions:** Use GitHub Discussions for questions
- **Discord:** [Join our Discord](#) (if available)

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Eligible for contributor rewards (if applicable)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to AlphaHelix! 🚀
