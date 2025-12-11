# Frontend user flow

This guide describes the end-to-end experience for using the AlphaHelix frontend during the commit–reveal lifecycle.

## Market lifecycle
1. **Create statement (optional UI exposure):** A wallet submits a statement with an IPFS CID plus commit/reveal durations. A fee is burned from the originator.
2. **Commit phase:** Users choose **YES / NO / UNALIGNED**, enter an HLX amount, and submit a commit hash. The UI generates a random salt client-side and saves the tuple `(salt, choice, amount, hash)` to `localStorage` under `helix_bet_{marketId}_{address}` so the user can reveal later.
3. **Reveal phase:** Users reveal with the stored salt + choice. If localStorage is empty (different browser/device), they cannot reveal that commit. The widget clears the saved entry after a successful reveal to avoid stale salts.
4. **After reveal:** Markets wait for resolution. The page shows "Awaiting resolution" when the reveal window has closed but `resolved` is still false.
5. **Closed:** Once resolved, the page shows the outcome and exposes a **Claim winnings / refund** button. Claims call `HelixMarket.claim(marketId)`; if there is no claimable balance the transaction will revert and the UI surfaces the revert message.

## User journey on the market detail page
- The header shows commit and reveal deadlines with live countdowns and a clear phase badge: **COMMIT**, **REVEAL**, **AFTER_REVEAL_NOT_RESOLVED**, or **CLOSED**.
- The betting widget adjusts to the current phase:
  - **COMMIT:** segmented YES/NO/UNALIGNED selector, HLX input, and a commit button (disabled while pending). After confirmation, a status highlights that the salt + choice are stored locally.
  - **REVEAL:** displays the stored choice/amount and a reveal button. If no local entry exists, the widget warns that the commit may have been made on another device.
  - **Closed / awaiting resolution:** hides commit/reveal controls and reminds the user to claim on the detail card.
- The detail card also surfaces per-address information pulled from `bets` and `committedAmount`: revealed YES/NO/UNALIGNED stakes, any unrevealed committed balance, and claimability (amount ready, or already claimed/empty).

## Local storage notes
- Keys use both marketId and address to prevent collisions: `helix_bet_{marketId}_{address}`.
- Clearing localStorage (or switching browsers/devices) means the salt is lost; the user cannot reveal that commit. Reveals also clear the entry to avoid re-use.

## Limitations
- Claim eligibility is inferred from contract storage (`bets`) and resolution flags; a reverted claim indicates no remaining winnings or refunds.
- The UI assumes the deployed contract addresses match the configured chain (`NEXT_PUBLIC_CHAIN_ID` or 31337). Selecting a different network disables actions.
