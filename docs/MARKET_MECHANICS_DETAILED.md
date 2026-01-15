# HelixMarket Detailed Mechanics

## Current Implementation: Fixed-Stake Aggregation (NOT an AMM)

### What You Actually Have

Your current HelixMarket is **not** a market maker at all—it's a **stake aggregation and redistribution system** similar to a parimutuel betting pool. Here's exactly how it works:

### Phase 1: Commit Phase
- Users commit a hash of `(choice, salt, bettor_address)` along with an HLX amount
- The HLX is transferred to the contract but **not** added to any pool yet
- Stored in `committedAmount[marketId][user]`
- **No price discovery happens** - you're not buying shares, you're just locking capital

### Phase 2: Reveal Phase
- Users reveal their `(choice, salt)` to prove their commitment
- HLX moves from `committedAmount` into one of three pools:
  - `yesPool` (choice = 1)
  - `noPool` (choice = 0)
  - `unalignedPool` (choice = 2)
- Still **no price** - just accumulation

### Phase 3: Resolution
- After `revealEndTime`, anyone can call `resolve()`
- Outcome is determined **purely by stake size**:
  ```solidity
  if (yesPool > noPool) → YES wins
  if (noPool > yesPool) → NO wins
  if (yesPool == noPool) → TIE (full refunds)
  ```
- Winner is **mechanically determined**, not by any external truth oracle

### Phase 4: Payouts

#### Non-Tie Scenario:
1. **Total Pool** = yesPool + noPool + unalignedPool
2. **Originator Fee** = totalPool × 1% (floor division)
3. **Reward Pool** = totalPool - originator fee
4. **Winners** = everyone who bet on the winning side (YES or NO, whichever had more stake)
5. **Payout Formula**:
   ```
   For each winner:
   payout = (userStake / winningPool) × rewardPool

   Last winner gets remainder to avoid rounding dust:
   lastPayout = rewardPool - alreadyPaidOut
   ```

**Key mechanic**: The entire UNALIGNED pool is **swept to the winning side** and distributed pro-rata. This creates a **bounty mechanism** for truth discovery on low-salience statements (see [UNALIGNED_POOL_RATIONALE.md](UNALIGNED_POOL_RATIONALE.md) for full details).

#### Tie Scenario:
- **No originator fee**
- Everyone (YES/NO/UNALIGNED) gets 100% refund of their stake
- No winners, no losers

### The UNALIGNED Pool: Truth Bounty Mechanism

**CRITICAL INSIGHT**: UNALIGNED is **not** a betting strategy—it's a **subsidy mechanism** for truth discovery.

#### The Problem It Solves

AlphaHelix's economic model naturally directs attention to **controversial statements**:
- Originators get 1% of total pool
- If no one bets, originator gets nothing
- Rational originators only submit controversial statements

