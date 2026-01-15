# Random Market Close: Design Considerations

## The Problem with Fixed Close Times

**Current design**: Markets have fixed commit/reveal windows (e.g., 1 hour each)

**Issue**: If markets must close **unpredictably**, users can't strategically time their bets. This requires a fundamentally different mechanism.

---

## Why Random Close?

**Goal**: Prevent strategic waiting where users hold information until the last second.

**Benefits**:
1. **Incentivize early information** - traders can't wait for "perfect timing"
2. **Prevent last-second manipulation** - no guaranteed final bet
3. **Continuous truth convergence** - prices/stakes reflect real-time information

**Trade-off**: Requires continuous trading (incompatible with commit-reveal batches)

---

## Design Options

### Option 1: Keep Current System (No Random Close)

**Stick with commit-reveal + fixed windows**

✅ **Advantages**:
- Simple, already implemented
- Strong front-running protection
- No need for AMM complexity

❌ **Disadvantages**:
- Users can strategically wait until last second of commit phase
- No price discovery
- Market only aggregates information once (at close)

**Verdict**: Good for **deliberative markets** where you want a single snapshot of consensus (e.g., "What is the GDP of France in 2025?")

---

### Option 2: Continuous Staking (No Commit Phase)

**Remove commit/reveal, allow instant staking**

```solidity
function stake(uint256 marketId, uint8 choice, uint256 amount) external {
    require(!markets[marketId].closed, "Market closed");

    // Immediately visible on-chain
    if (choice == 1) markets[marketId].yesPool += amount;
    else if (choice == 0) markets[marketId].noPool += amount;
    else markets[marketId].bountyPool += amount;

    bets[marketId][msg.sender][choice] += amount;
}
```

**Random close**:
- Use Chainlink VRF or block hash randomness
- Market can close at any time after `minDuration`
- When closed, snapshot pool sizes and resolve

✅ **Advantages**:
- Simple (keeps your stake aggregation model)
- UNALIGNED bounty still works
- No AMM complexity

❌ **Disadvantages**:
- **No front-running protection** (visible stakes)
- **Last-second whales** - if someone knows close is imminent, they can dump capital
- **No price discovery** - you can't see "YES is 70% likely"

**Verdict**: Only works if random close is **truly unpredictable** (not influenced by recent transactions)

---

### Option 3: Constant-Product AMM (Uniswap-style)

**Full market maker with continuous pricing**

```solidity
// Initialize with liquidity
yesReserve = 1000 HLX
noReserve = 1000 HLX
k = yesReserve * noReserve = 1,000,000

// Buy YES shares
function buyYes(uint256 hlxIn) external {
    uint256 fee = hlxIn * 3 / 1000; // 0.3% trading fee
    uint256 hlxInAfterFee = hlxIn - fee;

    noReserve += hlxInAfterFee;
    uint256 newYesReserve = k / noReserve;
    uint256 yesSharesOut = yesReserve - newYesReserve;
    yesReserve = newYesReserve;

    shares[msg.sender][YES] += yesSharesOut;
    emit Trade(msg.sender, YES, hlxIn, yesSharesOut);
}

// Price discovery
function getYesPrice() public view returns (uint256) {
    // Price of YES in HLX
    return noReserve * 1e18 / yesReserve;
}
```

**Resolution at random close**:
- Winner = side with higher price (more demand)
- OR: Winner = side with more shares sold
- Winning shares redeem for pro-rata share of total pool

✅ **Advantages**:
- **Price discovery** - "YES is trading at 0.73 HLX"
- **Always available** - trade 24/7
- **Early traders rewarded** - get better prices before information spreads
- **Composable** - shares are fungible tokens (can be used as collateral)

❌ **Disadvantages**:
- **Complex** - more code, more attack surface
- **Requires initial liquidity** - someone must seed the AMM
- **Slippage** - large trades move prices
- **Front-running risk** - MEV bots can sandwich trades
- **Gas costs** - more expensive than simple stake aggregation

**Verdict**: Best for **high-liquidity markets** where continuous trading is valuable

---

### Option 4: Hybrid AMM + Bounty Pool

**Combine AMM trading with UNALIGNED bounty mechanism**

```solidity
// AMM reserves (tradeable)
uint256 public yesReserve;
uint256 public noReserve;
uint256 public k;

// Bounty pool (non-tradeable, swept to winner)
uint256 public bountyPool;

function buyYes(uint256 hlxIn) external {
    // Standard AMM swap (as above)
    // ...
}

function addBounty(uint256 amount) external {
    bountyPool += amount;
    // This HLX is NOT tradeable, just added to winning side at close
}

function closeAndResolve() external {
    // Triggered by random close condition
    closed = true;

    // Determine winner by price or total shares
    bool yesWins = (noReserve > yesReserve); // Higher price = winner

    // Distribute bounty to winning shares
    uint256 totalWinningShares = yesWins ? totalYesShares : totalNoShares;
    uint256 totalPool = yesReserve + noReserve + bountyPool;

    // Each winning share redeems for:
    redemptionRate = totalPool / totalWinningShares;
}
```

