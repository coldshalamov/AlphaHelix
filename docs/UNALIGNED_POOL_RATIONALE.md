# The UNALIGNED Pool: Truth Bounties for Low-Salience Statements

## The Problem UNALIGNED Solves

AlphaHelix's economic model directs attention to **controversial statements** through the originator fee:
- Originator receives 1% of total pool (YES + NO + UNALIGNED)
- If no one bets, originator gets nothing
- **Rational originators only submit controversial statements** (where people will bet against each other)

This creates a **natural filter** for important debates, BUT it fails for two types of valuable statements:

### 1. Obvious Truths (No Controversy)
**Example**: "E = mc²" or "Water is H₂O"
- No one will bet NO (universally accepted)
- No controversy = no bets = no originator fee
- **Problem**: These statements are valuable to have on-chain (canonical knowledge base), but no economic incentive to submit them

### 2. Low-Salience Facts (No Public Interest)
**Example**: "Alice mowed Bob's lawn on Jan 15, 2026"
- Most people don't care
- No one will bet (irrelevant to them)
- **Problem**: Bob needs this validated for a smart contract payment, but can't attract bettors

---

## How UNALIGNED Fixes This: The Bounty Mechanism

### Scenario 1: Smart Contract Escrow (Lawn Mowing)

**Bob's use case**:
1. Bob has a smart contract that pays Alice 100 USDC if she mows his lawn
2. The contract requires a validated HelixMarket statement: "Alice mowed Bob's lawn on Jan 15"
3. Bob creates the market and **places 50 HLX on UNALIGNED**
4. This creates a **bounty**: "I will pay 50 HLX to anyone who validates this fact"

**What happens next**:
- Alice submits proof (photos, timestamp) and bets 10 HLX on YES
- No one bets NO (no controversy, small stakes)
- Market resolves: YES wins (10 HLX > 0 HLX on NO)
- Alice gets: `(10 / 10) × [(10 + 50) × 0.99]` = **59.4 HLX**
  - Her 10 HLX back + 49.4 HLX profit (from the UNALIGNED bounty)
- Bob pays the 50 HLX UNALIGNED stake, but his smart contract now has proof Alice mowed the lawn → releases 100 USDC to Alice

**Key insight**: Bob **wanted to pay** for validation. UNALIGNED lets him subsidize truth discovery.

---

### Scenario 2: Honeypot for Lies (Anti-Spam)

**Attack scenario**:
- Eve creates a market: "Eve mowed Bob's lawn on Jan 15"
- Eve bets 5 HLX on YES (lying)
- Bob placed 50 HLX UNALIGNED (from his smart contract)
- Eve expects to claim the UNALIGNED bounty fraudulently

**What happens next**:
- Alice (the real lawn mower) sees this lie and the 50 HLX honeypot
- Alice bets 10 HLX on NO (she has proof she did it, not Eve)
- Market resolves: NO wins (10 > 5)
- Alice gets: `(10 / 10) × [(15 + 50) × 0.99]` = **64.35 HLX**
  - Profit: 54.35 HLX for correcting the lie
- Eve loses her 5 HLX

**Key insight**: UNALIGNED bounties **incentivize truth-tellers to challenge lies**, even on low-salience markets.

---

### Scenario 3: Scientific Fact Registry

**Use case**: A research institution wants to establish on-chain records for scientific consensus.

**Example**: "The JWST detected exoplanet TOI-1234 on Dec 1, 2025"
- Institution places 200 HLX on UNALIGNED
- This is not controversial (anyone can verify the NASA data)
- A researcher bets 50 HLX on YES with a link to the official NASA release
- No one bets NO (it's verifiable fact)
- Researcher gets: `(50 / 50) × [(50 + 200) × 0.99]` = **247.5 HLX**
  - Profit: 197.5 HLX for adding the fact to the registry

**Key insight**: Institutions can **pay to populate the knowledge base** with non-controversial facts.

---

## Game Theory: When to Use UNALIGNED

### For Originators (Market Creators)

✅ **Use UNALIGNED when you want to:**
1. **Pay for validation** (smart contract escrow, proof of work)
2. **Seed a knowledge base** (obvious facts that need on-chain records)
3. **Create a honeypot** (attract truth-tellers to challenge potential lies)
4. **Bootstrap liquidity** (add initial incentive to bet on your market)

❌ **Don't use UNALIGNED when:**
1. The statement is already controversial (bettors will come naturally)
2. You don't care about the outcome (you're just farming originator fees)

### For Bettors

✅ **Bet on a side (YES/NO) when:**
1. You have conviction about the truth
2. You expect controversy (opposition will bet against you)
3. UNALIGNED pool exists (you can claim it if you win)

✅ **Bet UNALIGNED when:**
1. You believe the market will resolve decisively (not a tie)
2. You don't know which side will win
3. You want to subsidize validation without taking a position
4. **Example**: A DAO wants to validate member activity but doesn't care about the specific outcome

---

## Economic Analysis

### UNALIGNED as a Subsidy Mechanism

Traditional prediction markets fail when there's no natural controversy. UNALIGNED solves this by allowing **interested parties to subsidize truth discovery**.

**Comparison to alternatives**:

