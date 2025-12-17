// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./AlphaHelixToken.sol";

interface IMarketAMM {
    function mint(uint256 amount) external;
}

contract HelixReserve is ReentrancyGuard, Ownable2Step {
    AlphaHelixToken public immutable token;
    uint256 public constant RATE = 1000; // 1 ETH = 1000 HLX

    event Bought(address indexed buyer, uint256 ethIn, uint256 hlxOut);
    event Sold(address indexed seller, uint256 hlxIn, uint256 ethOut);
    event MarketSeeded(address indexed marketAMM, uint256 hlxAmount);

    constructor(address tokenAddress) Ownable(msg.sender) {
        require(tokenAddress != address(0), "Token address cannot be zero");
        token = AlphaHelixToken(tokenAddress);
    }

    function seedMarket(address marketAMM, uint256 hlxAmount) external onlyOwner nonReentrant {
        require(marketAMM != address(0), "Market AMM cannot be zero");
        require(token.balanceOf(address(this)) >= hlxAmount, "Insufficient HLX reserve");
        require(token.approve(marketAMM, hlxAmount), "Approve failed");
        IMarketAMM(marketAMM).mint(hlxAmount);

        emit MarketSeeded(marketAMM, hlxAmount);
    }

    function buy() public payable nonReentrant {
        _buy(msg.sender, msg.value);
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

        emit Sold(msg.sender, hlxAmount, ethAmount);
    }

    receive() external payable nonReentrant {
        _buy(msg.sender, msg.value);
    }

    function _buy(address buyer, uint256 ethIn) internal {
        require(ethIn > 0, "No ETH sent");

        uint256 hlxAmount = ethIn * RATE;
        token.mint(buyer, hlxAmount);

        emit Bought(buyer, ethIn, hlxAmount);
    }
}