**But what about**:
1. **Obvious truths** (E=mc², water is H₂O) - valuable to have on-chain, but no controversy
2. **Low-salience facts** (Alice mowed Bob's lawn) - needed for smart contracts, but irrelevant to most people

**UNALIGNED solves this**: Interested parties can **subsidize validation** by placing a bounty that goes to whoever proves the truth.

#### Use Cases

**1. Smart Contract Escrows**
- Bob needs proof Alice mowed his lawn (for payment contract)
- Bob places 50 HLX on UNALIGNED (bounty)
- Alice bets 10 HLX on YES with proof
- Alice gets 59.4 HLX back (her 10 + 49.4 profit from bounty)
- Bob paid for validation, his contract executes

**2. Knowledge Base Seeding**
- Research institution wants to add scientific facts on-chain
- Places UNALIGNED bounty on "JWST detected exoplanet TOI-1234"
- Researchers provide proof and claim bounty
- Builds a canonical, incentivized knowledge base

**3. Honeypot for Lies**
- If someone lies to claim a bounty, truth-tellers are incentivized to challenge
- The bounty ensures someone will validate even niche facts

**4. DAO Activity Validation**
- DAO needs to verify member work but can't take a position (conflict of interest)
- DAO places UNALIGNED bounty
- Member provides proof and bets YES
- Conflict-free validation

See [UNALIGNED_POOL_RATIONALE.md](UNALIGNED_POOL_RATIONALE.md) for complete analysis.

---

### Example Math

**Scenario**: 200 HLX on YES, 100 HLX on NO, 50 HLX on UNALIGNED

1. **Total Pool** = 350 HLX
2. **Originator Fee** = 350 × 0.01 = 3.5 HLX (goes to market creator)
3. **Reward Pool** = 350 - 3.5 = 346.5 HLX
4. **Winner** = YES (200 > 100)
5. **YES staker payout**:
   ```
   payout = (200 / 200) × 346.5 = 346.5 HLX
   ```
   - They staked 200, got back 346.5
   - Net profit = 146.5 HLX (73.25% ROI)
   - This includes their original 200 + the losing 100 + the unaligned 50 (minus fee)

---

## Why This is NOT an AMM

An **Automated Market Maker** (like Uniswap, Balancer, or prediction market AMMs like Gnosis Conditional Tokens) has these properties:

1. **Continuous pricing**: You can buy/sell at any time and get a price quote
2. **Price discovery**: The price moves as people trade (buy YES → YES becomes more expensive)
3. **Liquidity pools**: LPs provide capital and earn fees from trades
4. **Bonding curve**: A mathematical function (constant product, constant sum, etc.) determines prices

Your system has **none of these**:
- ❌ No continuous trading (only commit → reveal → resolve)
- ❌ No prices (you never see "YES is trading at 0.67" or similar)
- ❌ No liquidity providers (just bettors)
- ❌ No bonding curve (just stake aggregation)

---

## AMM vs Your Current System: Trade-offs

### Your Current "Fixed-Stake" System

#### ✅ Advantages:
1. **Extreme simplicity**: 265 lines of Solidity, easy to audit
2. **No front-running risk**: Commit-reveal prevents MEV/sniping
3. **Zero complexity for users**: "Bet X on YES" is immediately understandable
4. **Guaranteed full payout**: Winners always split 99% of total pool (no slippage, no IL)
5. **Gas efficient**: No complex math, just addition and pro-rata division
6. **No IL (Impermanent Loss)**: Not applicable—there's no LP position to lose value
7. **Deterministic**: Outcome is purely mechanical (most stake wins)

#### ❌ Disadvantages:
1. **No price signals**: You can't tell if "the market thinks YES has 70% probability"
2. **No early exit**: Once you commit, you're locked until resolution (unless you forfeit with 100% penalty)
3. **No continuous information**: All information is revealed atomically at resolution
4. **Winner-take-all volatility**: If you bet YES and ONE whale bets more on NO, you lose everything
5. **No incentive to bet early**: Since there's no price movement, might as well wait until the last second (commit phase)
6. **Unaligned pool is a weird game theory element**: It's essentially "bet on a decisive outcome" which may confuse users

---

### AMM-Based Prediction Market

#### ✅ Advantages:
1. **Price discovery**: "YES is trading at 0.73" = market thinks 73% probability
2. **Continuous trading**: Buy/sell anytime during market lifecycle
3. **Early exit**: Sell your position if you change your mind or see new info
4. **Gradual information aggregation**: Prices update as new info arrives
5. **No winner-take-all**: If you buy YES at 0.30 and it wins, you get 1.00 (not dependent on final pool ratios)
6. **Composability**: Shares are fungible tokens (can be used as collateral, traded on secondary markets)
7. **Market efficiency**: Arbitrageurs and informed traders push prices toward true probabilities

#### ❌ Disadvantages:
1. **Complexity**: Constant-product curves, slippage, liquidity depth calculations
2. **Front-running risk**: MEV bots can sandwich your trades unless you use commit-reveal (which negates AMM benefits)
3. **Requires initial liquidity**: Someone must seed the AMM or use a Logarithmic Market Scoring Rule (LMSR) with subsidy
4. **Impermanent Loss for LPs**: If you provide liquidity and the price moves a lot, you lose value
5. **Slippage**: Large trades move prices (bad UX for whales)
6. **Gas costs**: More complex math = higher gas fees
7. **Harder to audit**: More attack surface for bugs/exploits

---

## Hybrid Approaches

### Option 1: AMM with Commit-Reveal (Gnosis-style)
- Use a constant-product AMM for continuous trading
- **But** require commit-reveal for the final resolution window (e.g., last 24 hours before outcome is known)
- This prevents last-second informed trading based on leaked results
- **Example**: Polymarket uses this for sports betting

### Option 2: LMSR (Logarithmic Market Scoring Rule)
- Subsidized AMM where the house provides initial liquidity
- Traders always get instant pricing, no need for LPs
- Used by prediction markets like Augur v1
- **Downside**: Requires the protocol to take on risk (subsidy can be drained)

### Option 3: Order Book
- Traditional limit orders (like a stock exchange)
- No AMM, just bids/asks
- **Downside**: Requires active market makers; illiquid markets fail

### Option 4: Your Current System + Secondary Market
- Keep your simple stake aggregation for the "official" outcome
- Allow a separate AMM (or order book) for people to trade claims on future payouts
- **Example**: You bet 100 HLX on YES, then sell that claim to someone else for 80 HLX before resolution
- This keeps your core contract simple but adds price discovery via a secondary layer

---

## Recommendation for AlphaHelix

Given your project's philosophy (noise firewall, anti-spam, truth consensus), I'd recommend **sticking with your current system** for the alpha, because:

1. **Aligns with your goals**: You want to penalize noise and reward conviction. Fixed-stake commit-reveal does this perfectly.
2. **Simple = auditable**: Your current contract is clean and has minimal attack surface.
3. **No need for price discovery in alpha**: If your goal is "truth consensus" (not "gambling on outcomes"), you don't need continuous trading.
4. **Commit-reveal is essential**: Front-running would destroy your market if you used a vanilla AMM.

### But consider these enhancements:

#### Short-term (Alpha):
1. **Remove the UNALIGNED pool** (or rename it to "HIGH_CONFIDENCE" with better UX)
   - Current UNALIGNED is confusing: "I bet there will be a winner" is not intuitive
   - Alternative: Allow users to bet on BOTH sides with different amounts, and their payout is based on the winning side only

2. **Add a "conviction multiplier"**:
   - Let users optionally lock their stake for longer (e.g., 30 days post-resolution) in exchange for 1.5x payout
   - This rewards long-term truth-seekers over short-term speculators

3. **Document the game theory**:
   - Right now, there's no incentive to commit early (since pools are hidden)
   - Consider small bonuses for early commits (e.g., 0.1% bonus per day before deadline)

#### Medium-term (Post-Alpha):
4. **Add a secondary AMM for claim trading**:
   - Your core HelixMarket stays simple
   - Deploy a separate Uniswap v2-style AMM for "claim tokens" (ERC-1155 or similar)
   - People who want to exit early can sell their claims at a discount
   - This gives you price discovery **without** complicating your core resolution mechanism

5. **Consider challenge mechanics** (as described in alpha-helix-architecture.md):
   - Allow anyone to "reopen" a resolved market by staking 2x the original pool
   - This creates a revision history and continuous truth convergence
   - Still uses your simple stake aggregation (no AMM needed)

---

## Action Items for Documentation

I recommend creating these docs:

1. **MARKET_MECHANICS.md** (this file) - Explains current system in detail
2. **GAME_THEORY.md** - Analyzes optimal strategies for YES/NO/UNALIGNED bettors
3. **AMM_COMPARISON.md** - Compares your approach vs Polymarket, Augur, Gnosis
4. **FUTURE_ENHANCEMENTS.md** - Roadmap for secondary markets, challenge mechanics, etc.

Would you like me to draft any of these?

---

## Bottom Line

**Your current system is NOT an AMM—it's a stake aggregation pool with commit-reveal.**

**For your use case (truth consensus, not speculation), this is the right choice.**

**If you want price discovery later, add a secondary market layer—don't complicate your core resolution mechanism.**
