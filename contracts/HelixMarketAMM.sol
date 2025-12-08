// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

contract HelixMarketAMM is Ownable, ReentrancyGuard {
    using Math for uint256;

    IERC20 public hlxToken;
    address public reserveAddress;

    // Internal liquidity pools
    uint256 public poolYes;
    uint256 public poolNo;

    // User balances for outcome tokens
    mapping(address => uint256) public yesBalance;
    mapping(address => uint256) public noBalance;

    // Liquidity Provider shares (tracking contribution to pool)
    mapping(address => uint256) public liquidityBalance;
    uint256 public totalLiquidity;

    bool public marketResolved;
    bool public winningOutcome; // true = YES, false = NO

    event Mint(address indexed provider, uint256 amount);
    event Buy(address indexed buyer, bool isYes, uint256 hlxIn, uint256 sharesOut);
    event Sell(address indexed seller, bool isYes, uint256 sharesIn, uint256 hlxOut);
    event MarketResolved(bool outcome);
    event WinningsClaimed(address indexed user, uint256 amount);

    constructor(address _hlxToken, address _reserveAddress) Ownable(msg.sender) {
        require(_hlxToken != address(0), "Invalid token address");
        require(_reserveAddress != address(0), "Invalid reserve address");
        hlxToken = IERC20(_hlxToken);
        reserveAddress = _reserveAddress;
    }

    /**
     * @notice Takes amount HLX from user, creates amount YES and amount NO virtual tokens.
     * Used for liquidity provision.
     */
    function mint(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        require(!marketResolved, "Market resolved");

        // Transfer HLX from user to contract
        require(hlxToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        // Add to pool liquidity
        poolYes += amount;
        poolNo += amount;

        // Track LP shares
        liquidityBalance[msg.sender] += amount;
        totalLiquidity += amount;

        emit Mint(msg.sender, amount);
    }

    /**
     * @notice Buy YES or NO shares with HLX.
     * @param isYes True to buy YES, False to buy NO.
     * @param hlxIn Amount of HLX input.
     */
    function buy(bool isYes, uint256 hlxIn) external nonReentrant {
        require(hlxIn > 0, "Amount must be > 0");
        require(!marketResolved, "Market resolved");
        require(poolYes > 0 && poolNo > 0, "Pool not initialized");

        // Calculate 2% fee
        uint256 fee = (hlxIn * 2) / 100;
        uint256 amount = hlxIn - fee;

        // Transfer fee to reserve
        if (fee > 0) {
            require(hlxToken.transferFrom(msg.sender, reserveAddress, fee), "Fee transfer failed");
        }

        // Transfer net amount to contract
        require(hlxToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        // CPMM Logic
        // We mint 'amount' YES and 'amount' NO.
        // If buying YES: keep NO in pool, send YES to user + swapped YES.

        uint256 sharesOut;
        uint256 k = poolYes * poolNo;

        if (isYes) {
            // Add 'amount' NO to pool
            uint256 oldPoolNo = poolNo;
            uint256 newPoolNo = oldPoolNo + amount;

            // Calculate new poolYes to maintain k
            // k = newPoolNo * newPoolYes => newPoolYes = k / newPoolNo
            uint256 newPoolYes = k / newPoolNo;

            // Tokens taken from pool
            uint256 tokensFromPool = poolYes - newPoolYes;

            // Total tokens to user = minted (amount) + swapped (tokensFromPool)
            sharesOut = amount + tokensFromPool;

            // Update state
            poolNo = newPoolNo;
            poolYes = newPoolYes;
            yesBalance[msg.sender] += sharesOut;
        } else {
            // Buying NO
            // Add 'amount' YES to pool
            uint256 oldPoolYes = poolYes;
            uint256 newPoolYes = oldPoolYes + amount;

            // Calculate new poolNo to maintain k
            uint256 newPoolNo = k / newPoolYes;

            // Tokens taken from pool
            uint256 tokensFromPool = poolNo - newPoolNo;

            // Total tokens to user
            sharesOut = amount + tokensFromPool;

            // Update state
            poolYes = newPoolYes;
            poolNo = newPoolNo;
            noBalance[msg.sender] += sharesOut;
        }

        emit Buy(msg.sender, isYes, hlxIn, sharesOut);
    }

    /**
     * @notice Sell YES or NO shares for HLX.
     * @param isYes True to sell YES, False to sell NO.
     * @param amountShares Amount of shares to sell.
     */
    function sell(bool isYes, uint256 amountShares) external nonReentrant {
        require(amountShares > 0, "Amount must be > 0");
        require(!marketResolved, "Market resolved");

        if (isYes) {
            require(yesBalance[msg.sender] >= amountShares, "Insufficient balance");
        } else {
            require(noBalance[msg.sender] >= amountShares, "Insufficient balance");
        }

        // Calculate HLX out using quadratic formula to restore k
        // Logic: selling shares means swapping them for the opposite token (internally)
        // to form a complete set (YES+NO) which is then burned for HLX.
        // Formula: H = ((A+B+Y) - sqrt((A+B+Y)^2 - 4YB)) / 2
        // Where Y = amountShares, A = poolYes, B = poolNo (if selling YES)
        // Note: If selling YES, we add YES to pool (increasing A) and take NO (decreasing B)
        // But the formula derived H is the amount of HLX returned.

        uint256 A = poolYes;
        uint256 B = poolNo;
        uint256 Y = amountShares;

        // If selling NO, A and B logic is symmetric (product is same)
        // H formula depends on (A+B+Y) and Y*B (where B is the OTHER token pool)
        // If selling YES: B is poolNo.
        // If selling NO: B is poolYes.

        uint256 otherPool = isYes ? poolNo : poolYes;

        uint256 sum = A + B + Y;
        uint256 term1 = sum * sum;
        uint256 term2 = 4 * Y * otherPool;

        require(term1 >= term2, "Math error");

        uint256 sqrtTerm = Math.sqrt(term1 - term2);
        uint256 hlxOut = (sum - sqrtTerm) / 2;

        require(hlxOut > 0, "Zero output");
        // Ensure we don't drain more than available?
        // hlxOut corresponds to taking 'hlxOut' of the OTHER token from pool.
        require(hlxOut < otherPool, "Insufficient liquidity");

        // Update state
        if (isYes) {
            // Selling YES
            // User gives 'amountShares' YES.
            // Pool gives 'hlxOut' NO (conceptually).
            // User burns 'hlxOut' YES + 'hlxOut' NO -> 'hlxOut' HLX.
            // Remaining YES ('amountShares' - 'hlxOut') is added to pool.

            // poolYes increases by (amountShares - hlxOut)
            poolYes += (amountShares - hlxOut);
            // poolNo decreases by hlxOut
            poolNo -= hlxOut;

            yesBalance[msg.sender] -= amountShares;
        } else {
            // Selling NO
            // poolNo increases by (amountShares - hlxOut)
            poolNo += (amountShares - hlxOut);
            // poolYes decreases by hlxOut
            poolYes -= hlxOut;

            noBalance[msg.sender] -= amountShares;
        }

        // Transfer HLX to user
        require(hlxToken.transfer(msg.sender, hlxOut), "Transfer failed");

        emit Sell(msg.sender, isYes, amountShares, hlxOut);
    }

    /**
     * @notice Returns the current probability of YES.
     * @return price Probability scaled by 1e18.
     */
    function getSpotPrice() external view returns (uint256) {
        if (poolYes == 0 && poolNo == 0) return 0;
        // Price = poolNo / (poolYes + poolNo)
        return (poolNo * 1e18) / (poolYes + poolNo);
    }

    /**
     * @notice Resolves the market.
     * @param outcome True for YES, False for NO.
     */
    function resolve(bool outcome) external onlyOwner {
        require(!marketResolved, "Already resolved");
        marketResolved = true;
        winningOutcome = outcome;
        emit MarketResolved(outcome);
    }

    /**
     * @notice Claim winnings after resolution.
     * Winning shares are redeemable 1:1 for HLX.
     */
    function claimWinnings() external nonReentrant {
        require(marketResolved, "Not resolved");

        uint256 payout = 0;
        if (winningOutcome) {
            // YES won
            uint256 bal = yesBalance[msg.sender];
            if (bal > 0) {
                yesBalance[msg.sender] = 0;
                payout = bal;
            }
        } else {
            // NO won
            uint256 bal = noBalance[msg.sender];
            if (bal > 0) {
                noBalance[msg.sender] = 0;
                payout = bal;
            }
        }

        require(payout > 0, "No winnings");
        require(hlxToken.transfer(msg.sender, payout), "Transfer failed");

        emit WinningsClaimed(msg.sender, payout);
    }
}
