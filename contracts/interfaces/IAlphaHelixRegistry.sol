// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ITruthMarket} from "./ITruthMarket.sol";

interface IAlphaHelixRegistry {
    struct ResolutionReport {
        uint256 claimId;
        uint256 version;
        ITruthMarket.Resolution outcome;
        uint256 confidenceBps;
        uint256 totalValueLocked;
        uint256 trueStake;
        uint256 falseStake;
        uint256 unalignedStake;
        uint256 protocolFee;
    }

    function parameters()
        external
        view
        returns (address parametersContract);

    function onMarketResolved(
        ResolutionReport calldata report
    ) external;
}
