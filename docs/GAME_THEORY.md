# Game Theory Analysis: HelixMarket Incentives

## Strategic Overview

HelixMarket is a **winner-take-all stake aggregation game** with three player types:
1. **YES bettors** - believe the statement is true
2. **NO bettors** - believe the statement is false
3. **UNALIGNED bettors** - bet on a decisive outcome (either YES or NO will dominate)

The winner is determined **purely by stake size**, not by external truth. This creates unique game-theoretic dynamics.

---

## Core Incentive Structure

### Payout Formula (Non-Tie)
```
totalPool = yesPool + noPool + unalignedPool
originatorFee = totalPool × 1%
rewardPool = totalPool - originatorFee

If YES wins (yesPool > noPool):
  Each YES bettor gets: (theirStake / yesPool) × rewardPool

If NO wins (noPool > yesPool):
  Each NO bettor gets: (theirStake / noPool) × rewardPool
```

### Key Insight
**The UNALIGNED pool is swept to the winner**, meaning:
- If you bet YES and win, you capture not just the NO pool, but also the UNALIGNED pool
- This makes UNALIGNED a "meta-bet" on market decisiveness

---

## Optimal Strategies by Player Type

### 1. YES/NO Bettors (Truth-Seekers)

#### Optimal Strategy:
- **Bet on the side you believe is correct**
- **Bet as much as you can afford to lose**
- **Commit as late as possible** (to see market sentiment via total commit activity, if visible on-chain)

#### Why?
- Your payout is `(yourStake / winningPool) × rewardPool`
- If you believe YES is true and will win, your ROI is:
  ```
  ROI = (rewardPool / yesPool) - 1
      = [(totalPool × 0.99) / yesPool] - 1
  ```
- **The more opposition (NO + UNALIGNED), the higher your ROI**

#### Example:
- You bet 100 HLX on YES
- Final pools: YES = 100, NO = 50, UNALIGNED = 50
- Total = 200, reward = 198 (after 1% fee)
- Your payout = (100 / 100) × 198 = **198 HLX** (98% profit)

#### Risk:
- If **one whale** bets 101 HLX on NO at the last second, you lose everything
- This is the **whale vulnerability**

---

### 2. UNALIGNED Pool (Truth Bounty Mechanism)

**CRITICAL CORRECTION**: UNALIGNED is **not a betting strategy**—it's a **subsidy mechanism** for truth discovery.

#### The Real Purpose of UNALIGNED

UNALIGNED solves the **low-salience problem**:
- Controversial statements attract bets naturally (people argue → originator gets fees)
- Non-controversial or niche statements don't attract bets (no incentive to originate)
- **UNALIGNED lets interested parties subsidize validation** of facts that wouldn't otherwise get attention

#### Use Cases for UNALIGNED

**1. Smart Contract Escrows** (e.g., proof of work)
- Bob needs to verify Alice mowed his lawn
- Bob places 50 HLX on UNALIGNED (bounty for whoever validates)
- Alice bets 10 HLX on YES (with proof)
- Alice wins and gets her 10 HLX back + 49.4 HLX from the bounty
- **Bob paid for validation**—this is the intended use case

**2. Honeypot for Lies**
- If someone lies and tries to claim the bounty, truth-tellers can bet against them
- The liar loses their stake; the truth-teller claims the bounty
- **UNALIGNED attracts dispute resolution** on low-salience facts

**3. Knowledge Base Seeding**
- Research institutions can place UNALIGNED bounties on obvious facts
- Example: "JWST detected exoplanet TOI-1234" + 200 HLX UNALIGNED
- Researchers bet YES with proof, claim bounty
- **Pays to populate the canonical knowledge base**

