// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";

/**
 * @title MarketFactory
 * @notice EIP-1167 clone factory for TruthMarket instances. Only the AlphaHelixRegistry can request deployments.
 */
contract MarketFactory is AccessControl {
    using Clones for address;

    bytes32 public constant REGISTRY_ROLE = keccak256("REGISTRY_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    address public implementation;

    event MarketDeployed(address indexed registry, address indexed market);
    event ImplementationUpdated(address indexed newImplementation);

    constructor(address template, address admin) {
        require(template != address(0), "Template required");
        require(admin != address(0), "Admin required");
        implementation = template;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(UPGRADER_ROLE, admin);
    }

    function setImplementation(
        address newImplementation
    ) external onlyRole(UPGRADER_ROLE) {
        require(newImplementation != address(0), "Zero impl");
        implementation = newImplementation;
        emit ImplementationUpdated(newImplementation);
    }

    function deployMarket(
        address registry
    ) external onlyRole(REGISTRY_ROLE) returns (address market) {
        market = implementation.clone();
        emit MarketDeployed(registry, market);
    }
}
