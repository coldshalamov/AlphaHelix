# Economic Attack Scenarios & Mitigation

## Overview

AlphaHelix is a stake-weighted consensus system. This document analyzes potential economic attacks and game-theoretic edge cases.

## Known Attack Vectors

### 1. Whale Dominance Attack

**Description**: A single actor with massive HLX holdings dominates every market.

**Mechanism**:
1. Attacker acquires majority of HLX supply
2. Stakes overwhelming amounts on their preferred outcome
3. Smaller participants are economically disincentivized to participate

**Impact**: Medium
- Markets become predictable (whale always wins)
- Reduces market utility as truth oracle
- Discourages participation

**Mitigation**:
- ✅ **Built-in**: UNALIGNED pool allows anyone to subsidize opposition
- ✅ **Built-in**: Originator can seed UNALIGNED to create bounty
- ⚠️ **Economic**: Whale must risk capital on every market (capital intensive)
- ⚠️ **Economic**: Whale loses credibility if proven wrong (reputational risk)

**Severity**: **MEDIUM** - Economically expensive to execute, limited by HLX supply

---

### 2. Sybil Attack on Random Close

**Description**: Attacker spams `pingMarket()` calls to manipulate random close timing.

**Mechanism**:
1. Attacker wants to close market at advantageous time
2. Spams `pingMarket()` from many addresses
3. Increases probability of finding valid close hash

**Impact**: Low
- Could close market earlier than expected
- Costs gas for each ping attempt
- Only works if difficulty target is set low

**Mitigation**:
- ✅ **Built-in**: Gas costs make spam expensive
- ✅ **Built-in**: Multiple entropy sources make prediction hard
- ✅ **Built-in**: Difficulty target calibrated for 1/N probability
- ⚠️ **Requires**: Proper difficulty target configuration

**Severity**: **LOW** - Economically costly, limited benefit

---

### 3. Front-Running Attack (Commit Phase)

**Description**: Attacker observes mempool during commit phase to see others' commits.

**Mechanism**:
1. Attacker monitors mempool for `commitBet()` transactions
2. See which addresses are committing (but not the choice)
3. Front-run with own commit

