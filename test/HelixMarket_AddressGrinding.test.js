const { expect } = require("chai");
const { loadFixture, time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");

describe("HelixMarket Security: Address Grinding on Random Close", function () {
  async function deployHelixMarketFixture() {
    const [owner, ...others] = await ethers.getSigners();

    const AlphaHelixToken = await ethers.getContractFactory("AlphaHelixToken");
    const token = await AlphaHelixToken.deploy();

    const HelixMarket = await ethers.getContractFactory("HelixMarket");
    const market = await HelixMarket.deploy(token.target);

    const amount = ethers.parseEther("1000");
    const MINTER_ROLE = await token.MINTER_ROLE();
    await token.grantRole(MINTER_ROLE, owner.address);

    // Fund a bunch of random signers
    const signers = [];
    for (let i = 0; i < 10; i++) {
        const wallet = ethers.Wallet.createRandom().connect(ethers.provider);
        // We need to fund them with ETH for gas
        await owner.sendTransaction({
            to: wallet.address,
            value: ethers.parseEther("1.0")
        });
        signers.push(wallet);
    }

    // Approve market for statement fees
    await token.mint(owner.address, amount);
    await token.approve(market.target, amount);

    return { market, token, owner, signers };
  }

  const minCommitDuration = 3600;
  const revealDuration = 3600;
  const avgCommitDuration = 7200; // 2 hours

  it("VULNERABILITY: Address Grinding allows manipulation of random close", async function () {
    const { market, owner, signers } = await loadFixture(deployHelixMarketFixture);

    // Submit a market with random close enabled
    await market.connect(owner).submitStatementWithRandomClose(
        "ipfs://test",
        minCommitDuration,
        revealDuration,
        true,
        avgCommitDuration
    );
    const marketId = 0;

    // Fast forward to enable random close check
    await time.increase(minCommitDuration + 1);

    // Now check outcomes for different signers in the same block context
    // Since we are using Hardhat network, view calls don't mine blocks.
    // So all these calls will be against the same block state.

    let closesCount = 0;
    let openCount = 0;

    console.log("Checking outcomes for different addresses...");

    for (const signer of signers) {
        const result = await market.connect(signer).previewCloseCheck(marketId);
        const willClose = result.willClose;

        if (willClose) {
            closesCount++;
            console.log(`Address ${signer.address} => CLOSES`);
        } else {
            openCount++;
            console.log(`Address ${signer.address} => KEEPS OPEN`);
        }
    }

    console.log(`Found ${closesCount} addresses that close the market.`);
    console.log(`Found ${openCount} addresses that keep the market open.`);

    // If we find both, then the outcome depends on the sender address!
    // Note: Since it's probabilistic, we might not always find both in a small sample size.
    // But with 10 random addresses and a reasonable difficulty, we should see variance.
    // If difficulty is too high or too low, we might see all open or all closed.

    // Check difficulty target
    const status = await market.getRandomCloseStatus(marketId);
    console.log("Difficulty Target:", status.difficultyTarget.toString());

    // With msg.sender removed from entropy, all addresses should produce the same hash for the same block state.

    const hashes = new Set();
    for (const signer of signers) {
        const result = await market.connect(signer).previewCloseCheck(marketId);
        hashes.add(result.closeHash);
    }

    expect(hashes.size).to.equal(1); // Same hash for all addresses (Deterministic)
    console.log("Verified: Random close hash is deterministic and independent of sender address.");
  });
});