✅ **Advantages**:
- Keeps your killer feature (UNALIGNED bounty)
- Price discovery via AMM
- Continuous trading
- Bounty doesn't affect prices (separate pool)

❌ **Disadvantages**:
- Most complex option
- All the AMM disadvantages (front-running, slippage, liquidity requirements)

**Verdict**: Best if you want **both** price discovery AND low-salience bounties

---

## Recommendation for AlphaHelix

### Short-term (Alpha): Two Market Types

**1. Fixed-Time Markets (Commit-Reveal)**
- Use existing HelixMarket contract
- Good for deliberative questions ("What is the capital of France?")
- Strong front-running protection

**2. Continuous Markets (Open Staking, Random Close)**
- Remove commit phase, allow instant staking
- Add random close trigger (Chainlink VRF or block hash)
- Keep UNALIGNED bounty
- **Accept** that these markets have front-running risk (trade-off for continuous updates)

```solidity
enum MarketType { FIXED_TIME, RANDOM_CLOSE }

struct Statement {
    MarketType marketType;
    // ... existing fields ...
}
```

**Why**: Lets you test random close without rewriting the entire contract for AMM logic.

---

### Medium-term (Post-Alpha): Add AMM Option

**3. AMM Markets (Continuous Trading + Random Close)**
- Full constant-product AMM
- Price discovery
- Keep bounty pool separate
- Use for high-liquidity, time-sensitive markets

**Market type selection**:
```solidity
function submitStatement(
    string memory ipfsCid,
    MarketType marketType,
    uint256 duration,
    uint256 bountyAmount
) external {
    if (marketType == FIXED_TIME) {
        // Existing commit-reveal logic
    } else if (marketType == RANDOM_CLOSE) {
        // Continuous staking, random close
    } else if (marketType == AMM) {
        // Initialize AMM reserves
    }
}
```

---

## Random Close Implementation

### Approach 1: Chainlink VRF (Recommended for Production)

```solidity
import "@chainlink/contracts/src/v0.8/VRFConsumerBase.sol";

contract HelixMarket is VRFConsumerBase {
    mapping(bytes32 => uint256) public requestIdToMarket;

    function requestRandomClose(uint256 marketId) external {
        require(block.timestamp > markets[marketId].minDuration, "Too early");

        bytes32 requestId = requestRandomness(keyHash, fee);
        requestIdToMarket[requestId] = marketId;
    }

    function fulfillRandomness(bytes32 requestId, uint256 randomness) internal override {
        uint256 marketId = requestIdToMarket[requestId];

        // Close if random number meets threshold
        uint256 closeThreshold = 50; // 50% chance
        if (randomness % 100 < closeThreshold) {
            _closeMarket(marketId);
        }
    }
}
```

**Pros**: Secure, unpredictable
**Cons**: Costs LINK tokens, requires off-chain oracle

---

### Approach 2: Block Hash (Cheaper, Less Secure)

```solidity
function tryClose(uint256 marketId) external {
    Statement storage s = markets[marketId];
    require(block.timestamp > s.minDuration, "Too early");
    require(!s.closed, "Already closed");

    // Probability increases linearly over time
    uint256 elapsed = block.timestamp - s.startTime;
    uint256 maxDuration = s.maxDuration;
    uint256 closeProbability = (elapsed * 100) / maxDuration;

    // Use block hash as randomness (can be slightly influenced by miners)
    uint256 rand = uint256(blockhash(block.number - 1)) % 100;

    if (rand < closeProbability) {
        _closeMarket(marketId);
    }
}
```

**Pros**: No external dependency, cheap
**Cons**: Miners can slightly manipulate, requires someone to call it

---

### Approach 3: Epoch-Based Random Close

```solidity
// Market closes randomly within a 24-hour window
function checkEpochClose(uint256 marketId) external {
    Statement storage s = markets[marketId];
    require(block.timestamp > s.minDuration, "Too early");

    // Each hour has a 1/24 chance of being the close time
    uint256 currentEpoch = (block.timestamp - s.startTime) / 1 hours;
    uint256 targetEpoch = s.targetCloseEpoch; // Set randomly at creation

    if (currentEpoch >= targetEpoch && !s.closed) {
        _closeMarket(marketId);
    }
}
```

**Pros**: Predictable range (users know it's within 24 hours), fair
**Cons**: Not truly continuous (discrete epochs)

---

## Bottom Line

**For your use case** (random close + UNALIGNED bounty):

1. **Phase 1**: Add continuous staking markets with random close (keep commit-reveal for fixed-time markets)
2. **Phase 2**: Add AMM markets if demand for price discovery emerges
3. **Always**: Keep UNALIGNED bounty mechanism (works with all market types)

**Random close requires continuous trading** - you can't use commit-reveal batches with unpredictable close times.

The simplest path forward is **Option 2** (continuous staking) with Chainlink VRF for random close. This keeps your current payout logic but removes the commit phase for random-close markets.
