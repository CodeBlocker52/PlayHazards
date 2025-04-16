const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Get deployer balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Define initial parameters
  const initialSupply = ethers.parseEther("10000"); // 10,000 BIT tokens
  const baseURI = "https://example.com/nft/"; // Replace with actual base URI if needed

  // Deploy BITToken
  console.log("Deploying BITToken...");
  const BITTokenFactory = await ethers.getContractFactory("BITToken");
  const bitToken = await BITTokenFactory.deploy(initialSupply);
  await bitToken.waitForDeployment();
  console.log("BITToken deployed to:", bitToken.target);

  // Deploy BrainNFT
  console.log("Deploying BrainNFT...");
  const BrainNFTFactory = await ethers.getContractFactory("BrainNFT");
  const brainNFT = await BrainNFTFactory.deploy(bitToken.target, baseURI);
  await brainNFT.waitForDeployment();
  console.log("BrainNFT deployed to:", brainNFT.target);

  // Deploy UserLeaderboard
  console.log("Deploying UserLeaderboard...");
  const UserLeaderboardFactory = await ethers.getContractFactory("UserLeaderboard");
  const leaderboard = await UserLeaderboardFactory.deploy(bitToken.target, brainNFT.target);
  await leaderboard.waitForDeployment();
  console.log("UserLeaderboard deployed to:", leaderboard.target);

  // Set BrainNFT as burner for BITToken
  console.log("Setting BrainNFT as burner for BITToken...");
  const setBurnerTx = await bitToken.setBurner(brainNFT.target);
  await setBurnerTx.wait();
  console.log("BrainNFT set as burner");

  // Verify contracts (if explorer supports it)
  console.log("Verifying contracts...");
  try {
    // Verify BITToken
    await hre.run("verify:verify", {
      address: bitToken.target,
      constructorArguments: [initialSupply],
    });
    console.log("BITToken verified");

    // Verify BrainNFT
    await hre.run("verify:verify", {
      address: brainNFT.target,
      constructorArguments: [bitToken.target, baseURI],
    });
    console.log("BrainNFT verified");

    // Verify UserLeaderboard
    await hre.run("verify:verify", {
      address: leaderboard.target,
      constructorArguments: [bitToken.target, brainNFT.target],
    });
    console.log("UserLeaderboard verified");
  } catch (error) {
    console.error("Verification failed:", error.message);
    console.log("You may need to verify contracts manually on the Monad testnet explorer.");
  }

  console.log("Deployment completed!");
}

// Handle errors and run the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });