// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {ERC20Votes} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import {Nonces} from "@openzeppelin/contracts/utils/Nonces.sol";

/**
 * @title HLXToken
 * @notice Governance and staking token for Alpha-Helix. Designed to live on Arbitrum first,
 *         with dedicated bridge roles allowing seamless migration to a Helix main chain later.
 */
contract HLXToken is ERC20, ERC20Permit, ERC20Votes, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant BRIDGE_ROLE = keccak256("BRIDGE_ROLE");

    constructor(
        address dao,
        uint256 initialSupply
    ) ERC20("Helix Token", "HLX") ERC20Permit("Helix Token") {
        _grantRole(DEFAULT_ADMIN_ROLE, dao);
        _mint(dao, initialSupply);
    }

    /**
     * @notice Mint HLX to `to`. Restricted to addresses with MINTER_ROLE (e.g. treasury).
     */
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    /**
     * @notice Burn HLX from `from`. Restricted to addresses with BURNER_ROLE.
     */
    function burn(address from, uint256 amount) external onlyRole(BURNER_ROLE) {
        _burn(from, amount);
    }

    /**
     * @notice L2 bridge hook. The canonical bridge gets BRIDGE_ROLE to mint when tokens exit L1.
     */
    function bridgeMint(
        address to,
        uint256 amount
    ) external onlyRole(BRIDGE_ROLE) {
        _mint(to, amount);
    }

    /**
     * @notice L2 bridge hook. The canonical bridge burns tokens prior to relaying to L1.
     */
    function bridgeBurn(
        address from,
        uint256 amount
    ) external onlyRole(BRIDGE_ROLE) {
        _burn(from, amount);
    }

    // ---- Overrides required by Solidity ----

    // In OpenZeppelin 5.0, _mint, _burn, and _transfer were replaced by _update.
    // ERC20Votes overrides _update to track voting power.
    function _update(
        address from,
        address to,
        uint256 value
    ) internal override(ERC20, ERC20Votes) {
        super._update(from, to, value);
    }

    // ERC20Permit and Nonces (from ERC20Votes) both define nonces.
    function nonces(address owner)
        public
        view
        override(ERC20Permit, Nonces)
        returns (uint256)
    {
        return super.nonces(owner);
    }
}
