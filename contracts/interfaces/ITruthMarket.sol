// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ITruthMarket
 * @notice Minimal interface exposed by Alpha-Helix truth markets.
 */
interface ITruthMarket {
    enum Side {
        True,
        False,
        Unaligned
    }

    enum Resolution {
        Pending,
        True,
        False,
        Unresolved
    }

    struct Totals {
        uint256 trueStake;
        uint256 falseStake;
        uint256 unalignedStake;
    }

    struct Position {
        uint256 trueStake;
        uint256 falseStake;
        uint256 unalignedStake;
        bool paidOut;
        bool locked;
    }

    function claimId() external view returns (uint256);

    function version() external view returns (uint256);

    function winningOutcome() external view returns (Resolution);

    function totals()
        external
        view
        returns (Totals memory aggregate, uint256 totalStake);

    function position(address account) external view returns (Position memory);

    function confidenceBps() external view returns (uint256);

    function tradingClosesAt() external view returns (uint64);

    function resolvedAt() external view returns (uint64);
}