| Mechanism | How it works | Downside |
|-----------|-------------|----------|
| **Originator fee only** | 1% fee incentivizes controversial markets | No incentive for obvious/low-salience facts |
| **External bounty (separate contract)** | Pay someone directly to validate | No Sybil resistance, no dispute resolution |
| **UNALIGNED pool** | Subsidize the winner (whoever proves the truth) | None—combines bounty + dispute resolution |

---

## Why This is Better Than Alternatives

### vs. Centralized Oracles (Chainlink, UMA)
- **Chainlink**: Requires trusted data feeds (can be manipulated or censored)
- **UMA**: Optimistic oracle can be disputed, but disputes require UMA token holders (external dependency)
- **AlphaHelix UNALIGNED**: Anyone can participate; bounty ensures someone will validate

### vs. Direct Payment
**Without HelixMarket**:
- Bob pays Alice 100 USDC directly
- Alice claims she mowed the lawn
- Bob has no recourse if she's lying (no dispute resolution)

**With HelixMarket + UNALIGNED**:
- Bob escrows 100 USDC in a smart contract + 50 HLX UNALIGNED on the market
- Alice must prove she mowed the lawn (bet on YES with evidence)
- If anyone disputes (bets NO with counter-evidence), the market adjudicates
- Smart contract only pays Alice if the market resolves YES

---

## Updated Design Recommendations

Given this new understanding, here's what I now recommend:

### 1. Rename UNALIGNED → "BOUNTY" or "SUBSIDY"
- Current name is confusing ("unaligned with what?")
- "BOUNTY" makes the intent clear: "I'm paying for validation"
- "SUBSIDY" works if you want academic framing

### 2. Add Originator-Only BOUNTY Seeding
- Allow originators to **lock BOUNTY funds at market creation**
- This prevents them from betting on a side after seeing commit activity
- Makes the incentive structure transparent upfront

```solidity
function submitStatement(
    string memory ipfsCid,
    uint256 biddingDuration,
    uint256 revealDuration,
    uint256 bountyAmount  // NEW: originator can seed bounty
) external nonReentrant {
    // ... existing checks ...

    if (bountyAmount > 0) {
        require(token.transferFrom(msg.sender, address(this), bountyAmount), "Bounty transfer failed");
        markets[marketId].unalignedPool = bountyAmount;  // Seed immediately
    }

    // ... rest of function ...
}
```

### 3. Allow Third-Party Bounty Contributions
- Let anyone add to the BOUNTY pool (not just originator)
- Example: A DAO wants to subsidize validation of member activity
- They can add funds to the BOUNTY pool before the commit phase ends

```solidity
function contributeBounty(uint256 marketId, uint256 amount) external nonReentrant {
    Statement storage s = markets[marketId];
    require(block.timestamp < s.commitEndTime, "Market closed");
    require(amount > 0, "Amount must be > 0");

    require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");
    s.unalignedPool += amount;

    emit BountyContributed(marketId, msg.sender, amount);
}
```

### 4. Update Frontend Messaging
**Current UX**: "Choose YES, NO, or UNALIGNED"
- Sounds like three equal betting options
- Confusing for users

**Better UX**:
- **For originators**: "Add a bounty to incentivize validation" (checkbox + amount)
- **For bettors**: "Choose YES or NO" (hide UNALIGNED as a betting option)
- **Show bounty amount prominently**: "This market has a 50 HLX bounty for the winning side"

### 5. Document Common Use Cases
Create a guide with examples:
- ✅ Smart contract escrows (lawn mowing, freelance work)
- ✅ Scientific fact registries
- ✅ DAO activity validation
- ✅ Bootstrapping new markets (add bounty to attract first bettors)

---

## Revised Game Theory

### UNALIGNED is NOT Strategically Dominated

In my original analysis, I claimed UNALIGNED was dominated by betting YES/NO directly. **This was wrong** because I didn't understand the use case.

**Corrected insight**:
- **For truth-seekers**: Bet YES or NO (you have conviction)
- **For subsidizers**: Bet UNALIGNED (you want validation but don't know/care which side wins)
- **For free-riders**: Bet UNALIGNED when you expect a decisive outcome but have no information

### Example: DAO Activity Tracking

**Scenario**: A DAO wants to validate that member Alice completed a task.
- Alice submits: "I completed the website redesign on Jan 15"
- DAO places 100 HLX on UNALIGNED (bounty for validation)
- Alice bets 20 HLX on YES (with proof of work)
- No one bets NO (no controversy, small stakes)
- Alice wins and gets: `(20 / 20) × [(20 + 100) × 0.99]` = **118.8 HLX**

**Why DAO uses UNALIGNED instead of betting YES**:
1. DAO doesn't want to take a position (conflict of interest)
2. DAO wants to incentivize Alice to provide proof
3. If Alice lies, someone else can bet NO and claim the bounty

---

## Bottom Line

**UNALIGNED is not a betting option—it's a bounty mechanism for subsidizing truth discovery on low-salience or non-controversial statements.**

This is a **unique innovation** that solves a real problem in decentralized truth markets:
- Prediction markets only work for controversial topics
- AlphaHelix's UNALIGNED pool enables **truth markets for everything**, not just debates

**This should be the headline feature** in your documentation and marketing. No other system (Polymarket, Augur, Kleros) has this.
