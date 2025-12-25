// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title AlphaHelixParameters
 * @notice Governance-controlled configuration shared across all Alpha-Helix markets.
 */
contract AlphaHelixParameters is AccessControl {
    bytes32 public constant GOVERNOR_ROLE = keccak256("GOVERNOR_ROLE");

    struct Config {
        uint256 creationBond; // HLX required to post a new claim
        uint256 minimumEngagement; // minimum HLX staked across True/False for bond refund
        uint256 minStake; // minimum amount per bet
        uint64 minimumTradingSeconds; // minimum time window for market participation
        uint64 resolutionDelaySeconds; // cooldown before resolution after trading closes
        uint64 appealWindowSeconds; // window after resolution for reopening via challenge
        uint16 feeBps; // protocol fee on (losing + unaligned) pools
        uint16 challengeBondBps; // multiplier (basis points) on total stake to reopen
    }

    Config private config;

    event ConfigUpdated(Config config);

    constructor(address governor, Config memory initialConfig) {
        require(governor != address(0), "Governor required");
        _grantRole(DEFAULT_ADMIN_ROLE, governor);
        _grantRole(GOVERNOR_ROLE, governor);
        _setConfig(initialConfig);
    }

    function updateConfig(
        Config calldata newConfig
    ) external onlyRole(GOVERNOR_ROLE) {
        _setConfig(newConfig);
    }

    function getConfig() external view returns (Config memory) {
        return config;
    }

    function creationBond() external view returns (uint256) {
        return config.creationBond;
    }

    function minimumEngagement() external view returns (uint256) {
        return config.minimumEngagement;
    }

    function minStake() external view returns (uint256) {
        return config.minStake;
    }

    function minimumTradingSeconds() external view returns (uint64) {
        return config.minimumTradingSeconds;
    }

    function resolutionDelaySeconds() external view returns (uint64) {
        return config.resolutionDelaySeconds;
    }

    function appealWindowSeconds() external view returns (uint64) {
        return config.appealWindowSeconds;
    }

    function feeBps() external view returns (uint16) {
        return config.feeBps;
    }

    function challengeBondBps() external view returns (uint16) {
        return config.challengeBondBps;
    }

    function _setConfig(Config memory newConfig) internal {
        require(
            newConfig.feeBps <= 1_000,
            "Fee cannot exceed 10%"
        );
        require(
            newConfig.challengeBondBps >= 10_000,
            "Challenge bond < 1x"
        );
        config = newConfig;
        emit ConfigUpdated(newConfig);
    }
}
