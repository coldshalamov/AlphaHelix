// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../AlphaHelixToken.sol";

contract DummyMarketAMM {
    AlphaHelixToken public immutable token;
    uint256 public mintedTotal;
    address public lastCaller;

    constructor(address tokenAddress) {
        token = AlphaHelixToken(tokenAddress);
    }

    function mint(uint256 amount) external {
        lastCaller = msg.sender;
        mintedTotal += amount;
        require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");
    }
}
