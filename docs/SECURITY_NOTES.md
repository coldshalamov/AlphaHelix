# Security Notes

## Threat model (Alpha)
- **Primary assets**
  - HLX balances held by users.
  - HLX and ETH held by HelixReserve.
  - HLX held in HelixMarket as committed or revealed stakes.
- **Primary attackers**
  - Malicious bettors.
  - Originators.
  - Contract deployer or owner of HelixReserve.

### Top defenses in scope for Alpha
1. Sniping in the last seconds (handled via commit-reveal).
2. Outcome hijacking (no admin override).
3. Permanent fund lock for honest users (unrevealed withdrawal path).
4. Reentrancy on claim or buy/sell.
5. Obvious integer / precision mistakes.

## Checked invariants
- In tested payout scenarios, the sum of winner payouts plus the originator fee never exceeds the total market pool, and any remainder is bounded by expected integer rounding.
- Winner payouts match the contract's fee and pro-rata formula for both balanced and highly skewed markets.
- Losing bettors cannot extract funds after resolution; unrevealed withdrawals only work for still-locked commits.
