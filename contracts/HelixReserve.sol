// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./AlphaHelixToken.sol";

interface IMarketAMM {
    function mint(uint256 amount) external;
}

contract HelixReserve is ReentrancyGuard, Ownable {
    AlphaHelixToken public immutable token;
    uint256 public constant RATE = 1000; // 1 ETH = 1000 HLX

    constructor(address tokenAddress) Ownable(msg.sender) {
        require(tokenAddress != address(0), "Token address cannot be zero");
        token = AlphaHelixToken(tokenAddress);
    }

    function seedMarket(address marketAMM, uint256 hlxAmount) external onlyOwner nonReentrant {
        require(token.balanceOf(address(this)) >= hlxAmount, "Insufficient HLX reserve");
        require(token.approve(marketAMM, hlxAmount), "Approve failed");
        IMarketAMM(marketAMM).mint(hlxAmount);
    }

    function buy() public payable nonReentrant {
        require(msg.value > 0, "No ETH sent");

        uint256 hlxAmount = msg.value * RATE;
        token.mint(msg.sender, hlxAmount);
    }

    function sell(uint256 hlxAmount) external nonReentrant {
        require(hlxAmount > 0, "HLX amount is zero");
        require(hlxAmount % RATE == 0, "HLX amount must convert to whole wei");

        uint256 ethAmount = hlxAmount / RATE;
        require(address(this).balance >= ethAmount, "Insufficient ETH in reserve");
        require(token.allowance(msg.sender, address(this)) >= hlxAmount, "Insufficient allowance");

        token.transferFrom(msg.sender, address(this), hlxAmount);
        token.burn(address(this), hlxAmount);

        (bool success, ) = msg.sender.call{value: ethAmount}("");
        require(success, "ETH transfer failed");
    }

    receive() external payable {
        buy();
    }
}
