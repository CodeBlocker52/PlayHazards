import BITToken from "artifacts/contracts/BITToken.sol/BITToken.json";
import BrainNFT from "artifacts/contracts/BrainNFT.sol/BrainNFT.json";
import { ChainId, ChainIDUrl, TARGET_CHAIN } from "./chains";

const bitTokenAddresses: ChainIDUrl = {
  [ChainId.Hardhat]: "0x4C033EB7Baf936cF2FFED08D1C948106641095cf",
  [ChainId.Monad]: "0x4C033EB7Baf936cF2FFED08D1C948106641095cf", // contract address on Monad network
};

const nftTokenAddresses: ChainIDUrl = {
  [ChainId.Hardhat]: "0x84156870499fb4ee52570c1263590ecf49BA6796",
  [ChainId.Monad]: "0x84156870499fb4ee52570c1263590ecf49BA6796", // contract address on Monad network
};

export const BITContract = {
  abi: BITToken.abi,
  address: bitTokenAddresses[TARGET_CHAIN],
};

export const NFTContract = {
  abi: BrainNFT.abi,
  address: nftTokenAddresses[TARGET_CHAIN],
};