**4. DAO Activity Validation**
- DAOs need to verify member contributions but don't want to take a position
- DAO places UNALIGNED bounty
- Member provides proof and bets YES
- **Avoids conflict of interest** (DAO doesn't bet on outcome)

#### When to Use UNALIGNED (as a Bettor)

✅ **Bet UNALIGNED if**:
- You want to subsidize validation without taking a position
- You're the originator and want to bootstrap market liquidity
- You're free-riding on expected controversy (risky, usually -EV)

❌ **Don't bet UNALIGNED if**:
- You have conviction about the truth (bet YES/NO directly for higher payout)
- You're speculating (UNALIGNED is always worse ROI than betting the winning side)

#### Math Example: UNALIGNED as Subsidy

**Scenario**: Bob's lawn mowing contract
- Bob places 50 HLX UNALIGNED
- Alice bets 10 HLX YES
- No one bets NO (not controversial)

**Resolution**:
- YES wins (10 > 0)
- Total pool = 60 HLX
- Reward pool = 60 × 0.99 = 59.4 HLX
- Alice gets: (10 / 10) × 59.4 = **59.4 HLX**
- Alice's profit: 49.4 HLX (Bob paid for validation)

**If Alice bet NO instead** (lying):
- Bob sees the lie
- Bob bets 15 HLX on YES (he knows Alice didn't mow)
- YES wins (15 > 10)
- Bob gets: (15 / 15) × [(25 + 50) × 0.99] = **74.25 HLX**
- Bob's net: 74.25 - 15 - 50 = **+9.25 HLX** (he punished the liar AND made money)

**Key insight**: UNALIGNED creates a **truth bounty** that anyone can claim by proving the correct outcome.

---

### 3. Whales (Large Stake Holders)

#### Optimal Strategy:
- **Bet on the side you believe is correct**
- **Commit as late as possible** (to prevent counter-whales from overwhelming you)
- **Bet enough to guarantee a win** (if you can afford it)

#### Why?
If you have 10,000 HLX and the current pools are YES = 100, NO = 50, UNALIGNED = 50:
- You can bet 151 HLX on NO and **guarantee** a win (NO = 201 > YES = 100)
- Your payout = (151 / 201) × [(300 × 0.99)] = 222.68 HLX
- Profit = 71.68 HLX (47.5% ROI)

#### Risk:
- Another whale can bet 202 HLX on YES and flip the outcome
- This creates a **whale war** where both sides keep escalating
- Whoever bets last (just before `commitEndTime`) wins

#### The Commit-Reveal Defense:
- **Commit-reveal prevents this** because whales can't see the current pool sizes during the commit phase
- They have to guess how much to bet blindly
- This is why commit-reveal is essential for your market design

---

## Attacks and Exploits

### Attack 1: Sybil Whale (Bet Both Sides)
**Setup**: Alice bets 100 HLX on YES, then also bets 200 HLX on NO (using a second address).

**Outcome**:
- NO wins (200 > 100)
- Alice's NO bet gets (200 / 200) × [(300 × 0.99)] = 297 HLX
- Alice's YES bet loses 100 HLX
- Net: 297 - 100 - 200 = **-3 HLX loss** (the originator fee)

**Conclusion**: **Betting both sides is always -EV** (you just pay the originator fee). Not an exploit.

### Attack 2: Last-Second Whale Snipe
**Setup**: Alice waits until `commitEndTime - 1 second`, then commits a massive bet.

**With your current commit-reveal**:
- Alice commits a hash at the last second
- She still has to reveal during the reveal phase
- Other bettors can see her commit happened (on-chain) but not the amount or side
- **Partially mitigated**, but she still gets timing advantage (others can't react after her commit)

**Mitigation**: Extend commit phase or add a randomized resolution delay.

### Attack 3: Originator Manipulation
**Setup**: Market creator submits a vague statement, bets heavily on YES, then uses social engineering to convince others to bet NO.

**Outcome**: If successful, originator wins the NO pool + 1% fee.

**Mitigation**:
- Reputation systems (track originator win rates)
- Require higher originator fees for new/untrusted accounts
- Community governance to blacklist malicious originators

### Attack 4: Market Maker Collusion
**Setup**: A group of bettors coordinate off-chain:
- 10 people each bet 100 HLX on YES
- 1 person bets 1001 HLX on NO
- The NO bettor is a shill who will split winnings with the group

**Outcome**: NO wins, shill gets entire reward pool, splits with conspirators.

**Why this fails**:
- The shill still pays the 1% originator fee
- The shill has to **trust** the other conspirators won't defect and bet more on NO themselves
- This is just a convoluted way to bet NO—no profit over betting normally

**Conclusion**: Not an exploit, just expensive coordination.

---

## Emergent Behaviors

### 1. Low-Liquidity Markets Die
- If a market has only 10 HLX total across all pools, the ROI for any single bettor is capped at ~90% (after fees)
- Whales won't participate (not worth the gas fees)
- The market becomes a "coin flip" for small bettors

**Mitigation**: Require minimum total stake (e.g., 1000 HLX) before resolution is allowed.

### 2. High-Liquidity Markets Attract Informed Traders
- If a market has 100,000 HLX total, even a 1% edge is worth 1000 HLX profit
- Informed traders will do research and bet accordingly
- This pushes the outcome toward truth (assuming stake correlates with information)

### 3. UNALIGNED Becomes a "No-Opinion" Bet
- In practice, lazy or uninformed bettors will default to UNALIGNED
- This creates a passive pool that rewards whichever side wins
- **Potential improvement**: Rename UNALIGNED to "ABSTAIN" and distribute it to BOTH sides (50/50) to reduce whale incentives

---

## Comparison to Alternatives

### vs. Parimutuel Betting (Horse Racing)
**Similarity**: Winner-take-all, pro-rata payouts
**Difference**: Horse racing has an external outcome (race result). Your market is self-resolving (most stake wins).

### vs. Prediction Markets (Polymarket, Augur)
**Similarity**: Users bet on binary outcomes
**Difference**: Prediction markets use AMMs or order books for continuous trading. Your system is batch-auction style (commit → reveal → resolve).

### vs. Futarchy (Governance by Prediction Markets)
**Similarity**: Use market outcomes to make decisions
**Difference**: Futarchy has external resolution (did GDP go up?). Your system is stake-weighted voting with financial skin in the game.

---

## Recommendations

### 1. Rename UNALIGNED → "BOUNTY" or "SUBSIDY"
- Current name is confusing ("unaligned with what?")
- **Suggested names**:
  - "BOUNTY" (clear incentive framing)
  - "SUBSIDY" (academic framing)
  - "REWARD" (neutral)
- Update UI/docs to emphasize this is a **subsidy mechanism**, not a betting option

### 2. Add Early Commit Bonuses
- Problem: No incentive to commit early (everyone waits until the last second)
- Solution: Small bonus (e.g., +1% per day before deadline) for early commits
- This rewards information discovery over timing games

### 3. Add a Minimum Pool Size
- Require at least 1000 HLX total (across YES/NO/UNALIGNED) before resolution is allowed
- Prevents dust markets with no meaningful outcomes

### 4. Add a "Challenge Period" Post-Resolution
- After resolution, allow a 24-hour window for anyone to challenge by staking 2x the original pool
- If challenged, deploy a new market with higher stakes
- This creates iterative truth convergence (as described in your architecture docs)

### 5. Track Originator Reputation
- Store historical data: `originatorWinRate[address]`
- Front-end can display: "This originator's markets resolve YES 80% of the time"
- Users can decide if the originator is trustworthy or biased

---

## Conclusion

**Your current system is economically sound** for its intended purpose (stake-weighted consensus with anti-manipulation via commit-reveal).

**The main weakness is whale vulnerability**: A single large bettor can override many small bettors. This is by design (skin in the game), but may feel unfair.

**UNALIGNED is a unique innovation**: The bounty mechanism solves the low-salience problem that plagues all prediction markets. **This is a killer feature**—no other system (Polymarket, Augur, Kleros) has this. It enables:
- Smart contract escrows (proof of work validation)
- Knowledge base seeding (paying to add facts)
- DAO activity tracking (conflict-free validation)
- Honeypots for lies (incentivize truth-tellers to challenge fraud)

**Recommendation**: Rename UNALIGNED to "BOUNTY" and make this the headline feature in your marketing. This is what makes AlphaHelix a **universal truth oracle**, not just a prediction market for controversial topics.

**Adding secondary features** (early commit bonuses, challenge periods, reputation tracking) would make the game theory richer without complicating the core contract.