**Impact**: None
- Commit is hashed (attacker can't see choice)
- Can only see that address X is betting Y amount
- Cannot determine YES/NO/UNALIGNED from hash

**Mitigation**:
- ✅ **Built-in**: Commit-reveal prevents this entirely
- ✅ **Built-in**: Hash includes address, so can't be replayed

**Severity**: **NONE** - Commit-reveal mechanism prevents this

---

### 4. Griefing via Unrevealed Commits

**Description**: Attacker commits large amounts but never reveals, locking funds.

**Mechanism**:
1. Attacker commits 1000 HLX
2. Never reveals during reveal window
3. Withdraws after reveal ends, accepting 100% burn penalty
4. Intent: Grief originator by reducing market participation

**Impact**: Very Low
- Attacker loses 100% of committed HLX (burned)
- Other participants unaffected (market resolves normally)
- Originator still gets fee from revealed bets

**Mitigation**:
- ✅ **Built-in**: 100% penalty makes this very expensive
- ✅ **Built-in**: Unrevealed stakes don't affect outcome
- ✅ **Built-in**: Burns tokens (removes from supply)

**Severity**: **VERY LOW** - Self-destructive attack, no rational incentive

---

### 5. Late Reveal Manipulation

**Description**: Attacker waits until end of reveal window to reveal, observing others first.

**Mechanism**:
1. Attacker commits early
2. Waits for others to reveal first
3. Observes which side is winning
4. Reveals only if profitable, otherwise withdraws with penalty

**Impact**: Medium
- Could game the system if penalty is too low
- Reveals information asymmetry

**Mitigation**:
- ✅ **Built-in**: 100% burn penalty for unrevealed
- ✅ **Built-in**: Revealing always better than burning 100%
- ⚠️ **Economic**: Rational actors always reveal (even if losing)

**Severity**: **LOW** - Burn penalty makes this economically irrational

---

### 6. Originator Self-Betting Attack

**Description**: Originator creates market and bets on known outcome.

**Mechanism**:
1. Originator creates market for event they know outcome of
2. Stakes heavily on known outcome
3. Collects winnings + originator fee

**Impact**: High (if originator has insider info)
- Violates spirit of truth oracle
- Could exploit information asymmetry
- Hard to detect on-chain

**Mitigation**:
- ❌ **Not addressed**: Protocol is trustless, assumes adversarial
- ⚠️ **Governance**: Community reputation system (off-chain)
- ⚠️ **Economic**: UNALIGNED pool allows counter-staking
- ⚠️ **Economic**: Originator risks capital (could be wrong)

**Severity**: **MEDIUM** - Reputation/social layer needed

---

### 7. Flash Loan Attack on Reserve

**Description**: Attacker uses flash loan to manipulate HLX price.

**Mechanism**:
1. Take flash loan of ETH
2. Buy massive HLX from reserve
3. Stake on market
4. Sell HLX back
5. Repay flash loan

**Impact**: Medium
- Could temporarily inflate/deflate HLX supply
- Reserve uses fixed 1:1000 rate (no slippage)
- Must repay loan same block

**Mitigation**:
- ✅ **Built-in**: Fixed rate means no price manipulation
- ✅ **Built-in**: Market requires time-locked commit-reveal
- ✅ **Economic**: Must hold HLX through commit+reveal (days)
- ❌ **Not addressed**: Could drain reserve ETH if rate is exploitable

**Severity**: **LOW** - Time-lock prevents flash loan attacks on markets

---

### 8. Gas Price Manipulation (Random Close)

**Description**: Attacker manipulates gas price to influence random close hash.

**Mechanism**:
1. Random close hash includes `tx.gasprice`
2. Attacker tries different gas prices
3. Finds gas price that triggers random close

**Impact**: Very Low
- Only one of many entropy sources
- Still needs to meet difficulty target
- Costs extra gas to experiment

**Mitigation**:
- ✅ **Built-in**: Multiple entropy sources (blockhash, pools, timestamp, etc.)
- ✅ **Built-in**: Difficulty target calibrated
- ✅ **Economic**: Costs gas for each attempt

**Severity**: **VERY LOW** - Minimal influence on randomness

---

## Systemic Risks

### Liquidity Crisis

**Scenario**: HLX becomes illiquid, reserve runs out of ETH.

**Impact**: Cannot exit HLX positions easily.

**Mitigation**:
- Deploy secondary market AMMs
- Seed initial liquidity via `HelixReserve.seedMarket()`
- Monitor reserve ETH balance

### Black Swan Event

**Scenario**: Smart contract bug discovered post-deployment.

**Impact**: Funds at risk, trust in protocol damaged.

**Mitigation**:
- ✅ Comprehensive test coverage (100% statements)
- ✅ Slither static analysis completed
- ✅ No admin keys (cannot rug pull)
- ⚠️ **CRITICAL**: Get professional audit before mainnet
- ⚠️ Implement bug bounty program
- ⚠️ Have emergency pause mechanism (conflicts with no-admin principle)

## Emergency Response Plan

### Critical Bug Discovered

1. **Immediate**:
   - Notify all known participants via social channels
   - Publish detailed bug report
   - If possible, trigger any circuit breakers

2. **Short-term** (24 hours):
   - Deploy fixed version to testnet
   - Release migration guide
   - Coordinate with major stakeholders

3. **Long-term** (1 week):
   - Audit fixed version
   - Coordinate migration if funds can be recovered
   - Post-mortem and update documentation

### Reserve Insolvency

If `HelixReserve` runs out of ETH:

1. **Detection**: Monitor reserve ETH balance via alerts
2. **Response**:
   - Seed reserve with additional ETH (owner action)
   - Warn users that sells may fail
   - Encourage HLX holders to use secondary markets

3. **Prevention**:
   - Set buy/sell limits
   - Monitor reserve ratio
   - Implement circuit breakers

### Market Manipulation Detected

If whale dominance or manipulation detected:

1. **On-chain**: No admin intervention possible (by design)
2. **Off-chain**:
   - Publish analysis of manipulation
   - Community coordinates UNALIGNED pool defense
   - Originator can seed bounties to incentivize opposition

## Risk Assessment Summary

| Attack Vector | Severity | Mitigation | Status |
|---------------|----------|------------|--------|
| Whale Dominance | Medium | UNALIGNED pool, economic | ✅ Addressed |
| Sybil Random Close | Low | Gas costs, entropy | ✅ Addressed |
| Front-Running | None | Commit-reveal | ✅ Prevented |
| Griefing Unrevealed | Very Low | 100% penalty | ✅ Addressed |
| Late Reveal Manipulation | Low | 100% penalty | ✅ Addressed |
| Originator Self-Betting | Medium | Reputation system | ⚠️ Social Layer |
| Flash Loan | Low | Time-lock | ✅ Prevented |
| Gas Price Manipulation | Very Low | Multi-entropy | ✅ Addressed |

## Recommendations

### Before Mainnet Launch

1. ✅ **Complete formal audit** (professional firm)
2. ✅ **Launch bug bounty** (ImmuneFi or similar)
3. ⚠️ **Stress test on testnet** (high-value markets)
4. ⚠️ **Economic modeling** (game theory analysis)
5. ⚠️ **Community education** (attack vectors, best practices)

### Post-Launch Monitoring

1. **On-chain Monitoring**:
   - Market participation rates
   - Whale address tracking
   - Reserve solvency ratio
   - Unrevealed withdrawal rate

2. **Social Monitoring**:
   - Originator reputation tracking
   - Community sentiment
   - Exploit attempts

3. **Technical Monitoring**:
   - Contract upgrade proposals
   - Security patches
   - Gas cost optimizations
