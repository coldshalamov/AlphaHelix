# Economic Attack Scenarios & Game Theory Analysis

## Overview

This document analyzes potential economic attack vectors and game-theoretic considerations for the AlphaHelix prediction market protocol.

## Table of Contents

1. [Market Manipulation Attacks](#market-manipulation-attacks)
2. [Griefing Attacks](#griefing-attacks)
3. [Collusion Scenarios](#collusion-scenarios)
4. [MEV Attacks](#mev-attacks)
5. [Economic Incentive Analysis](#economic-incentive-analysis)
6. [Nash Equilibrium Analysis](#nash-equilibrium-analysis)

---

## Market Manipulation Attacks

### 1. Whale Manipulation

**Attack Vector:**
A large holder ("whale") places enormous bets to artificially skew market odds and influence other participants.

**Example Scenario:**
```
Market: "Will ETH reach $5000 by EOY?"
Whale bets: 10,000 HLX on YES
Small bettors: 100 HLX total on NO
Apparent odds: 99:1 in favor of YES
```

**Defense Mechanisms:**

1. **Pro-rata Payout System**
   - Whale receives payout proportional to their stake
   - No advantage to betting large vs. small amounts
   - Expected value remains constant regardless of bet size

2. **Unaligned Pool**
   - Participants can bet "unaligned" if they believe market is manipulated
   - Unaligned bets are swept by winning side
   - Provides counter-incentive to manipulation

**Mathematical Analysis:**
```
Expected Value (EV) for whale:
EV = P(win) * Payout - (1 - P(win)) * Stake

For honest market:
P(win) ≈ Stake_whale / (Stake_whale + Stake_opponents)

Payout = Total_Pool * (Stake_whale / Winning_Pool) - Fee

Since payout is proportional to stake, EV ≈ 0 for manipulation
```

**Conclusion:** ✅ PROTECTED - No economic advantage to whale manipulation

---

### 2. False Signaling

**Attack Vector:**
Attacker places large bet to signal confidence, then reveals opposite position or doesn't reveal.

**Example Scenario:**
```
1. Attacker commits 1000 HLX (appears to be YES bet)
2. Other users follow the "signal" and bet YES
3. Attacker reveals as NO or doesn't reveal
```

**Defense Mechanisms:**

1. **Commit-Reveal Scheme**
   - Commitments are hashed, hiding actual position
   - No one knows what others bet until reveal phase
   - Eliminates signaling during commit phase

2. **Unrevealed Penalty**
   - 100% burn on unrevealed commitments
   - Makes false signaling extremely expensive
   - Economic disincentive: lose entire stake

**Game Theory:**
```
Payoff for false signaling:
- Cost: 1000 HLX (burned if unrevealed)
- Benefit: Potential to mislead others
- Net: Negative (guaranteed loss)

Rational strategy: Reveal honestly
```

**Conclusion:** ✅ PROTECTED - Commit-reveal prevents signaling, penalties prevent non-reveal

---

### 3. Last-Minute Manipulation

**Attack Vector:**
Attacker waits until end of commit phase to place large bet, preventing others from reacting.

**Example Scenario:**
```
1. Market has balanced bets: 500 YES, 500 NO
2. Attacker commits 5000 HLX on YES in last block
3. Reveal phase starts immediately
4. Others cannot adjust positions
```

**Defense Mechanisms:**

1. **Commit-Reveal Separation**
   - Commitments are hidden until reveal phase
   - No one knows final distribution until reveals
   - Last-minute commits don't provide information advantage

2. **Pro-rata Payouts**
   - Large last-minute bet doesn't change expected value
   - Payout remains proportional to stake
   - No advantage to timing of commit

**Conclusion:** ✅ PROTECTED - Hidden commitments eliminate timing advantage

---

## Griefing Attacks

### 1. Unrevealed Commitment Griefing

**Attack Vector:**
Attacker commits large amounts but never reveals, locking up market liquidity.

**Example Scenario:**
```
1. Attacker commits 10,000 HLX
2. Never reveals
3. Winning pool appears smaller than it actually is
4. Winners receive larger payouts (from unrevealed funds)
```

**Defense Mechanisms:**

1. **100% Burn Penalty**
   - Unrevealed commitments are completely burned
   - Griefer loses entire stake
   - Funds go to burn address, not to winners

2. **Market Still Resolves**
   - Market can resolve with partial reveals
   - Unrevealed funds don't affect outcome
   - Winners still receive fair payouts

**Economic Analysis:**
```
Cost to griefer: 10,000 HLX (100% loss)
Benefit to griefer: 0 (no advantage gained)
Impact on market: Minimal (market still functions)

Rational strategy: Always reveal
```

**Conclusion:** ✅ PROTECTED - Extreme penalty makes griefing economically irrational

---

### 2. Spam Commitment Griefing

**Attack Vector:**
Attacker makes many small commitments to increase gas costs for others.

**Example Scenario:**
```
1. Attacker makes 100 commits of 1 HLX each
2. Each commit costs gas
3. Increases blockchain congestion
4. Makes market expensive to participate in
```

**Defense Mechanisms:**

1. **Gas Costs**
   - Each commit costs gas to attacker
   - No refund for unrevealed commits
   - Economic cost scales with spam

2. **Minimum Stake** (Potential Addition)
   - Could implement minimum bet size
   - Would increase cost of spam
   - Trade-off: reduces accessibility

**Current Status:**
- No minimum stake (by design for accessibility)
- Gas costs provide natural spam deterrent
- Unrevealed penalty (100% burn) applies to all spam commits

**Conclusion:** ⚠️ PARTIALLY PROTECTED - Gas costs deter spam, but no minimum stake

---

## Collusion Scenarios

### 1. Originator-Bettor Collusion

**Attack Vector:**
Market originator colludes with bettors to create fake markets and extract fees.

**Example Scenario:**
```
1. Originator creates market with known outcome
2. Colluders bet on winning side
3. Originator receives 1% fee
4. Colluders split winnings
```

**Defense Mechanisms:**

1. **Reputation System** (External)
   - Originator reputation tracked off-chain
   - Bad actors identified and avoided
   - Market forces discourage fake markets

2. **Economic Constraints**
   - Originator pays 100 HLX fee to create market
   - Only receives 1% of total pool
   - Must have >10,000 HLX pool to break even on fee

**Mathematical Analysis:**
```
Break-even calculation:
Originator fee: 100 HLX (upfront cost)
Originator reward: 1% of total pool

Break-even pool size:
100 HLX = 0.01 * Total_Pool
Total_Pool = 10,000 HLX

For profit, need >10,000 HLX in pool
Colluders must risk significant capital
```

**Conclusion:** ⚠️ PARTIALLY PROTECTED - Economic barriers exist, but reputation is key

---

### 2. Multi-Account Sybil Attack

**Attack Vector:**
Single entity creates multiple accounts to appear as multiple independent bettors.

**Example Scenario:**
```
1. Attacker creates 10 accounts
2. Bets from all accounts on same side
3. Attempts to create illusion of consensus
```

**Defense Mechanisms:**

1. **Commit-Reveal Hides Positions**
   - No one knows what others bet during commit
   - Sybil accounts provide no signaling advantage
   - Cannot coordinate based on others' positions

2. **Gas Costs**
   - Each account pays gas for transactions
   - Multiple accounts = multiple gas costs
   - No economic advantage over single account

3. **Pro-rata Payouts**
   - Splitting stake across accounts doesn't change total payout
   - Same expected value as single large bet
   - No mathematical advantage

**Conclusion:** ✅ PROTECTED - No economic or strategic advantage to Sybil attacks

---

## MEV Attacks

### 1. Front-running Reveals

**Attack Vector:**
MEV bot observes pending reveal transactions and front-runs with own reveal.

**Example Scenario:**
```
1. User A submits reveal transaction (YES, 1000 HLX)
2. MEV bot sees pending transaction
3. Bot front-runs with own reveal
4. Bot's reveal gets included first
```

**Defense Mechanisms:**

1. **Reveal Order Doesn't Matter**
   - All reveals go to same pools
   - Order of reveals doesn't affect payouts
   - No advantage to revealing first

2. **Commit-Reveal Prevents Information Leakage**
   - Commitment hash doesn't reveal position
   - MEV bot can't determine what user bet
   - No actionable information to front-run

**Conclusion:** ✅ PROTECTED - No advantage to front-running reveals

---

### 2. Sandwich Attacks on Resolution

**Attack Vector:**
MEV bot sandwiches resolution transaction with reveals.

**Example Scenario:**
```
1. User submits resolve transaction
2. MEV bot front-runs with reveals
3. Resolution happens
4. MEV bot back-runs with claims
```

**Defense Mechanisms:**

1. **Reveal Deadline**
   - Must reveal before reveal phase ends
   - Cannot reveal after resolution
   - Sandwiching doesn't work

2. **Permissionless Resolution**
   - Anyone can call resolve
   - No advantage to calling it first
   - No MEV opportunity

**Conclusion:** ✅ PROTECTED - Reveal deadline prevents sandwich attacks

---

## Economic Incentive Analysis

### Honest Participation Incentives

**Positive Incentives:**
1. ✅ Win share of losing pool (pro-rata)
2. ✅ Originator fee (1% of total pool)
3. ✅ Ping reward (1 HLX for closing random markets)

**Negative Incentives (Penalties):**
1. ❌ 100% burn on unrevealed commitments
2. ❌ 100 HLX fee to create market
3. ❌ Gas costs for all transactions

### Dishonest Behavior Disincentives

**Manipulation Attempts:**
- No economic advantage (pro-rata payouts)
- Gas costs for attempts
- Reputation damage

**Griefing Attempts:**
- 100% loss on unrevealed commits
- Gas costs for spam
- No benefit gained

**Collusion Attempts:**
- High capital requirements (>10,000 HLX)
- Reputation risk
- Coordination costs

---

## Nash Equilibrium Analysis

### Two-Player Game

**Players:** Bettor A, Bettor B  
**Strategies:** Bet YES, Bet NO, Bet UNALIGNED, Don't Bet

**Payoff Matrix (Simplified):**

```
                Bettor B
                YES     NO      UNALIGNED   DON'T BET
Bettor A
YES             0,0     +X,-X   +Y,-Y       +Z,0
NO              -X,+X   0,0     +Y,-Y       +Z,0
UNALIGNED       -Y,+Y   -Y,+Y   0,0         -Y,0
DON'T BET       0,+Z    0,+Z    0,-Y        0,0
```

**Nash Equilibrium:**
- Bet on side you believe will win
- Reveal honestly (100% penalty otherwise)
- Don't bet if uncertain (unaligned is dominated strategy)

**Dominant Strategy:**
For rational actors with private information about outcome:
1. Commit to side you believe will win
2. Reveal honestly
3. Claim winnings

---

### Multi-Player Game

**Players:** N bettors  
**Strategies:** Same as above

**Key Insights:**

1. **No Coordination Benefit**
   - Commit-reveal prevents coordination
   - Pro-rata payouts eliminate advantage of large coalitions
   - Nash equilibrium: Bet independently based on private information

2. **Information Aggregation**
   - Market aggregates private information through bets
   - Larger pools indicate stronger consensus
   - Prediction market efficiency emerges

3. **Stable Equilibrium**
   - Honest participation is Nash equilibrium
   - Deviations are punished (penalties)
   - No profitable deviations exist

---

## Recommendations

### Current Strengths
✅ Strong economic incentives for honest behavior  
✅ Severe penalties for dishonest behavior  
✅ Commit-reveal prevents information leakage  
✅ Pro-rata payouts eliminate manipulation incentives  
✅ No MEV opportunities  

### Potential Improvements

1. **Minimum Stake** (Optional)
   - Pros: Reduces spam, increases quality
   - Cons: Reduces accessibility
   - Recommendation: Monitor spam levels, implement if needed

2. **Reputation System** (Off-chain)
   - Track originator history
   - Display market quality metrics
   - Help users identify trustworthy markets

3. **Oracle Integration** (Future)
   - Integrate with Chainlink or UMA
   - Provide objective truth resolution
   - Reduce originator trust requirement

4. **Dynamic Fees** (Future)
   - Adjust fees based on market size
   - Larger markets = lower percentage fee
   - Encourages larger, more liquid markets

5. **Liquidity Incentives** (Future)
   - Reward early participants
   - Encourage balanced markets
   - Improve price discovery

---

## Conclusion

The AlphaHelix protocol demonstrates strong resistance to economic attacks:

**Attack Resistance Summary:**
- ✅ Whale manipulation: PROTECTED
- ✅ False signaling: PROTECTED  
- ✅ Last-minute manipulation: PROTECTED
- ✅ Unrevealed griefing: PROTECTED
- ⚠️ Spam griefing: PARTIALLY PROTECTED
- ⚠️ Originator collusion: PARTIALLY PROTECTED
- ✅ Sybil attacks: PROTECTED
- ✅ MEV attacks: PROTECTED

**Game Theory:**
- Honest participation is Nash equilibrium
- Strong economic incentives align with protocol goals
- Penalties effectively deter dishonest behavior

**Overall Assessment:** The protocol is economically sound with minimal attack surface. Recommended improvements focus on user experience and market quality rather than security.

---

**Last Updated:** 2026-01-15  
**Version:** 1.0  
**Status:** Pre-Audit
