const { expect } = require("chai");
const { loadFixture, time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");

require("@nomicfoundation/hardhat-chai-matchers");

describe("HelixMarket - Fuzzing & Invariant Tests", function () {
    async function deployHelixMarketFixture() {
        const [owner, userA, userB, userC, userD, userE] = await ethers.getSigners();

        const AlphaHelixToken = await ethers.getContractFactory("AlphaHelixToken");
        const token = await AlphaHelixToken.deploy();

        const HelixMarket = await ethers.getContractFactory("HelixMarket");
        const market = await HelixMarket.deploy(token.target);

        const amount = ethers.parseEther("10000");
        const MINTER_ROLE = await token.MINTER_ROLE();
        await token.grantRole(MINTER_ROLE, owner.address);

        for (const user of [owner, userA, userB, userC, userD, userE]) {
            await token.mint(user.address, amount);
            await token.connect(user).approve(market.target, amount);
        }

        return { market, token, owner, userA, userB, userC, userD, userE };
    }

    const biddingDuration = 3600;
    const revealDuration = 3600;

    function buildCommit(choice, salt, user) {
        return ethers.solidityPackedKeccak256(["uint8", "uint256", "address"], [choice, salt, user.address]);
    }

    describe("Pool Accounting Invariants", function () {
        it("Total pool = yesPool + noPool + unalignedPool (invariant)", async function () {
            const { market, token, userA, userB, userC, userD } = await loadFixture(deployHelixMarketFixture);

            await market.connect(userA).submitStatement("ipfs://invariant", biddingDuration, revealDuration);
            const marketId = 0;

            // Random amounts
            const amounts = [
                ethers.parseEther("123.456"),
                ethers.parseEther("789.012"),
                ethers.parseEther("345.678"),
                ethers.parseEther("901.234")
            ];

            await market.connect(userB).commitBet(marketId, buildCommit(1, 111, userB), amounts[0]);
            await market.connect(userC).commitBet(marketId, buildCommit(0, 222, userC), amounts[1]);
            await market.connect(userD).commitBet(marketId, buildCommit(2, 333, userD), amounts[2]);
            await market.connect(userA).commitBet(marketId, buildCommit(1, 444, userA), amounts[3]);

            await time.increase(biddingDuration + 1);

            await market.connect(userB).revealBet(marketId, 1, 111);
            await market.connect(userC).revealBet(marketId, 0, 222);
            await market.connect(userD).revealBet(marketId, 2, 333);
            await market.connect(userA).revealBet(marketId, 1, 444);

            const statement = await market.markets(marketId);
            const totalPool = statement.yesPool + statement.noPool + statement.unalignedPool;
            const expectedTotal = amounts[0] + amounts[1] + amounts[2] + amounts[3];

            expect(totalPool).to.equal(expectedTotal);
        });

        it("Payouts + fees = total pool (conservation of funds)", async function () {
            const { market, token, userA, userB, userC, userD } = await loadFixture(deployHelixMarketFixture);

            await market.connect(userA).submitStatement("ipfs://conservation", biddingDuration, revealDuration);
            const marketId = 0;

            const yesAmount = ethers.parseEther("567.89");
            const noAmount = ethers.parseEther("234.56");
            const unalignedAmount = ethers.parseEther("123.45");

            await market.connect(userB).commitBet(marketId, buildCommit(1, 111, userB), yesAmount);
            await market.connect(userC).commitBet(marketId, buildCommit(0, 222, userC), noAmount);
            await market.connect(userD).commitBet(marketId, buildCommit(2, 333, userD), unalignedAmount);

            await time.increase(biddingDuration + 1);

            await market.connect(userB).revealBet(marketId, 1, 111);
            await market.connect(userC).revealBet(marketId, 0, 222);
            await market.connect(userD).revealBet(marketId, 2, 333);

            await time.increase(revealDuration + 1);

            const originatorBefore = await token.balanceOf(userA.address);
            await market.resolve(marketId);
            const originatorAfter = await token.balanceOf(userA.address);
            const originatorFee = originatorAfter - originatorBefore;

            const winnerBefore = await token.balanceOf(userB.address);
            await market.connect(userB).claim(marketId);
            const winnerAfter = await token.balanceOf(userB.address);
            const winnerPayout = winnerAfter - winnerBefore;

            const totalPool = yesAmount + noAmount + unalignedAmount;
            const totalDistributed = originatorFee + winnerPayout;

            expect(totalDistributed).to.equal(totalPool);
        });

        it("Multiple winners share pool correctly (pro-rata)", async function () {
            const { market, token, userA, userB, userC, userD, userE } = await loadFixture(deployHelixMarketFixture);

            await market.connect(userA).submitStatement("ipfs://prorata", biddingDuration, revealDuration);
            const marketId = 0;

            // Multiple YES winners with different stakes
            const yesAmounts = [
                ethers.parseEther("100"),
                ethers.parseEther("200"),
                ethers.parseEther("300")
            ];
            const noAmount = ethers.parseEther("150");

            await market.connect(userB).commitBet(marketId, buildCommit(1, 111, userB), yesAmounts[0]);
            await market.connect(userC).commitBet(marketId, buildCommit(1, 222, userC), yesAmounts[1]);
            await market.connect(userD).commitBet(marketId, buildCommit(1, 333, userD), yesAmounts[2]);
            await market.connect(userE).commitBet(marketId, buildCommit(0, 444, userE), noAmount);

            await time.increase(biddingDuration + 1);

            await market.connect(userB).revealBet(marketId, 1, 111);
            await market.connect(userC).revealBet(marketId, 1, 222);
            await market.connect(userD).revealBet(marketId, 1, 333);
            await market.connect(userE).revealBet(marketId, 0, 444);

            await time.increase(revealDuration + 1);

            const originatorBefore = await token.balanceOf(userA.address);
            await market.resolve(marketId);
            const originatorAfter = await token.balanceOf(userA.address);
            const fee = originatorAfter - originatorBefore;

            const totalPool = yesAmounts[0] + yesAmounts[1] + yesAmounts[2] + noAmount;
            const rewardPool = totalPool - fee;

            let totalPayouts = 0n;

            for (const user of [userB, userC, userD]) {
                const before = await token.balanceOf(user.address);
                await market.connect(user).claim(marketId);
                const after = await token.balanceOf(user.address);
                totalPayouts += (after - before);
            }

            expect(totalPayouts).to.equal(rewardPool);
        });
    });

    describe("Extreme Pool Ratios", function () {
        it("Handles 1:1000000 pool ratio (tiny YES vs huge NO)", async function () {
            const { market, token, userA, userB, userC } = await loadFixture(deployHelixMarketFixture);

            await market.connect(userA).submitStatement("ipfs://extreme-ratio", biddingDuration, revealDuration);
            const marketId = 0;

            const tinyYes = ethers.parseEther("0.001");
            const hugeNo = ethers.parseEther("1000");

            await market.connect(userB).commitBet(marketId, buildCommit(1, 111, userB), tinyYes);
            await market.connect(userC).commitBet(marketId, buildCommit(0, 222, userC), hugeNo);

            await time.increase(biddingDuration + 1);

            await market.connect(userB).revealBet(marketId, 1, 111);
            await market.connect(userC).revealBet(marketId, 0, 222);

            await time.increase(revealDuration + 1);

            await market.resolve(marketId);

            // NO wins with huge stake
            const statement = await market.markets(marketId);
            expect(statement.outcome).to.be.false; // NO wins

            const before = await token.balanceOf(userC.address);
            await market.connect(userC).claim(marketId);
            const after = await token.balanceOf(userC.address);

            // Should receive entire pool minus fee
            const totalPool = tinyYes + hugeNo;
            const fee = (totalPool * 100n) / 10000n; // 1%
            const expectedPayout = totalPool - fee;

            expect(after - before).to.equal(expectedPayout);
        });

        it("Handles exact tie with large numbers", async function () {
            const { market, token, userA, userB, userC } = await loadFixture(deployHelixMarketFixture);

            await market.connect(userA).submitStatement("ipfs://large-tie", biddingDuration, revealDuration);
            const marketId = 0;

            const largeAmount = ethers.parseEther("9999.999999999999");

            await market.connect(userB).commitBet(marketId, buildCommit(1, 111, userB), largeAmount);
            await market.connect(userC).commitBet(marketId, buildCommit(0, 222, userC), largeAmount);

            await time.increase(biddingDuration + 1);

            await market.connect(userB).revealBet(marketId, 1, 111);
            await market.connect(userC).revealBet(marketId, 0, 222);

            await time.increase(revealDuration + 1);

            await market.resolve(marketId);

            const statement = await market.markets(marketId);
            expect(statement.tie).to.be.true;

            // Both should get full refund
            const beforeB = await token.balanceOf(userB.address);
            await market.connect(userB).claim(marketId);
            const afterB = await token.balanceOf(userB.address);
            expect(afterB - beforeB).to.equal(largeAmount);

            const beforeC = await token.balanceOf(userC.address);
            await market.connect(userC).claim(marketId);
            const afterC = await token.balanceOf(userC.address);
            expect(afterC - beforeC).to.equal(largeAmount);
        });

        it("Handles minimum stake (1 wei)", async function () {
            const { market, token, userA, userB, userC } = await loadFixture(deployHelixMarketFixture);

            await market.connect(userA).submitStatement("ipfs://min-stake", biddingDuration, revealDuration);
            const marketId = 0;

            const minStake = 1n;
            const normalStake = ethers.parseEther("100");

            await market.connect(userB).commitBet(marketId, buildCommit(1, 111, userB), minStake);
            await market.connect(userC).commitBet(marketId, buildCommit(0, 222, userC), normalStake);

            await time.increase(biddingDuration + 1);

            await market.connect(userB).revealBet(marketId, 1, 111);
            await market.connect(userC).revealBet(marketId, 0, 222);

            await time.increase(revealDuration + 1);

            await market.resolve(marketId);

            // NO wins with larger stake
            const statement = await market.markets(marketId);
            expect(statement.outcome).to.be.false; // NO wins

            const before = await token.balanceOf(userC.address);
            await market.connect(userC).claim(marketId);
            const after = await token.balanceOf(userC.address);

            // Should receive entire pool minus fee
            const totalPool = minStake + normalStake;
            const fee = (totalPool * 100n) / 10000n;
            const expectedPayout = totalPool - fee;
            expect(after - before).to.equal(expectedPayout);
        });
    });

    describe("Maximum Participants", function () {
        it("Handles 6 participants with mixed choices", async function () {
            const { market, token, owner, userA, userB, userC, userD, userE } = await loadFixture(deployHelixMarketFixture);

            await market.connect(userA).submitStatement("ipfs://max-participants", biddingDuration, revealDuration);
            const marketId = 0;

            const users = [owner, userB, userC, userD, userE];
            const choices = [1, 0, 1, 2, 0]; // Mix of YES, NO, UNALIGNED
            const amounts = [
                ethers.parseEther("100"),
                ethers.parseEther("200"),
                ethers.parseEther("150"),
                ethers.parseEther("50"),
                ethers.parseEther("300")
            ];

            for (let i = 0; i < users.length; i++) {
                await market.connect(users[i]).commitBet(marketId, buildCommit(choices[i], 1000 + i, users[i]), amounts[i]);
            }

            await time.increase(biddingDuration + 1);

            for (let i = 0; i < users.length; i++) {
                await market.connect(users[i]).revealBet(marketId, choices[i], 1000 + i);
            }

            await time.increase(revealDuration + 1);

            const originatorBefore = await token.balanceOf(userA.address);
            await market.resolve(marketId);
            const originatorAfter = await token.balanceOf(userA.address);
            const fee = originatorAfter - originatorBefore;

            const totalPool = amounts.reduce((a, b) => a + b, 0n);
            const rewardPool = totalPool - fee;

            let totalClaimed = 0n;
            const statement = await market.markets(marketId);

            for (let i = 0; i < users.length; i++) {
                const isWinner = statement.tie ||
                    (statement.outcome && choices[i] === 1) ||
                    (!statement.outcome && choices[i] === 0);

                if (isWinner) {
                    const before = await token.balanceOf(users[i].address);
                    await market.connect(users[i]).claim(marketId);
                    const after = await token.balanceOf(users[i].address);
                    totalClaimed += (after - before);
                }
            }

            expect(totalClaimed).to.equal(rewardPool);
        });
    });

    describe("Random Close Stress Tests", function () {
        it("Random close with extreme difficulty (very fast close)", async function () {
            const { market, userA, userB } = await loadFixture(deployHelixMarketFixture);

            const minDuration = 3600;
            const avgDuration = 3601; // Very high probability

            await market.connect(userA).submitStatementWithRandomClose(
                "ipfs://fast-close",
                minDuration,
                3600,
                true,
                avgDuration
            );

            const marketId = 0;

            await time.increase(minDuration + 1);

            // Should close very quickly
            let closed = false;
            for (let i = 0; i < 50; i++) {
                try {
                    await market.connect(userB).commitBet(marketId, buildCommit(1, 1000 + i, userB), ethers.parseEther("1"));
                    await time.increase(1);
                } catch (e) {
                    if (e.message.includes("Commit phase closed")) {
                        closed = true;
                        break;
                    }
                }
            }

            // Should have closed within 50 attempts
            expect(closed).to.be.true;
        });

        it("Random close with low difficulty (slow close)", async function () {
            const { market, userA, userB } = await loadFixture(deployHelixMarketFixture);

            const minDuration = 3600;
            const avgDuration = 86400; // 24 hours - lower probability

            await market.connect(userA).submitStatementWithRandomClose(
                "ipfs://slow-close",
                minDuration,
                3600,
                true,
                avgDuration
            );

            const marketId = 0;

            await time.increase(minDuration + 1);

            // Try a few commits - should not close immediately
            let commitCount = 0;
            for (let i = 0; i < 10; i++) {
                try {
                    await market.connect(userB).commitBet(marketId, buildCommit(1, 1000 + i, userB), ethers.parseEther("1"));
                    commitCount++;
                    await time.increase(1);
                } catch (e) {
                    if (e.message.includes("Commit phase closed")) {
                        break;
                    }
                }
            }

            // Should allow at least a few commits
            expect(commitCount).to.be.gte(1);
        });
    });

    describe("Griefing Attack Resistance", function () {
        it("Cannot grief by committing but never revealing", async function () {
            const { market, token, userA, userB, userC } = await loadFixture(deployHelixMarketFixture);

            await market.connect(userA).submitStatement("ipfs://grief-test", biddingDuration, revealDuration);
            const marketId = 0;

            const honestAmount = ethers.parseEther("100");
            const grieferAmount = ethers.parseEther("1000");

            await market.connect(userB).commitBet(marketId, buildCommit(1, 111, userB), honestAmount);
            await market.connect(userC).commitBet(marketId, buildCommit(0, 222, userC), grieferAmount);

            await time.increase(biddingDuration + 1);

            // Only honest user reveals
            await market.connect(userB).revealBet(marketId, 1, 111);

            await time.increase(revealDuration + 1);

            // Market can still resolve
            await market.resolve(marketId);

            // Honest user wins (only revealed bet)
            const statement = await market.markets(marketId);
            // YES wins because it's the only revealed bet (NO was not revealed)
            expect(statement.outcome).to.be.true;

            const before = await token.balanceOf(userB.address);
            await market.connect(userB).claim(marketId);
            const after = await token.balanceOf(userB.address);

            // Should receive only their own stake back minus fee (no losing pool to sweep)
            const expectedPayout = ethers.parseEther("99"); // 100 - 1% fee
            expect(after - before).to.equal(expectedPayout);

            // Griever loses everything
            const grieferBefore = await token.balanceOf(userC.address);
            await market.connect(userC).withdrawUnrevealed(marketId);
            const grieferAfter = await token.balanceOf(userC.address);

            // 100% penalty
            expect(grieferAfter).to.equal(grieferBefore);
        });

        it("Cannot grief by spamming ping on non-random markets", async function () {
            const { market, userA, userB } = await loadFixture(deployHelixMarketFixture);

            await market.connect(userA).submitStatement("ipfs://no-grief-ping", biddingDuration, revealDuration);
            const marketId = 0;

            // Ping should not affect fixed-time markets
            for (let i = 0; i < 10; i++) {
                await market.connect(userB).pingMarket(marketId);
            }

            // Should still be able to commit
            await market.connect(userB).commitBet(marketId, buildCommit(1, 111, userB), ethers.parseEther("10"));
        });
    });

    describe("Edge Cases", function () {
        it("Handles market with only UNALIGNED bets", async function () {
            const { market, token, userA, userB, userC } = await loadFixture(deployHelixMarketFixture);

            await market.connect(userA).submitStatement("ipfs://only-unaligned", biddingDuration, revealDuration);
            const marketId = 0;

            await market.connect(userB).commitBet(marketId, buildCommit(2, 111, userB), ethers.parseEther("100"));
            await market.connect(userC).commitBet(marketId, buildCommit(2, 222, userC), ethers.parseEther("200"));

            await time.increase(biddingDuration + 1);

            await market.connect(userB).revealBet(marketId, 2, 111);
            await market.connect(userC).revealBet(marketId, 2, 222);

            await time.increase(revealDuration + 1);

            await market.resolve(marketId);

            const statement = await market.markets(marketId);
            expect(statement.tie).to.be.true; // 0 == 0

            // Both should get refunds
            const beforeB = await token.balanceOf(userB.address);
            await market.connect(userB).claim(marketId);
            const afterB = await token.balanceOf(userB.address);
            expect(afterB - beforeB).to.equal(ethers.parseEther("100"));
        });

        it("Handles market with single participant", async function () {
            const { market, token, userA, userB } = await loadFixture(deployHelixMarketFixture);

            await market.connect(userA).submitStatement("ipfs://single-participant", biddingDuration, revealDuration);
            const marketId = 0;

            await market.connect(userB).commitBet(marketId, buildCommit(1, 111, userB), ethers.parseEther("100"));

            await time.increase(biddingDuration + 1);

            await market.connect(userB).revealBet(marketId, 1, 111);

            await time.increase(revealDuration + 1);

            await market.resolve(marketId);

            // Single YES bet wins against 0 NO
            const before = await token.balanceOf(userB.address);
            await market.connect(userB).claim(marketId);
            const after = await token.balanceOf(userB.address);

            const expectedPayout = ethers.parseEther("99"); // 100 - 1% fee
            expect(after - before).to.equal(expectedPayout);
        });

        it("Prevents double claiming", async function () {
            const { market, userA, userB, userC } = await loadFixture(deployHelixMarketFixture);

            await market.connect(userA).submitStatement("ipfs://double-claim", biddingDuration, revealDuration);
            const marketId = 0;

            await market.connect(userB).commitBet(marketId, buildCommit(1, 111, userB), ethers.parseEther("100"));
            await market.connect(userC).commitBet(marketId, buildCommit(0, 222, userC), ethers.parseEther("50"));

            await time.increase(biddingDuration + 1);

            await market.connect(userB).revealBet(marketId, 1, 111);
            await market.connect(userC).revealBet(marketId, 0, 222);

            await time.increase(revealDuration + 1);

            await market.resolve(marketId);

            await market.connect(userB).claim(marketId);

            // Second claim should fail
            await expect(market.connect(userB).claim(marketId)).to.be.revertedWith("No winning bet");
        });
    });
});
