const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("UserLeaderboard Combined Scoring Tests", function () {
    let BITToken, BrainNFT, UserLeaderboard, bitToken, brainNFT, leaderboard, owner, user1, user2;
    const initialSupply = ethers.parseEther("10000");
    const baseURI = "https://example.com/nft/";

    beforeEach(async function () {
        // Use Hardhat's ethers to get signers
        [owner, user1, user2] = await ethers.getSigners();

        // Deploy BITToken
        const BITTokenFactory = await ethers.getContractFactory("BITToken");
        bitToken = await BITTokenFactory.deploy(initialSupply);
        await bitToken.waitForDeployment();

        // Deploy BrainNFT
        const BrainNFTFactory = await ethers.getContractFactory("BrainNFT");
        brainNFT = await BrainNFTFactory.deploy(await bitToken.getAddress(), baseURI);
        await brainNFT.waitForDeployment();

        // Deploy UserLeaderboard
        const UserLeaderboardFactory = await ethers.getContractFactory("UserLeaderboard");
        leaderboard = await UserLeaderboardFactory.deploy(await bitToken.getAddress(), await brainNFT.getAddress());
        await leaderboard.waitForDeployment();

        // Set BrainNFT as burner
        await bitToken.setBurner(await brainNFT.getAddress());
    });

    it("should rank users correctly based on combined token and NFT scores", async function () {
        console.log("==== DETAILED DEBUG INFORMATION ====");
        
        // User1: 100 tokens, claim Bronze NFT (10 points)
        await bitToken.connect(user1).claimTokens(ethers.parseEther("100"));
        await brainNFT.connect(user1).claimNFT(1); // Bronze NFT (10 points), burns 50 tokens
        console.log("User1 balance after claiming Bronze NFT:", ethers.formatEther(await bitToken.balanceOf(user1.address)));
        
        // User2: 500 tokens, claim Silver NFT (50 points)
        await bitToken.connect(user2).claimTokens(ethers.parseEther("500"));
        await brainNFT.connect(user2).claimNFT(3); // Silver NFT (50 points), burns 300 tokens
        console.log("User2 balance after claiming Silver NFT:", ethers.formatEther(await bitToken.balanceOf(user2.address)));
        
        const ranks = await leaderboard.getLeaderboard(3);
        console.log("==== LEADERBOARD RESULTS ====");
        
        for (let i = 0; i < ranks.length; i++) {
            console.log(`Rank ${i+1}:`, {
                user: ranks[i].user,
                score: ranks[i].score.toString(),
                tokenBalance: ethers.formatEther(ranks[i].tokenBalance),
                nftCount: ranks[i].nftCount.toString()
            });
        }

        // We expect:
        // User2: 50 (NFT) + 200 (tokens) = 250 points
        // User1: 10 (NFT) + 50 (tokens) = 60 points
        
        expect(ranks[0].user).to.equal(user2.address);
        expect(ranks[0].score).to.equal(250);
        expect(ranks[0].tokenBalance).to.equal(ethers.parseEther("200"));
        expect(ranks[0].nftCount).to.equal(5); // 50/10
        
        expect(ranks[1].user).to.equal(user1.address);
        expect(ranks[1].score).to.equal(60);
        expect(ranks[1].tokenBalance).to.equal(ethers.parseEther("50"));
        expect(ranks[1].nftCount).to.equal(1); // 10/10
    });
});